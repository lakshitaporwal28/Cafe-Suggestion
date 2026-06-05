/* ========================================================
   Cafe Mood - App Logic (Map-Free Responsive Edition)
   ======================================================== */

// --- Global Application State ---
const state = {
  moodTags: [],
  companionTypes: [],
  seatingTypes: [],
  menuTypes: [],
  cafes: [],             // All loaded cafes from the search
  bookmarks: [],         // Bookmarked cafe IDs
  currentTab: 'explore', // 'explore', 'saved', 'profile'
  currentPage: 'page0',  // 'page0', 'page1', 'page2', 'page3', 'page4', 'page5'
  history: [],           // Stack of previous pages
  user: null             // Logged in user
};

// --- DOM Elements ---
const DOM = {
  body: document.body,
  pages: {
    page0: document.getElementById('page0'),
    page1: document.getElementById('page1'),
    page2: document.getElementById('page2'),
    page3: document.getElementById('page3'),
    page4: document.getElementById('page4'),
    page5: document.getElementById('page5')
  },
  
  // Navigation & Headers
  headerTitleText: document.getElementById('header-title-text'),
  progressContainer: document.getElementById('global-progress'),
  progressIndicator: document.getElementById('progress-indicator'),
  backBtn: document.getElementById('global-back-btn'),
  menuToggle: document.getElementById('menu-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  
  // Stepper Buttons
  btnNext1: document.getElementById('btn-next-1'),
  btnNext2: document.getElementById('btn-next-2'),
  
  // Drawer
  sideDrawer: document.getElementById('side-drawer'),
  drawerOverlay: document.getElementById('drawer-overlay'),
  closeDrawer: document.getElementById('close-drawer'),
  drawerHome: document.getElementById('drawer-home'),
  drawerSaved: document.getElementById('drawer-saved'),
  
  // Bottom Navigation tabs
  tabExplore: document.getElementById('tab-btn-explore'),
  tabSaved: document.getElementById('tab-btn-saved'),
  tabProfile: document.getElementById('tab-btn-profile'),
  
  // Results Container & Search
  cafesContainer: document.getElementById('cafes-container'),
  searchInput: document.getElementById('search-input'),
  resultsHeadline: document.getElementById('results-headline'),
  
  // Details
  detailContainer: document.getElementById('detail-container')
};

// ========================================================
// INITIALIZE & PERSISTENCE
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load Saved Theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    DOM.body.classList.add('dark-theme');
  }

  // Load Saved Bookmarks
  const savedBookmarks = localStorage.getItem('saved_cafes');
  if (savedBookmarks) {
    state.bookmarks = JSON.parse(savedBookmarks);
  }

  // Load Saved User Session
  const savedUser = localStorage.getItem('cafe_user');
  if (savedUser) {
    try {
      state.user = JSON.parse(savedUser);
      
      const drawerName = document.getElementById('drawer-user-name');
      if (drawerName) drawerName.textContent = state.user.name;
      const drawerAvatar = document.getElementById('drawer-user-avatar');
      if (drawerAvatar) drawerAvatar.textContent = state.user.name.charAt(0).toUpperCase();

      // Sync stats from MongoDB in the background
      fetchLatestUserProfile();
      updateDrawerStats();
    } catch (e) {
      console.error('Failed to parse saved user session:', e);
    }
  }

  // Bind Listeners
  setupThemeToggle();
  setupDrawerListeners();
  setupBottomTabListeners();
  setupCardSelectionListeners();
  setupNavigationBtnListeners();
  setupSearchAndPills();
  
  // Set initial layout states
  updateHeaderProgress();
  setupAuthListeners();

  // If auto-logged in, navigate to Phase 1 (page1) instead of the login screen
  if (state.user) {
    showPage('page1');
  }
});

// Sync user session details with MongoDB
async function fetchLatestUserProfile() {
  if (!state.user || !state.user.id) return;
  try {
    const res = await fetch(`/api/users/${state.user.id}/profile`);
    if (res.ok) {
      const updatedUser = await res.json();
      state.user = updatedUser;
      localStorage.setItem('cafe_user', JSON.stringify(updatedUser));
      state.bookmarks = updatedUser.bookmarks || [];
      localStorage.setItem('saved_cafes', JSON.stringify(state.bookmarks));
      
      const drawerName = document.getElementById('drawer-user-name');
      if (drawerName) drawerName.textContent = updatedUser.name;
      const drawerAvatar = document.getElementById('drawer-user-avatar');
      if (drawerAvatar) drawerAvatar.textContent = updatedUser.name.charAt(0).toUpperCase();

      // If they are on the profile or saved tab, refresh visual counts
      if (state.currentTab === 'profile') {
        renderProfileTab();
      } else if (state.currentTab === 'saved') {
        renderSavedCafes();
      }
      updateDrawerStats();
      
      if (state.currentPage === 'page0') {
        showPage('page1');
      }
    }
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
  }
}

// ========================================================
// AUTHENTICATION LOGIC
// ========================================================
function setupAuthListeners() {
  const authForm = document.getElementById('auth-form');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const nameInput = document.getElementById('auth-name');
  const submitBtn = document.getElementById('auth-submit-btn');
  
  let isLogin = true;

  toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    if (isLogin) {
      title.textContent = 'Welcome back';
      subtitle.textContent = 'Log in to discover your perfect cafe vibe';
      nameInput.classList.add('hidden');
      nameInput.removeAttribute('required');
      submitBtn.textContent = 'Log In';
      toggleBtn.textContent = "Don't have an account? Sign up";
    } else {
      title.textContent = 'Create an Account';
      subtitle.textContent = 'Join Cafe Mood and save your favorites';
      nameInput.classList.remove('hidden');
      nameInput.setAttribute('required', 'true');
      submitBtn.textContent = 'Sign Up';
      toggleBtn.textContent = 'Already have an account? Log in';
    }
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const name = nameInput ? nameInput.value.trim() : '';

    submitBtn.textContent = 'Please wait...';
    submitBtn.disabled = true;

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        state.user = data.user;
        localStorage.setItem('cafe_user', JSON.stringify(data.user));
        state.bookmarks = data.user.bookmarks || [];
        localStorage.setItem('saved_cafes', JSON.stringify(state.bookmarks));
        
        const drawerName = document.getElementById('drawer-user-name');
        if (drawerName) drawerName.textContent = data.user.name;
        const drawerAvatar = document.getElementById('drawer-user-avatar');
        if (drawerAvatar) drawerAvatar.textContent = data.user.name.charAt(0).toUpperCase();
        updateDrawerStats();
        showToast(isLogin ? `Welcome back, ${data.user.name}!` : `Welcome to Cafe Mood, ${data.user.name}!`);
        showPage('page1');
      } else {
        showToast(`❌ ${data.error || 'Authentication failed'}`);
      }
    } catch (err) {
      showToast('❌ Network error. Please try again.');
    } finally {
      submitBtn.textContent = isLogin ? 'Log In' : 'Sign Up';
      submitBtn.disabled = false;
    }
  });
}

// ========================================================
// THEME SWITCHER
// ========================================================
function setupThemeToggle() {
  DOM.themeToggle.addEventListener('click', () => {
    DOM.body.classList.toggle('dark-theme');
    const isDark = DOM.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Smooth micro-animation rotation
    DOM.themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      DOM.themeToggle.style.transform = 'none';
    }, 400);
  });
}

// ========================================================
// SIDE DRAWER ACTIONS
// ========================================================
function setupDrawerListeners() {
  const toggleDrawer = (open) => {
    DOM.sideDrawer.classList.toggle('open', open);
    DOM.drawerOverlay.classList.toggle('open', open);
  };

  DOM.menuToggle.addEventListener('click', () => toggleDrawer(true));
  DOM.closeDrawer.addEventListener('click', () => toggleDrawer(false));
  DOM.drawerOverlay.addEventListener('click', () => toggleDrawer(false));

  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.close-info-modal')) {
      const aboutModal = document.getElementById('about-modal');
      const contactModal = document.getElementById('contact-modal');
      if (aboutModal) aboutModal.classList.remove('open');
      if (contactModal) contactModal.classList.remove('open');
    }
  });

  // Close modals when clicking overlay area
  const aboutModal = document.getElementById('about-modal');
  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) aboutModal.classList.remove('open');
    });
  }
  const contactModal = document.getElementById('contact-modal');
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) contactModal.classList.remove('open');
    });
  }

  // Click on user info in drawer redirects to dashboard profile
  const drawerUser = document.querySelector('.drawer-user');
  if (drawerUser) {
    drawerUser.style.cursor = 'pointer';
    drawerUser.addEventListener('click', () => {
      toggleDrawer(false);
      activateTab('profile');
    });
  }

  // Drawer Menu clicks
  if (DOM.drawerHome) {
    DOM.drawerHome.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDrawer(false);
      if (!state.user) {
        showPage('page0');
        showToast('🔑 Please log in to view cafes.');
        return;
      }
      showAllCafesPage();
    });
  }

  if (DOM.drawerSaved) {
    DOM.drawerSaved.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDrawer(false);
      if (!state.user) {
        showPage('page0');
        showToast('🔑 Please log in to view saved cafes.');
        return;
      }
      activateTab('saved');
    });
  }
}

function updateDrawerStats() {
  const bookmarksEl = document.getElementById('drawer-bookmarks');
  const searchesEl = document.getElementById('drawer-searches');
  const bookingsEl = document.getElementById('drawer-bookings');
  
  if (bookmarksEl) bookmarksEl.textContent = state.bookmarks.length || 0;
  if (searchesEl) {
    const totalSearches = state.user && state.user.searchCount !== undefined ? state.user.searchCount : parseInt(localStorage.getItem('search_count') || '0');
    searchesEl.textContent = totalSearches;
  }
  if (bookingsEl) {
    const totalBookings = state.user && state.user.bookingCount !== undefined ? state.user.bookingCount : parseInt(localStorage.getItem('booking_count') || '0');
    bookingsEl.textContent = totalBookings;
  }
}

// Global modal helpers for footer links
window.openAboutModal = function() {
  const modal = document.getElementById('about-modal');
  if (modal) modal.classList.add('open');
};

window.openContactModal = function() {
  const modal = document.getElementById('contact-modal');
  if (modal) modal.classList.add('open');
};

// ========================================================
// PAGE TRANSITIONS & HEADER UPDATES
// ========================================================
function showPage(pageId, isBack = false) {
  if (!isBack && state.currentPage !== pageId) {
    state.history.push(state.currentPage);
  }
  state.currentPage = pageId;
  
  // Show active page, hide others
  Object.keys(DOM.pages).forEach(key => {
    if(DOM.pages[key]) {
      DOM.pages[key].classList.toggle('active', key === pageId);
    }
  });
  
  // Manage additional pages dynamically if not in DOM.pages map yet
  const dynamicPage = document.getElementById(pageId);
  if (dynamicPage && !DOM.pages[pageId]) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    dynamicPage.classList.add('active');
  }

  // Manage Stepper header visibility
  if (pageId === 'page0') {
    DOM.progressContainer.classList.add('hidden');
    DOM.backBtn.classList.add('hidden');
    DOM.headerTitleText.textContent = 'Welcome';
  } else if (pageId === 'page1') {
    DOM.progressContainer.classList.remove('hidden');
    DOM.backBtn.classList.add('hidden');
    DOM.headerTitleText.textContent = 'Cafe Mood';
  } else if (pageId === 'page2') {
    DOM.progressContainer.classList.remove('hidden');
    DOM.backBtn.classList.remove('hidden');
    DOM.headerTitleText.textContent = 'Your Choices';
  } else if (pageId === 'page3') {
    DOM.progressContainer.classList.add('hidden');
    DOM.backBtn.classList.add('hidden');
    updateHeaderForTab();
  } else if (pageId === 'page4') {
    DOM.progressContainer.classList.add('hidden');
    DOM.backBtn.classList.remove('hidden');
    DOM.headerTitleText.textContent = 'Cafe Details';
  } else if (pageId === 'page5') {
    DOM.progressContainer.classList.add('hidden');
    DOM.backBtn.classList.remove('hidden');
    DOM.headerTitleText.textContent = 'Reserve Table';
  }

  updateHeaderProgress();
  window.scrollTo(0, 0);
}

function updateHeaderProgress() {
  if (state.currentPage === 'page1') {
    DOM.progressIndicator.style.width = '25%';
  } else if (state.currentPage === 'page2') {
    DOM.progressIndicator.style.width = '75%';
  } else if (state.currentPage === 'page3') {
    DOM.progressIndicator.style.width = '100%';
  }
}

function updateHeaderForTab() {
  if (state.currentTab === 'explore') {
    DOM.headerTitleText.textContent = 'Cafe Mood';
  } else if (state.currentTab === 'saved') {
    DOM.headerTitleText.textContent = 'Saved Cafes';
  } else if (state.currentTab === 'profile') {
    DOM.headerTitleText.textContent = 'My Profile';
  }
}

// Reset the entire questionnaire search state
function resetVibeFinder() {
  state.moodTags = [];
  state.companionTypes = [];
  state.seatingTypes = [];
  state.menuTypes = [];
  
  // Unselect all option cards
  document.querySelectorAll('.option-card-v2, .selection-card-v2, .seating-card-v2, .food-card-v2').forEach(el => {
    el.classList.remove('selected');
  });

  // Reset Bottom tab back to explore
  state.history = [];
  activateTab('explore');
  showPage('page1');
}

// Show All Cafes results page (Phase 3)
async function showAllCafesPage() {
  if (!state.user) {
    showPage('page0');
    showToast('🔑 Please log in to view cafes.');
    return;
  }
  
  // Set bottom tab to active explore
  state.currentTab = 'explore';
  const tabs = [DOM.tabExplore, DOM.tabSaved, DOM.tabProfile];
  tabs.forEach(t => {
    if (t) t.classList.remove('active');
  });
  if (DOM.tabExplore) DOM.tabExplore.classList.add('active');
  updateHeaderForTab();
  
  showPage('page3');
  
  // Show loading indicator
  DOM.cafesContainer.innerHTML = `
    <div class="loading-wrapper">
      <div class="loading-spinner"></div>
      <p class="loading-txt">Loading all cafes...</p>
    </div>
  `;
  
  try {
    const response = await fetch('/api/test');
    const allCafes = await response.json();
    state.cafes = allCafes;
    renderExploreTab();
  } catch (err) {
    console.error('Error loading all cafes:', err);
    DOM.cafesContainer.innerHTML = `<p style="text-align:center; margin-top: 40px; color: var(--clr-text-muted);">Failed to load cafes.</p>`;
  }
}

// ========================================================
// CARD SELECTION LOGIC
// ========================================================
function setupCardSelectionListeners() {
  // Mood Cards (Multi-select)
  document.querySelectorAll('[data-type="mood"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const val = card.dataset.value;
      if (state.moodTags.includes(val)) {
        state.moodTags = state.moodTags.filter(v => v !== val);
      } else {
        state.moodTags.push(val);
      }
    });
  });

  // Companion Cards (Multi-select)
  document.querySelectorAll('[data-type="companion"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const val = card.dataset.value;
      if (state.companionTypes.includes(val)) {
        state.companionTypes = state.companionTypes.filter(v => v !== val);
      } else {
        state.companionTypes.push(val);
      }
    });
  });

  // Seating Cards (Multi-select)
  document.querySelectorAll('[data-type="seating"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const val = card.dataset.value;
      if (state.seatingTypes.includes(val)) {
        state.seatingTypes = state.seatingTypes.filter(v => v !== val);
      } else {
        state.seatingTypes.push(val);
      }
    });
  });

  // Food Cards (Multi-select)
  document.querySelectorAll('[data-type="food"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const val = card.dataset.value;
      if (state.menuTypes.includes(val)) {
        state.menuTypes = state.menuTypes.filter(v => v !== val);
      } else {
        state.menuTypes.push(val);
      }
    });
  });
}

// ========================================================
// BUTTON NAVIGATION HANDLERS
// ========================================================
function setupNavigationBtnListeners() {
  // Global Stepper Back Button
  DOM.backBtn.addEventListener('click', () => {
    if (state.history.length > 0) {
      const prev = state.history.pop();
      showPage(prev, true);
    } else {
      showPage('page1', true);
    }
  });

  // Step 1 Continue
  DOM.btnNext1.addEventListener('click', () => {
    showPage('page2');
  });

  // Step 2 Find Cafes (Continue)
  DOM.btnNext2.addEventListener('click', async () => {
    showPage('page3');
    await fetchMatchingCafes();
  });
}

// ========================================================
// API SEARCH & FETCH CALLS
// ========================================================
async function fetchMatchingCafes() {
  // Increment local search count
  let searchCount = parseInt(localStorage.getItem('search_count') || '0');
  searchCount++;
  localStorage.setItem('search_count', searchCount.toString());

  // Increment DB search count if logged in
  if (state.user && state.user.id) {
    try {
      const res = await fetch(`/api/users/${state.user.id}/increment-search`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        state.user.searchCount = data.searchCount;
        localStorage.setItem('cafe_user', JSON.stringify(state.user));
      }
    } catch (err) {
      console.error('Failed to increment search count in MongoDB:', err);
    }
  }

  DOM.cafesContainer.innerHTML = `
    <div class="loading-wrapper">
      <div class="loading-spinner"></div>
      <p class="loading-txt">Finding perfect cafes for you...</p>
    </div>
  `;

  // Map values for the database
  const queryMoods = state.moodTags;
  // Normalize companion: map UI "Couples" -> DB "Couple"
  const queryCompanions = state.companionTypes.map(c => c === 'Couples' ? 'Couple' : c);
  const querySeatings = state.seatingTypes;
  // Food types map directly
  const queryFood = state.menuTypes;

  try {
    const response = await fetch('/api/cafes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moodTags: queryMoods,
        companionTypes: queryCompanions,
        seatingTypes: querySeatings,
        menuTypes: queryFood
      })
    });

    const data = await response.json();
    state.cafes = data;

    // Small delay for clean loading interaction
    await new Promise(resolve => setTimeout(resolve, 500));
    renderCafeList(state.cafes);
    
    // Clear search input on new query
    DOM.searchInput.value = '';

  } catch (error) {
    console.error('Error fetching cafes:', error);
    DOM.cafesContainer.innerHTML = `
      <div class="no-results-v2">
        <div class="no-results-emoji">⚠️</div>
        <h3 class="no-results-title">Something went wrong</h3>
        <p class="no-results-desc">Failed to connect to the database. Make sure server is running and try again.</p>
      </div>
    `;
  }
}

// ========================================================
// CARD LIST RENDERING
// ========================================================
function renderCafeList(cafesList) {
  if (!cafesList || cafesList.length === 0) {
    DOM.cafesContainer.innerHTML = `
      <div class="no-results-v2">
        <div class="no-results-emoji">😔</div>
        <h3 class="no-results-title">No matching cafes found</h3>
        <p class="no-results-desc">Try loosening your search preferences or explore another vibe tag.</p>
      </div>
    `;
    return;
  }

  DOM.cafesContainer.innerHTML = cafesList.map((cafe, idx) => {
    const isBookmarked = state.bookmarks.includes(cafe._id);
    let mainImg = cafe.photoUrl || (cafe.images && cafe.images[0]) || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=100';
    if (mainImg.includes('zmtcdn.com')) mainImg = mainImg.split('?')[0];
    if (mainImg.includes('unsplash.com')) mainImg = mainImg.replace(/w=\d+&q=\d+/, 'w=1200&q=100');
    const ratingVal = cafe.rating ? cafe.rating.toFixed(1) : '4.6';
    const firstMood = cafe.moodTags && cafe.moodTags[0] ? `#${cafe.moodTags[0]}` : '';

    return `
      <div class="cafe-card-v2" style="animation-delay: ${idx * 0.08}s">
        <div class="cafe-card-img-container">
          <img src="${mainImg}" alt="${cafe.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'">
          <button class="heart-btn ${isBookmarked ? 'liked' : ''}" data-id="${cafe._id}" aria-label="Bookmark cafe">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="cafe-card-details">
          <div class="cafe-card-row">
            <h3 class="cafe-name-title">${cafe.name}</h3>
            <span class="rating-badge">⭐ ${ratingVal}</span>
          </div>
          ${firstMood ? `<div class="cafe-card-meta" style="margin-bottom:8px;">${firstMood}</div>` : ''}
          ${cafe.summary ? `<p class="cafe-ai-summary" style="margin-bottom:12px;">✨ ${cafe.summary}</p>` : ''}
          <button class="btn-view-cafe" data-id="${cafe._id}">View Cafe</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind heart button clicks
  document.querySelectorAll('.heart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      toggleBookmark(id, btn);
    });
  });

  // Bind View Detail clicks
  document.querySelectorAll('.btn-view-cafe').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openCafeDetails(id);
    });
  });
}

// Toggle saved state
async function toggleBookmark(cafeId, buttonEl) {
  if (state.bookmarks.includes(cafeId)) {
    state.bookmarks = state.bookmarks.filter(id => id !== cafeId);
    buttonEl.classList.remove('liked');
  } else {
    state.bookmarks.push(cafeId);
    buttonEl.classList.add('liked');
  }
  localStorage.setItem('saved_cafes', JSON.stringify(state.bookmarks));

  // Sync with database if logged in
  if (state.user && state.user.id) {
    try {
      const res = await fetch(`/api/users/${state.user.id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId })
      });
      if (res.ok) {
        const data = await res.json();
        state.bookmarks = data.bookmarks;
        state.user.bookmarks = data.bookmarks;
        localStorage.setItem('cafe_user', JSON.stringify(state.user));
        localStorage.setItem('saved_cafes', JSON.stringify(state.bookmarks));
        updateDrawerStats();
      }
    } catch (err) {
      console.error('Failed to sync bookmark to MongoDB:', err);
    }
  }

  // If we are currently on the Saved tab, dynamically re-render
  if (state.currentTab === 'saved') {
    renderSavedCafes();
  }
}

// ========================================================
// SEARCH BAR FILTERING
// ========================================================
function setupSearchAndPills() {
  // Input search
  DOM.searchInput.addEventListener('input', () => {
    filterAndRenderCafes();
  });
}

function filterAndRenderCafes() {
  const searchTerm = DOM.searchInput.value.toLowerCase().trim();
  
  // Decide which source array to filter (all search results OR bookmarks if on saved tab)
  const sourceList = state.currentTab === 'saved' 
    ? state.cafes.filter(c => state.bookmarks.includes(c._id))
    : state.cafes;

  let filtered = sourceList;

  // 1. Search term filter (matches name, description, or mood tags)
  if (searchTerm) {
    filtered = filtered.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(searchTerm);
      const descMatch = c.description && c.description.toLowerCase().includes(searchTerm);
      const moodMatch = c.moodTags && c.moodTags.some(m => m.toLowerCase().includes(searchTerm));
      return nameMatch || descMatch || moodMatch;
    });
  }

  renderCafeList(filtered);
}

// ========================================================
// BOTTOM TAB NAVIGATION
// ========================================================
function setupBottomTabListeners() {
  const tabs = [DOM.tabExplore, DOM.tabSaved, DOM.tabProfile];
  
  DOM.tabExplore.addEventListener('click', () => {
    if (!state.user) {
      showPage('page0');
      showToast('🔑 Please log in or sign up first.');
      return;
    }
    resetVibeFinder();
  });
  DOM.tabSaved.addEventListener('click', () => activateTab('saved'));
  DOM.tabProfile.addEventListener('click', () => activateTab('profile'));

  function activateTab(tabId) {
    if (!state.user) {
      showPage('page0');
      showToast('🔑 Please log in or sign up first.');
      return;
    }
    state.currentTab = tabId;
    
    // Toggle active design styles on bottom bar
    tabs.forEach(t => t.classList.remove('active'));
    if (tabId === 'explore') DOM.tabExplore.classList.add('active');
    if (tabId === 'saved') DOM.tabSaved.classList.add('active');
    if (tabId === 'profile') DOM.tabProfile.classList.add('active');

    updateHeaderForTab();

    // Clear history on tab switch to avoid confusing back paths
    state.history = [];

    // Navigate appropriately when switching to Explore tab
    if (tabId === 'explore') {
      if (!['page1', 'page2', 'page3', 'page4'].includes(state.currentPage)) {
        // Default entry to explore tab if coming from outside
        showPage('page1');
      } else if (state.currentPage === 'page4') {
        showPage('page3'); // pop back from detail view
      }
    } else {
      // For other tabs (saved, profile), ensure we jump out of the main flow if needed
      if (!['page3'].includes(state.currentPage)) {
        showPage('page3'); // Fallback placeholder since Saved/Profile usually use page3 layout
      }
    }

    // Render corresponding tab view
    if (tabId === 'explore') {
      renderExploreTab();
    } else if (tabId === 'saved') {
      renderSavedTab();
    } else if (tabId === 'profile') {
      renderProfileTab();
    }
  }

  // Exposed globally for ease of use
  window.activateTab = activateTab;
}

function renderExploreTab() {
  // Show standard search layout elements
  DOM.searchInput.closest('.search-section-v2').style.display = 'block';
  DOM.resultsHeadline.style.display = 'block';
  DOM.resultsHeadline.innerHTML = 'Here are cafes<br>perfectly matching<br>your vibe today ✨';
  
  renderCafeList(state.cafes);
}

function renderSavedTab() {
  // Reuse Page 3 styling, customize header & hide search/pills
  DOM.searchInput.closest('.search-section-v2').style.display = 'none';
  DOM.resultsHeadline.style.display = 'block';
  DOM.resultsHeadline.textContent = 'Your Saved Corners 🔖';

  renderSavedCafes();
}

function renderSavedCafes() {
  // If we have loaded cafes, search matching saved ones, otherwise load all from DB
  const bookmarkedCafes = state.cafes.filter(c => state.bookmarks.includes(c._id));
  
  if (bookmarkedCafes.length > 0) {
    renderCafeList(bookmarkedCafes);
  } else {
    // If cafes list in state is empty, fetch all cafes first to filter
    fetchAllCafesToFilterBookmarks();
  }
}

async function fetchAllCafesToFilterBookmarks() {
  DOM.cafesContainer.innerHTML = `
    <div class="loading-wrapper">
      <div class="loading-spinner"></div>
      <p class="loading-txt">Loading your saved cafes...</p>
    </div>
  `;
  try {
    const response = await fetch('/api/test'); // returns all database cafes
    const allCafes = await response.json();
    state.cafes = allCafes;
    
    const bookmarkedCafes = allCafes.filter(c => state.bookmarks.includes(c._id));
    renderCafeList(bookmarkedCafes);
  } catch (err) {
    console.error('Error loading bookmarks:', err);
    DOM.cafesContainer.innerHTML = `<p style="text-align:center; margin-top: 40px; color: var(--clr-text-muted);">Failed to load cafes.</p>`;
  }
}

function renderProfileTab() {
  DOM.searchInput.closest('.search-section-v2').style.display = 'none';
  DOM.resultsHeadline.style.display = 'none';

  // Dynamic values
  const totalSaved = state.bookmarks.length;
  const totalSearches = state.user && state.user.searchCount !== undefined ? state.user.searchCount : parseInt(localStorage.getItem('search_count') || '0');
  const totalBookings = state.user && state.user.bookingCount !== undefined ? state.user.bookingCount : parseInt(localStorage.getItem('booking_count') || '0');
  
  const moodPref = state.moodTags.length > 0 ? state.moodTags.join(', ') : 'None';
  const seatingPref = state.seatingTypes.length > 0 ? state.seatingTypes.join(', ') : 'None';
  const foodPref = state.menuTypes.length > 0 ? state.menuTypes.join(', ') : 'None';
  const companionPref = state.companionTypes.length > 0 ? state.companionTypes.join(', ') : 'None';

  DOM.cafesContainer.innerHTML = `
    <div class="profile-container">
      <div class="profile-hero">
        <div class="profile-avatar">${state.user ? state.user.name.charAt(0).toUpperCase() : 'G'}</div>
        <div class="profile-details">
          <h3>${state.user ? state.user.name : 'Guest User'}</h3>
        </div>
        <div class="profile-stats-row">
          <div class="prof-stat">
            <span class="num">${totalSaved}</span>
            <span class="lbl">Bookmarks</span>
          </div>
          <div class="prof-stat">
            <span class="num">${totalSearches}</span>
            <span class="lbl">Searches</span>
          </div>
          <div class="prof-stat">
            <span class="num">${totalBookings}</span>
            <span class="lbl">Bookings</span>
          </div>
        </div>
      </div>

      <div class="profile-card">
        <h4 class="detail-section-title">Current Preferences</h4>
        <div class="pref-item">
          <span class="lbl">Mood Tag</span>
          <span class="val">${moodPref}</span>
        </div>
        <div class="pref-item">
          <span class="lbl">Seating</span>
          <span class="val">${seatingPref}</span>
        </div>
        <div class="pref-item">
          <span class="lbl">Companion</span>
          <span class="val">${companionPref}</span>
        </div>
        <div class="pref-item">
          <span class="lbl">Food Preference</span>
          <span class="val">${foodPref}</span>
        </div>
      </div>
      
      <button class="btn-continue" id="btn-logout" style="background-color: #A34E36; margin-top: 10px; width: 100%; max-width: 100%;">Log Out</button>
    </div>
  `;

  // Bind Log Out button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear local states
      state.user = null;
      state.bookmarks = [];
      localStorage.removeItem('cafe_user');
      localStorage.removeItem('saved_cafes');
      localStorage.removeItem('search_count');
      localStorage.removeItem('booking_count');

      // Revert Drawer UI to Guest
      const drawerName = document.getElementById('drawer-user-name');
      if (drawerName) drawerName.textContent = 'Guest User';
      const drawerAvatar = document.getElementById('drawer-user-avatar');
      if (drawerAvatar) drawerAvatar.textContent = 'G';

      // Redirect to Auth Screen (page0)
      showPage('page0');
      showToast('Logged out successfully!');
    });
  }
}

// Make reset Vibe finder public
window.resetVibeFinder = resetVibeFinder;
window.showAllCafesPage = showAllCafesPage;

// ========================================================
// CAFE DETAIL VIEW
// ========================================================
function openCafeDetails(cafeId) {
  const cafe = state.cafes.find(c => c._id === cafeId);
  if (!cafe) return;

  let mainImg = cafe.photoUrl || (cafe.images && cafe.images[0]) || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=100';
  if (mainImg.includes('zmtcdn.com')) mainImg = mainImg.split('?')[0];
  if (mainImg.includes('unsplash.com')) mainImg = mainImg.replace(/w=\d+&q=\d+/, 'w=1200&q=100');
  const ratingVal = cafe.rating ? cafe.rating.toFixed(1) : '4.6';
  const budgetVal = cafe.avgBudget || 400;
  
  const moodHtml = (cafe.moodTags || []).map(m => `<span class="detail-pill-tag">${m}</span>`).join('');
  const seatingHtml = (cafe.seatingTypes || []).map(s => `<span class="detail-pill-tag">${s}</span>`).join('');
  const companionHtml = (cafe.companionTypes || []).map(c => `<span class="detail-pill-tag">${c === 'Couple' ? 'Couples' : c}</span>`).join('');
  const menuHtml = (cafe.menuTypes || []).map(m => `<span class="detail-pill-tag">${m}</span>`).join('');
  
  let reelSection = '';
  if (cafe.reelUrl) {
    let embedUrl = cafe.reelUrl.split('?')[0];
    if (!embedUrl.endsWith('/')) embedUrl += '/';
    embedUrl += 'embed';
    
    reelSection = `
      <div class="cafe-reel-section">
        <h4 class="detail-section-title" style="margin-bottom: 12px;">🎥 Cafe Reel</h4>
        <div class="reel-embed-container" style="border-radius: var(--radius-md); overflow: hidden; background: #000; display: flex; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 12px;">
          <iframe 
            id="cafe-reel-iframe"
            src="${embedUrl}" 
            width="100%" 
            height="500" 
            frameborder="0" 
            scrolling="no" 
            allowtransparency="true"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowfullscreen
            style="max-width: 400px; border: none; overflow: hidden; border-radius: var(--radius-md);">
          </iframe>
        </div>
        <button id="reload-reel-btn" style="width: 100%; padding: 10px; background-color: var(--clr-card-bg); border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-weight: 700; color: var(--clr-text-main); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease;">
          🔄 Reload Reel
        </button>
      </div>
    `;
  }

  DOM.detailContainer.innerHTML = `
    <!-- Left Column (Carousel + Reel) -->
    <div class="detail-left-column">
      <div class="detail-carousel-v2">
        <img src="${mainImg}" alt="${cafe.name}">
      </div>
      ${reelSection}
    </div>

    <!-- Details Card (Right Column) -->
    <div class="detail-card-v2">
      <div class="detail-header-row">
        <div>
          <h2 class="detail-name-title">${cafe.name}</h2>
        </div>
        <span class="rating-badge" style="font-size: 0.9rem; padding: 6px 12px;">⭐ ${ratingVal}</span>
      </div>

      <!-- AI Cafe Summary -->
      ${cafe.summary ? `<p class="detail-ai-summary" style="font-size: 0.95rem; font-weight: 600; color: var(--clr-accent); line-height: 1.5; padding: 12px; background-color: var(--clr-accent-light); border-radius: var(--radius-md); border-left: 4px solid var(--clr-accent); margin-bottom: 16px;">✨ ${cafe.summary}</p>` : ''}

      <!-- Information Section -->
      <div>
        <h4 class="detail-section-title">📍 Address</h4>
        <p style="font-size: 0.9rem; color: var(--clr-text-muted); line-height: 1.5; margin-bottom: 12px;">${cafe.address || 'Address not available'}</p>
      </div>

      <div class="detail-stats-grid" style="margin-bottom: 12px;">
        <div class="detail-stat-box">
          <span class="stat-label">Avg Budget</span>
          <span class="stat-value">₹${budgetVal} for two</span>
        </div>
      </div>

      <div>
        <h4 class="detail-section-title">😊 Mood Tags</h4>
        <div class="detail-tags-wrapper">
          ${moodHtml}
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 class="detail-section-title">🪑 Seating Types</h4>
        <div class="detail-tags-wrapper">
          ${seatingHtml}
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 class="detail-section-title">👥 Companion Types</h4>
        <div class="detail-tags-wrapper">
          ${companionHtml}
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 class="detail-section-title">🍔 Food Types</h4>
        <div class="detail-tags-wrapper">
          ${menuHtml}
        </div>
      </div>

      <!-- TABLE BOOKING SECTION -->
      <div class="booking-card-v2" style="align-items: center; text-align: center;">
        <h4 class="detail-section-title" style="margin-bottom: 0; border-bottom: none;">📅 Want to reserve a spot?</h4>
        <p style="font-size: 0.85rem; color: var(--clr-text-muted); margin-bottom: 8px;">Skip the wait by booking ahead at ${cafe.name}</p>
        <button class="btn-book" onclick="openBookingPage('${cafe._id}')" style="width: auto; padding: 12px 32px;">Book a Table</button>
      </div>
    </div>
  `;

  showPage('page4');
  
  // Bind reload reel button if it exists
  const reloadBtn = document.getElementById('reload-reel-btn');
  const reelIframe = document.getElementById('cafe-reel-iframe');
  if (reloadBtn && reelIframe) {
    reloadBtn.addEventListener('click', () => {
      // Refreshing the src reloads the Instagram player so the user can play it again
      const currentSrc = reelIframe.src;
      reelIframe.src = currentSrc;
    });
  }

  // Trigger Real-time Crowd Popup
  setTimeout(() => {
    openCrowdModal(cafe);
  }, 400); // slight delay after opening detail page
}

// ========================================================
// BOOKING PAGE LOGIC
// ========================================================
function openBookingPage(cafeId) {
  const cafe = state.cafes.find(c => c._id === cafeId);
  if (!cafe) return;

  let mainImg = cafe.photoUrl || (cafe.images && cafe.images[0]) || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80';
  if (mainImg.includes('zmtcdn.com')) mainImg = mainImg.split('?')[0];

  const bookingContainer = document.getElementById('booking-container');
  bookingContainer.innerHTML = `
    <div class="detail-left-column" style="width: 100%; max-width: 500px; margin: 0 auto; flex-shrink: 1;">
      <div class="detail-carousel-v2" style="height: 220px; border-radius: var(--radius-md);">
        <img src="${mainImg}" alt="${cafe.name}">
      </div>
      
      <div class="booking-card-v2" style="margin-top: 0;">
        <h4 class="detail-section-title" style="margin-bottom: 0;">📅 Book a Table</h4>
        <p style="font-size: 0.85rem; color: var(--clr-text-muted); margin-bottom: 4px;">Reserve your spot at ${cafe.name}</p>
        <form id="booking-form" class="booking-form">
          <input type="text" id="bk-name" class="booking-input" placeholder="Your Name" required>
          <input type="tel" id="bk-phone" class="booking-input" placeholder="Phone Number" required>
          <div class="booking-form-row">
            <input type="date" id="bk-date" class="booking-input" required>
            <input type="time" id="bk-time" class="booking-input" required>
          </div>
          <select id="bk-guests" class="booking-input" required>
            <option value="" disabled selected>Number of Guests</option>
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3 Guests</option>
            <option value="4">4 Guests</option>
            <option value="5">5+ Guests</option>
          </select>
          <button type="submit" class="btn-book" id="btn-book-submit">Confirm Booking</button>
        </form>
      </div>
      
      <button class="btn-back-v2" onclick="openCafeDetails('${cafe._id}')" style="position: relative; top: 0; left: 0; margin-top: 0; width: fit-content; display: inline-flex;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Cafe
      </button>
    </div>
  `;

  showPage('page5');

  // Bind Form Submit
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    const dateInput = document.getElementById('bk-date');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const phoneVal = document.getElementById('bk-phone').value.trim();
      if (!/^\d{10}$/.test(phoneVal)) {
        showToast('❌ Invalid number. Please enter a correct 10-digit phone number.');
        return;
      }

      const btn = document.getElementById('btn-book-submit');
      const originalText = btn.textContent;
      btn.textContent = 'Booking...';
      btn.disabled = true;

      const payload = {
        cafeId: cafe._id,
        name: document.getElementById('bk-name').value,
        phone: document.getElementById('bk-phone').value,
        date: document.getElementById('bk-date').value,
        time: document.getElementById('bk-time').value,
        guests: parseInt(document.getElementById('bk-guests').value)
      };

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          // Increment bookings count
          let bookingCount = parseInt(localStorage.getItem('booking_count') || '0');
          bookingCount++;
          localStorage.setItem('booking_count', bookingCount.toString());

          // Increment DB booking count if logged in
          if (state.user && state.user.id) {
            try {
              const res = await fetch(`/api/users/${state.user.id}/increment-booking`, {
                method: 'POST'
              });
              if (res.ok) {
                const data = await res.json();
                state.user.bookingCount = data.bookingCount;
                localStorage.setItem('cafe_user', JSON.stringify(state.user));
              }
            } catch (err) {
              console.error('Failed to increment booking count in MongoDB:', err);
            }
          }

          showToast(`🎉 Booking Confirmed at ${cafe.name} for ${payload.date} at ${payload.time}!`);
          bookingForm.reset();
          setTimeout(() => {
             openCafeDetails(cafe._id);
          }, 1500);
        } else {
          showToast('❌ Failed to confirm booking. Please try again.');
        }
      } catch (err) {
        showToast('❌ Network error. Could not connect to server.');
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }
}

// ========================================================
// CROWD PREDICTOR MODAL LOGIC
// ========================================================
function openCrowdModal(cafe) {
  const modal = document.getElementById('crowd-modal');
  const timeEl = document.getElementById('modal-time');
  const statusEl = document.getElementById('modal-status');
  const bestTimeEl = document.getElementById('modal-best-time');
  const peakHoursEl = document.getElementById('modal-peak-hours');
  
  // Set current time (HH:MM AM/PM format)
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const strTime = hours + ':' + minutes + ' ' + ampm;
  
  timeEl.textContent = strTime;
  
  // Use the dynamic crowdStatus directly from the server response
  statusEl.textContent = cafe.crowdStatus || '🟢 Peaceful';
  
  // Set best time & peak hours
  bestTimeEl.textContent = cafe.bestTimeMessage || 'Not Available';
  peakHoursEl.textContent = cafe.peakHours || 'Not Available';
  
  // Show Modal
  modal.classList.add('open');
  
  // Close logic
  const closeBtn = document.getElementById('close-modal-btn');
  const closeModal = () => modal.classList.remove('open');
  
  closeBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

// ========================================================
// TOAST NOTIFICATION LOGIC
// ========================================================
function showToast(message) {
  let toastEl = document.getElementById('app-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'app-toast';
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  
  toastEl.textContent = message;
  toastEl.classList.add('show');
  
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 4000);
}
