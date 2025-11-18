const express = require('express');
const router = express.Router();
const Event = require('../models/events');

// OPTIONAL: If you eventually add "create event", "edit event" etc.
// keeping this here is harmless
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}


// GET all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error while fetching events" });
  }
});


// GET single event by ID
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ message: "Server error while fetching event" });
  }
});


module.exports = router;
