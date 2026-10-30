
import { Router } from "express";

import {
  createMemberController,
  listMembersController,
  getMemberController,
  updateMemberController,
  archiveMemberController,
} from "../controller/memberController.js";

import {
  createMemberSchema,
  listMembersSchema,
  memberIdSchema,
  updateMemberSchema,
} from "../utils/memberValidation.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Membership records contain private personal information.
router.use(
  authenticate,
  authorizeRoles("admin", "pastor")
);

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - Members
 *     summary: Create a member
 *     description: Creates a church member record. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *               address:
 *                 type: string
 *                 example: Warri, Delta State
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1995-05-12"
 *               notes:
 *                 type: string
 *                 example: Joined the church recently
 *     responses:
 *       201:
 *         description: Member created successfully
 *       400:
 *         description: Invalid member details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/",
  validateMiddleware(createMemberSchema),
  asyncHandler(createMemberController)
);

/**
 * @swagger
 * /members:
 *   get:
 *     tags:
 *       - Members
 *     summary: List members
 *     description: Returns a paginated list of church members.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search for members.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived]
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
 *         description: Members retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/",
  validateMiddleware(listMembersSchema),
  asyncHandler(listMembersController)
);

/**
 * @swagger
 * /members/{id}:
 *   get:
 *     tags:
 *       - Members
 *     summary: Get a member
 *     description: Retrieves a member by their database ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB member ID
 *     responses:
 *       200:
 *         description: Member retrieved successfully
 *       400:
 *         description: Invalid member ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Member not found
 */
router.get(
  "/:id",
  validateMiddleware(memberIdSchema),
  asyncHandler(getMemberController)
);

/**
 * @swagger
 * /members/{id}:
 *   patch:
 *     tags:
 *       - Members
 *     summary: Update a member
 *     description: Updates an existing member record. Admin or pastor access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 example: "+2348098765432"
 *               address:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               membershipStatus:
 *                 type: string
 *                 enum: [active, inactive, archived]
 *     responses:
 *       200:
 *         description: Member updated successfully
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Member not found
 */
router.patch(
  "/:id",
  validateMiddleware(updateMemberSchema),
  asyncHandler(updateMemberController)
);

/**
 * @swagger
 * /members/{id}/archive:
 *   patch:
 *     tags:
 *       - Members
 *     summary: Archive a member
 *     description: Archives a member without permanently deleting the record.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB member ID
 *     responses:
 *       200:
 *         description: Member archived successfully
 *       400:
 *         description: Invalid member ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Member not found
 */
router.patch(
  "/:id/archive",
  validateMiddleware(memberIdSchema),
  asyncHandler(archiveMemberController)
);

export default router;
