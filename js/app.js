/**
 * BCIT Campus Maps - Main Application
 * Version: 1.0.0
 */

// Campus data with detailed information
const CAMPUS_DATA = {
  '1': {
    name: 'Burnaby Campus',
    fullName: 'Burnaby Campus (Main Campus)',
    address: '3700 Willingdon Avenue, Burnaby, BC V5G 3H2',
    phone: '(604) 434-5734',
    description: 'The main campus of BCIT, offering a wide range of programs in technology, business, and health sciences.',
    features: [
      'Library and Learning Commons',
      'Student Association Building',
      'Multiple cafeterias and food services',
      'Fitness center and gym',
      'On-campus residence'
    ],
    mapAlt: 'Burnaby Campus Map - Main BCIT Campus showing buildings and facilities'
  },
  '2': {
    name: 'Downtown Campus',
    fullName: 'Downtown Campus',
    address: '555 Seymour Street, Vancouver, BC V6B 3H6',
    phone: '(604) 412-7500',
    description: 'Located in the heart of downtown Vancouver, focusing on business, media, and computing programs.',
    features: [
      'Modern downtown location',
      'Easy transit access',
      'Industry-connected programs',
      'Networking opportunities',
      'Continuing education center'
    ],
    mapAlt: 'Downtown Campus Map - BCIT Downtown Vancouver location'
  },
  '3': {
    name: 'Marine Campus',
    fullName: 'Marine Campus',
    address: '265 West Esplanade, North Vancouver, BC V7M 1A5',
    phone: '(604) 453-4100',
    description: 'Specialized campus for marine, nautical, and offshore oil and gas training programs.',
    features: [
      'Marine simulation center',
      'Ship bridge simulators',
      'Specialized marine training',
      'Waterfront location',
      'Industry partnerships'
    ],
    mapAlt: 'Marine Campus Map - BCIT Marine training facilities in North Vancouver'
  },
  '4': {
    name: 'Aerospace Campus',
    fullName: 'Aerospace Technology Campus',
    address: '3800 Cessna Drive, Richmond, BC V7B 0C1',
    phone: '(604) 456-8100',
    description: 'State-of-the-art facility for aerospace training adjacent to Vancouver International Airport.',
    features: [
      'Hangar facilities',
      'Aircraft maintenance training',
      'Aviation programs',
      'Industry-standard equipment',
      'Airport proximity'
    ],
    mapAlt: 'Aerospace Campus Map - BCIT Aviation and aerospace training facilities'
  },
  '5': {
    name: 'Annacis Island',
    fullName: 'Annacis Island Campus',
    address: '1400 Cliveden Avenue, Delta, BC V3M 6G5',
    phone: '(604) 777-6300',
    description: 'Specialized trades training facility focusing on apprenticeship and technical training.',
    features: [
      'Trades training center',
      'Apprenticeship programs',
      'Industrial workshops',
      'Hands-on training',
      'Industry connections'
    ],
    mapAlt: 'Annacis Island Campus Map - BCIT Trades and apprenticeship training center'
  }
};

// Map zoom functionality
class MapZoom {
  constructor() {
    this.currentScale = 1;
    this.minScale = 0.5;
    this.maxScale = 3;
    this.scaleStep = 0.1;
    this.image = document.getElementById('campus-map');
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.reset();
  }

  setupEventListeners() {
    document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
    document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
    document.getElementById('reset-zoom').addEventListener('click', () => this.reset());
    
    // Touch events for mobile zoom
    this.image.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.image.addEventListener('touchmove', this.handleTouchMove.bind(this));
  }

  zoomIn() {
    this.currentScale = Math.min(this.currentScale + this.scaleStep, this.maxScale);
    this.applyZoom();
  }

  zoomOut() {
    this.currentScale = Math.max(this.currentScale - this.scaleStep, this.minScale);
    this.applyZoom();
  }

  reset() {
    this.currentScale = 1;
    this.applyZoom();
  }

  applyZoom() {
    this.image.style.transform = `scale(${this.currentScale})`;
    this.image.style.transformOrigin = 'center center';
  }

  handleTouchStart(e) {
    if (e.touches.length === 2) {
      this.initialDistance = this.getTouchDistance(e);
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = this.getTouchDistance(e);
      const scaleChange = currentDistance / this.initialDistance;
      
      this.currentScale = Math.max(
        this.minScale,
        Math.min(this.currentScale * scaleChange, this.maxScale)
      );
      
      this.applyZoom();
      this.initialDistance = currentDistance;
    }
  }

  getTouchDistance(e) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }
}

// Campus Manager
class CampusManager {
  constructor() {
    this.currentCampus = '1';
    this.mapZoom = new MapZoom();
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.updateCampus('1', true);
    this.checkCacheStatus();
  }

  setupEventListeners() {
    const select = document.getElementById('campus-select');
    select.addEventListener('change', (e) => {
      this.updateCampus(e.target.value);
    });

    // Keyboard navigation for dropdown
    select.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.updateCampus(select.value);
      }
    });
  }

  updateCampus(campusId, initialLoad = false) {
    const campus = CAMPUS_DATA[campusId];
    if (!campus) return;

    this.currentCampus = campusId;
    
    // Update map
    const map = document.getElementById('campus-map');
    map.src = `./images/${campusId}.jpg`;
    map.alt = campus.mapAlt;
    
    // Update campus info display
    this.updateCampusInfo(campus);
    
    // Update current campus text
    document.getElementById('current-campus').textContent = 
      `Currently viewing: ${campus.name}`;
    
    // Update dropdown selection
    document.getElementById('campus-select').value = campusId;
    
    // Reset zoom on campus change
    this.mapZoom.reset();
    
    // Announce change for screen readers
    if (!initialLoad) {
      this.announceCampusChange(campus.name);
    }
    
    // Log analytics
    this.logCampusView(campusId);
  }

  updateCampusInfo(campus) {
    const infoDiv = document.getElementById('campus-info');
    
    const html = `
      <div class="campus-detail-card">
        <h3 class="campus-name">${campus.fullName}</h3>
        <div class="campus-meta">
          <p class="campus-address">📍 ${campus.address}</p>
          <p class="campus-phone">📞 ${campus.phone}</p>
        </div>
        <p class="campus-description">${campus.description}</p>
        <div class="campus-features">
          <h4>Campus Features:</h4>
          <ul>
            ${campus.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    
    infoDiv.innerHTML = html;
  }

  announceCampusChange(campusName) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Now viewing ${campusName} campus map`;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  logCampusView(campusId) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CAMPUS_VIEW',
        campusId: campusId,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkCacheStatus() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const cache = await caches.open('BCIT Campus Maps-v2.0.0');
        const keys = await cache.keys();
        
        const statusElement = document.getElementById('cache-status');
        if (statusElement) {
          statusElement.textContent = `${keys.length} resources cached for offline use`;
        }
      } catch (error) {
        console.log('Cache status check failed:', error);
      }
    }
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize campus manager
  window.campusManager = new CampusManager();
  
  // Set app version
  document.getElementById('app-version').textContent = 'Version 2.0.0';
  
  // Add loading state removal
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 100);
  
  // Register service worker if not already registered
  if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js');
    });
  }
  
  // Handle offline/online events
  window.addEventListener('online', () => {
    document.body.classList.remove('offline');
    document.body.classList.add('online');
    
    // Show notification
    this.showNotification('Back online', 'success');
  });
  
  window.addEventListener('offline', () => {
    document.body.classList.remove('online');
    document.body.classList.add('offline');
    
    // Show notification
    this.showNotification('Working offline', 'info');
  });
  
  // Initialize tooltips
  this.initTooltips();
});

// Utility functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function initTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    element.addEventListener('focus', showTooltip);
    element.addEventListener('blur', hideTooltip);
  });
}

function showTooltip(e) {
  const tooltipText = e.target.getAttribute('data-tooltip');
  if (!tooltipText) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = tooltipText;
  tooltip.id = 'current-tooltip';
  
  const rect = e.target.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${rect.top - 40}px`;
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.transform = 'translateX(-50%)';
  
  document.body.appendChild(tooltip);
}

function hideTooltip() {
  const tooltip = document.getElementById('current-tooltip');
  if (tooltip) {
    document.body.removeChild(tooltip);
  }
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CampusManager, MapZoom, CAMPUS_DATA };
}
