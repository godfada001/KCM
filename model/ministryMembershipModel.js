import mongoose from "mongoose";

const ministryMembershipSchema = new mongoose.Schema(
  {
    ministry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ministry",
      required: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    addedBy: {
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

// Only one active membership for a member in a given ministry.
ministryMembershipSchema.index(
  { ministry: 1, member: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

ministryMembershipSchema.index({
  ministry: 1,
  status: 1,
});

ministryMembershipSchema.index({
  member: 1,
  status: 1,
});

const MinistryMembership = mongoose.model(
  "MinistryMembership",
  ministryMembershipSchema
);

export default MinistryMembership;