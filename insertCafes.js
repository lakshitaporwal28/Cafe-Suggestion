const mongoose = require('mongoose');
const Cafe = require('./models/Cafe');

const cafes = [
  {
    "name": "Mangosteen Cafe",
    "city": "Indore",
    "avgBudget": 700,
    "moodTags": ["Relax"],
    "seatingTypes": ["Indoor","Outdoor"],
    "menuTypes": ["Indian", "Drinks","Snacks"],
    "companionTypes": ["Friends","Family"],
    "images": ["https://b.zmtcdn.com/data/pictures/8/21158778/51555ef92616cd08993d09000eeb348c.png", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1080&q=80","https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080&q=80"]
  },
  {
    "name": "Berlin",
    "city": "Indore",
    "avgBudget": 800,
    "moodTags": ["Fun","Romantic"],
    "seatingTypes": ["Indoor", "Outdoor"],
    "menuTypes": ["Snacks", "Drinks", "Desserts"],
    "companionTypes": ["Friends", "Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/2/21761532/214fa0632076e2ec607d22c92dff2f51.jpg","https://b.zmtcdn.com/data/pictures/2/21761532/1bd49e0e831243eec6996e1635f96e94.png"]
  },
 {
    "name": "Cafe De Casa",
    "city": "Indore",
    "avgBudget": 350,
    "moodTags": ["Relax","Cozy"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Snacks", "Drinks"],
    "companionTypes": ["Friends", "Family"],
    "images": ["https://b.zmtcdn.com/data/pictures/5/20661325/7d2beb2054e56813ddb35c4c204aeb0a.jpeg", "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1080&q=80"]
  },
 {
    "name": "The Fusion Culture",
    "city": "Indore",
    "avgBudget": 350,
    "moodTags": ["Relax","Cozy"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Indian","Snacks", "Drinks", "Desserts"],
    "companionTypes": ["Friends", "Family"],
    "images": ["https://b.zmtcdn.com/data/pictures/4/21268814/fe72f3bac0a2acebfbc2951b4725225f.jpg"]
  },
 {
    "name": "Siolim",
    "city": "Indore",
    "avgBudget": 500,
    "moodTags": ["Romantic","Cozy","Work"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Snacks", "Drinks"],
    "companionTypes": ["Friends", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/9/21158679/55aedddd43028d3da24b30fc6bcbbae9.jpeg"]
  },
 {
    "name": "Neighbourhood",
    "city": "Indore",
    "avgBudget": 750,
    "moodTags": ["Romantic","Fun"],
    "seatingTypes": ["Indoor", "Outdoor"],
    "menuTypes": ["Snacks", "Drinks", "Desserts"],
    "companionTypes": ["Friends", "Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/1/22478691/dd85d9bea8ffbc4d94f5e3e1826f0ff5.jpg"]
  },
 {
    "name": "Oakaz",
    "city": "Indore",
    "avgBudget": 700,
    "moodTags": ["Romantic","Fun","Relax"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Indian","Snacks", "Drinks", "Desserts"],
    "companionTypes": ["Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/7/1400417/d6863e91348523890c2c821ad7cbb561.jpeg"]
  },
 {
    "name": "Hopin",
    "city": "Indore",
    "avgBudget": 600,
    "moodTags": ["Romantic","Cozy","Relax"],
    "seatingTypes": ["Indoor", "Outdoor"],
    "menuTypes": ["Indian","Snacks", "Drinks", "Desserts"],
    "companionTypes": ["Friends", "Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/7/20582207/9868246b58d676095b718de7d28e23fb.jpg"]
  },
 {
    "name": "Mama Loca",
    "city": "Indore",
    "avgBudget": 550,
    "moodTags": ["Fun","Relax"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Snacks", "Drinks"],
    "companionTypes": [ "Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/4/1401934/fa7a469484c6f83015c2688962023954.jpg"]
  },
 {
    "name": "11:11 Coffee",
    "city": "Indore",
    "avgBudget": 300,
    "moodTags": ["Work","Cozy"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Drinks", "Desserts"],
    "companionTypes": ["Friends"],
    "images": ["https://b.zmtcdn.com/data/pictures/5/20384005/69c1e4f7e4cf173fbea5b766cb4d202c.jpg"]
  }, {
    "name": "Chapter One",
    "city": "Indore",
    "avgBudget": 400,
    "moodTags": ["Relax","Work"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Drinks", "Desserts"],
    "companionTypes": ["Friends", "Family"],
    "images": ["https://b.zmtcdn.com/data/pictures/7/18769767/b34eb981baecd7f6bb40a0843c07704c.jpg"]
  }, {
    "name": "Xero Degree",
    "city": "Indore",
    "avgBudget": 400,
    "moodTags": ["Romantic","Relax"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Indian","Snacks", "Drinks", "Desserts"],
    "companionTypes": ["Friends", "Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/reviews_photos/cd8/1b415225d0e63c4a25be6171961afcd8_1656130098.jpg"]
  }, {
    "name": "Sky House",
    "city": "Indore",
    "avgBudget": 800,
    "moodTags": ["Romantic","Fun"],
    "seatingTypes": ["Outdoor"],
    "menuTypes": ["Indian","Snacks", "Drinks", "Desserts"],
    "companionTypes": ["Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/7/20647797/60c7817a66aafc0cf4c693178ad79415.jpg","https://b.zmtcdn.com/data/pictures/7/20647797/7a0877059c2c5ee425d01c6ea62143c8.jpg"]
  }, {
    "name": "Tiny House",
    "city": "Indore",
    "avgBudget": 500,
    "moodTags": ["Fun","Cozy"],
    "seatingTypes": ["Indoor"],
    "menuTypes": ["Drinks", "Desserts"],
    "companionTypes": ["Friends", "Family", "Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/0/20002720/10e72e98cb91802bb10c00ba3aa49160.jpeg","https://b.zmtcdn.com/data/reviews_photos/b9f/1a6c09958b2a241813743b912bc6eb9f_1638549882.jpg"]
  }, {
    "name": "Adam's Ale",
    "city": "Indore",
    "avgBudget": 600,
    "moodTags": ["Fun","Relax"],
    "seatingTypes": ["Indoor", "Outdoor"],
    "menuTypes": ["Snacks", "Drinks"],
    "companionTypes": ["Friends","Couple"],
    "images": ["https://b.zmtcdn.com/data/pictures/8/19644838/5f31470748e52b83dfce133d08fe6fdd.jpg","https://b.zmtcdn.com/data/pictures/8/19644838/65e14a04909bb371354e3b48ba499572.jpeg"]
  }
];

mongoose.connect('mongodb+srv://rishiporwal2004_db_user:QiuKrisBkuBBVRnL@cluster0.qcgylva.mongodb.net/Cafe?retryWrites=true&w=majority')
  .then(async () => {
    console.log('MongoDB connected');
    await Cafe.deleteMany({}); // Optional: clear old docs
    const result = await Cafe.insertMany(cafes);
    console.log('Inserted cafes:', result.length);
    process.exit(0);
  })
  .catch(err => console.error(err));