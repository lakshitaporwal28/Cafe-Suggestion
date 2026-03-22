const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Cafe = require('./models/Cafe');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ================================
// MongoDB Connection & Step 1 Debugging
// ================================
const mongoURI = 'mongodb+srv://rishiporwal2004_db_user:QiuKrisBkuBBVRnL@cluster0.qcgylva.mongodb.net/Cafe?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    // --- STEP 1: THE DOCUMENT COUNTER ---
    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`📂 Database: "${dbName}"`);
    console.log(`📋 Collections found:`, collectionNames);

    // This specifically checks the 'Cafe' collection
    const count = await mongoose.connection.db.collection('Cafe').countDocuments();
    console.log(`📊 Documents actually inside "Cafe" collection: ${count}`);

    if (count === 0) {
      console.error('❌ ERROR: Your database is EMPTY. Please run "node insertCafes.js" first!');
    } else {
      console.log('✨ SUCCESS: Data is present and ready to be served.');
    }
  })
  .catch(err => console.error('❌ Connection Error:', err));

// ================================
// API Routes
// ================================

// GET /api/test - returns everything
app.get('/api/test', async (req, res) => {
  try {
    // We use .lean() to get plain JSON objects, which is faster and more reliable
    const cafes = await Cafe.find({}).lean();
    console.log(`GET /api/test - Found ${cafes.length} cafes`);
    res.json(cafes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database search failed" });
  }
});

// POST /api/cafes - filtered search
app.post('/api/cafes', async (req, res) => {
  try {
    const { moodTags, companionTypes, seatingTypes, menuTypes } = req.body;
    let query = {};
    let filters = [];

    // Case-insensitive regex matching
    if (moodTags?.length) {
      filters.push({ moodTags: { $in: moodTags.map(t => new RegExp(`^${t}$`, 'i')) } });
    }
    if (companionTypes?.length) {
      filters.push({ companionTypes: { $in: companionTypes.map(t => new RegExp(`^${t}$`, 'i')) } });
    }
    if (seatingTypes?.length) {
      filters.push({ seatingTypes: { $in: seatingTypes.map(t => new RegExp(`^${t}$`, 'i')) } });
    }
    if (menuTypes?.length) {
      filters.push({ menuTypes: { $in: menuTypes.map(t => new RegExp(`^${t}$`, 'i')) } });
    }

    if (filters.length > 0) {
      query = { $and: filters };
    }

    console.log('Running Query:', JSON.stringify(query));
    const cafes = await Cafe.find(query).lean();
    console.log(`Results found: ${cafes.length}`);
    
    res.json(cafes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server filtering error' });
  }
});


// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));