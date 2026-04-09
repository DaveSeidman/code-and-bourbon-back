const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: { type: String },
  email: { type: String, unique: true, lowercase: true, trim: true },
  profilePicture: { type: String },
  chatAccessRequestedAt: { type: Date, default: null },
  chatAccessRequestCount: { type: Number, default: 0 },
  chatAccessRequestNotifiedAt: { type: Date, default: null },
  chatApproved: { type: Boolean, default: false },
  chatApprovedAt: { type: Date, default: null },
  chatApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    default: null,
  },
});

module.exports = mongoose.model("Member", MemberSchema);
