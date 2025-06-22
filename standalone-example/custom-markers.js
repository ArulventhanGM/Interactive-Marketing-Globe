/**
 * Custom Marker Icons for Interactive Globe
 * This file provides functionality to create custom location pins/icons
 */

// Custom marker icon configurations
const markerIconConfigs = {
  'nyc': {
    icon: '🏢', // Headquarters
    color: '#00BFFF',
    scale: 1.2
  },
  'london': {
    icon: '🏛️', // European office
    color: '#FFD700',
    scale: 1.1
  },
  'tokyo': {
    icon: '🗾', // Asian branch
    color: '#FF69B4',
    scale: 1.1
  },
  'sydney': {
    icon: '🏝️', // Oceania office
    color: '#00FF7F',
    scale: 1.0
  }
};

/**
 * Create a custom marker with icon and styling
 * @param {Object} location - Location data
 * @param {THREE.Vector3} position - 3D position for the marker
 * @returns {THREE.Group} - Custom marker group
 */
function createCustomMarker(location, position) {
  const markerGroup = new THREE.Group();
  const config = markerIconConfigs[location.id] || markerIconConfigs['nyc'];
  
  // Create the main marker sphere with enhanced styling
  const markerGeometry = new THREE.SphereGeometry(0.12 * config.scale, 32, 32);
  const markerMaterial = new THREE.MeshPhongMaterial({
    color: config.color,
    emissive: config.color,
    emissiveIntensity: 0.6,
    shininess: 100,
    transparent: true,
    opacity: 0.9
  });
  
  const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
  markerMesh.position.copy(position);
  
  // Create pulsing glow ring
  const ringGeometry = new THREE.RingGeometry(0.15 * config.scale, 0.25 * config.scale, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  
  const glowRing = new THREE.Mesh(ringGeometry, ringMaterial);
  glowRing.position.copy(position);
  glowRing.lookAt(new THREE.Vector3(0, 0, 0)); // Face the center
  
  // Create icon sprite
  const iconSprite = createIconSprite(config.icon, config.color, config.scale);
  iconSprite.position.copy(position);
  iconSprite.position.normalize().multiplyScalar(EARTH_RADIUS + 0.3);
  
  // Create connection line to surface
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    position.clone().normalize().multiplyScalar(EARTH_RADIUS + 0.05),
    iconSprite.position.clone()
  ]);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: 0.6,
    linewidth: 2
  });
  const connectionLine = new THREE.Line(lineGeometry, lineMaterial);
  
  // Add components to group
  markerGroup.add(markerMesh);
  markerGroup.add(glowRing);
  markerGroup.add(iconSprite);
  markerGroup.add(connectionLine);
  
  // Store references for animations
  markerGroup.userData = {
    ...location,
    marker: markerMesh,
    glowRing: glowRing,
    iconSprite: iconSprite,
    connectionLine: connectionLine,
    originalColor: { color: config.color, emissive: config.color },
    config: config
  };
  
  return markerGroup;
}

/**
 * Create an icon sprite for the marker
 * @param {string} icon - Emoji or text icon
 * @param {string} color - Color for the icon
 * @param {number} scale - Scale factor
 * @returns {THREE.Sprite} - Icon sprite
 */
function createIconSprite(icon, color, scale = 1.0) {
  // Create canvas for the icon
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const size = 128;
  
  canvas.width = size;
  canvas.height = size;
  
  // Clear canvas
  context.clearRect(0, 0, size, size);
  
  // Draw background circle
  context.beginPath();
  context.arc(size/2, size/2, size/2 - 10, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.globalAlpha = 0.8;
  context.fill();
  
  // Draw border
  context.strokeStyle = '#ffffff';
  context.lineWidth = 4;
  context.stroke();
  
  // Draw icon
  context.globalAlpha = 1.0;
  context.font = `${size * 0.4}px Arial`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  context.fillText(icon, size/2, size/2);
  
  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.4 * scale, 0.4 * scale, 1);
  
  return sprite;
}

/**
 * Create a company logo marker
 * @param {Object} location - Location data
 * @param {THREE.Vector3} position - 3D position
 * @returns {THREE.Group} - Logo marker group
 */
function createLogoMarker(location, position) {
  const markerGroup = new THREE.Group();
  
  // Create logo sprite (you would load your actual company logo here)
  const logoSprite = createCompanyLogoSprite();
  logoSprite.position.copy(position);
  logoSprite.position.normalize().multiplyScalar(EARTH_RADIUS + 0.3);
  
  // Create glowing base
  const baseGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.1, 16);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: '#00BFFF',
    emissive: '#004080',
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8
  });
  
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.position.copy(position);
  baseMesh.lookAt(new THREE.Vector3(0, 0, 0));
  
  markerGroup.add(logoSprite);
  markerGroup.add(baseMesh);
  
  markerGroup.userData = {
    ...location,
    logoSprite: logoSprite,
    baseMesh: baseMesh
  };
  
  return markerGroup;
}

/**
 * Create company logo sprite
 * @returns {THREE.Sprite} - Company logo sprite
 */
function createCompanyLogoSprite() {
  // Create a simple company logo (replace with actual logo loading)
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const size = 256;
  
  canvas.width = size;
  canvas.height = size;
  
  // Draw company logo (simplified example)
  context.fillStyle = '#00BFFF';
  context.fillRect(0, 0, size, size);
  
  context.fillStyle = '#ffffff';
  context.font = `${size * 0.3}px Arial Black`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GT', size/2, size/2);
  
  // Add border
  context.strokeStyle = '#ffffff';
  context.lineWidth = 8;
  context.strokeRect(0, 0, size, size);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true
  });
  
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.5, 0.5, 1);
  
  return sprite;
}

/**
 * Animate custom markers
 * @param {Array} markers - Array of marker groups
 */
function animateCustomMarkers(markers) {
  markers.forEach(markerGroup => {
    if (markerGroup.userData.glowRing) {
      // Rotate glow ring
      markerGroup.userData.glowRing.rotation.z += 0.01;
      
      // Pulse glow ring
      const time = Date.now() * 0.001;
      const scale = 1 + Math.sin(time * 2) * 0.1;
      markerGroup.userData.glowRing.scale.setScalar(scale);
    }
    
    if (markerGroup.userData.iconSprite) {
      // Gentle floating animation for icon
      const time = Date.now() * 0.001;
      const originalPosition = markerGroup.userData.iconSprite.position.clone().normalize().multiplyScalar(EARTH_RADIUS + 0.3);
      const floatOffset = Math.sin(time + markerGroup.userData.lat) * 0.02;
      markerGroup.userData.iconSprite.position.copy(originalPosition).normalize().multiplyScalar(EARTH_RADIUS + 0.3 + floatOffset);
    }
  });
}

/**
 * Update marker visibility based on timeline
 * @param {Array} markers - Array of marker groups
 * @param {number} year - Current year
 */
function updateMarkerVisibility(markers, year) {
  markers.forEach(markerGroup => {
    const location = markerGroup.userData;
    const shouldBeVisible = !location.established || location.established <= year;
    
    if (shouldBeVisible && !markerGroup.visible) {
      // Animate in
      markerGroup.visible = true;
      animateMarkerIn(markerGroup);
    } else if (!shouldBeVisible && markerGroup.visible) {
      // Animate out
      animateMarkerOut(markerGroup);
    }
  });
}

/**
 * Animate marker appearing
 * @param {THREE.Group} markerGroup - Marker group to animate
 */
function animateMarkerIn(markerGroup) {
  markerGroup.scale.setScalar(0);
  
  const animate = () => {
    const currentScale = markerGroup.scale.x;
    const targetScale = 1;
    const newScale = currentScale + (targetScale - currentScale) * 0.1;
    
    markerGroup.scale.setScalar(newScale);
    
    if (Math.abs(newScale - targetScale) > 0.01) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
}

/**
 * Animate marker disappearing
 * @param {THREE.Group} markerGroup - Marker group to animate
 */
function animateMarkerOut(markerGroup) {
  const animate = () => {
    const currentScale = markerGroup.scale.x;
    const targetScale = 0;
    const newScale = currentScale + (targetScale - currentScale) * 0.1;
    
    markerGroup.scale.setScalar(newScale);
    
    if (newScale > 0.01) {
      requestAnimationFrame(animate);
    } else {
      markerGroup.visible = false;
      markerGroup.scale.setScalar(1); // Reset for next time
    }
  };
  
  animate();
}

// Export functions for global access
window.createCustomMarker = createCustomMarker;
window.createLogoMarker = createLogoMarker;
window.animateCustomMarkers = animateCustomMarkers;
window.updateMarkerVisibility = updateMarkerVisibility;
