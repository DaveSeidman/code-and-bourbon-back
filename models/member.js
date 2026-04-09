const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: { type: String },
  email: { type: String, unique: true, lowercase: true, trim: true },
  profilePicture: { type: String },
  chatApproved: { type: Boolean, default: false },
  chatApprovedAt: { type: Date, default: null },
  chatApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    default: null,
  },
});

module.exports = mongoose.model("Member", MemberSchema);
