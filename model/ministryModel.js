import mongoose from "mongoose";

const ministrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
      required: true,
    },

    meetingDay: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      default: null,
    },

    meetingTime: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
      default: null,
    },

    meetingLocation: {
      type: String,
      trim: true,
      maxlength: 200,
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

ministrySchema.index({ status: 1, name: 1 });

const Ministry = mongoose.model("Ministry", ministrySchema);

export default Ministry;