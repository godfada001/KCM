import LiveStream from "../model/liveStreamModel.js";
import { ApiError } from "../utils/apiError.js";

const defaultStream = { embedUrl: "", isLive: false, serviceTime: "Sunday, 7:00 AM–11:30 AM" };

export async function getLiveStream(req, res) {
  const stream = await LiveStream.findOne({ key: "main" }).lean();
  const { embedUrl, isLive, serviceTime } = stream || defaultStream;
  res.status(200).json({ success: true, data: { embedUrl, isLive, serviceTime } });
}

export async function updateLiveStream(req, res) {
  const { embedUrl = "", isLive = false, serviceTime = "Sunday, 7:00 AM–11:30 AM" } = req.body || {};
  if (typeof embedUrl !== "string") throw new ApiError(400, "Stream embed URL must be text", "INVALID_STREAM_URL");
  let parsedUrl;
  if (embedUrl) {
    try { parsedUrl = new URL(embedUrl); } catch { throw new ApiError(400, "Enter a valid stream embed URL", "INVALID_STREAM_URL"); }
    if (parsedUrl.protocol !== "https:") throw new ApiError(400, "Stream embed URLs must use HTTPS", "INVALID_STREAM_URL");
  }
  if (typeof isLive !== "boolean") throw new ApiError(400, "Live status must be true or false", "INVALID_STREAM_STATUS");
  if (typeof serviceTime !== "string" || serviceTime.trim().length > 120) throw new ApiError(400, "Service time must be 120 characters or fewer", "INVALID_SERVICE_TIME");

  const stream = await LiveStream.findOneAndUpdate(
    { key: "main" },
      { $set: { embedUrl: embedUrl.trim(), isLive, serviceTime: serviceTime.trim() }, $setOnInsert: { key: "main" } },
    { new: true, upsert: true, runValidators: true }
  ).lean();
  res.status(200).json({ success: true, message: "Live stream settings saved", data: { embedUrl: stream.embedUrl, isLive: stream.isLive, serviceTime: stream.serviceTime } });
}
