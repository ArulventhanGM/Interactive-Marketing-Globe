/**
 * Locations Navigation Extension for Globe
 * This file contains functions for navigating to specific locations on the globe
 */

// IDs to match with the dropdown
const LOCATION_IDS = {
  'nyc': { name: "New York HQ", lat: 40.7128, lng: -74.0060 },
  'london': { name: "London Office", lat: 51.5074, lng: -0.1278 },
  'tokyo': { name: "Tokyo Branch", lat: 35.6762, lng: 139.6503 },
  'sydney': { name: "Sydney Branch", lat: -33.8688, lng: 151.2093 }
};

/**
 * Navigate to a specific location on the globe
 * @param {string} locationId - The ID of the location to navigate to
 */
function navigateToLocation(locationId) {
  if (!locationId || !scene || !camera || !controls) {
    console.warn('⚠️ Cannot navigate: invalid location ID or globe not initialized');
    return;
  }
  // Find the location data by ID from markers
  let targetLocation = null;
  
  // First try to find in markers
  for (let i = 0; i < markers.length; i++) {
    if (markers[i].userData && markers[i].userData.id === locationId) {
      targetLocation = markers[i].userData;
      break;
    }
  }
  
  // If not found in markers, use our fallback data
  if (!targetLocation) {
    targetLocation = LOCATION_IDS[locationId];
    if (!targetLocation) {
      console.warn(`⚠️ Location with ID "${locationId}" not found`);
      return;
    }
  }

  console.log(`🔍 Navigating to ${targetLocation.name}`);
  
  // Stop auto-rotation during navigation
  if (controls.autoRotate) {
    controls.autoRotate = false;
  }

  // Calculate position based on latitude and longitude
  const lat = targetLocation.lat;
  const lng = targetLocation.lng;
  
  // Convert lat/long to 3D coordinates
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  // Calculate target position
  const targetPosition = new THREE.Vector3();
  targetPosition.x = -(EARTH_RADIUS * Math.sin(phi) * Math.cos(theta));
  targetPosition.y = EARTH_RADIUS * Math.cos(phi);
  targetPosition.z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
  
  // Calculate camera position (distance from target)
  const distance = EARTH_RADIUS * 2.5; // Camera distance from globe center
  const cameraTargetPosition = targetPosition.clone().normalize().multiplyScalar(distance);
  
  // Animate camera movement
  const startPosition = camera.position.clone();
  const startRotation = controls.target.clone();
  const duration = 1000; // Animation duration in milliseconds
  const startTime = Date.now();
  
  // Animation function
  function animateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease function (smooth transition)
    const ease = t => t<.5 ? 2*t*t : -1+(4-2*t)*t;
    const t = ease(progress);
    
    // Interpolate camera position
    camera.position.lerpVectors(startPosition, cameraTargetPosition, t);
    
    // Interpolate target (the point the camera is looking at)
    controls.target.lerpVectors(startRotation, new THREE.Vector3(0, 0, 0), t);
    controls.update();
    
    // Continue animation until complete
    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      // Flash the marker for visual confirmation
      flashMarkerAtLocation(lat, lng);
    }
  }
  
  // Start animation
  animateCamera();
}

/**
 * Create visual highlight effect for a marker at the given coordinates
 * @param {number} lat - Latitude 
 * @param {number} lng - Longitude
 */
function flashMarkerAtLocation(lat, lng) {
  // Find the closest marker to these coordinates
  let closestMarker = null;
  let minDistance = Infinity;
  
  markers.forEach(marker => {
    if (marker.userData && marker.userData.lat && marker.userData.lng) {
      const distance = Math.sqrt(
        Math.pow(marker.userData.lat - lat, 2) + 
        Math.pow(marker.userData.lng - lng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestMarker = marker;
      }
    }
  });
  
  // Flash the marker if found
  if (closestMarker && closestMarker.userData.marker) {
    const marker = closestMarker.userData.marker;
    const originalEmissive = marker.material.emissive.getHex();
    const originalIntensity = marker.material.emissiveIntensity;
    
    // Flash effect
    marker.material.emissive.setHex(0xFFFFFF);
    marker.material.emissiveIntensity = 1.5;
    
    // Reset after flash
    setTimeout(() => {
      marker.material.emissive.setHex(originalEmissive);
      marker.material.emissiveIntensity = originalIntensity;
    }, 500);
  }
}

// Initialize event listeners once DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Set up location dropdown event listener
  const locationSelect = document.getElementById('location-select');
  if (locationSelect) {
    locationSelect.addEventListener('change', function() {
      const locationId = this.value;
      if (locationId) {
        // Add visual feedback to the dropdown
        this.style.backgroundColor = 'rgba(0, 191, 255, 0.4)';
        this.style.boxShadow = '0 0 10px rgba(0, 191, 255, 0.7)';
        
        // Navigate to the location
        navigateToLocation(locationId);
        
        // Reset the dropdown style after navigation
        setTimeout(() => {
          this.style.backgroundColor = '';
          this.style.boxShadow = '';
        }, 1500);
      }
    });
    console.log('📍 Location navigation dropdown initialized');
  }
});

// Wait for globe initialization to complete
let checkGlobeLoaded = setInterval(function() {
  if (typeof scene !== 'undefined' && scene && camera && controls) {
    console.log('🌎 Globe ready for navigation');
    clearInterval(checkGlobeLoaded);
  }
}, 1000);
