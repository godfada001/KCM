import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    membershipNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
      select: false,
    },

    dateOfBirth: {
      type: Date,
      default: null,
      select: false,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    membershipStatus: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notes: {
      type: String,
      maxlength: 2000,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

memberSchema.index({
  lastName: 1,
  firstName: 1,
});

memberSchema.index({
  membershipStatus: 1,
  createdAt: -1,
});

memberSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $type: "objectId" },
    },
  }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;