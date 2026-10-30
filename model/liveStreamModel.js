import mongoose from "mongoose";

const liveStreamSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "main" },
    embedUrl: { type: String, trim: true, default: "" },
    isLive: { type: Boolean, default: false },
    serviceTime: { type: String, trim: true, maxlength: 120, default: "Sunday, 7:00 AM–11:30 AM" },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("LiveStream", liveStreamSchema);
