import { Router } from "express";
import { getLiveStream, updateLiveStream } from "../controller/liveStreamController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(getLiveStream));
router.put("/", authenticate, authorizeRoles("admin", "pastor"), asyncHandler(updateLiveStream));
export default router;
