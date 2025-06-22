/**
 * Interactive Globe Enhancements
 * This file contains enhanced features for the interactive globe visualization
 */

// Global variables for enhanced features
let isTimelinePlaying = false;
let timelineInterval;
let currentTheme = 'dark';
let ambientAudio;
let idleTimer;
let lastInteractionTime = Date.now();

// Real-time data simulation
const realtimeData = {
  achievements: 18,
  projects: 42,
  offices: 6,
  employees: 8250
};

// Timeline data for company expansion
const timelineData = {
  1995: { 
    description: "Company founded in New York", 
    locations: ['nyc'],
    achievements: 0 
  },
  1998: { 
    description: "European expansion with London office", 
    locations: ['nyc', 'london'],
    achievements: 3 
  },
  2001: { 
    description: "Asia-Pacific expansion with Tokyo branch", 
    locations: ['nyc', 'london', 'tokyo'],
    achievements: 8 
  },
  2005: { 
    description: "Oceania presence established in Sydney", 
    locations: ['nyc', 'london', 'tokyo', 'sydney'],
    achievements: 12 
  },
  2025: { 
    description: "All locations and achievements visible", 
    locations: ['nyc', 'london', 'tokyo', 'sydney'],
    achievements: 18 
  }
};

// Location flags mapping
const locationFlags = {
  'nyc': '🇺🇸',
  'london': '🇬🇧', 
  'tokyo': '🇯🇵',
  'sydney': '🇦🇺'
};

// Enhanced location data
const enhancedLocationData = {
  'nyc': {
    projects: 15,
    successRate: '94%',
    revenue: '$2.8B',
    marketShare: '23%'
  },
  'london': {
    projects: 12,
    successRate: '91%',
    revenue: '$1.9B',
    marketShare: '18%'
  },
  'tokyo': {
    projects: 8,
    successRate: '96%',
    revenue: '$1.2B',
    marketShare: '15%'
  },
  'sydney': {
    projects: 7,
    successRate: '89%',
    revenue: '$850M',
    marketShare: '12%'
  }
};

/**
 * Initialize enhanced features
 */
function initializeEnhancements() {
  console.log('🎨 Initializing globe enhancements...');
  
  // Initialize audio
  initializeAudio();
  
  // Initialize theme toggle
  initializeThemeToggle();
  
  // Initialize timeline
  initializeTimeline();
  
  // Initialize real-time data updates
  initializeRealtimeData();
  
  // Initialize idle detection
  initializeIdleDetection();
  
  // Initialize enhanced tooltips
  initializeEnhancedTooltips();
  
  console.log('✅ Globe enhancements initialized');
}

/**
 * Initialize ambient audio system
 */
function initializeAudio() {
  ambientAudio = document.getElementById('ambient-audio');
  const musicToggle = document.getElementById('ambient-music');
  const volumeSlider = document.getElementById('music-volume');
  const volumeValue = document.getElementById('volume-value');
  
  if (ambientAudio && musicToggle && volumeSlider) {
    // Set initial volume
    ambientAudio.volume = volumeSlider.value / 100;
    
    // Music toggle handler
    musicToggle.addEventListener('change', function() {
      if (this.checked) {
        ambientAudio.play().catch(e => console.log('Audio play failed:', e));
      } else {
        ambientAudio.pause();
      }
    });
    
    // Volume control handler
    volumeSlider.addEventListener('input', function() {
      const volume = this.value / 100;
      ambientAudio.volume = volume;
      volumeValue.textContent = this.value + '%';
    });
    
    // Auto-start music (will only work after user interaction)
    document.addEventListener('click', function startAudio() {
      if (musicToggle.checked) {
        ambientAudio.play().catch(e => console.log('Audio autostart failed:', e));
      }
      document.removeEventListener('click', startAudio);
    }, { once: true });
  }
}

/**
 * Initialize theme toggle functionality
 */
function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      toggleTheme();
    });
  }
}

function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  
  if (currentTheme === 'dark') {
    body.classList.add('light-theme');
    themeToggle.textContent = '☀️';
    currentTheme = 'light';
  } else {
    body.classList.remove('light-theme');
    themeToggle.textContent = '🌙';
    currentTheme = 'dark';
  }
  
  console.log(`🎨 Theme switched to: ${currentTheme}`);
}

/**
 * Initialize timeline functionality
 */
function initializeTimeline() {
  const timelineSlider = document.getElementById('timeline-slider');
  const yearLabel = document.getElementById('timeline-year-label');
  const description = document.getElementById('timeline-description');
  const playButton = document.getElementById('timeline-play');
  
  if (timelineSlider && yearLabel && description && playButton) {
    // Slider change handler
    timelineSlider.addEventListener('input', function() {
      const year = parseInt(this.value);
      updateTimelineDisplay(year);
    });
    
    // Play button handler
    playButton.addEventListener('click', function() {
      if (isTimelinePlaying) {
        stopTimeline();
      } else {
        playTimeline();
      }
    });
  }
}

function updateTimelineDisplay(year) {
  const yearLabel = document.getElementById('timeline-year-label');
  const description = document.getElementById('timeline-description');
  
  yearLabel.textContent = year;
  
  // Find the closest timeline data
  const availableYears = Object.keys(timelineData).map(y => parseInt(y)).sort((a, b) => a - b);
  let closestYear = availableYears[0];
  
  for (let i = 0; i < availableYears.length; i++) {
    if (availableYears[i] <= year) {
      closestYear = availableYears[i];
    } else {
      break;
    }
  }
  
  const data = timelineData[closestYear];
  if (data) {
    description.textContent = data.description;
    
    // Update real-time counters based on timeline
    updateRealtimeCounter('achievements-counter', data.achievements);
    
    // Show/hide locations based on timeline (if globe is ready)
    if (typeof showLocationsUpToYear === 'function') {
      showLocationsUpToYear(year);
    }
  }
}

function playTimeline() {
  const timelineSlider = document.getElementById('timeline-slider');
  const playButton = document.getElementById('timeline-play');
  
  isTimelinePlaying = true;
  playButton.textContent = '⏸ Pause Timeline';
  playButton.classList.add('playing');
  
  const startYear = 1995;
  const endYear = 2025;
  const duration = 10000; // 10 seconds
  const steps = endYear - startYear;
  const stepDuration = duration / steps;
  
  let currentYear = startYear;
  
  timelineInterval = setInterval(() => {
    timelineSlider.value = currentYear;
    updateTimelineDisplay(currentYear);
    
    currentYear++;
    
    if (currentYear > endYear) {
      stopTimeline();
    }
  }, stepDuration);
}

function stopTimeline() {
  const playButton = document.getElementById('timeline-play');
  
  isTimelinePlaying = false;
  playButton.textContent = '▶ Play Timeline';
  playButton.classList.remove('playing');
  
  if (timelineInterval) {
    clearInterval(timelineInterval);
    timelineInterval = null;
  }
}

/**
 * Initialize real-time data updates
 */
function initializeRealtimeData() {
  // Simulate data updates every 30 seconds
  setInterval(() => {
    // Simulate small changes in data
    if (Math.random() > 0.7) {
      realtimeData.projects += Math.random() > 0.5 ? 1 : -1;
      realtimeData.projects = Math.max(30, Math.min(50, realtimeData.projects));
      updateRealtimeCounter('projects-counter', realtimeData.projects);
    }
    
    if (Math.random() > 0.8) {
      realtimeData.employees += Math.floor(Math.random() * 10) - 5;
      realtimeData.employees = Math.max(8000, Math.min(8500, realtimeData.employees));
      updateRealtimeCounter('employees-counter', realtimeData.employees.toLocaleString());
    }
  }, 30000);
}

function updateRealtimeCounter(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    // Add animation class
    element.classList.add('updating');
    
    setTimeout(() => {
      element.textContent = value;
      element.classList.remove('updating');
    }, 200);
  }
}

/**
 * Initialize idle detection for auto-rotation
 */
function initializeIdleDetection() {
  const idleRotationToggle = document.getElementById('idle-rotation');
  
  // Track user interactions
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, () => {
      lastInteractionTime = Date.now();
      
      // Stop auto-rotation when user interacts
      if (typeof controls !== 'undefined' && controls) {
        controls.autoRotate = false;
      }
    });
  });
  
  // Check for idle state every 2 seconds
  setInterval(() => {
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    const isIdle = timeSinceLastInteraction > 8000; // 8 seconds
    
    if (isIdle && idleRotationToggle && idleRotationToggle.checked) {
      if (typeof controls !== 'undefined' && controls) {
        controls.autoRotate = true;
      }
    }
  }, 2000);
  
  // Handle idle rotation toggle
  if (idleRotationToggle) {
    idleRotationToggle.addEventListener('change', function() {
      if (!this.checked && typeof controls !== 'undefined' && controls) {
        controls.autoRotate = false;
      }
    });
  }
}

/**
 * Initialize enhanced tooltips
 */
function initializeEnhancedTooltips() {
  const tooltip = document.getElementById('location-tooltip');
  const closeBtn = document.getElementById('close-tooltip');
  const viewDetailsBtn = document.getElementById('view-details-btn');
  const navigateBtn = document.getElementById('navigate-btn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', hideEnhancedTooltip);
  }
  
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', function() {
      // Open the achievement modal for the current location
      if (currentLocation && typeof showAchievementModal === 'function') {
        showAchievementModal(currentLocation);
      }
      hideEnhancedTooltip();
    });
  }
  
  if (navigateBtn) {
    navigateBtn.addEventListener('click', function() {
      // Navigate to the current location
      if (currentLocation && typeof navigateToLocation === 'function') {
        navigateToLocation(currentLocation.id);
      }
      hideEnhancedTooltip();
    });
  }
}

/**
 * Show enhanced tooltip for a location
 */
function showEnhancedTooltip(location, x, y) {
  const tooltip = document.getElementById('location-tooltip');
  if (!tooltip || !location) return;
  
  // Update tooltip content
  const flag = document.getElementById('location-flag');
  const name = document.getElementById('location-name');
  const established = document.getElementById('location-established');
  const employees = document.getElementById('location-employees');
  const description = document.getElementById('location-description');
  const projects = document.getElementById('location-projects');
  const successRate = document.getElementById('location-success-rate');
  const revenue = document.getElementById('location-revenue');
  const marketShare = document.getElementById('location-market-share');
  
  if (flag) flag.textContent = locationFlags[location.id] || '🌍';
  if (name) name.textContent = location.name || 'Unknown Location';
  if (established) established.textContent = location.established ? `Est. ${location.established}` : '';
  if (employees) employees.textContent = location.employees ? `${location.employees.toLocaleString()} employees` : '';
  if (description) description.textContent = location.description || '';
  
  // Enhanced data
  const enhanced = enhancedLocationData[location.id];
  if (enhanced) {
    if (projects) projects.textContent = enhanced.projects;
    if (successRate) successRate.textContent = enhanced.successRate;
    if (revenue) revenue.textContent = enhanced.revenue;
    if (marketShare) marketShare.textContent = enhanced.marketShare;
  }
  
  // Position tooltip
  tooltip.style.left = Math.min(x + 20, window.innerWidth - 400) + 'px';
  tooltip.style.top = Math.min(y - 10, window.innerHeight - 300) + 'px';
  
  // Show with animation
  tooltip.style.display = 'block';
  setTimeout(() => {
    tooltip.classList.add('visible');
  }, 10);
  
  console.log('📍 Enhanced tooltip shown for:', location.name);
}

/**
 * Hide enhanced tooltip
 */
function hideEnhancedTooltip() {
  const tooltip = document.getElementById('location-tooltip');
  if (tooltip) {
    tooltip.classList.remove('visible');
    setTimeout(() => {
      tooltip.style.display = 'none';
    }, 300);
  }
}

// CSS animation for updating counters
const style = document.createElement('style');
style.textContent = `
  .metric-value.updating {
    animation: pulse 0.4s ease-in-out;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); color: #FFD700; }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeEnhancements();
});

// Initialize when globe is ready
let checkGlobeReady = setInterval(function() {
  if (typeof scene !== 'undefined' && scene && typeof markers !== 'undefined' && markers.length > 0) {
    console.log('🌍 Globe ready - connecting enhancements');
    
    // Override the existing tooltip function if it exists
    if (typeof showTooltipForLocation !== 'undefined') {
      window.originalShowTooltip = showTooltipForLocation;
    }
    
    window.showTooltipForLocation = showEnhancedTooltip;
    
    clearInterval(checkGlobeReady);
  }
}, 1000);

// Export functions for global access
window.toggleTheme = toggleTheme;
window.showEnhancedTooltip = showEnhancedTooltip;
window.hideEnhancedTooltip = hideEnhancedTooltip;
window.updateTimelineDisplay = updateTimelineDisplay;
