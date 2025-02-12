const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  date: {
    type: String, // Alternatively, you can use Date if you want automatic date handling
    required: true,
  },
  location: {
    name: { type: String, required: true },
    neighborhood: { type: String, required: true },
    map: { type: String, required: true }, // URL to Google Maps
  },
  theme: { type: String, required: true },
  description: { type: String, required: true },
  photo: { type: String, required: true }, // File name for the event's image
});

module.exports = mongoose.model('Event', EventSchema);
