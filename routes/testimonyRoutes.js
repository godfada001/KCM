
import { Router } from "express";

import {
  createTestimonyController,
  listPublicTestimoniesController,
  listPendingTestimoniesController,
  reviewTestimonyController,
} from "../controller/testimonyController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Testimonies
 *   description: Public testimony submissions and church moderation
 */

/**
 * @swagger
 * /testimonies:
 *   get:
 *     summary: List approved testimonies
 *     description: Returns only approved testimonies for public display. Anonymous submissions never expose a display name.
 *     tags: [Testimonies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of testimonies per page
 *     responses:
 *       200:
 *         description: Approved testimonies retrieved successfully
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  asyncHandler(listPublicTestimoniesController)
);

/**
 * @swagger
 * /testimonies:
 *   post:
 *     summary: Submit a testimony
 *     description: Public endpoint. Submissions remain pending until approved. When isAnonymous is true, the display name is not stored.
 *     tags: [Testimonies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - testimony
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: A testimony of healing
 *               testimony:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10000
 *                 example: I want to share what happened in my life...
 *               isAnonymous:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               displayName:
 *                 type: string
 *                 maxLength: 120
 *                 description: Required when isAnonymous is false; ignored for anonymous submissions.
 *                 example: Grace
 *     responses:
 *       201:
 *         description: Testimony submitted and awaiting review
 *       400:
 *         description: Invalid submission
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  asyncHandler(createTestimonyController)
);

/**
 * @swagger
 * /testimonies/admin/pending:
 *   get:
 *     summary: List pending testimonies for review
 *     description: Requires an authenticated admin or pastor.
 *     tags: [Testimonies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Pending testimonies retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/admin/pending",
  authenticate,
  authorizeRoles("admin", "pastor"),
  asyncHandler(listPendingTestimoniesController)
);

/**
 * @swagger
 * /testimonies/{id}/review:
 *   patch:
 *     summary: Approve or reject a testimony
 *     description: Requires an authenticated admin or pastor. Only pending testimonies can be reviewed.
 *     tags: [Testimonies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimony MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *     responses:
 *       200:
 *         description: Testimony reviewed successfully
 *       400:
 *         description: Invalid ID or review action
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Pending testimony not found
 */
router.patch(
  "/:id/review",
  authenticate,
  authorizeRoles("admin", "pastor"),
  asyncHandler(reviewTestimonyController)
);

export default router;
