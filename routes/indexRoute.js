import { Router } from "express";

import authRoutes from "./authRoute.js";
import userRoutes from "./userRoute.js";
import memberRoutes from "./memberRoute.js";
import ministryRoutes from "./ministryRoute.js";
import contentRoutes from "./contentRoute.js";
import testimonyRoutes from "./testimonyRoutes.js";
import liveStreamRoutes from "./liveStreamRoute.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Church API is running",
    data: {
      name: "Church API",
      version: "1.0.0",
    },
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/members", memberRoutes);
router.use("/ministries", ministryRoutes);
router.use("/content", contentRoutes);
router.use("/testimonies", testimonyRoutes);
router.use("/live-stream", liveStreamRoutes);
export default router;
