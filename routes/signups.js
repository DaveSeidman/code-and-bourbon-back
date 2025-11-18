const express = require('express');
const router = express.Router();
const Signup = require('../models/signup');

// Middleware: require login
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}


// GET /api/signups?eventId=xxx
router.get('/', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.query;
    const userId = req.user._id; // enforce current user

    if (!eventId) {
      return res.status(400).json({ error: 'eventId required' });
    }

    const signup = await Signup.findOne({ userId, eventId });
    res.json(signup || {});
  } catch (err) {
    console.error("Error fetching signup:", err);
    res.status(500).json({ message: "Server error loading signup" });
  }
});


// POST /api/signups
router.post('/', requireAuth, async (req, res) => {
  try {
    const { eventId, status } = req.body;
    const userId = req.user._id; // force authenticated user

    if (!eventId || typeof status !== 'number') {
      return res.status(400).json({ error: 'eventId and status required' });
    }

    const signup = await Signup.findOneAndUpdate(
      { userId, eventId },
      { status },
      { upsert: true, new: true }
    );

    res.json(signup);
  } catch (err) {
    console.error("Error saving signup:", err);
    res.status(500).json({ message: "Server error saving signup" });
  }
});


module.exports = router;
