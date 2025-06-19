/**
 * Enhanced Globe Implementation with Google Earth-style features
 * Features:
 * - Accurate anchored labels and markers that stay fixed to lat/lng
 * - Smooth deep zoom with proper camera controls and momentum
 * - Click-to-show achievements drawer with filtering
 * - Auto-occlusion for overlapping labels
 * - Performance optimizations for hundreds of markers
 */

// Globe constants for accurate positioning
const EARTH_RADIUS = 5;
const MARKER_HEIGHT = 0.05;
const LABEL_HEIGHT = 0.1;
const MIN_ZOOM_DISTANCE = EARTH_RADIUS * 1.1; // ~5.5 units (close zoom ~5km altitude equivalent)
const MAX_ZOOM_DISTANCE = EARTH_RADIUS * 10;   // ~50 units (far zoom)

// Global variables
let scene, camera, renderer, controls;
let earth, clouds, atmosphere;
let markers = [];
let labels = [];
let selectedLocation = null;
let achievementsDrawer = null;
let currentFilters = { category: 'all', year: 'all' };
let labelRenderer; // For CSS2DRenderer

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking Three.js...');

  // Check if Three.js is available
  if (typeof THREE === 'undefined') {
    console.error('Three.js is not loaded! Please check the CDN link.');
    return;
  }
  console.log('Three.js version:', THREE.REVISION);

  const globeContainer = document.getElementById('globe-container');
  const categoryFilter = document.getElementById('category-filter');
  const yearFilter = document.getElementById('year-filter');
  const totalAchievements = document.getElementById('total-achievements');
  const totalLocations = document.getElementById('total-locations');

  console.log('Globe container:', globeContainer);
  console.log('Category filter:', categoryFilter);
  console.log('Year filter:', yearFilter);

  /**
   * Utility function to convert lat/lng to 3D coordinates on sphere surface
   * This ensures labels and markers stay anchored to exact positions
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
        <button id="drawer-close" class="drawer-close-btn" aria-label="Close achievements drawer">×</button>
      </div>
      <div class="drawer-filters">
        <select id="drawer-category-filter" aria-label="Filter by category">
          <option value="all">All Categories</option>
          <option value="award">Awards</option>
          <option value="innovation">Innovation</option>
          <option value="sustainability">Sustainability</option>
          <option value="operational">Operational</option>
          <option value="partnership">Partnership</option>
          <option value="social">Social Impact</option>
        </select>
        <select id="drawer-year-filter" aria-label="Filter by year">
          <option value="all">All Years</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>
      <div class="drawer-content">
        <div id="drawer-achievements-list" role="list"></div>
      </div>
    `;

    document.body.appendChild(drawer);

    // Event listeners
    document.getElementById('drawer-close').addEventListener('click', closeAchievementsDrawer);
    document.getElementById('drawer-category-filter').addEventListener('change', updateDrawerContent);
    document.getElementById('drawer-year-filter').addEventListener('change', updateDrawerContent);

    // Keyboard accessibility
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAchievementsDrawer();
      }
    });

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
    const drawerCategoryFilter = document.getElementById('drawer-category-filter');
    const drawerYearFilter = document.getElementById('drawer-year-filter');

    if (categoryFilter && drawerCategoryFilter) {
      drawerCategoryFilter.value = categoryFilter.value;
    }
    if (yearFilter && drawerYearFilter) {
      drawerYearFilter.value = yearFilter.value;
    }

    updateDrawerContent();
    achievementsDrawer.classList.remove('hidden');

    // Focus management for accessibility
    achievementsDrawer.focus();
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

    filteredAchievements.forEach((achievement, index) => {
      const achievementDiv = document.createElement('div');
      achievementDiv.className = `drawer-achievement-item ${achievement.category}`;
      achievementDiv.setAttribute('role', 'listitem');
      achievementDiv.setAttribute('tabindex', '0');

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

      // Keyboard accessibility
      achievementDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Could expand achievement details here
        }
      });

      achievementsList.appendChild(achievementDiv);
    });
  }

  // Helper function to populate tooltip with location data (legacy support)
  function populateTooltip(location) {
    // Get legacy tooltip elements (may not exist)
    const locationName = document.getElementById('location-name');
    const locationDescription = document.getElementById('location-description');
    const locationEstablished = document.getElementById('location-established');
    const locationEmployees = document.getElementById('location-employees');
    const locationRevenue = document.getElementById('location-revenue');
    const locationMarketShare = document.getElementById('location-market-share');
    const achievementsList = document.getElementById('achievements-list');

    // Only populate if elements exist
    if (locationName) locationName.textContent = location.name;
    if (locationDescription) locationDescription.textContent = location.description;
    if (locationEstablished) locationEstablished.textContent = `Est. ${location.established}`;
    if (locationEmployees) locationEmployees.textContent = `${location.employees} employees`;
    if (locationRevenue) locationRevenue.textContent = `$${location.totalRevenue}`;
    if (locationMarketShare) locationMarketShare.textContent = location.marketShare;

    // Clear and populate achievements if element exists
    if (achievementsList) {
      achievementsList.innerHTML = '';

      // Filter achievements based on current filters
      let filteredAchievements = location.achievements;
      if (currentFilters.category !== 'all') {
        filteredAchievements = filteredAchievements.filter(a => a.category === currentFilters.category);
      }
      if (currentFilters.year !== 'all') {
        filteredAchievements = filteredAchievements.filter(a => a.year.toString() === currentFilters.year);
      }

      filteredAchievements.forEach(achievement => {
        const achievementDiv = document.createElement('div');
        achievementDiv.className = `achievement-item ${achievement.category}`;

        const metricsHtml = Object.entries(achievement.metrics).map(([key, value]) =>
          `<span class="metric-item">${key}: ${value}</span>`
        ).join('');

        achievementDiv.innerHTML = `
          <div class="achievement-title">${achievement.title}</div>
          <div class="achievement-year">${achievement.year}</div>
          <div class="achievement-description">${achievement.description}</div>
          <div class="achievement-metrics">${metricsHtml}</div>
        `;

        achievementsList.appendChild(achievementDiv);
      });

      if (filteredAchievements.length === 0) {
        achievementsList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No achievements match current filters</div>';
      }
    }
  }

  // Function to update statistics
  function updateStats() {
    let totalAchievementCount = 0;
    let filteredCount = 0;

    locations.forEach(location => {
      totalAchievementCount += location.achievements.length;

      let locationFiltered = location.achievements;
      if (currentFilters.category !== 'all') {
        locationFiltered = locationFiltered.filter(a => a.category === currentFilters.category);
      }
      if (currentFilters.year !== 'all') {
        locationFiltered = locationFiltered.filter(a => a.year.toString() === currentFilters.year);
      }
      filteredCount += locationFiltered.length;
    });

    totalAchievements.textContent = `Total Achievements: ${filteredCount}${currentFilters.category !== 'all' || currentFilters.year !== 'all' ? ` (of ${totalAchievementCount})` : ''}`;
    totalLocations.textContent = `Locations: ${locations.length}`;
  }

  // Initialize the globe
  if (!globeContainer) {
    console.error('Globe container not found! Make sure element with id="globe-container" exists.');
    return;
  }

  console.log('Globe container found, initializing globe...');

  // Create scene
  const scene = new THREE.Scene();

  // Add error handling for WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    console.log('WebGL support confirmed');
  } catch (error) {
    console.error('WebGL Error:', error);
    globeContainer.innerHTML = '<div style="color: white; text-align: center; padding: 50px;">WebGL is not supported in your browser. Please use a modern browser to view the 3D globe.</div>';
    return;
  }

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

  // Create camera and renderer
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000011);
  globeContainer.appendChild(renderer.domElement);

  // Create realistic Earth with high-quality textures
  const earthGeometry = new THREE.SphereGeometry(5, 256, 256);

  // Load high-quality Earth textures
  const textureLoader = new THREE.TextureLoader();

  // Use high-quality Blue Marble texture for vibrant Earth appearance
  const earthTexture = textureLoader.load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg');

  // Load additional texture maps for realism
  const bumpTexture = textureLoader.load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png');
  const specularTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg');

  // Fallback handling
  earthTexture.onError = () => {
    console.log('Loading fallback Earth texture...');
    earthTexture.image = new Image();
    earthTexture.image.crossOrigin = 'anonymous';
    earthTexture.image.src = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg';
    earthTexture.needsUpdate = true;
  };

  // Create realistic Earth material with enhanced properties
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.02,
    specularMap: specularTexture,
    specular: new THREE.Color(0x333333),
    shininess: 200,
    transparent: false
  });

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Add cloud layer for realism
  const cloudGeometry = new THREE.SphereGeometry(5.05, 64, 64);
  const cloudTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png');

  // Fallback cloud texture
  cloudTexture.onError = () => {
    console.log('Creating procedural clouds...');
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cloudContext = cloudCanvas.getContext('2d');

    // Create procedural cloud pattern
    cloudContext.fillStyle = 'rgba(0, 0, 0, 0)';
    cloudContext.fillRect(0, 0, 1024, 512);

    cloudContext.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const size = Math.random() * 100 + 20;
      cloudContext.beginPath();
      cloudContext.arc(x, y, size, 0, Math.PI * 2);
      cloudContext.fill();
    }

    cloudTexture.image = cloudCanvas;
    cloudTexture.needsUpdate = true;
  };

  const cloudMaterial = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.4
  });

  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  scene.add(clouds);

  // Add country borders for Google Earth-style appearance
  function createCountryBorders() {
    const borderGeometry = new THREE.BufferGeometry();
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });

    // Simplified country border coordinates (major countries)
    const borderLines = [
      // USA-Canada border (simplified)
      { start: { lat: 49, lng: -125 }, end: { lat: 49, lng: -95 } },
      { start: { lat: 49, lng: -95 }, end: { lat: 49, lng: -67 } },

      // USA-Mexico border (simplified)
      { start: { lat: 32.5, lng: -117 }, end: { lat: 32.5, lng: -106 } },
      { start: { lat: 32.5, lng: -106 }, end: { lat: 25.8, lng: -97 } },

      // Europe borders (simplified)
      { start: { lat: 50.5, lng: -4 }, end: { lat: 51.5, lng: 2 } }, // UK-France
      { start: { lat: 47.5, lng: 7.5 }, end: { lat: 47.5, lng: 13 } }, // Switzerland-Austria

      // Asia borders (simplified)
      { start: { lat: 45, lng: 80 }, end: { lat: 45, lng: 135 } }, // Russia-China
      { start: { lat: 28, lng: 77 }, end: { lat: 28, lng: 88 } }, // India-China
    ];

    const positions = [];
    borderLines.forEach(line => {
      // Convert lat/lng to 3D coordinates for start point
      const startPhi = (90 - line.start.lat) * (Math.PI / 180);
      const startTheta = (line.start.lng + 180) * (Math.PI / 180);
      const startX = -(5.01 * Math.sin(startPhi) * Math.cos(startTheta));
      const startY = 5.01 * Math.cos(startPhi);
      const startZ = 5.01 * Math.sin(startPhi) * Math.sin(startTheta);

      // Convert lat/lng to 3D coordinates for end point
      const endPhi = (90 - line.end.lat) * (Math.PI / 180);
      const endTheta = (line.end.lng + 180) * (Math.PI / 180);
      const endX = -(5.01 * Math.sin(endPhi) * Math.cos(endTheta));
      const endY = 5.01 * Math.cos(endPhi);
      const endZ = 5.01 * Math.sin(endPhi) * Math.sin(endTheta);

      positions.push(startX, startY, startZ);
      positions.push(endX, endY, endZ);
    });

    borderGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const borders = new THREE.LineSegments(borderGeometry, borderMaterial);
    scene.add(borders);

    return borders;
  }

  const countryBorders = createCountryBorders();

  // Add atmosphere
  const atmosphereGeometry = new THREE.SphereGeometry(5.1, 64, 64);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      lightDirection: { value: new THREE.Vector3(1, 0, 0) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      uniform float time;
      uniform vec3 lightDirection;
      void main() {
        float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        float lightIntensity = dot(normalize(vNormal), normalize(lightDirection));
        lightIntensity = max(0.0, lightIntensity);
        vec3 atmosColor = mix(vec3(0.2, 0.5, 1.0), vec3(0.8, 0.9, 1.0), lightIntensity);
        gl_FragColor = vec4(atmosColor, intensity * 0.6);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // Enhanced company locations with achievements data
  const locations = [
    {
      id: 1,
      name: "New York HQ",
      lat: 40.7128,
      lng: -74.0060,
      description: "Global Headquarters - Manhattan",
      established: 1995,
      employees: 2500,
      achievements: [
        {
          id: 1,
          title: "Fortune 500 Recognition",
          category: "award",
          year: 2023,
          description: "Ranked #127 in Fortune 500 companies",
          impact: "Global recognition for excellence",
          metrics: { revenue: "$2.8B", growth: "15%" }
        },
        {
          id: 2,
          title: "Green Building Certification",
          category: "sustainability",
          year: 2022,
          description: "LEED Platinum certification for headquarters",
          impact: "40% reduction in energy consumption",
          metrics: { savings: "$1.2M", co2Reduction: "500 tons" }
        },
        {
          id: 3,
          title: "AI Innovation Center Launch",
          category: "innovation",
          year: 2024,
          description: "Opened state-of-the-art AI research facility",
          impact: "Leading breakthrough in machine learning",
          metrics: { patents: "25", researchers: "150" }
        }
      ],
      totalRevenue: "2.8B",
      marketShare: "23%",
      color: "#ff4444"
    },
    {
      id: 2,
      name: "London Office",
      lat: 51.5074,
      lng: -0.1278,
      description: "European Operations - City of London",
      established: 1998,
      employees: 1800,
      achievements: [
        {
          id: 4,
          title: "Brexit Resilience Award",
          category: "award",
          year: 2023,
          description: "Recognized for maintaining growth post-Brexit",
          impact: "Sustained European market leadership",
          metrics: { growth: "12%", retention: "98%" }
        },
        {
          id: 5,
          title: "Digital Transformation Initiative",
          category: "innovation",
          year: 2022,
          description: "Complete digitization of European operations",
          impact: "30% efficiency improvement across EU",
          metrics: { efficiency: "30%", cost_savings: "€15M" }
        },
        {
          id: 6,
          title: "Carbon Neutral Operations",
          category: "sustainability",
          year: 2024,
          description: "Achieved carbon neutrality across all EU offices",
          impact: "Zero net carbon emissions",
          metrics: { co2Reduction: "100%", renewable: "85%" }
        }
      ],
      totalRevenue: "1.9B",
      marketShare: "31%",
      color: "#4488ff"
    },
    {
      id: 3,
      name: "Tokyo Branch",
      lat: 35.6762,
      lng: 139.6503,
      description: "Asia Pacific Hub - Shibuya",
      established: 2001,
      employees: 1200,
      achievements: [
        {
          id: 7,
          title: "Robotics Partnership",
          category: "innovation",
          year: 2023,
          description: "Strategic alliance with leading robotics companies",
          impact: "Revolutionary automation solutions",
          metrics: { partnerships: "8", automation: "60%" }
        },
        {
          id: 8,
          title: "Disaster Recovery Excellence",
          category: "operational",
          year: 2022,
          description: "Best-in-class disaster recovery systems",
          impact: "99.99% uptime during natural disasters",
          metrics: { uptime: "99.99%", recovery_time: "< 1min" }
        },
        {
          id: 9,
          title: "Cultural Integration Award",
          category: "award",
          year: 2024,
          description: "Excellence in cross-cultural business practices",
          impact: "Model for global cultural integration",
          metrics: { satisfaction: "96%", diversity: "45%" }
        }
      ],
      totalRevenue: "1.4B",
      marketShare: "18%",
      color: "#ff8844"
    },
    {
      id: 4,
      name: "Singapore Office",
      lat: 1.3521,
      lng: 103.8198,
      description: "Southeast Asia Center - Marina Bay",
      established: 2005,
      employees: 950,
      achievements: [
        {
          id: 10,
          title: "Smart City Initiative",
          category: "innovation",
          year: 2023,
          description: "Leading smart city technology implementation",
          impact: "Transformed urban infrastructure",
          metrics: { cities: "12", population: "5M" }
        },
        {
          id: 11,
          title: "Fintech Innovation Hub",
          category: "innovation",
          year: 2022,
          description: "Established Southeast Asia's largest fintech hub",
          impact: "Revolutionizing financial services",
          metrics: { startups: "150", funding: "$500M" }
        },
        {
          id: 12,
          title: "Sustainability Leadership",
          category: "sustainability",
          year: 2024,
          description: "Zero waste to landfill achievement",
          impact: "100% waste recycling and reuse",
          metrics: { waste_reduction: "100%", recycling: "95%" }
        }
      ],
      totalRevenue: "1.1B",
      marketShare: "28%",
      color: "#44ff88"
    },
    {
      id: 5,
      name: "Dubai Office",
      lat: 25.2048,
      lng: 55.2708,
      description: "Middle East Operations - DIFC",
      established: 2008,
      employees: 750,
      achievements: [
        {
          id: 13,
          title: "Expo 2020 Technology Partner",
          category: "partnership",
          year: 2022,
          description: "Official technology partner for Expo 2020",
          impact: "Showcased innovation to 25M visitors",
          metrics: { visitors: "25M", demos: "500" }
        },
        {
          id: 14,
          title: "Renewable Energy Transition",
          category: "sustainability",
          year: 2023,
          description: "100% renewable energy for all operations",
          impact: "Leading clean energy adoption in MENA",
          metrics: { renewable: "100%", savings: "$2.5M" }
        },
        {
          id: 15,
          title: "Cross-Border Innovation",
          category: "innovation",
          year: 2024,
          description: "Breakthrough in cross-border payment systems",
          impact: "Reduced transaction costs by 70%",
          metrics: { cost_reduction: "70%", speed: "10x faster" }
        }
      ],
      totalRevenue: "0.8B",
      marketShare: "35%",
      color: "#ff44aa"
    },
    {
      id: 6,
      name: "Sydney Branch",
      lat: -33.8688,
      lng: 151.2093,
      description: "Australia & NZ Hub - CBD",
      established: 2010,
      employees: 650,
      achievements: [
        {
          id: 16,
          title: "Great Barrier Reef Conservation",
          category: "sustainability",
          year: 2023,
          description: "Major coral reef restoration project",
          impact: "Restored 500 hectares of coral reef",
          metrics: { area_restored: "500 hectares", species: "200+" }
        },
        {
          id: 17,
          title: "Indigenous Partnership Program",
          category: "social",
          year: 2022,
          description: "Comprehensive indigenous business partnership",
          impact: "Supporting indigenous communities",
          metrics: { partnerships: "25", jobs_created: "300" }
        },
        {
          id: 18,
          title: "Mining Technology Innovation",
          category: "innovation",
          year: 2024,
          description: "Revolutionary sustainable mining solutions",
          impact: "50% reduction in environmental impact",
          metrics: { efficiency: "50%", water_savings: "40%" }
        }
      ],
      totalRevenue: "0.9B",
      marketShare: "22%",
      color: "#8844ff"
    }
  ];

  // Achievement categories and their colors
  const categoryColors = {
    award: '#FFD700',
    innovation: '#00BFFF',
    sustainability: '#32CD32',
    operational: '#FF6347',
    partnership: '#9370DB',
    social: '#FF69B4'
  };

  // Create enhanced markers with achievement indicators
  const markers = [];
  locations.forEach((location) => {
    const markerGroup = new THREE.Group();

    // Main marker with location-specific color
    const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: location.color,
      emissive: location.color,
      emissiveIntensity: 0.6
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    // Achievement count indicator (elevated smaller sphere)
    const achievementCount = location.achievements.length;
    const countGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const countMaterial = new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: 0.8
    });
    const countIndicator = new THREE.Mesh(countGeometry, countMaterial);

    // Pulsing ring with dynamic size based on revenue
    const revenueValue = parseFloat(location.totalRevenue.replace('B', ''));
    const ringSize = 0.1 + (revenueValue * 0.02); // Scale ring based on revenue
    const ringGeometry = new THREE.RingGeometry(ringSize, ringSize + 0.05, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: location.color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    // Achievement category rings (multiple rings for different categories)
    const categoryRings = [];
    const uniqueCategories = [...new Set(location.achievements.map(a => a.category))];
    uniqueCategories.forEach((category, index) => {
      const catRingGeometry = new THREE.RingGeometry(
        ringSize + 0.08 + (index * 0.03),
        ringSize + 0.1 + (index * 0.03),
        16
      );
      const catRingMaterial = new THREE.MeshBasicMaterial({
        color: categoryColors[category] || '#FFFFFF',
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const catRing = new THREE.Mesh(catRingGeometry, catRingMaterial);
      categoryRings.push(catRing);
    });

    // Use accurate lat/lng to 3D coordinates conversion
    const worldPosition = latLngToVector3(location.lat, location.lng, MARKER_HEIGHT);
    marker.position.copy(worldPosition);
    ring.position.copy(worldPosition);
    ring.lookAt(0, 0, 0);

    // Position achievement count indicator slightly above main marker
    const countPosition = latLngToVector3(location.lat, location.lng, MARKER_HEIGHT + 0.05);
    countIndicator.position.copy(countPosition);

    // Position category rings
    categoryRings.forEach(catRing => {
      catRing.position.copy(worldPosition);
      catRing.lookAt(0, 0, 0);
    });

    markerGroup.add(marker);
    markerGroup.add(ring);
    markerGroup.add(countIndicator);
    categoryRings.forEach(catRing => markerGroup.add(catRing));

    markerGroup.userData = location;
    markers.push({
      group: markerGroup,
      marker,
      ring,
      countIndicator,
      categoryRings,
      worldPosition: worldPosition,
      data: location,
      originalPos: worldPosition.clone() // For legacy compatibility
    });
    scene.add(markerGroup);
  });

  // Enhanced lighting setup for vibrant, Google Earth-style appearance
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  // Main sun light (simulating the sun) - brighter and warmer
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
  sunLight.position.set(20, 10, 15);
  sunLight.castShadow = false;
  scene.add(sunLight);

  // Secondary fill light for better illumination
  const fillLight = new THREE.DirectionalLight(0x6699ff, 0.6);
  fillLight.position.set(-15, 5, -10);
  scene.add(fillLight);

  // Rim light for atmospheric glow
  const rimLight = new THREE.DirectionalLight(0x88ccff, 0.4);
  rimLight.position.set(0, 15, -20);
  scene.add(rimLight);

  // Additional hemisphere light for natural lighting
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1d, 0.3);
  scene.add(hemisphereLight);

  // Camera positioning
  camera.position.set(12, 3, 12);
  camera.lookAt(0, 0, 0);

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
   * Initialize enhanced camera controls with MapControls for Google Earth-style interaction
   */
  function initCameraControls() {
    // Try MapControls first for better map-like interaction
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
            initFallbackControls();
          });
      });
  }

  /**
   * Setup camera controls with Google Earth-style settings
   */
  function setupControls() {
    if (!controls) return;

    // Enable smooth damping for fluid motion like Google Earth
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Set zoom limits to prevent clipping and allow close inspection (~5km altitude equivalent)
    controls.minDistance = MIN_ZOOM_DISTANCE;
    controls.maxDistance = MAX_ZOOM_DISTANCE;

    // Disable panning to keep focus on globe
    controls.enablePan = false;
    controls.screenSpacePanning = false;

    // Configure rotation and zoom speeds for smooth interaction
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

  // Fallback mouse controls
  let mouseX = 0;
  let mouseY = 0;
  let isMouseDown = false;
  let rotationX = 0;
  let rotationY = 0;

  function initFallbackControls() {
    isControlsEnabled = false;
  }

  /**
   * Progressive labeling system with accurate anchoring and auto-occlusion
   */
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

  /**
   * Create anchored label that stays fixed to lat/lng position
   */
  function createAnchoredLabel(labelInfo) {
    const labelDiv = document.createElement('div');
    labelDiv.className = `globe-label globe-label-${labelInfo.type}`;
    labelDiv.textContent = labelInfo.name;
    labelDiv.style.position = 'absolute';
    labelDiv.style.pointerEvents = 'none';
    labelDiv.style.userSelect = 'none';
    labelDiv.style.opacity = '0';
    labelDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    labelDiv.style.zIndex = '1000';
    labelDiv.style.whiteSpace = 'nowrap';
    labelDiv.style.transform = 'translate(-50%, -50%)';
    labelDiv.setAttribute('tabindex', '0');
    labelDiv.setAttribute('role', 'button');
    labelDiv.setAttribute('aria-label', `${labelInfo.type}: ${labelInfo.name}`);

    // Style based on type
    switch (labelInfo.type) {
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

    // Keyboard accessibility
    labelDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Could trigger location focus or info display
      }
    });

    document.body.appendChild(labelDiv);

    return {
      element: labelDiv,
      data: labelInfo,
      visible: false,
      worldPosition: latLngToVector3(labelInfo.lat, labelInfo.lng, LABEL_HEIGHT)
    };
  }

  // Create all labels
  labelData.forEach(labelInfo => {
    labels.push(createAnchoredLabel(labelInfo));
  });

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
        // Project 3D world position to screen coordinates
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
      if (!shouldBeVisible) {
        label.element.style.opacity = '0';
        label.visible = false;
      }
    });

    // Apply auto-occlusion to prevent overlapping labels
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
        // Position and show label with gentle scaling based on zoom
        const scale = Math.max(0.8, Math.min(1.2, (30 - label.distance) / 20));
        label.element.style.left = label.screenX + 'px';
        label.element.style.top = label.screenY + 'px';
        label.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
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

  function handleMouseMove(event) {
    if (isMouseDown) {
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      rotationY += deltaX * 0.005;
      rotationX += deltaY * 0.005;
      rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationX));

      earth.rotation.y = rotationY;
      earth.rotation.x = rotationX;
      atmosphere.rotation.copy(earth.rotation);
      clouds.rotation.copy(earth.rotation);

      // Update marker positions
      markers.forEach(({ marker, ring, countIndicator, categoryRings, originalPos }) => {
        const newPos = originalPos.clone();
        newPos.applyEuler(new THREE.Euler(rotationX, rotationY, 0));
        marker.position.copy(newPos);
        ring.position.copy(newPos);
        ring.lookAt(0, 0, 0);

        // Update count indicator position
        countIndicator.position.set(newPos.x * 1.02, newPos.y * 1.02, newPos.z * 1.02);

        // Update category rings
        categoryRings.forEach(catRing => {
          catRing.position.copy(newPos);
          catRing.lookAt(0, 0, 0);
        });
      });
    }
    mouseX = event.clientX;
    mouseY = event.clientY;
  }

  function handleMouseDown() {
    isMouseDown = true;
  }

  function handleMouseUp() {
    isMouseDown = false;
  }

  /**
   * Handle marker clicks with raycasting for precise selection
   */
  function handleClick(event) {
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
        // Open achievements drawer with the location data
        const locationData = clickedMarker.data || clickedMarker.group.userData;
        openAchievementsDrawer(locationData);

        // Legacy tooltip support (can be removed)
        selectedLocation = locationData;
        if (typeof populateTooltip === 'function') {
          populateTooltip(selectedLocation);
        }
        const locationTooltip = document.getElementById('location-tooltip');
        if (locationTooltip) {
          locationTooltip.style.display = 'block';
        }
      }
    } else {
      // Click on empty space - close drawer and tooltip
      closeAchievementsDrawer();
      selectedLocation = null;
      const locationTooltip = document.getElementById('location-tooltip');
      if (locationTooltip) {
        locationTooltip.style.display = 'none';
      }
    }
  }

  // Close tooltip on button click (if element exists)
  if (closeTooltip) {
    closeTooltip.addEventListener('click', function() {
      selectedLocation = null;
      const locationTooltip = document.getElementById('location-tooltip');
      if (locationTooltip) {
        locationTooltip.style.display = 'none';
      }
    });
  }

  renderer.domElement.addEventListener('mousemove', handleMouseMove);
  renderer.domElement.addEventListener('mousedown', handleMouseDown);
  renderer.domElement.addEventListener('mouseup', handleMouseUp);
  renderer.domElement.addEventListener('click', handleClick);

  /**
   * Animation loop with smooth updates and enhanced marker animations
   */
  function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Update controls for smooth damping
    if (controls && controls.update) {
      controls.update();
    }

    // Auto-rotation only when controls are not being used
    if ((!controls || controls.autoRotate) && !isMouseDown) {
      earth.rotation.y += 0.001;
      atmosphere.rotation.y += 0.001;
      clouds.rotation.y += 0.0008; // Clouds rotate slightly slower for realism
    }

    // Animate markers with pulsing effects
    markers.forEach((markerObj) => {
      // Pulsing ring animation
      if (markerObj.ring) {
        markerObj.ring.scale.setScalar(1 + 0.2 * Math.sin(time * 3));
        markerObj.ring.material.opacity = 0.3 + 0.3 * Math.sin(time * 2);
      }

      // Count indicator gentle pulsing
      if (markerObj.countIndicator) {
        markerObj.countIndicator.scale.setScalar(1 + 0.1 * Math.sin(time * 4));
      }

      // Update positions if auto-rotating (legacy support)
      if (markerObj.originalPos && (!controls || controls.autoRotate) && !isMouseDown) {
        const newPos = markerObj.originalPos.clone();
        newPos.applyEuler(new THREE.Euler(0, earth.rotation.y, 0));

        if (markerObj.marker) {
          markerObj.marker.position.copy(newPos);
        }
        if (markerObj.ring) {
          markerObj.ring.position.copy(newPos);
          markerObj.ring.lookAt(0, 0, 0);
        }
        if (markerObj.countIndicator) {
          markerObj.countIndicator.position.set(newPos.x * 1.02, newPos.y * 1.02, newPos.z * 1.02);
        }
      }
    });

    // Update labels visibility and positioning
    updateLabelsVisibility();

    // Additional category ring animations (if they exist)
    markers.forEach((markerObj) => {
      if (markerObj.categoryRings) {
        markerObj.categoryRings.forEach((catRing, index) => {
          catRing.rotation.z += 0.01 * (index + 1);
          catRing.scale.setScalar(1 + 0.15 * Math.sin(time * 2 + index));
          catRing.material.opacity = 0.2 + 0.2 * Math.sin(time * 1.5 + index);
        });
      }
    });

    // Rotate stars slowly
    stars.rotation.y += 0.0002;

    // Update atmosphere shader
    atmosphereMaterial.uniforms.time.value = time;

    renderer.render(scene, camera);
  }

  // Handle window resize
  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', handleResize);

  // Filter event listeners
  categoryFilter.addEventListener('change', function() {
    currentFilters.category = this.value;
    updateStats();
    if (selectedLocation) {
      populateTooltip(selectedLocation);
    }
  });

  yearFilter.addEventListener('change', function() {
    currentFilters.year = this.value;
    updateStats();
    if (selectedLocation) {
      populateTooltip(selectedLocation);
    }
  });

  // Initialize enhanced camera controls and statistics
  initCameraControls();
  updateStats();
  updateLabelsVisibility();

  // Start animation loop
  animate();
});
