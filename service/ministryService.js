import Ministry from "../model/ministryModel.js";
import MinistryMembership from "../model/ministryMembershipModel.js";
import Member from "../model/memberModel.js";

import { ApiError } from "../utils/apiError.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createSlug(name) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return base;
}

function ministryResponse(ministry) {
  return {
    id: ministry._id,
    name: ministry.name,
    slug: ministry.slug,
    description: ministry.description,
    leader: ministry.leader,
    status: ministry.status,
    meetingDay: ministry.meetingDay,
    meetingTime: ministry.meetingTime,
    meetingLocation: ministry.meetingLocation,
    createdAt: ministry.createdAt,
    updatedAt: ministry.updatedAt,
  };
}

async function validateLeader(leaderId) {
  if (leaderId === null || leaderId === undefined) return;

  const leader = await Member.findById(leaderId);

  if (!leader) {
    throw new ApiError(
      404,
      "Ministry leader member record not found",
      "MINISTRY_LEADER_NOT_FOUND"
    );
  }

  if (leader.membershipStatus !== "active") {
    throw new ApiError(
      400,
      "The ministry leader must have active membership",
      "MINISTRY_LEADER_INACTIVE"
    );
  }
}

async function generateUniqueSlug(name, excludeId = null) {
  const base = createSlug(name);

  if (!base) {
    throw new ApiError(
      400,
      "Ministry name must contain letters or numbers",
      "INVALID_MINISTRY_NAME"
    );
  }

  let slug = base;
  let suffix = 1;

  while (
    await Ministry.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

export async function createMinistry(input, actorId) {
  await validateLeader(input.leader);

  const slug = await generateUniqueSlug(input.name);

  const ministry = await Ministry.create({
    ...input,
    slug,
    createdBy: actorId,
  });

  return ministryResponse(ministry);
}

export async function listMinistries(filters, user) {
  const { search, status, page, limit } = filters;
  const query = {};

  if (status) {
    query.status = status;
  } else {
    query.status = { $ne: "archived" };
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");

    query.$or = [
      { name: pattern },
      { slug: pattern },
      { description: pattern },
    ];
  }

  // Ministry leaders can only list ministries they lead.
  if (user.role === "ministry_leader") {
    const member = await Member.findOne({ user: user._id });

    if (!member) {
      return {
        ministries: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    query.leader = member._id;
  }

  const skip = (page - 1) * limit;

  const [ministries, total] = await Promise.all([
    Ministry.find(query)
      .populate("leader", "firstName lastName membershipNumber")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),

    Ministry.countDocuments(query),
  ]);

  return {
    ministries: ministries.map(ministryResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMinistryById(id) {
  const ministry = await Ministry.findById(id).populate(
    "leader",
    "firstName lastName membershipNumber"
  );

  if (!ministry) {
    throw new ApiError(
      404,
      "Ministry not found",
      "MINISTRY_NOT_FOUND"
    );
  }

  return ministryResponse(ministry);
}

export async function updateMinistry(id, input) {
  const ministry = await Ministry.findById(id);

  if (!ministry) {
    throw new ApiError(
      404,
      "Ministry not found",
      "MINISTRY_NOT_FOUND"
    );
  }

  if (Object.hasOwn(input, "leader")) {
    await validateLeader(input.leader);
  }

  if (
    Object.hasOwn(input, "name") &&
    input.name !== ministry.name
  ) {
    ministry.slug = await generateUniqueSlug(
      input.name,
      ministry._id
    );
  }

  const allowedFields = [
    "name",
    "description",
    "leader",
    "status",
    "meetingDay",
    "meetingTime",
    "meetingLocation",
  ];

  for (const field of allowedFields) {
    if (Object.hasOwn(input, field)) {
      ministry.set(field, input[field]);
    }
  }

  await ministry.save();

  return ministryResponse(ministry);
}

export async function archiveMinistry(id) {
  const ministry = await Ministry.findById(id);

  if (!ministry) {
    throw new ApiError(
      404,
      "Ministry not found",
      "MINISTRY_NOT_FOUND"
    );
  }

  ministry.status = "archived";
  await ministry.save();

  // Keep membership history. Do not delete membership records.
  await MinistryMembership.updateMany(
    { ministry: ministry._id, status: "active" },
    { $set: { status: "inactive", leftAt: new Date() } }
  );

  return ministryResponse(ministry);
}

async function requireManageableMinistry(id, user) {
  const ministry = await Ministry.findById(id);

  if (!ministry) {
    throw new ApiError(
      404,
      "Ministry not found",
      "MINISTRY_NOT_FOUND"
    );
  }

  if (user.role === "admin" || user.role === "pastor") {
    return ministry;
  }

  if (user.role !== "ministry_leader") {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }

  const member = await Member.findOne({ user: user._id });

  if (!member || String(ministry.leader) !== String(member._id)) {
    throw new ApiError(
      403,
      "You can only manage your assigned ministry",
      "FORBIDDEN"
    );
  }

  return ministry;
}

export async function listMinistryMembers(id, filters, user) {
  const ministry = await requireManageableMinistry(id, user);

  if (ministry.status === "archived") {
    throw new ApiError(
      409,
      "Archived ministries cannot be managed",
      "MINISTRY_ARCHIVED"
    );
  }

  const { status, page, limit } = filters;

  const query = { ministry: ministry._id };

  if (status) {
    query.status = status;
  } else {
    query.status = "active";
  }

  const skip = (page - 1) * limit;

  const [memberships, total] = await Promise.all([
    MinistryMembership.find(query)
      .populate("member", "firstName lastName email phone membershipNumber membershipStatus")
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit),

    MinistryMembership.countDocuments(query),
  ]);

  return {
    members: memberships.map((record) => ({
      membershipId: record._id,
      member: record.member,
      status: record.status,
      joinedAt: record.joinedAt,
      leftAt: record.leftAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function addMinistryMember(id, memberId, actorId, user) {
  const ministry = await requireManageableMinistry(id, user);

  if (ministry.status !== "active") {
    throw new ApiError(
      409,
      "Only active ministries can accept members",
      "MINISTRY_NOT_ACTIVE"
    );
  }

  const member = await Member.findById(memberId);

  if (!member || member.membershipStatus !== "active") {
    throw new ApiError(
      404,
      "Active member not found",
      "ACTIVE_MEMBER_NOT_FOUND"
    );
  }

  const existing = await MinistryMembership.findOne({
    ministry: ministry._id,
    member: member._id,
  }).sort({ createdAt: -1 });

  if (existing?.status === "active") {
    throw new ApiError(
      409,
      "Member already belongs to this ministry",
      "MEMBER_ALREADY_IN_MINISTRY"
    );
  }

  if (existing) {
    existing.status = "active";
    existing.joinedAt = new Date();
    existing.leftAt = null;
    existing.addedBy = actorId;
    await existing.save();

    return existing;
  }

  return MinistryMembership.create({
    ministry: ministry._id,
    member: member._id,
    addedBy: actorId,
  });
}

export async function removeMinistryMember(
  id,
  memberId,
  user
) {
  await requireManageableMinistry(id, user);

  const membership = await MinistryMembership.findOne({
    ministry: id,
    member: memberId,
    status: "active",
  });

  if (!membership) {
    throw new ApiError(
      404,
      "Active ministry membership not found",
      "MINISTRY_MEMBERSHIP_NOT_FOUND"
    );
  }

  membership.status = "inactive";
  membership.leftAt = new Date();

  await membership.save();

  return {
    membershipId: membership._id,
    ministry: membership.ministry,
    member: membership.member,
    status: membership.status,
    joinedAt: membership.joinedAt,
    leftAt: membership.leftAt,
  };
}
/*  export async function getMinistryById(id, user) {
  let ministry;

  if (user.role === "ministry_leader") {
    ministry = await requireManageableMinistry(id, user);
  } else {
    ministry = await Ministry.findById(id);
  }

  if (!ministry) {
    throw new ApiError(
      404,
      "Ministry not found",
      "MINISTRY_NOT_FOUND"
    );
  }

  await ministry.populate(
    "leader",
    "firstName lastName membershipNumber"
  );

  return ministryResponse(ministry);
}*/