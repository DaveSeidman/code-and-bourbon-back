const mongoose = require('mongoose');

const SignupSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: Number, enum: [-1, 0, 1], required: true }
}, {
  timestamps: true
});

// Prevent duplicate rows
SignupSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Signup', SignupSchema);
