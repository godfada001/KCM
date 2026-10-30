import { Router } from "express";

import {
  registerController,
  loginController,
  logoutController,
  refreshController,
  meController,
  updateMeController,
} from "../controller/authController.js";

import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../utils/authValidation.js";

import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireTrustedOrigin } from "../middleware/originMiddleware.js";

const router = Router();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new member account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid registration details
 *       409:
 *         description: Email already exists
 */
router.post(
  "/register",
  validateMiddleware(registerSchema),
  asyncHandler(registerController)
);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Log in
 *     description: Authenticates a user and returns authentication credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
router.post(
  "/login",
  validateMiddleware(loginSchema),
  asyncHandler(loginController)
);

router.post(
  "/refresh",
  asyncHandler(refreshController)
);

router.post(
  "/logout",
  asyncHandler(logoutController)
);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user
 *     description: Returns the profile of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(meController)
);

router.patch(
  "/me",
  authenticate,
  validateMiddleware(updateProfileSchema),
  asyncHandler(updateMeController)
);
 /** 
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Uses the refresh session to obtain a new access token.
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Refresh session is missing, invalid, or expired
 */
router.post(
  "/refresh",
  requireTrustedOrigin,
  asyncHandler(refreshController)
);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Log out
 *     description: Revokes the user's refresh session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Authentication required
 */
router.post(
  "/logout",
  requireTrustedOrigin,
  asyncHandler(logoutController)
);

export default router;


