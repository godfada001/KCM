import { randomBytes } from "node:crypto";

import Member from "../model/memberModel.js";
import User from "../model/userModel.js";
import { ApiError } from "../utils/apiError.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateMembershipNumber() {
  const year = new Date().getFullYear();
  const suffix = randomBytes(5).toString("hex").toUpperCase();

  return `CH-${year}-${suffix}`;
}

function publicMember(member) {
  return {
    id: member._id,
    membershipNumber: member.membershipNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    joinedAt: member.joinedAt,
    membershipStatus: member.membershipStatus,
    user: member.user,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

async function validateLinkedUser(userId, currentMemberId = null) {
  if (userId === null || userId === undefined) {
    return;
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "Linked user account not found",
      "LINKED_USER_NOT_FOUND"
    );
  }

  const existingMember = await Member.findOne({
    user: userId,
    ...(currentMemberId
      ? { _id: { $ne: currentMemberId } }
      : {}),
  });

  if (existingMember) {
    throw new ApiError(
      409,
      "This user account is already linked to another member",
      "USER_ALREADY_LINKED"
    );
  }
}

export async function createMember(input) {
  await validateLinkedUser(input.user);

  const member = await Member.create({
    ...input,
    membershipNumber: generateMembershipNumber(),
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    notes: input.notes ?? null,
  });

  return publicMember(member);
}

export async function listMembers(filters) {
  const { search, membershipStatus, page, limit } = filters;

  const query = {};

  // Hide archived records unless the caller explicitly requests them.
  if (membershipStatus) {
    query.membershipStatus = membershipStatus;
  } else {
    query.membershipStatus = { $ne: "archived" };
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");

    query.$or = [
      { firstName: pattern },
      { lastName: pattern },
      { email: pattern },
      { phone: pattern },
      { membershipNumber: pattern },
    ];
  }

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    Member.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit),

    Member.countDocuments(query),
  ]);

  return {
    members: members.map(publicMember),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMemberById(id) {
  const member = await Member.findById(id).select(
    "+address +dateOfBirth +notes"
  );

  if (!member) {
    throw new ApiError(
      404,
      "Member not found",
      "MEMBER_NOT_FOUND"
    );
  }

  return {
    ...publicMember(member),
    address: member.address,
    dateOfBirth: member.dateOfBirth,
    notes: member.notes,
  };
}

export async function updateMember(id, input) {
  const member = await Member.findById(id);

  if (!member) {
    throw new ApiError(
      404,
      "Member not found",
      "MEMBER_NOT_FOUND"
    );
  }

  if (Object.hasOwn(input, "user")) {
    await validateLinkedUser(input.user, member._id);
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "dateOfBirth",
    "joinedAt",
    "membershipStatus",
    "user",
    "notes",
  ];

  for (const field of allowedFields) {
    if (Object.hasOwn(input, field)) {
      member.set(field, input[field]);
    }
  }

  await member.save();

  return publicMember(member);
}

export async function archiveMember(id) {
  const member = await Member.findById(id);

  if (!member) {
    throw new ApiError(
      404,
      "Member not found",
      "MEMBER_NOT_FOUND"
    );
  }

  member.membershipStatus = "archived";
  await member.save();

  return publicMember(member);
}