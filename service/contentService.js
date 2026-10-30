import Sermon from "../model/sermonModel.js";
import Announcement from "../model/annoucementModel.js";
import { ApiError } from "../utils/apiError.js";

function makeSlug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

async function uniqueSlug(Model, title, excludeId = null) {
  const base = makeSlug(title) || "content";
  let slug = base;
  let counter = 2;

  while (true) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await Model.exists(filter);

    if (!existing) return slug;

    slug = `${base}-${counter}`;
    counter += 1;
  }
}

function preparePublication(data, previousStatus = "draft") {
  const next = { ...data };

  if (next.status === "published" && previousStatus !== "published") {
    next.publishedAt = new Date();
  }

  if (next.status === "draft") {
    next.publishedAt = null;
  }

  return next;
}

function validateAnnouncementDates(data) {
  if (
    data.publishAt &&
    data.expiresAt &&
    new Date(data.expiresAt) <= new Date(data.publishAt)
  ) {
    throw new ApiError(
      400,
      "expiresAt must be later than publishAt",
      "INVALID_ANNOUNCEMENT_DATES"
    );
  }
}

function publicAnnouncementFilter() {
  const now = new Date();

  return {
    status: "published",
    $and: [
      {
        $or: [
          { publishAt: null },
          { publishAt: { $exists: false } },
          { publishAt: { $lte: now } },
        ],
      },
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } },
        ],
      },
    ],
  };
}

function buildListFilter({ search, status }, publicOnly = false) {
  const filter = {};

  if (publicOnly) {
    Object.assign(filter, publicAnnouncementFilter());
  } else if (status) {
    filter.status = status;
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$text = { $search: escaped };
  }

  return filter;
}

async function listContent(Model, filters, publicOnly = false) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const filter = buildListFilter(filters, publicOnly);

  const [items, total] = await Promise.all([
    Model.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// -------------------- SERMONS --------------------

export async function createSermon(input, userId) {
  const data = { ...input };
  data.slug = await uniqueSlug(Sermon, data.title);
  Object.assign(data, preparePublication(data));

  return Sermon.create({
    ...data,
    createdBy: userId,
  });
}

export async function listSermons(filters, { publicOnly = false } = {}) {
  return listContent(Sermon, filters, publicOnly);
}

export async function getSermonBySlug(slug) {
  const sermon = await Sermon.findOne({
    slug,
    status: "published",
  }).lean();

  if (!sermon) {
    throw new ApiError(404, "Sermon not found", "SERMON_NOT_FOUND");
  }

  return sermon;
}

export async function updateSermon(id, input) {
  const sermon = await Sermon.findById(id);

  if (!sermon) {
    throw new ApiError(404, "Sermon not found", "SERMON_NOT_FOUND");
  }

  const data = { ...input };

  if (data.title && data.title !== sermon.title) {
    data.slug = await uniqueSlug(Sermon, data.title, sermon._id);
  }

  Object.assign(data, preparePublication(data, sermon.status));

  Object.assign(sermon, data);
  await sermon.save();

  return sermon;
}

export async function archiveSermon(id) {
  const sermon = await Sermon.findByIdAndUpdate(
    id,
    { status: "archived" },
    { new: true, runValidators: true }
  );

  if (!sermon) {
    throw new ApiError(404, "Sermon not found", "SERMON_NOT_FOUND");
  }

  return sermon;
}

// ---------------- ANNOUNCEMENTS ----------------

export async function createAnnouncement(input, userId) {
  const data = { ...input };

  validateAnnouncementDates(data);

  data.slug = await uniqueSlug(Announcement, data.title);
  Object.assign(data, preparePublication(data));

  return Announcement.create({
    ...data,
    createdBy: userId,
  });
}

export async function listAnnouncements(
  filters,
  { publicOnly = false } = {}
) {
  return listContent(Announcement, filters, publicOnly);
}

export async function getAnnouncementBySlug(slug) {
  const announcement = await Announcement.findOne({
    slug,
    ...publicAnnouncementFilter(),
  }).lean();

  if (!announcement) {
    throw new ApiError(
      404,
      "Announcement not found",
      "ANNOUNCEMENT_NOT_FOUND"
    );
  }

  return announcement;
}

export async function updateAnnouncement(id, input) {
  const announcement = await Announcement.findById(id);

  if (!announcement) {
    throw new ApiError(
      404,
      "Announcement not found",
      "ANNOUNCEMENT_NOT_FOUND"
    );
  }

  const data = { ...input };

  validateAnnouncementDates({
    publishAt: data.publishAt ?? announcement.publishAt,
    expiresAt: data.expiresAt ?? announcement.expiresAt,
  });

  if (data.title && data.title !== announcement.title) {
    data.slug = await uniqueSlug(
      Announcement,
      data.title,
      announcement._id
    );
  }

  Object.assign(
    data,
    preparePublication(data, announcement.status)
  );

  Object.assign(announcement, data);
  await announcement.save();

  return announcement;
}

export async function archiveAnnouncement(id) {
  const announcement = await Announcement.findByIdAndUpdate(
    id,
    { status: "archived" },
    { new: true, runValidators: true }
  );

  if (!announcement) {
    throw new ApiError(
      404,
      "Announcement not found",
      "ANNOUNCEMENT_NOT_FOUND"
    );
  }

  return announcement;
}