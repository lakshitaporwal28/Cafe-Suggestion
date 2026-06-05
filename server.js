const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Cafe = require('./models/Cafe');
const Booking = require('./models/Booking');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { getCurrentCrowdStatus, getBestTimeMessage, generateCafeSummary, getDynamicCrowdStatusAndRecommendation } = require('./utils/cafeHelpers');

const app = express();

// Middleware
const path = require('path');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// MongoDB Connection & Step 1 Debugging
// ================================
const mongoURI = 'mongodb+srv://rishiporwal2004_db_user:h3fR6pMIfvFqUolY@cluster0.qcgylva.mongodb.net/Cafe?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connected ');

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
    const cafes = await Cafe.find({}).lean();
    const enrichedCafes = cafes.map(cafe => {
      const dynamicData = getDynamicCrowdStatusAndRecommendation(cafe);
      return {
        ...cafe,
        crowdStatus: dynamicData.status,
        crowdRecommendation: dynamicData.recommendation,
        bestTimeMessage: getBestTimeMessage(cafe),
        summary: generateCafeSummary(cafe)
      };
    });
    console.log(`GET /api/test - Found ${enrichedCafes.length} cafes`);
    res.json(enrichedCafes);
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
    
    const enrichedCafes = cafes.map(cafe => {
      const dynamicData = getDynamicCrowdStatusAndRecommendation(cafe);
      return {
        ...cafe,
        crowdStatus: dynamicData.status,
        crowdRecommendation: dynamicData.recommendation,
        bestTimeMessage: getBestTimeMessage(cafe),
        summary: generateCafeSummary(cafe)
      };
    });
    
    console.log(`Results found: ${enrichedCafes.length}`);
    res.json(enrichedCafes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server filtering error' });
  }
});

// POST /api/bookings - save a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { cafeId, name, phone, date, time, guests } = req.body;
    
    // Validate required fields
    if (!cafeId || !name || !phone || !date || !time || !guests) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newBooking = new Booking({
      cafeId,
      name,
      phone,
      date,
      time,
      guests
    });

    await newBooking.save();
    
    console.log(`✅ New booking saved for ${name} on ${date} at ${time}`);
    res.status(201).json({ message: 'Booking confirmed!', booking: newBooking });
  } catch (err) {
    console.error('Error saving booking:', err);
    res.status(500).json({ error: 'Could not save booking' });
  }
});

// ================================
// Auth Routes
// ================================

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required.' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email is already registered.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        bookmarks: newUser.bookmarks || [],
        searchCount: newUser.searchCount || 0,
        bookingCount: newUser.bookingCount || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bookmarks: user.bookmarks || [],
        searchCount: user.searchCount || 0,
        bookingCount: user.bookingCount || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/users/:userId/profile
app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      bookmarks: user.bookmarks || [],
      searchCount: user.searchCount || 0,
      bookingCount: user.bookingCount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/users/:userId/bookmark
app.post('/api/users/:userId/bookmark', async (req, res) => {
  try {
    const { cafeId } = req.body;
    if (!cafeId) return res.status(400).json({ error: 'cafeId is required' });
    
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const index = user.bookmarks.indexOf(cafeId);
    if (index > -1) {
      user.bookmarks.splice(index, 1);
    } else {
      user.bookmarks.push(cafeId);
    }
    await user.save();
    res.json({ bookmarks: user.bookmarks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// POST /api/users/:userId/increment-search
app.post('/api/users/:userId/increment-search', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $inc: { searchCount: 1 } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ searchCount: user.searchCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to increment search count' });
  }
});

// POST /api/users/:userId/increment-booking
app.post('/api/users/:userId/increment-booking', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $inc: { bookingCount: 1 } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ bookingCount: user.bookingCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to increment booking count' });
  }
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Export app for Vercel serverless functions
module.exports = app;