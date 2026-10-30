import {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
} from "../service/userService.js";

export async function listUsersController(req, res) {
  const result = await listUsers(res.locals.validated.query);

  return res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: result.users,
    pagination: result.pagination,
  });
}

export async function getUserController(req, res) {
  const user = await getUserById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: { user },
  });
}

export async function updateUserRoleController(req, res) {
  const user = await updateUserRole(
    req.params.id,
    req.body.role,
    req.user._id
  );

  return res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: { user },
  });
}

export async function updateUserStatusController(req, res) {
  const user = await updateUserStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );

  return res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: { user },
  });
}