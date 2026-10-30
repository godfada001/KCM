
import { Router } from "express";

import {
  createSermonController,
  listSermonsController,
  listManageSermonsController,
  getSermonController,
  updateSermonController,
  archiveSermonController,
  createAnnouncementController,
  listAnnouncementsController,
  listManageAnnouncementsController,
  getAnnouncementController,
  updateAnnouncementController,
  archiveAnnouncementController,
} from "../controller/contentController.js";

import {
  createSermonSchema,
  updateSermonSchema,
  sermonIdSchema,
  sermonSlugSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementIdSchema,
  announcementSlugSchema,
  contentListSchema,
} from "../utils/contentValidation.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const manageContent = [
  authenticate,
  authorizeRoles("admin", "pastor"),
];

// =====================================================
// PUBLIC SERMON ENDPOINTS
// =====================================================

/**
 * @swagger
 * /content/sermons:
 *   get:
 *     tags:
 *       - Sermons
 *     summary: List published sermons
 *     description: Returns published sermons available to the public.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search sermons.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Sermons retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
  "/sermons",
  validateMiddleware(contentListSchema),
  asyncHandler(listSermonsController)
);

/**
 * @swagger
 * /content/sermons/slug/{slug}:
 *   get:
 *     tags:
 *       - Sermons
 *     summary: Get a sermon by slug
 *     description: Retrieves a published sermon using its URL slug.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: walking-by-faith
 *     responses:
 *       200:
 *         description: Sermon retrieved successfully
 *       400:
 *         description: Invalid sermon slug
 *       404:
 *         description: Published sermon not found
 */
router.get(
  "/sermons/slug/:slug",
  validateMiddleware(sermonSlugSchema),
  asyncHandler(getSermonController)
);

// =====================================================
// PROTECTED SERMON MANAGEMENT ENDPOINTS
// Admin and pastor access required
// =====================================================

/**
 * @swagger
 * /content/sermons/manage/all:
 *   get:
 *     tags:
 *       - Sermons
 *     summary: List sermons for management
 *     description: Lists sermons for administrators and pastors, including unpublished records if supported by the controller.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Sermons retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 */
router.get(
  "/sermons/manage/all",
  ...manageContent,
  validateMiddleware(contentListSchema),
  asyncHandler(listManageSermonsController)
);

/**
 * @swagger
 * /content/sermons:
 *   post:
 *     tags:
 *       - Sermons
 *     summary: Create a sermon
 *     description: Creates a sermon. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - speaker
 *             properties:
 *               title:
 *                 type: string
 *                 example: Walking by Faith
 *               speaker:
 *                 type: string
 *                 example: Pastor John
 *               description:
 *                 type: string
 *                 example: A message about trusting God.
 *               scriptureReference:
 *                 type: string
 *                 example: 2 Corinthians 5:7
 *               preachedAt:
 *                 type: string
 *                 format: date-time
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Sermon created successfully
 *       400:
 *         description: Invalid sermon details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 */
router.post(
  "/sermons",
  ...manageContent,
  validateMiddleware(createSermonSchema),
  asyncHandler(createSermonController)
);

/**
 * @swagger
 * /content/sermons/{id}:
 *   patch:
 *     tags:
 *       - Sermons
 *     summary: Update a sermon
 *     description: Updates an existing sermon. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB sermon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               speaker:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               scriptureReference:
 *                 type: string
 *                 nullable: true
 *               preachedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Sermon updated successfully
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 *       404:
 *         description: Sermon not found
 */
router.patch(
  "/sermons/:id",
  ...manageContent,
  validateMiddleware(updateSermonSchema),
  asyncHandler(updateSermonController)
);

/**
 * @swagger
 * /content/sermons/{id}/archive:
 *   patch:
 *     tags:
 *       - Sermons
 *     summary: Archive a sermon
 *     description: Archives a sermon. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB sermon ID
 *     responses:
 *       200:
 *         description: Sermon archived successfully
 *       400:
 *         description: Invalid sermon ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 *       404:
 *         description: Sermon not found
 */
router.patch(
  "/sermons/:id/archive",
  ...manageContent,
  validateMiddleware(sermonIdSchema),
  asyncHandler(archiveSermonController)
);

// =====================================================
// PUBLIC ANNOUNCEMENT ENDPOINTS
// =====================================================

/**
 * @swagger
 * /content/announcements:
 *   get:
 *     tags:
 *       - Announcements
 *     summary: List public announcements
 *     description: Returns announcements available to the public.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search announcements.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
  "/announcements",
  validateMiddleware(contentListSchema),
  asyncHandler(listAnnouncementsController)
);

/**
 * @swagger
 * /content/announcements/slug/{slug}:
 *   get:
 *     tags:
 *       - Announcements
 *     summary: Get an announcement by slug
 *     description: Retrieves an announcement using its URL slug.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: sunday-worship-service
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 *       400:
 *         description: Invalid announcement slug
 *       404:
 *         description: Announcement not found or not publicly available
 */
router.get(
  "/announcements/slug/:slug",
  validateMiddleware(announcementSlugSchema),
  asyncHandler(getAnnouncementController)
);

// =====================================================
// PROTECTED ANNOUNCEMENT MANAGEMENT ENDPOINTS
// Admin and pastor access required
// =====================================================

/**
 * @swagger
 * /content/announcements/manage/all:
 *   get:
 *     tags:
 *       - Announcements
 *     summary: List announcements for management
 *     description: Lists announcements for administrators and pastors, including non-public records if supported by the controller.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 */
router.get(
  "/announcements/manage/all",
  ...manageContent,
  validateMiddleware(contentListSchema),
  asyncHandler(listManageAnnouncementsController)
);

/**
 * @swagger
 * /content/announcements:
 *   post:
 *     tags:
 *       - Announcements
 *     summary: Create an announcement
 *     description: Creates a church announcement. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sunday Worship Service
 *               body:
 *                 type: string
 *                 example: Join us this Sunday at 9:00 AM.
 *               category:
 *                 type: string
 *                 enum: [general, service, youth, children, prayer, ministry, other]
 *                 default: general
 *               priority:
 *                 type: string
 *                 enum: [normal, important, urgent]
 *                 default: normal
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Invalid announcement details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 */
router.post(
  "/announcements",
  ...manageContent,
  validateMiddleware(createAnnouncementSchema),
  asyncHandler(createAnnouncementController)
);

/**
 * @swagger
 * /content/announcements/{id}:
 *   patch:
 *     tags:
 *       - Announcements
 *     summary: Update an announcement
 *     description: Updates announcement content, priority, status, or publication schedule.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, service, youth, children, prayer, ministry, other]
 *               priority:
 *                 type: string
 *                 enum: [normal, important, urgent]
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 *       404:
 *         description: Announcement not found
 */
router.patch(
  "/announcements/:id",
  ...manageContent,
  validateMiddleware(updateAnnouncementSchema),
  asyncHandler(updateAnnouncementController)
);

/**
 * @swagger
 * /content/announcements/{id}/archive:
 *   patch:
 *     tags:
 *       - Announcements
 *     summary: Archive an announcement
 *     description: Archives an announcement. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB announcement ID
 *     responses:
 *       200:
 *         description: Announcement archived successfully
 *       400:
 *         description: Invalid announcement ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or pastor role required
 *       404:
 *         description: Announcement not found
 */
router.patch(
  "/announcements/:id/archive",
  ...manageContent,
  validateMiddleware(announcementIdSchema),
  asyncHandler(archiveAnnouncementController)
);

export default router;
