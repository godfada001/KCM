
import { Router } from "express";

import {
  listUsersController,
  getUserController,
  updateUserRoleController,
  updateUserStatusController,
} from "../controller/userController.js";

import {
  listUsersSchema,
  userIdSchema,
  updateRoleSchema,
  updateStatusSchema,
} from "../utils/userValidation.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// All user management endpoints require authentication and admin access.
router.use(authenticate, authorizeRoles("admin"));

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users
 *     description: Returns a paginated list of users. Admin access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page.
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",
  validateMiddleware(listUsersSchema),
  asyncHandler(listUsersController)
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user
 *     description: Retrieves a user's details by their MongoDB ID. Admin access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID.
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  validateMiddleware(userIdSchema),
  asyncHandler(getUserController)
);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change user role
 *     description: Updates a user's role. Admin access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, pastor, ministry_leader, admin]
 *                 example: pastor
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/role",
  validateMiddleware(updateRoleSchema),
  asyncHandler(updateUserRoleController)
);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change user status
 *     description: Activates or deactivates a user account. Admin access is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/status",
  validateMiddleware(updateStatusSchema),
  asyncHandler(updateUserStatusController)
);

export default router;
