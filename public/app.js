/* ========================================
   Mood-Based Café Finder - App Logic
   ======================================== */

// --- State ---
const state = {
  moodTags: [],
  companionTypes: [],
  seatingTypes: [],
  menuTypes: [],
  cafes: [],
  currentCafe: null
};

// --- DOM Elements ---
const pages = {
  page1: document.getElementById('page1'),
  page2: document.getElementById('page2'),
  page3: document.getElementById('page3'),
  page4: document.getElementById('page4')
};

const btnNext1 = document.getElementById('btn-next-1');
const btnNext2 = document.getElementById('btn-next-2');
const btnBack2 = document.getElementById('btn-back-2');
const btnBack3 = document.getElementById('btn-back-3');
const btnBack4 = document.getElementById('btn-back-4');

// --- Page Navigation ---
function showPage(pageId) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  const target = pages[pageId];
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }
}

// --- Card Selection Logic ---
function setupCardListeners() {
  // Mood cards (multi-select)
  document.querySelectorAll('[data-type="mood"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const value = card.dataset.value;
      if (state.moodTags.includes(value)) {
        state.moodTags = state.moodTags.filter(v => v !== value);
      } else {
        state.moodTags.push(value);
      }
      updatePage1Button();
    });
  });

  // Companion cards (multi-select)
  document.querySelectorAll('[data-type="companion"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const value = card.dataset.value;
      if (state.companionTypes.includes(value)) {
        state.companionTypes = state.companionTypes.filter(v => v !== value);
      } else {
        state.companionTypes.push(value);
      }
      updatePage1Button();
    });
  });

  // Seating cards (multi-select)
  document.querySelectorAll('[data-type="seating"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const value = card.dataset.value;
      if (state.seatingTypes.includes(value)) {
        state.seatingTypes = state.seatingTypes.filter(v => v !== value);
      } else {
        state.seatingTypes.push(value);
      }
      updatePage2Button();
    });
  });

  // Food cards (multi-select)
  document.querySelectorAll('[data-type="food"]').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const value = card.dataset.value;
      if (state.menuTypes.includes(value)) {
        state.menuTypes = state.menuTypes.filter(v => v !== value);
      } else {
        state.menuTypes.push(value);
      }
      updatePage2Button();
    });
  });
}

// --- Button State Updates ---
function updatePage1Button() {
  const hasSelections = state.moodTags.length > 0 && state.companionTypes.length > 0;
  btnNext1.disabled = !hasSelections;
}

function updatePage2Button() {
  const hasSelections = state.seatingTypes.length > 0 && state.menuTypes.length > 0;
  btnNext2.disabled = !hasSelections;
}

// --- Navigation Handlers ---
btnNext1.addEventListener('click', () => {
  if (state.moodTags.length > 0 && state.companionTypes.length > 0) {
    showPage('page2');
  }
});

btnNext2.addEventListener('click', async () => {
  if (state.seatingTypes.length > 0 && state.menuTypes.length > 0) {
    showPage('page3');
    await fetchCafes();
  }
});

btnBack2.addEventListener('click', () => showPage('page1'));
btnBack3.addEventListener('click', () => showPage('page2'));
btnBack4.addEventListener('click', () => showPage('page3'));

// --- API: Fetch Cafes ---
async function fetchCafes() {
  const container = document.getElementById('cafes-container');
  const tagsContainer = document.getElementById('selected-tags');

  // Show loading
  container.innerHTML = `
    <div class="loading-container" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <p class="loading-text">Finding perfect cafés for you...</p>
    </div>
  `;

  // Display selected preference tags
  const allTags = [
    ...state.moodTags,
    ...state.companionTypes,
    ...state.seatingTypes,
    ...state.menuTypes
  ];
  tagsContainer.innerHTML = allTags.map(tag =>
    `<span class="preference-tag">${tag}</span>`
  ).join('');

  try {
    const response = await fetch('/api/cafes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moodTags: state.moodTags,
        companionTypes: state.companionTypes,
        seatingTypes: state.seatingTypes,
        menuTypes: state.menuTypes
      })
    });

    const cafes = await response.json();
    state.cafes = cafes;

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 600));

    if (cafes.length === 0) {
      container.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1;">
          <div class="icon">😔</div>
          <h2>No cafés found</h2>
          <p>Try changing your preferences to discover more options!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = cafes.map((cafe, index) => `
      <div class="cafe-card" style="animation-delay: ${index * 0.1}s">
        <div class="cafe-card-image-wrapper">
          <img
            src="${cafe.images && cafe.images[0] ? cafe.images[0] : '/images/cafe_background.png'}"
            alt="${cafe.name}"
            class="cafe-card-image"
            loading="lazy"
            onerror="this.src='/images/cafe_background.png'"
          >
          <span class="budget-badge">₹${cafe.avgBudget}</span>
        </div>
        <div class="cafe-card-body">
          <h3 class="cafe-card-name">${cafe.name}</h3>
          <div class="cafe-card-tags">
            ${(cafe.moodTags || []).map(t => `<span class="cafe-card-tag">${t}</span>`).join('')}
            ${(cafe.seatingTypes || []).map(t => `<span class="cafe-card-tag">${t}</span>`).join('')}
          </div>
          <div class="cafe-card-footer">
            <div class="cafe-card-info">
              <span>📍</span> ${cafe.city || 'Indore'}
            </div>
            <button class="btn-view-details" onclick="showCafeDetail('${cafe._id}')">
              View Details
            </button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error fetching cafes:', error);
    container.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <div class="icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>Please make sure the server is running and try again.</p>
      </div>
    `;
  }
}

// --- Show Cafe Detail ---
function showCafeDetail(cafeId) {
  const cafe = state.cafes.find(c => c._id === cafeId);
  if (!cafe) return;

  state.currentCafe = cafe;
  const container = document.getElementById('detail-container');

  // Build image carousel
  const images = cafe.images && cafe.images.length > 0 ? cafe.images : ['/images/cafe_background.png'];
  const carouselDotsHtml = images.length > 1 ? `
    <div class="carousel-dots">
      ${images.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
    </div>
  ` : '';

  container.innerHTML = `
    <!-- Image Carousel -->
    <div class="detail-image-carousel" id="detail-carousel">
      <img src="${images[0]}" alt="${cafe.name}" id="carousel-image" onerror="this.src='/images/cafe_background.png'">
      ${carouselDotsHtml}
    </div>

    <!-- Info Card -->
    <div class="detail-card">
      <h1 class="detail-name">${cafe.name}</h1>
      <p class="detail-city">📍 ${cafe.city || 'Indore'}</p>

      <div class="detail-info-grid">
        <div class="detail-info-item">
          <div class="info-icon">💰</div>
          <div class="info-label">Avg Budget</div>
          <div class="info-value budget">₹${cafe.avgBudget}</div>
        </div>
        <div class="detail-info-item">
          <div class="info-icon">🪑</div>
          <div class="info-label">Seating</div>
          <div class="info-value">${(cafe.seatingTypes || []).join(', ')}</div>
        </div>
        <div class="detail-info-item">
          <div class="info-icon">😊</div>
          <div class="info-label">Mood</div>
          <div class="info-value">${(cafe.moodTags || []).join(', ')}</div>
        </div>
        <div class="detail-info-item">
          <div class="info-icon">👥</div>
          <div class="info-label">Best For</div>
          <div class="info-value">${(cafe.companionTypes || []).join(', ')}</div>
        </div>
      </div>

      <!-- Menu Types -->
      <div class="detail-tags-section">
        <div class="detail-tags-title">Menu Available</div>
        <div class="detail-tags-row">
          ${(cafe.menuTypes || []).map(t => `<span class="detail-tag">${t}</span>`).join('')}
        </div>
      </div>

      <!-- Your Preferences Match -->
      <div class="detail-tags-section">
        <div class="detail-tags-title">Your Selected Preferences</div>
        <div class="detail-tags-row">
          ${state.moodTags.map(t => `<span class="detail-tag">${t}</span>`).join('')}
          ${state.companionTypes.map(t => `<span class="detail-tag">${t}</span>`).join('')}
          ${state.seatingTypes.map(t => `<span class="detail-tag">${t}</span>`).join('')}
          ${state.menuTypes.map(t => `<span class="detail-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;

  // Setup carousel functionality
  if (images.length > 1) {
    setupCarousel(images);
  }

  // Update page 4 background with cafe image
  const page4Bg = document.querySelector('#page4 .page-bg');
  page4Bg.style.backgroundImage = `url('${images[0]}')`;

  showPage('page4');
}

// --- Image Carousel ---
function setupCarousel(images) {
  let currentIndex = 0;
  const imgEl = document.getElementById('carousel-image');
  const dots = document.querySelectorAll('.carousel-dot');

  function goToSlide(index) {
    currentIndex = index;
    imgEl.style.opacity = '0';
    setTimeout(() => {
      imgEl.src = images[currentIndex];
      imgEl.style.opacity = '1';
    }, 250);
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.index));
    });
  });

  // Auto-rotate every 4 seconds
  let autoPlayInterval = setInterval(() => {
    goToSlide((currentIndex + 1) % images.length);
  }, 4000);

  // Pause auto-play on hover
  const carousel = document.getElementById('detail-carousel');
  carousel.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
  carousel.addEventListener('mouseleave', () => {
    autoPlayInterval = setInterval(() => {
      goToSlide((currentIndex + 1) % images.length);
    }, 4000);
  });

  // Add smooth transition to image
  imgEl.style.transition = 'opacity 0.25s ease';
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  setupCardListeners();
});
