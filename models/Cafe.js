const mongoose = require('mongoose');

const CafeSchema = new mongoose.Schema({
  name: String,
  city: String,
  avgBudget: Number,
  moodTags: [String],        // Must be [String] for Arrays
  seatingTypes: [String],    // Must be [String] for Arrays
  menuTypes: [String],       // Must be [String] for Arrays
  companionTypes: [String],  // Must be [String] for Arrays
  images: [String]           // Must be [String] for Arrays
}, { 
  collection: 'Cafe',        // Force singular 'Cafe'
  strict: false              // THIS IS KEY: It allows Mongoose to show data even if the schema isn't perfect
});

module.exports = mongoose.models.Cafe || mongoose.model('Cafe', CafeSchema, 'Cafe');