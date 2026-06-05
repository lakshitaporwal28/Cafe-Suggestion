/**
 * Dynamic Helpers for Cafe crowd prediction and AI-like summaries
 */

// Simple deterministic hash based on a string
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function pickRandomly(arr, seed) {
  if (!arr || arr.length === 0) return "";
  return arr[seed % arr.length];
}

/**
 * Predicts the current crowd status based on the hour of the day and new crowd fields
 * @param {Object} cafe 
 * @returns {String} Current crowd level (Peaceful, Moderate, Crowded, Very Crowded)
 */
function getCurrentCrowdStatus(cafe) {
  const hour = new Date().getHours();
  let rawStatus = "Peaceful";
  
  if (hour >= 6 && hour < 12) {
    rawStatus = cafe.crowdMorning;
  } else if (hour >= 12 && hour < 17) {
    rawStatus = cafe.crowdAfternoon;
  } else if (hour >= 17 && hour < 22) {
    rawStatus = cafe.crowdEvening;
  } else {
    rawStatus = cafe.crowdNight;
  }

  // Ensure it matches one of the requested statuses
  rawStatus = rawStatus || "Moderate";
  if (rawStatus.toLowerCase() === "busy") rawStatus = "Crowded";
  if (rawStatus.toLowerCase() === "closed") rawStatus = "Peaceful"; // Or maybe "Closed" if preferred, but instructions said 4 options.
  
  if (rawStatus.toLowerCase().includes("very")) return "🔴 Very Crowded";
  if (rawStatus.toLowerCase().includes("crowd") || rawStatus.toLowerCase().includes("busy")) return "🔴 Crowded";
  if (rawStatus.toLowerCase().includes("moderat")) return "🟡 Moderate";
  return "🟢 Peaceful";
}

/**
 * Dynamic crowd status and recommendation based on the current hour of day
 * Updated to use new logic from prompt.
 */
function getDynamicCrowdStatusAndRecommendation(cafe) {
  // As requested, crowd predictor just shows the 4 states.
  const status = getCurrentCrowdStatus(cafe);
  
  // Create a recommendation based on status
  let recommendation = "Perfect time to visit!";
  if (status.includes("Very Crowded")) recommendation = "Expect waiting times.";
  else if (status.includes("Crowded")) recommendation = "Lively atmosphere.";
  else if (status.includes("Moderate")) recommendation = "Comfortable setting.";
  else recommendation = "Quiet and peaceful.";

  return {
    status,
    recommendation
  };
}

/**
 * Returns the best time to visit message
 * @param {Object} cafe 
 * @returns {String}
 */
function getBestTimeMessage(cafe) {
  return cafe.bestVisitTime || "Morning";
}

/**
 * Generates an AI-like natural language summary of the cafe based on its features
 * @param {Object} cafe 
 * @returns {String} Generated summary
 */
function generateCafeSummary(cafe) {
  const nameHash = simpleHash(cafe.name || "Cafe");
  
  const introTemplates = [
    "A fantastic spot",
    "An ideal destination",
    "A highly-rated haven",
    "A wonderful choice",
    "A perfect retreat"
  ];
  
  const moodMap = {
    "work": ["laptop sessions", "productive workspaces", "focused work", "getting things done"],
    "romantic": ["intimate dates", "romantic evenings", "couples", "candlelit moments"],
    "cozy": ["snuggling up", "cozy relaxation", "chilly evenings", "warm vibes"],
    "relax": ["peaceful conversations", "unwinding", "laid-back hangs", "chilling out"],
    "fun": ["lively gatherings", "fun weekends", "upbeat vibes", "celebrations"]
  };
  
  let moodPhrase = "great vibes";
  if (cafe.moodTags && cafe.moodTags.length > 0) {
    const firstMood = cafe.moodTags[0].toLowerCase();
    if (moodMap[firstMood]) {
      moodPhrase = pickRandomly(moodMap[firstMood], nameHash);
    } else {
      moodPhrase = `a ${firstMood} atmosphere`;
    }
  }

  let companionPhrase = "everyone";
  if (cafe.companionTypes && cafe.companionTypes.length > 0) {
    const comps = cafe.companionTypes.map(c => c.toLowerCase());
    if (comps.includes('friends')) companionPhrase = pickRandomly(["friends", "groups", "your squad"], nameHash + 1);
    else if (comps.includes('family')) companionPhrase = pickRandomly(["families", "family outings", "loved ones"], nameHash + 1);
    else if (comps.includes('solo')) companionPhrase = pickRandomly(["solo visits", "me-time", "individual retreats"], nameHash + 1);
    else companionPhrase = comps[0];
  }

  let seatingPhrase = "comfortable seating";
  if (cafe.seatingTypes && cafe.seatingTypes.length > 0) {
    const seats = cafe.seatingTypes.map(s => s.toLowerCase());
    if (seats.includes('outdoor')) seatingPhrase = pickRandomly(["breezy outdoor seating", "an open-air terrace", "beautiful al-fresco spots"], nameHash + 2);
    else if (seats.includes('indoor')) seatingPhrase = pickRandomly(["cozy indoor arrangements", "air-conditioned comfort", "plush interior seating"], nameHash + 2);
  }

  let foodPhrase = "great food";
  if (cafe.menuTypes && cafe.menuTypes.length > 0) {
    const foods = cafe.menuTypes.slice(0, 2).join(' and ');
    foodPhrase = pickRandomly(["a great selection of", "delicious", "mouth-watering", "tasty"], nameHash + 3) + ` ${foods}`;
  }

  let budgetPhrase = "reasonable prices";
  if (cafe.avgBudget) {
    if (cafe.avgBudget <= 500) budgetPhrase = pickRandomly(["an affordable budget", "pocket-friendly prices", "a budget-friendly cost"], nameHash + 4);
    else if (cafe.avgBudget <= 800) budgetPhrase = pickRandomly(["a moderate budget", "mid-range pricing", "fair prices"], nameHash + 4);
    else budgetPhrase = pickRandomly(["a premium budget", "upscale pricing", "a luxurious feel"], nameHash + 4);
  }

  const intro = pickRandomly(introTemplates, nameHash + 5);
  
  // Format options:
  const formats = [
    `${intro} ideal for ${moodPhrase} with ${companionPhrase}, offering ${seatingPhrase} and ${foodPhrase} at ${budgetPhrase}.`,
    `Perfect for ${moodPhrase} with ${companionPhrase}, featuring ${seatingPhrase}, ${foodPhrase}, and ${budgetPhrase}.`,
    `A ${cafe.rating >= 4.5 ? 'top-rated ' : ''}space for ${companionPhrase} looking for ${moodPhrase}. Enjoy ${seatingPhrase} and ${foodPhrase} with ${budgetPhrase}.`,
    `${intro} for ${companionPhrase}, offering ${foodPhrase} and ${seatingPhrase}. It's great for ${moodPhrase} at ${budgetPhrase}.`
  ];

  return pickRandomly(formats, nameHash + 6);
}

module.exports = {
  getCurrentCrowdStatus,
  getBestTimeMessage,
  generateCafeSummary,
  getDynamicCrowdStatusAndRecommendation
};
