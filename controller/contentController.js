import * as contentService from "../service/contentService.js";

function validated(req, res, key) {
  return res.locals.validated?.[key] ?? req[key];
}

// -------------------- SERMONS --------------------

export async function createSermonController(req, res) {
  const sermon = await contentService.createSermon(
    validated(req, res, "body"),
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Sermon created successfully",
    data: sermon,
  });
}

export async function listSermonsController(req, res) {
  const result = await contentService.listSermons(
    validated(req, res, "query"),
    { publicOnly: true }
  );

  res.status(200).json({
    success: true,
    ...result,
  });
}

export async function listManageSermonsController(req, res) {
  const result = await contentService.listSermons(
    validated(req, res, "query")
  );

  res.status(200).json({
    success: true,
    ...result,
  });
}

export async function getSermonController(req, res) {
  const sermon = await contentService.getSermonBySlug(
    req.params.slug
  );

  res.status(200).json({
    success: true,
    data: sermon,
  });
}

export async function updateSermonController(req, res) {
  const sermon = await contentService.updateSermon(
    req.params.id,
    validated(req, res, "body")
  );

  res.status(200).json({
    success: true,
    message: "Sermon updated successfully",
    data: sermon,
  });
}

export async function archiveSermonController(req, res) {
  const sermon = await contentService.archiveSermon(
    req.params.id
  );

  res.status(200).json({
    success: true,
    message: "Sermon archived successfully",
    data: sermon,
  });
}

// ---------------- ANNOUNCEMENTS ----------------

export async function createAnnouncementController(req, res) {
  const announcement =
    await contentService.createAnnouncement(
      validated(req, res, "body"),
      req.user._id
    );

  res.status(201).json({
    success: true,
    message: "Announcement created successfully",
    data: announcement,
  });
}

export async function listAnnouncementsController(req, res) {
  const result = await contentService.listAnnouncements(
    validated(req, res, "query"),
    { publicOnly: true }
  );

  res.status(200).json({
    success: true,
    ...result,
  });
}

export async function listManageAnnouncementsController(req, res) {
  const result = await contentService.listAnnouncements(
    validated(req, res, "query")
  );

  res.status(200).json({
    success: true,
    ...result,
  });
}

export async function getAnnouncementController(req, res) {
  const announcement =
    await contentService.getAnnouncementBySlug(
      req.params.slug
    );

  res.status(200).json({
    success: true,
    data: announcement,
  });
}

export async function updateAnnouncementController(req, res) {
  const announcement =
    await contentService.updateAnnouncement(
      req.params.id,
      validated(req, res, "body")
    );

  res.status(200).json({
    success: true,
    message: "Announcement updated successfully",
    data: announcement,
  });
}

export async function archiveAnnouncementController(req, res) {
  const announcement =
    await contentService.archiveAnnouncement(
      req.params.id
    );

  res.status(200).json({
    success: true,
    message: "Announcement archived successfully",
    data: announcement,
  });
}