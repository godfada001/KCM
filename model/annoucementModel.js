import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
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

    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 10000,
    },

    category: {
      type: String,
      enum: [
        "general",
        "service",
        "youth",
        "children",
        "prayer",
        "ministry",
        "other",
      ],
      default: "general",
      required: true,
    },

    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
    },

    publishAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
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

announcementSchema.index({ status: 1, publishAt: 1, expiresAt: 1 });
announcementSchema.index({ title: "text", body: "text" });

const Announcement = mongoose.model(
  "Announcement",
  announcementSchema
);

export default Announcement;