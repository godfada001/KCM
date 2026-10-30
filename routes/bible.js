/*import { Router } from "express";
import { getPassage } from "../clients/bibleClient.js";

const router = Router();

// GET /api/bible?ref=john 3:16&translation=kjv
router.get("/", async (req, res) => {
  const { ref, translation = "web" } = req.query;
  if (!ref) return res.status(400).json({ error: "Missing 'ref' query param" });

  try {
    const data = await getPassage(ref, translation);
    if (!data) return res.status(404).json({ error: "Passage not found" });
    res.set("Cache-Control", "public, max-age=86400");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Upstream Bible API failed" });
  }
});

export default router;*/

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
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Sermon created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/sermons",
  ...manageContent,
  validateMiddleware(createSermonSchema),
  asyncHandler(createSermonController)
);