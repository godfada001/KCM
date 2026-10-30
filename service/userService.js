import User from "../model/userModel.js";
import RefreshSession from "../utils/refreshSessionModel.js";
import { ApiError } from "../utils/apiError.js";

function toPublicUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function revokeUserSessions(userId) {
  await RefreshSession.updateMany(
    {
      user: userId,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
}

export async function listUsers(filters) {
  const { page, limit, role, status } = filters;

  const query = {};

  if (role) query.role = role;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    User.countDocuments(query),
  ]);

  return {
    users: users.map(toPublicUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(id) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  return toPublicUser(user);
}

export async function updateUserRole(id, role, actorId) {
  if (id === actorId.toString()) {
    throw new ApiError(
      400,
      "You cannot change your own role",
      "CANNOT_CHANGE_OWN_ROLE"
    );
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (user.role === "admin" && role !== "admin") {
    const activeAdminCount = await User.countDocuments({
      role: "admin",
      status: "active",
    });

    if (user.status === "active" && activeAdminCount <= 1) {
      throw new ApiError(
        409,
        "Cannot demote the last active administrator",
        "LAST_ACTIVE_ADMIN"
      );
    }
  }

  user.role = role;
  await user.save();

  // Require the affected account to establish a fresh session.
  await revokeUserSessions(user._id);

  return toPublicUser(user);
}

export async function updateUserStatus(id, status, actorId) {
  if (id === actorId.toString()) {
    throw new ApiError(
      400,
      "You cannot change your own account status",
      "CANNOT_CHANGE_OWN_STATUS"
    );
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (user.role === "admin" && status !== "active" && user.status === "active") {
    const activeAdminCount = await User.countDocuments({
      role: "admin",
      status: "active",
    });

    if (activeAdminCount <= 1) {
      throw new ApiError(
        409,
        "Cannot deactivate the last active administrator",
        "LAST_ACTIVE_ADMIN"
      );
    }
  }

  user.status = status;
  await user.save();

  if (status !== "active") {
    await revokeUserSessions(user._id);
  }

  return toPublicUser(user);
}