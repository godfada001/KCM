
import mongoose from "mongoose";

const testimonySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    testimony: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 10000,
    },

    isAnonymous: {
      type: Boolean,
      default: true,
      required: true,
    },

    // Only populated when the submitter chooses to share their name.
    displayName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Efficiently retrieve approved testimonies for the homepage.
testimonySchema.index({ status: 1, approvedAt: -1 });
testimonySchema.index({ title: "text", testimony: "text" });

const Testimony = mongoose.model("Testimony", testimonySchema);

export default Testimony;
