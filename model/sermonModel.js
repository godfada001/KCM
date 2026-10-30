import mongoose from "mongoose";

const sermonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    speaker: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    scriptureReference: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    preachedAt: {
      type: Date,
      default: null,
    },

    videoUrl: {
      type: String,
      trim: true,
      default: null,
    },

    audioUrl: {
      type: String,
      trim: true,
      default: null,
    },

    thumbnailUrl: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

sermonSchema.index({ status: 1, publishedAt: -1 });
sermonSchema.index({ title: "text", speaker: "text" });

const Sermon = mongoose.model("Sermon", sermonSchema);

export default Sermon;