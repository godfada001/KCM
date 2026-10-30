
import { Router } from "express";

import {
  createMinistryController,
  listMinistriesController,
  getMinistryController,
  updateMinistryController,
  archiveMinistryController,
  listMinistryMembersController,
  addMinistryMemberController,
  removeMinistryMemberController,
} from "../controller/ministryController.js";

import {
  createMinistrySchema,
  updateMinistrySchema,
  ministryIdSchema,
  listMinistriesSchema,
  addMinistryMemberSchema,
  ministryMemberParamsSchema,
  listMinistryMembersSchema,
} from "../utils/ministryValidation.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /ministries:
 *   post:
 *     tags:
 *       - Ministries
 *     summary: Create a ministry
 *     description: Creates a ministry. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Choir
 *               description:
 *                 type: string
 *                 example: The church music and worship ministry
 *               leader:
 *                 type: string
 *                 nullable: true
 *                 example: "67123456789abcdef0123456"
 *               meetingDay:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                 example: saturday
 *               meetingTime:
 *                 type: string
 *                 pattern: "^([01]\\d|2[0-3]):[0-5]\\d$"
 *                 example: "15:00"
 *               meetingLocation:
 *                 type: string
 *                 example: Main Church Auditorium
 *     responses:
 *       201:
 *         description: Ministry created successfully
 *       400:
 *         description: Invalid ministry details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/",
  authorizeRoles("admin", "pastor"),
  validateMiddleware(createMinistrySchema),
  asyncHandler(createMinistryController)
);

/**
 * @swagger
 * /ministries:
 *   get:
 *     tags:
 *       - Ministries
 *     summary: List ministries
 *     description: Returns ministries accessible to the current user. Admins and pastors can list ministries, while ministry leaders may be restricted to their assigned ministries.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search ministry names.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived]
 *         description: Filter ministries by status.
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Ministries retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/",
  authorizeRoles("admin", "pastor", "ministry_leader"),
  validateMiddleware(listMinistriesSchema),
  asyncHandler(listMinistriesController)
);

/**
 * @swagger
 * /ministries/{id}/members:
 *   get:
 *     tags:
 *       - Ministries
 *     summary: List ministry members
 *     description: Returns members associated with a ministry. Access depends on the authenticated user's role and ministry permissions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ministry ID.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         description: Filter memberships by status.
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Ministry members retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Ministry not found
 */
router.get(
  "/:id/members",
  authorizeRoles("admin", "pastor", "ministry_leader"),
  validateMiddleware(listMinistryMembersSchema),
  asyncHandler(listMinistryMembersController)
);

/**
 * @swagger
 * /ministries/{id}/members:
 *   post:
 *     tags:
 *       - Ministries
 *     summary: Add a member to a ministry
 *     description: Adds a church member to a ministry, subject to role and ministry permissions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ministry ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: string
 *                 example: "67123456789abcdef0123456"
 *     responses:
 *       201:
 *         description: Member added to ministry successfully
 *       400:
 *         description: Invalid member ID or request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Ministry or member not found
 *       409:
 *         description: Member is already active in this ministry
 */
router.post(
  "/:id/members",
  authorizeRoles("admin", "pastor", "ministry_leader"),
  validateMiddleware(addMinistryMemberSchema),
  asyncHandler(addMinistryMemberController)
);

/**
 * @swagger
 * /ministries/{id}/members/{memberId}:
 *   delete:
 *     tags:
 *       - Ministries
 *     summary: Remove a member from a ministry
 *     description: Ends an active ministry membership while retaining its history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ministry ID.
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB member ID.
 *     responses:
 *       200:
 *         description: Member removed from ministry successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Active membership not found
 */
router.delete(
  "/:id/members/:memberId",
  authorizeRoles("admin", "pastor", "ministry_leader"),
  validateMiddleware(ministryMemberParamsSchema),
  asyncHandler(removeMinistryMemberController)
);

/**
 * @swagger
 * /ministries/{id}:
 *   get:
 *     tags:
 *       - Ministries
 *     summary: Get a ministry
 *     description: Retrieves a ministry by its ID, subject to the authenticated user's permissions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ministry ID.
 *     responses:
 *       200:
 *         description: Ministry retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You cannot access this ministry
 *       404:
 *         description: Ministry not found
 */
router.get(
  "/:id",
  authorizeRoles("admin", "pastor", "ministry_leader"),
  validateMiddleware(ministryIdSchema),
  asyncHandler(getMinistryController)
);

/**
 * @swagger
 * /ministries/{id}:
 *   patch:
 *     tags:
 *       - Ministries
 *     summary: Update a ministry
 *     description: Updates ministry details. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ministry ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Church Choir
 *               description:
 *                 type: string
 *               leader:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived]
 *               meetingDay:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               meetingTime:
 *                 type: string
 *                 pattern: "^([01]\\d|2[0-3]):[0-5]\\d$"
 *                 example: "16:30"
 *               meetingLocation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ministry updated successfully
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Ministry not found
 */
router.patch(
  "/:id",
  authorizeRoles("admin", "pastor"),
  validateMiddleware(updateMinistrySchema),
  asyncHandler(updateMinistryController)
);

/**
 * @swagger
 * /ministries/{id}/archive:
 *   patch:
 *     tags:
 *       - Ministries
 *     summary: Archive a ministry
 *     description: Archives a ministry and ends its active memberships, if implemented by the controller.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ministry ID.
 *     responses:
 *       200:
 *         description: Ministry archived successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Ministry not found
 */
router.patch(
  "/:id/archive",
  authorizeRoles("admin", "pastor"),
  validateMiddleware(ministryIdSchema),
  asyncHandler(archiveMinistryController)
);

export default router;
