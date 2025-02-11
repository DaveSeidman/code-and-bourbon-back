const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: { type: String },
  email: { type: String, unique: true },
  profilePicture: { type: String }
});

module.exports = mongoose.model('User', UserSchema);
