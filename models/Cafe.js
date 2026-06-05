const mongoose = require('mongoose');

const CafeSchema = new mongoose.Schema({
  name: String,
  rating: Number,
  address: String,
  rest_type: String,
  city: String,
  avgBudget: Number,
  moodTags: [String],
  seatingTypes: [String],
  menuTypes: [String],
  companionTypes: [String],
  photoUrl: String,
  images: [String],
  reelUrl: String,
  bestVisitTime: String,
  peakHours: String,
  crowdMorning: String,
  crowdAfternoon: String,
  crowdEvening: String,
  crowdNight: String,
  crowdPattern: { // Keeping for backwards compatibility if needed
    morning: String,
    afternoon: String,
    evening: String,
    night: String
  }
}, { 
  collection: 'Cafe',        // Force singular 'Cafe'
  strict: false              // THIS IS KEY: It allows Mongoose to show data even if the schema isn't perfect
});

module.exports = mongoose.models.Cafe || mongoose.model('Cafe', CafeSchema, 'Cafe');  