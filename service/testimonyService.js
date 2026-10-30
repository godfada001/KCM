
import mongoose from "mongoose";
import Testimony from "../model/testimonyModel.js";

const PUBLIC_FIELDS = "title testimony isAnonymous displayName approvedAt createdAt";

const createTestimony = async (payload) => {
  const {
    title,
    testimony,
    isAnonymous = true,
    displayName,
  } = payload;

  if (typeof isAnonymous !== "boolean") {
    const error = new Error("isAnonymous must be true or false.");
    error.statusCode = 400;
    throw error;
  }

  if (!isAnonymous && !displayName?.trim()) {
    const error = new Error(
      "Please provide a display name or choose anonymous submission."
    );
    error.statusCode = 400;
    throw error;
  }

  const testimonyData = {
    title,
    testimony,
    isAnonymous,
    status: "pending",
  };

  // Never save a name when the submitter chooses anonymity.
  if (!isAnonymous) {
    testimonyData.displayName = displayName.trim();
  }

  const createdTestimony = await Testimony.create(testimonyData);

  // Do not return moderation details to public submitters.
  return {
    id: createdTestimony._id,
    title: createdTestimony.title,
    isAnonymous: createdTestimony.isAnonymous,
    status: createdTestimony.status,
    createdAt: createdTestimony.createdAt,
  };
};

const getApprovedTestimonies = async ({
  page = 1,
  limit = 10,
} = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = { status: "approved" };

  const [testimonies, total] = await Promise.all([
    Testimony.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ approvedAt: -1, createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Testimony.countDocuments(filter),
  ]);

  // Explicitly prevent a name from being exposed for anonymous entries.
  const safeTestimonies = testimonies.map((item) => {
    if (item.isAnonymous) {
      item.displayName = null;
    }

    return item;
  });

  return {
    testimonies: safeTestimonies,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getPendingTestimonies = async ({
  page = 1,
  limit = 20,
} = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = { status: "pending" };

  const [testimonies, total] = await Promise.all([
    Testimony.find(filter)
      .sort({ createdAt: 1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Testimony.countDocuments(filter),
  ]);

  return {
    testimonies,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const reviewTestimony = async ({
  testimonyId,
  action,
  reviewerId,
}) => {
  if (!mongoose.isValidObjectId(testimonyId)) {
    const error = new Error("Invalid testimony ID.");
    error.statusCode = 400;
    throw error;
  }

  if (!["approve", "reject"].includes(action)) {
    const error = new Error("Action must be approve or reject.");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.isValidObjectId(reviewerId)) {
    const error = new Error("A valid reviewer ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const testimony = await Testimony.findOne({
    _id: testimonyId,
    status: "pending",
  });

  if (!testimony) {
    const error = new Error(
      "Pending testimony not found. It may already have been reviewed."
    );
    error.statusCode = 404;
    throw error;
  }

  testimony.status = action === "approve" ? "approved" : "rejected";
  testimony.reviewedBy = reviewerId;
  testimony.approvedAt =
    action === "approve" ? new Date() : null;

  await testimony.save();

  return testimony;
};

export {
  createTestimony,
  getApprovedTestimonies,
  getPendingTestimonies,
  reviewTestimony,
};
