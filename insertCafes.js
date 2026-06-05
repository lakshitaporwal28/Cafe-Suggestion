const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Cafe = require('./models/Cafe');

const results = [];

fs.createReadStream('finals_with_crowd.csv')
  .pipe(csv())
  .on('data', (data) => {
    // Process and clean the row
    const parseList = (str) => {
      if (!str) return [];
      return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
    };

    // Capitalize first letter of each item in array
    const formatTags = (arr) => arr.map(item => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());

    const cafeObj = {
      name: data.name,
      rating: parseFloat(data.rate) || 0,
      address: data.address,
      rest_type: data.rest_type,
      city: 'Bangalore', // Based on the addresses in the CSV
      avgBudget: parseFloat(data.avg_cost_for_two) || 0,
      moodTags: formatTags(parseList(data.mood)),
      seatingTypes: formatTags(parseList(data.seating)),
      menuTypes: formatTags(parseList(data.food_type)),
      companionTypes: formatTags(parseList(data.companions)),
      photoUrl: data.photo_url,
      images: [data.photo_url].filter(Boolean),
      reelUrl: data['Reels '], // Note the space in the column name from CSV
      bestVisitTime: data.bestVisitTime,
      peakHours: data.peakHours,
      crowdMorning: data.crowdMorning,
      crowdAfternoon: data.crowdAfternoon,
      crowdEvening: data.crowdEvening,
      crowdNight: data.crowdNight
    };
    results.push(cafeObj);
  })
  .on('end', () => {
    mongoose.connect('mongodb+srv://rishiporwal2004_db_user:h3fR6pMIfvFqUolY@cluster0.qcgylva.mongodb.net/Cafe?retryWrites=true&w=majority&appName=Cluster0')
      .then(async () => {
        console.log('MongoDB connected');
        await Cafe.deleteMany({});
        const insertResult = await Cafe.insertMany(results);
        console.log('Successfully inserted new cafes:', insertResult.length);
        process.exit(0);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  });