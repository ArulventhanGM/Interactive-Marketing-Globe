/**
 * Enhanced Globe Implementation with Google Earth-style features
 * Features:
 * - Accurate anchored labels and markers
 * - Smooth deep zoom with proper camera controls
 * - Click-to-show achievements drawer
 * - Auto-occlusion for overlapping labels
 * - Momentum/damping for fluid interactions
 */

// Globe constants for accurate positioning
const EARTH_RADIUS = 5;
const MARKER_HEIGHT = 0.05;
const LABEL_HEIGHT = 0.1;
const MIN_ZOOM_DISTANCE = EARTH_RADIUS * 1.1; // ~5.5 units (close zoom)
const MAX_ZOOM_DISTANCE = EARTH_RADIUS * 10;   // ~50 units (far zoom)

// Global variables
let scene, camera, renderer, controls;
let earth, clouds, atmosphere;
let markers = [];
let labels = [];
let selectedLocation = null;
let achievementsDrawer = null;
let currentFilters = { category: 'all', year: 'all' };

/**
 * Utility function to convert lat/lng to 3D coordinates on sphere surface
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} altitude - Height above surface (default: 0)
 * @returns {THREE.Vector3} 3D position vector
 */
function latLngToVector3(lat, lng, altitude = 0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const radius = EARTH_RADIUS + altitude;

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Create achievements drawer UI
 */
function createAchievementsDrawer() {
  const drawer = document.createElement('div');
  drawer.id = 'achievements-drawer';
  drawer.className = 'achievements-drawer hidden';

  drawer.innerHTML = `
    <div class="drawer-header">
      <h3 id="drawer-location-name">Location Achievements</h3>
      <button id="drawer-close" class="drawer-close-btn">×</button>
    </div>
    <div class="drawer-filters">
      <select id="drawer-category-filter">
        <option value="all">All Categories</option>
        <option value="award">Awards</option>
        <option value="innovation">Innovation</option>
        <option value="sustainability">Sustainability</option>
        <option value="operational">Operational</option>
        <option value="partnership">Partnership</option>
        <option value="social">Social Impact</option>
      </select>
      <select id="drawer-year-filter">
        <option value="all">All Years</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
        <option value="2022">2022</option>
      </select>
    </div>
    <div class="drawer-content">
      <div id="drawer-achievements-list"></div>
    </div>
  `;

  document.body.appendChild(drawer);

  // Event listeners
  document.getElementById('drawer-close').addEventListener('click', closeAchievementsDrawer);
  document.getElementById('drawer-category-filter').addEventListener('change', updateDrawerContent);
  document.getElementById('drawer-year-filter').addEventListener('change', updateDrawerContent);

  return drawer;
}

/**
 * Open achievements drawer for a location
 */
function openAchievementsDrawer(location) {
  if (!achievementsDrawer) {
    achievementsDrawer = createAchievementsDrawer();
  }

  selectedLocation = location;
  document.getElementById('drawer-location-name').textContent = location.name;

  // Sync filters with main page
  const mainCategoryFilter = document.getElementById('category-filter');
  const mainYearFilter = document.getElementById('year-filter');
  const drawerCategoryFilter = document.getElementById('drawer-category-filter');
  const drawerYearFilter = document.getElementById('drawer-year-filter');

  if (mainCategoryFilter && drawerCategoryFilter) {
    drawerCategoryFilter.value = mainCategoryFilter.value;
  }
  if (mainYearFilter && drawerYearFilter) {
    drawerYearFilter.value = mainYearFilter.value;
  }

  updateDrawerContent();
  achievementsDrawer.classList.remove('hidden');
}

/**
 * Close achievements drawer
 */
function closeAchievementsDrawer() {
  if (achievementsDrawer) {
    achievementsDrawer.classList.add('hidden');
  }
  selectedLocation = null;
}

/**
 * Update drawer content based on filters
 */
function updateDrawerContent() {
  if (!selectedLocation) return;

  const categoryFilter = document.getElementById('drawer-category-filter').value;
  const yearFilter = document.getElementById('drawer-year-filter').value;
  const achievementsList = document.getElementById('drawer-achievements-list');

  let filteredAchievements = selectedLocation.achievements;

  if (categoryFilter !== 'all') {
    filteredAchievements = filteredAchievements.filter(a => a.category === categoryFilter);
  }
  if (yearFilter !== 'all') {
    filteredAchievements = filteredAchievements.filter(a => a.year.toString() === yearFilter);
  }

  achievementsList.innerHTML = '';

  if (filteredAchievements.length === 0) {
    achievementsList.innerHTML = '<div class="no-achievements">No achievements match current filters</div>';
    return;
  }

  filteredAchievements.forEach(achievement => {
    const achievementDiv = document.createElement('div');
    achievementDiv.className = `drawer-achievement-item ${achievement.category}`;

    const metricsHtml = Object.entries(achievement.metrics).map(([key, value]) =>
      `<span class="drawer-metric-item">${key}: ${value}</span>`
    ).join('');

    achievementDiv.innerHTML = `
      <div class="drawer-achievement-title">${achievement.title}</div>
      <div class="drawer-achievement-year">${achievement.year}</div>
      <div class="drawer-achievement-description">${achievement.description}</div>
      <div class="drawer-achievement-impact">${achievement.impact}</div>
      <div class="drawer-achievement-metrics">${metricsHtml}</div>
    `;

    achievementsList.appendChild(achievementDiv);
  });
}

/**
 * Initialize camera controls with proper zoom limits and damping
 */
function initCameraControls() {
  // Try to import MapControls for better map-like interaction
  import('https://cdn.skypack.dev/three@0.157.0/examples/jsm/controls/MapControls.js')
    .then(({ MapControls }) => {
      controls = new MapControls(camera, renderer.domElement);
      setupControls();
    })
    .catch(() => {
      // Fallback to OrbitControls
      import('https://cdn.skypack.dev/three@0.157.0/examples/jsm/controls/OrbitControls.js')
        .then(({ OrbitControls }) => {
          controls = new OrbitControls(camera, renderer.domElement);
          setupControls();
        })
        .catch(() => {
          console.warn('Could not load camera controls');
        });
    });
}

/**
 * Setup camera controls with Google Earth-style settings
 */
function setupControls() {
  if (!controls) return;

  // Enable smooth damping for fluid motion
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Set zoom limits to prevent clipping and allow close inspection
  controls.minDistance = MIN_ZOOM_DISTANCE;
  controls.maxDistance = MAX_ZOOM_DISTANCE;

  // Disable panning to keep focus on globe
  controls.enablePan = false;

  // Configure rotation and zoom speeds
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 1.0;

  // Allow full rotation
  controls.maxPolarAngle = Math.PI;

  // Auto-rotate when idle
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  // Event listeners for interaction feedback
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });

  controls.addEventListener('end', () => {
    // Resume auto-rotate after 3 seconds of inactivity
    setTimeout(() => {
      if (controls) controls.autoRotate = true;
    }, 3000);
  });

  controls.addEventListener('change', () => {
    updateLabelsVisibility();
    updateMarkersScale();
  });
}

/**
 * Create anchored label that stays fixed to lat/lng position
 */
function createAnchoredLabel(labelData) {
  const labelDiv = document.createElement('div');
  labelDiv.className = `globe-label globe-label-${labelData.type}`;
  labelDiv.textContent = labelData.name;
  labelDiv.style.position = 'absolute';
  labelDiv.style.pointerEvents = 'none';
  labelDiv.style.userSelect = 'none';
  labelDiv.style.opacity = '0';
  labelDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  labelDiv.style.zIndex = '1000';
  labelDiv.style.whiteSpace = 'nowrap';
  labelDiv.style.transform = 'translate(-50%, -50%)';

  // Style based on type
  switch (labelData.type) {
    case 'continent':
      labelDiv.style.fontSize = '18px';
      labelDiv.style.color = '#ffffff';
      labelDiv.style.fontWeight = '900';
      labelDiv.style.textShadow = '3px 3px 6px rgba(0,0,0,0.9)';
      break;
    case 'country':
      labelDiv.style.fontSize = '14px';
      labelDiv.style.color = '#ffdd44';
      labelDiv.style.fontWeight = 'bold';
      labelDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
      break;
    case 'city':
      labelDiv.style.fontSize = '12px';
      labelDiv.style.color = '#88ccff';
      labelDiv.style.fontWeight = '600';
      labelDiv.style.textShadow = '1px 1px 3px rgba(0,0,0,0.7)';
      break;
  }

  document.body.appendChild(labelDiv);

  return {
    element: labelDiv,
    data: labelData,
    visible: false,
    worldPosition: latLngToVector3(labelData.lat, labelData.lng, LABEL_HEIGHT)
  };
}

/**
 * Update label visibility and positioning with auto-occlusion
 */
function updateLabelsVisibility() {
  if (!camera) return;

  const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
  const visibleLabels = [];

  labels.forEach(label => {
    const shouldBeVisible = cameraDistance <= label.data.minZoom;

    if (shouldBeVisible) {
      // Project 3D position to screen coordinates
      const screenPosition = label.worldPosition.clone();
      screenPosition.project(camera);

      // Check if label is on visible side of globe
      const isVisible = screenPosition.z < 1;

      if (isVisible) {
        const screenX = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (screenPosition.y * -0.5 + 0.5) * window.innerHeight;

        // Check if within screen bounds
        if (screenX >= 0 && screenX <= window.innerWidth &&
            screenY >= 0 && screenY <= window.innerHeight) {

          label.screenX = screenX;
          label.screenY = screenY;
          label.distance = cameraDistance;
          visibleLabels.push(label);
        }
      }
    }

    // Hide labels that shouldn't be visible
    if (!shouldBeVisible || !isVisible) {
      label.element.style.opacity = '0';
      label.visible = false;
    }
  });

  // Auto-occlusion: hide overlapping labels
  applyAutoOcclusion(visibleLabels);
}

/**
 * Apply auto-occlusion to prevent overlapping labels
 */
function applyAutoOcclusion(visibleLabels) {
  const OVERLAP_THRESHOLD = 50; // Minimum distance between labels

  // Sort by priority (continent > country > city) and distance
  visibleLabels.sort((a, b) => {
    const priorityA = a.data.type === 'continent' ? 3 : a.data.type === 'country' ? 2 : 1;
    const priorityB = b.data.type === 'continent' ? 3 : b.data.type === 'country' ? 2 : 1;

    if (priorityA !== priorityB) return priorityB - priorityA;
    return a.distance - b.distance;
  });

  const displayedLabels = [];

  visibleLabels.forEach(label => {
    let canDisplay = true;

    // Check for overlaps with already displayed labels
    for (const displayed of displayedLabels) {
      const dx = label.screenX - displayed.screenX;
      const dy = label.screenY - displayed.screenY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < OVERLAP_THRESHOLD) {
        canDisplay = false;
        break;
      }
    }

    if (canDisplay) {
      // Position and show label
      label.element.style.left = label.screenX + 'px';
      label.element.style.top = label.screenY + 'px';
      label.element.style.opacity = '1';
      label.visible = true;
      displayedLabels.push(label);
    } else {
      // Hide overlapping label
      label.element.style.opacity = '0';
      label.visible = false;
    }
  });
}

/**
 * Create anchored marker that stays fixed to lat/lng position
 */
function createAnchoredMarker(locationData) {
  const markerGroup = new THREE.Group();

  // Main marker sphere
  const markerGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: locationData.color,
    emissive: locationData.color,
    emissiveIntensity: 0.6
  });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);

  // Achievement count indicator
  const countGeometry = new THREE.SphereGeometry(0.03, 8, 8);
  const countMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 0.8
  });
  const countIndicator = new THREE.Mesh(countGeometry, countMaterial);

  // Pulsing ring
  const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 16);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: locationData.color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);

  // Position all elements at the correct lat/lng
  const worldPosition = latLngToVector3(locationData.lat, locationData.lng, MARKER_HEIGHT);
  marker.position.copy(worldPosition);

  // Position count indicator slightly above marker
  const countPosition = latLngToVector3(locationData.lat, locationData.lng, MARKER_HEIGHT + 0.05);
  countIndicator.position.copy(countPosition);

  // Position ring at surface and orient toward center
  ring.position.copy(worldPosition);
  ring.lookAt(0, 0, 0);

  markerGroup.add(marker);
  markerGroup.add(countIndicator);
  markerGroup.add(ring);
  markerGroup.userData = locationData;

  return {
    group: markerGroup,
    marker: marker,
    countIndicator: countIndicator,
    ring: ring,
    worldPosition: worldPosition,
    data: locationData
  };
}

/**
 * Update marker scales based on camera distance for better visibility
 */
function updateMarkersScale() {
  if (!camera) return;

  const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
  const baseScale = Math.max(0.5, Math.min(2.0, cameraDistance / 15));

  markers.forEach(markerObj => {
    markerObj.group.scale.setScalar(baseScale);
  });
}

/**
 * Handle marker clicks with raycasting
 */
function handleMarkerClick(event) {
  event.preventDefault();

  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Get all marker meshes for intersection testing
  const markerMeshes = markers.map(m => m.marker);
  const intersects = raycaster.intersectObjects(markerMeshes);

  if (intersects.length > 0) {
    // Find the clicked marker
    const clickedMesh = intersects[0].object;
    const clickedMarker = markers.find(m => m.marker === clickedMesh);

    if (clickedMarker) {
      openAchievementsDrawer(clickedMarker.data);
    }
  } else {
    // Click on empty space - close drawer
    closeAchievementsDrawer();
  }
}

// Sample label data for progressive labeling
const labelData = [
  // Continents (visible at far zoom)
  { name: "North America", lat: 54.5260, lng: -105.2551, minZoom: 25, type: "continent" },
  { name: "South America", lat: -8.7832, lng: -55.4915, minZoom: 25, type: "continent" },
  { name: "Europe", lat: 54.5260, lng: 15.2551, minZoom: 25, type: "continent" },
  { name: "Asia", lat: 29.8405, lng: 89.2964, minZoom: 25, type: "continent" },
  { name: "Africa", lat: -8.7832, lng: 34.5085, minZoom: 25, type: "continent" },
  { name: "Australia", lat: -25.2744, lng: 133.7751, minZoom: 25, type: "continent" },

  // Major countries (visible at medium zoom)
  { name: "United States", lat: 39.8283, lng: -98.5795, minZoom: 15, type: "country" },
  { name: "China", lat: 35.8617, lng: 104.1954, minZoom: 15, type: "country" },
  { name: "Russia", lat: 61.5240, lng: 105.3188, minZoom: 15, type: "country" },
  { name: "Brazil", lat: -14.2350, lng: -51.9253, minZoom: 15, type: "country" },
  { name: "India", lat: 20.5937, lng: 78.9629, minZoom: 15, type: "country" },
  { name: "Australia", lat: -25.2744, lng: 133.7751, minZoom: 15, type: "country" },

  // Major cities (visible at close zoom)
  { name: "New York", lat: 40.7128, lng: -74.0060, minZoom: 10, type: "city" },
  { name: "London", lat: 51.5074, lng: -0.1278, minZoom: 10, type: "city" },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, minZoom: 10, type: "city" },
  { name: "Paris", lat: 48.8566, lng: 2.3522, minZoom: 10, type: "city" },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, minZoom: 10, type: "city" },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, minZoom: 10, type: "city" },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, minZoom: 10, type: "city" },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, minZoom: 8, type: "city" },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, minZoom: 8, type: "city" },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, minZoom: 8, type: "city" }
];

// Sample location data (will be populated from achievements data)
const locationData = [
  {
    id: 1,
    name: "New York HQ",
    lat: 40.7128,
    lng: -74.0060,
    description: "Global Headquarters - Manhattan",
    established: 1995,
    employees: 2500,
    totalRevenue: "2.8B",
    marketShare: "23%",
    color: "#ff4444",
    achievements: []
  },
  {
    id: 2,
    name: "London Office",
    lat: 51.5074,
    lng: -0.1278,
    description: "European Operations - City of London",
    established: 1998,
    employees: 1800,
    totalRevenue: "1.9B",
    marketShare: "31%",
    color: "#4488ff",
    achievements: []
  },
  {
    id: 3,
    name: "Tokyo Branch",
    lat: 35.6762,
    lng: 139.6503,
    description: "Asia Pacific Hub - Shibuya",
    established: 2001,
    employees: 1200,
    totalRevenue: "1.4B",
    marketShare: "18%",
    color: "#ff8844",
    achievements: []
  },
  {
    id: 4,
    name: "Singapore Office",
    lat: 1.3521,
    lng: 103.8198,
    description: "Southeast Asia Center - Marina Bay",
    established: 2005,
    employees: 950,
    totalRevenue: "1.1B",
    marketShare: "28%",
    color: "#44ff88",
    achievements: []
  },
  {
    id: 5,
    name: "Dubai Office",
    lat: 25.2048,
    lng: 55.2708,
    description: "Middle East Operations - DIFC",
    established: 2008,
    employees: 750,
    totalRevenue: "0.8B",
    marketShare: "35%",
    color: "#ff44aa",
    achievements: []
  },
  {
    id: 6,
    name: "Sydney Branch",
    lat: -33.8688,
    lng: 151.2093,
    description: "Australia & NZ Hub - CBD",
    established: 2010,
    employees: 650,
    totalRevenue: "0.9B",
    marketShare: "22%",
    color: "#8844ff",
    achievements: []
  }
];

/**
 * Load achievements data and populate locations
 */
async function loadAchievementsData() {
  try {
    const response = await fetch('./achievements-data.json');
    const achievements = await response.json();

    // Group achievements by location
    const achievementsByLocation = {};
    achievements.forEach(achievement => {
      const locationName = achievement.location;
      if (!achievementsByLocation[locationName]) {
        achievementsByLocation[locationName] = [];
      }
      achievementsByLocation[locationName].push(achievement);
    });

    // Populate location data with achievements
    locationData.forEach(location => {
      location.achievements = achievementsByLocation[location.name] || [];
    });

    return locationData;
  } catch (error) {
    console.warn('Could not load achievements data, using sample data:', error);
    return locationData;
  }
}

/**
 * Initialize the enhanced globe
 */
async function initEnhancedGlobe(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Globe container not found:', containerId);
    return;
  }

  // Create scene
  scene = new THREE.Scene();

  // Create camera with proper settings
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(12, 3, 12);
  camera.lookAt(0, 0, 0);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000011);
  container.appendChild(renderer.domElement);

  // Add starfield background
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 2000;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Create Earth
  const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 256, 256);
  const textureLoader = new THREE.TextureLoader();

  const earthTexture = textureLoader.load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg');
  const bumpTexture = textureLoader.load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png');

  const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.02,
    shininess: 200
  });

  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Add clouds
  const cloudGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 0.05, 64, 64);
  const cloudTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png');
  const cloudMaterial = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.4
  });
  clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  scene.add(clouds);

  // Add atmosphere
  const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 0.1, 64, 64);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform float time;
      void main() {
        float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        vec3 atmosColor = vec3(0.3, 0.6, 1.0);
        gl_FragColor = vec4(atmosColor, intensity * 0.6);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  });
  atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
  sunLight.position.set(20, 10, 15);
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x6699ff, 0.6);
  fillLight.position.set(-15, 5, -10);
  scene.add(fillLight);

  // Load achievements data and create markers
  const locations = await loadAchievementsData();

  // Create markers for each location
  locations.forEach(location => {
    const markerObj = createAnchoredMarker(location);
    markers.push(markerObj);
    scene.add(markerObj.group);
  });

  // Create labels
  labelData.forEach(labelInfo => {
    const label = createAnchoredLabel(labelInfo);
    labels.push(label);
  });

  // Initialize camera controls
  initCameraControls();

  // Add event listeners
  renderer.domElement.addEventListener('click', handleMarkerClick);
  window.addEventListener('resize', handleResize);

  // Start animation loop
  animate();

  console.log('Enhanced globe initialized successfully');
}

/**
 * Animation loop with smooth updates
 */
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Update controls
  if (controls && controls.update) {
    controls.update();
  }

  // Rotate clouds slowly
  if (clouds) {
    clouds.rotation.y += 0.0005;
  }

  // Update atmosphere shader
  if (atmosphere && atmosphere.material.uniforms) {
    atmosphere.material.uniforms.time.value = time;
  }

  // Animate markers
  markers.forEach(markerObj => {
    // Pulsing ring animation
    if (markerObj.ring) {
      markerObj.ring.scale.setScalar(1 + 0.2 * Math.sin(time * 3));
      markerObj.ring.material.opacity = 0.3 + 0.3 * Math.sin(time * 2);
    }

    // Count indicator gentle pulsing
    if (markerObj.countIndicator) {
      markerObj.countIndicator.scale.setScalar(1 + 0.1 * Math.sin(time * 4));
    }
  });

  renderer.render(scene, camera);
}

/**
 * Handle window resize
 */
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateLabelsVisibility();
}

// Export for global access
window.initEnhancedGlobe = initEnhancedGlobe;
