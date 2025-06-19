/**
 * Simplified Globe Implementation - Debugging Version
 * This version focuses on core functionality to identify issues
 */

// Globe constants
const EARTH_RADIUS = 5;
const MARKER_HEIGHT = 0.05;
const MIN_ZOOM_DISTANCE = EARTH_RADIUS * 1.1;
const MAX_ZOOM_DISTANCE = EARTH_RADIUS * 10;

// Global variables
let scene, camera, renderer, controls;
let earth, markers = [];
let currentLocation = null; // Global variable for current selected location

// Day/Night lighting system variables
let sunLight, ambientLight, nightAmbientLight;
let dayNightUpdateInterval;
let lastSunUpdate = 0;
const SUN_UPDATE_INTERVAL = 60000; // Update every minute

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🌍 Starting globe initialization...');
  console.log('📋 Initialization checklist:');

  // Update loading status
  updateLoadingStatus('Checking dependencies...');

  // Step 1: Check Three.js availability
  console.log('1️⃣ Checking Three.js library...');
  if (typeof THREE === 'undefined') {
    console.error('❌ Three.js not loaded from CDN');
    showError('Three.js library failed to load. Please check your internet connection.');
    return;
  }
  console.log('✅ Three.js available (version ' + THREE.REVISION + ')');
  updateLoadingStatus('Three.js library loaded ✓');

  // Step 2: Check DOM elements
  console.log('2️⃣ Checking DOM elements...');
  const globeContainer = document.getElementById('globe-container');
  if (!globeContainer) {
    console.error('❌ Globe container element not found');
    showError('Globe container element missing from HTML.');
    return;
  }
  console.log('✅ Globe container found:', globeContainer);
  updateLoadingStatus('DOM elements ready ✓');

  // Step 3: Check WebGL support
  console.log('3️⃣ Checking WebGL support...');
  updateLoadingStatus('Checking WebGL support...');
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported by browser');
    console.log('✅ WebGL supported');
    console.log('   - Vendor:', gl.getParameter(gl.VENDOR));
    console.log('   - Renderer:', gl.getParameter(gl.RENDERER));
    updateLoadingStatus('WebGL support confirmed ✓');
  } catch (error) {
    console.error('❌ WebGL error:', error);
    showError('WebGL is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
    return;
  }

  // Step 4: Initialize globe with comprehensive error handling
  console.log('4️⃣ Initializing 3D globe...');
  updateLoadingStatus('Initializing 3D globe...');
  try {
    await initGlobe();
    console.log('✅ Globe initialization completed successfully');
    console.log('🎉 All systems ready! Globe is now interactive.');

    // Hide loading indicator
    hideLoadingIndicator();
  } catch (error) {
    console.error('❌ Globe initialization failed:', error);
    console.error('Error stack:', error.stack);
    showError('Failed to initialize 3D globe: ' + error.message);
  }

  // Helper function to update loading status
  function updateLoadingStatus(message) {
    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
      statusElement.textContent = message;
      console.log('📊 Loading:', message);
    }
  }

  // Helper function to hide loading indicator
  function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.opacity = '0';
      loadingIndicator.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
      }, 500);
      console.log('✅ Loading indicator hidden');
    }
  }

  // Helper function to show user-friendly error messages
  function showError(message) {
    const globeContainer = document.getElementById('globe-container');
    if (globeContainer) {
      globeContainer.innerHTML = `
        <div style="
          color: white;
          text-align: center;
          padding: 50px;
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 10px;
          margin: 20px;
          font-family: Arial, sans-serif;
        ">
          <h3 style="color: #ff6b6b; margin-bottom: 20px;">🚫 Globe Loading Error</h3>
          <p style="margin-bottom: 20px;">${message}</p>
          <button onclick="location.reload()" style="
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          ">Try Again</button>
        </div>
      `;
    }
  }

  async function initGlobe() {
    console.log('🔧 Starting globe component initialization...');

    try {
      // Step 1: Create Three.js scene with space background
      console.log('   📦 Creating Three.js scene...');
      scene = new THREE.Scene();
      await createSpaceBackground();
      console.log('   ✅ Scene created with space background');

      // Step 2: Create camera
      console.log('   📷 Setting up camera...');
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(12, 3, 12);
      camera.lookAt(0, 0, 0);
      console.log('   ✅ Camera positioned at (12, 3, 12)');

      // Step 3: Create WebGL renderer
      console.log('   🖥️ Creating WebGL renderer...');
      const globeContainer = document.getElementById('globe-container');
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000011);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize for performance
      globeContainer.appendChild(renderer.domElement);
      console.log('   ✅ Renderer created and attached to DOM');

      // Step 4: Setup consistent daylight lighting system
      console.log('   💡 Setting up consistent daylight lighting...');
      setupDayNightLighting();
      console.log('   ✅ Consistent daylight lighting system initialized');

      // Step 5: Create Earth
      console.log('   🌍 Creating Earth geometry and materials...');
      updateLoadingStatus('Creating Earth geometry...');
      await createEarth();
      console.log('   ✅ Earth created successfully');

      // Step 6: Create location markers
      console.log('   📍 Creating location markers...');
      updateLoadingStatus('Adding location markers...');
      createMarkers();
      console.log('   ✅ Location markers created');

      // Step 7: Initialize camera controls
      console.log('   🎮 Initializing camera controls...');
      updateLoadingStatus('Setting up camera controls...');
      await initControls();
      console.log('   ✅ Camera controls initialized');

      // Step 8: Start animation loop
      console.log('   🎬 Starting animation loop...');
      updateLoadingStatus('Starting animation...');
      animate();
      console.log('   ✅ Animation loop started');

      // Step 9: Setup event handlers
      console.log('   🖱️ Setting up interaction handlers...');
      updateLoadingStatus('Configuring interactions...');
      setupEventHandlers();
      console.log('   ✅ Event handlers configured');

      updateLoadingStatus('Globe ready! 🎉');

      console.log('🎉 Globe initialization completed successfully!');
      console.log('🌍 Interactive 3D globe is ready for exploration');
      console.log('🖱️ Use mouse to rotate and zoom the globe');
      console.log('📍 Click on markers to view location achievements');
      console.log('📏 Adaptive marker scaling: ENABLED (markers scale with zoom level)');
      console.log('☀️ Consistent daylight mode: ENABLED (always bright lighting)');

    } catch (error) {
      console.error('❌ Error during globe initialization:', error);
      throw new Error(`Globe initialization failed: ${error.message}`);
    }
  }

  async function createEarth() {
    try {
      console.log('     🌐 Creating Earth geometry...');
      const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
      console.log('     ✅ Earth geometry created (radius:', EARTH_RADIUS, ')');

      // Create enhanced Earth material for better marker contrast
      console.log('     🎨 Creating enhanced Earth material...');
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a2e, // Darker base color for better marker contrast
        shininess: 50,   // Reduced shininess to avoid overwhelming bright markers
        transparent: false,
        emissive: 0x000000, // No emissive to keep Earth subdued
        specular: 0x222244  // Subtle specular highlights
      });

      earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);
      console.log('     ✅ Basic Earth mesh added to scene');

      // Load high-resolution Earth textures with LOD system
      console.log('     🖼️ Loading high-resolution Earth textures...');
      await loadEarthTextures(earthMaterial);

    } catch (error) {
      console.error('❌ Failed to create Earth:', error);
      throw new Error(`Earth creation failed: ${error.message}`);
    }
  }

  // Enhanced Earth texture loading system with LOD
  async function loadEarthTextures(earthMaterial) {
    try {
      console.log('     🌍 Initializing high-resolution Earth texture system...');

      // High-resolution texture sources for different zoom levels
      const textureConfig = {
        // High-resolution base textures (8K-16K)
        highRes: [
          'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
          'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74218/world.200412.3x5400x2700.jpg',
          'https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry/73909l.jpg'
        ],
        // Medium-resolution fallbacks (4K)
        mediumRes: [
          'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
          'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
          'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg'
        ],
        // Low-resolution emergency fallbacks (2K)
        lowRes: [
          'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
          'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg'
        ]
      };

      let textureLoaded = false;
      let loadedTexture = null;

      // Try high-resolution textures first
      console.log('     🔍 Attempting high-resolution Earth textures...');
      for (const url of textureConfig.highRes) {
        try {
          console.log(`     🔄 Loading high-res texture: ${url.split('/').pop()}`);
          loadedTexture = await loadTextureWithTimeout(url, 10000); // 10 second timeout
          console.log('     ✅ High-resolution Earth texture loaded successfully');
          textureLoaded = true;
          break;
        } catch (error) {
          console.warn(`     ⚠️ High-res texture failed: ${error.message}`);
        }
      }

      // Fallback to medium-resolution
      if (!textureLoaded) {
        console.log('     🔍 Falling back to medium-resolution textures...');
        for (const url of textureConfig.mediumRes) {
          try {
            console.log(`     🔄 Loading medium-res texture: ${url.split('/').pop()}`);
            loadedTexture = await loadTextureWithTimeout(url, 8000);
            console.log('     ✅ Medium-resolution Earth texture loaded successfully');
            textureLoaded = true;
            break;
          } catch (error) {
            console.warn(`     ⚠️ Medium-res texture failed: ${error.message}`);
          }
        }
      }

      // Final fallback to low-resolution
      if (!textureLoaded) {
        console.log('     🔍 Final fallback to low-resolution textures...');
        for (const url of textureConfig.lowRes) {
          try {
            console.log(`     🔄 Loading low-res texture: ${url.split('/').pop()}`);
            loadedTexture = await loadTextureWithTimeout(url, 5000);
            console.log('     ✅ Low-resolution Earth texture loaded successfully');
            textureLoaded = true;
            break;
          } catch (error) {
            console.warn(`     ⚠️ Low-res texture failed: ${error.message}`);
          }
        }
      }

      if (textureLoaded && loadedTexture) {
        // Configure texture for optimal quality
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = true;
        loadedTexture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());

        // Apply texture to material
        earthMaterial.map = loadedTexture;
        earthMaterial.color.setHex(0xffffff); // Full color for texture
        earthMaterial.needsUpdate = true;

        console.log('     🎨 Earth texture configured with optimal settings');
        console.log(`     📊 Anisotropy: ${loadedTexture.anisotropy}x`);

        // Setup LOD system for zoom-based detail
        setupLODSystem(loadedTexture);

      } else {
        // Ultimate fallback - procedural Earth colors
        console.warn('     ⚠️ All texture sources failed, using procedural Earth colors');
        createProceduralEarthTexture(earthMaterial);
      }

    } catch (error) {
      console.error('     ❌ Earth texture loading system failed:', error);
      createProceduralEarthTexture(earthMaterial);
    }
  }

  // Helper function to load textures with timeout
  function loadTextureWithTimeout(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader();

      const timeoutId = setTimeout(() => {
        reject(new Error(`Texture loading timeout after ${timeout}ms`));
      }, timeout);

      textureLoader.load(
        url,
        function(texture) {
          clearTimeout(timeoutId);
          resolve(texture);
        },
        function(progress) {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total * 100).toFixed(1);
            console.log(`     📊 Loading: ${percent}%`);
          }
        },
        function(error) {
          clearTimeout(timeoutId);
          reject(new Error(`Texture loading failed: ${error.message || 'Unknown error'}`));
        }
      );
    });
  }

  // Setup Level of Detail system for zoom-based quality
  function setupLODSystem(baseTexture) {
    console.log('     🔧 Setting up LOD (Level of Detail) system...');

    // Store original texture settings
    window.earthLOD = {
      baseTexture: baseTexture,
      currentLevel: 'high',
      zoomThresholds: {
        high: EARTH_RADIUS * 3,    // Close zoom - highest detail
        medium: EARTH_RADIUS * 6,  // Medium zoom - medium detail
        low: EARTH_RADIUS * 9      // Far zoom - lower detail for performance
      }
    };

    console.log('     ✅ LOD system configured for optimal zoom performance');
  }

  // Create procedural Earth texture as ultimate fallback
  function createProceduralEarthTexture(earthMaterial) {
    console.log('     🎨 Creating procedural Earth texture...');

    // Create a canvas-based Earth texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Create gradient for ocean and land
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');    // Deep ocean blue
    gradient.addColorStop(0.3, '#3b82f6');  // Ocean blue
    gradient.addColorStop(0.5, '#22c55e');  // Land green
    gradient.addColorStop(0.7, '#eab308');  // Desert yellow
    gradient.addColorStop(0.9, '#8b5cf6');  // Mountain purple
    gradient.addColorStop(1, '#f3f4f6');    // Ice white

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some noise for terrain variation
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to texture
    const proceduralTexture = new THREE.CanvasTexture(canvas);
    proceduralTexture.wrapS = THREE.RepeatWrapping;
    proceduralTexture.wrapT = THREE.RepeatWrapping;
    proceduralTexture.minFilter = THREE.LinearFilter;
    proceduralTexture.magFilter = THREE.LinearFilter;

    earthMaterial.map = proceduralTexture;
    earthMaterial.color.setHex(0xffffff);
    earthMaterial.needsUpdate = true;

    console.log('     ✅ Procedural Earth texture created and applied');
  }

  // Create enhanced realistic space background with prominent twinkling stars
  async function createSpaceBackground() {
    console.log('     🌌 Creating enhanced space background with prominent twinkling stars...');

    try {
      // Create realistic starfield background with optimal star count
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 4000; // Reduced from 15,000 for more realistic night sky
      const starPositions = new Float32Array(starCount * 3);
      const starColors = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);
      const starTwinklePhases = new Float32Array(starCount); // For individual twinkling
      const starTwinkleFreqs = new Float32Array(starCount);  // For varied twinkling speeds

      // Generate random stars in a large sphere around the scene
      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;

        // Position stars in a large sphere (radius 800-1000)
        const radius = 800 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = radius * Math.cos(phi);

        // Enhanced star colors with more vibrant appearance
        const starType = Math.random();
        if (starType < 0.6) {
          // Bright white stars (most common) - enhanced brightness
          starColors[i3] = 1.0;
          starColors[i3 + 1] = 1.0;
          starColors[i3 + 2] = 1.0;
        } else if (starType < 0.75) {
          // Vibrant blue stars - enhanced blue intensity
          starColors[i3] = 0.8;
          starColors[i3 + 1] = 0.9;
          starColors[i3 + 2] = 1.0;
        } else if (starType < 0.9) {
          // Bright yellow/golden stars - enhanced warmth
          starColors[i3] = 1.0;
          starColors[i3 + 1] = 1.0;
          starColors[i3 + 2] = 0.6;
        } else {
          // Vibrant red/orange stars - enhanced warmth
          starColors[i3] = 1.0;
          starColors[i3 + 1] = 0.6;
          starColors[i3 + 2] = 0.4;
        }

        // Enhanced star size variation for more visual depth
        const sizeCategory = Math.random();
        if (sizeCategory < 0.7) {
          // Small stars (most common)
          starSizes[i] = 1 + Math.random() * 2;
        } else if (sizeCategory < 0.9) {
          // Medium stars
          starSizes[i] = 2.5 + Math.random() * 2;
        } else {
          // Large bright stars (rare)
          starSizes[i] = 4 + Math.random() * 3;
        }

        // Individual twinkling properties
        starTwinklePhases[i] = Math.random() * Math.PI * 2; // Random starting phase

        // Varied twinkling frequencies for realistic effect
        const freqType = Math.random();
        if (freqType < 0.4) {
          starTwinkleFreqs[i] = 0.5 + Math.random() * 1.0; // Slow twinkling
        } else if (freqType < 0.8) {
          starTwinkleFreqs[i] = 1.5 + Math.random() * 1.5; // Medium twinkling
        } else {
          starTwinkleFreqs[i] = 3.0 + Math.random() * 2.0; // Fast twinkling
        }
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
      starGeometry.setAttribute('twinklePhase', new THREE.BufferAttribute(starTwinklePhases, 1));
      starGeometry.setAttribute('twinkleFreq', new THREE.BufferAttribute(starTwinkleFreqs, 1));

      // Enhanced star material with maximum brightness and additive blending
      const starMaterial = new THREE.PointsMaterial({
        size: 3, // Increased base size for better visibility
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 1.0, // Maximum opacity for brightest stars
        blending: THREE.AdditiveBlending,
        alphaTest: 0.1 // Helps with performance by culling very transparent pixels
      });

      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      // Store enhanced reference for animation with twinkling data
      window.spaceBackground = {
        stars,
        starGeometry,
        starMaterial,
        originalColors: new Float32Array(starColors), // Store original colors
        originalSizes: new Float32Array(starSizes),   // Store original sizes
        twinklePhases: starTwinklePhases,
        twinkleFreqs: starTwinkleFreqs,
        starCount
      };

      console.log('     ✅ Realistic space background created with 4,000 prominent twinkling stars');

      // Set pure black space background for clean starfield
      scene.background = new THREE.Color(0x000000); // Pure black space

    } catch (error) {
      console.warn('     ⚠️ Enhanced space background creation failed, using fallback:', error.message);
      // Fallback to simple gradient background
      scene.background = new THREE.Color(0x000011);
    }
  }



  // Setup dynamic day/night lighting system
  function setupDayNightLighting() {
    console.log('     🌅 Initializing day/night lighting system...');

    // Create ambient lights for day and night
    ambientLight = new THREE.AmbientLight(0x404040, 0.3); // Reduced for more dramatic effect
    scene.add(ambientLight);

    // Night ambient light (cooler, dimmer)
    nightAmbientLight = new THREE.AmbientLight(0x1a1a2e, 0.2);
    nightAmbientLight.visible = false;
    scene.add(nightAmbientLight);

    // Create the sun light (directional light representing the sun)
    sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.castShadow = false; // Disable shadows for performance
    scene.add(sunLight);

    // Calculate initial sun position based on current time
    updateSunPosition();

    // Start the day/night update cycle
    startDayNightCycle();

    // Setup lighting controls after a short delay to ensure DOM is ready
    setTimeout(() => {
      setupLightingControls();
    }, 500);

    console.log('     ✅ Day/night lighting system ready');
  }

  // Calculate sun position based on GMT (Greenwich Mean Time)
  function calculateSunPosition() {
    const now = new Date();

    // Get GMT time directly (UTC is equivalent to GMT for our purposes)
    const gmtHours = now.getUTCHours();
    const gmtMinutes = now.getUTCMinutes();
    const gmtSeconds = now.getUTCSeconds();

    // Calculate precise GMT time as decimal hours
    const gmtTime = gmtHours + gmtMinutes / 60 + gmtSeconds / 3600;

    // Calculate day of year for seasonal variation
    const start = new Date(now.getUTCFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Solar declination angle (Earth's 23.45° tilt effect)
    // This varies throughout the year, affecting seasons
    const declination = 23.45 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365) * Math.PI / 180;

    // Hour angle based on GMT time
    // At GMT noon (12:00), the sun is directly over the Prime Meridian (0° longitude)
    // Each hour represents 15° of Earth's rotation
    const hourAngle = (gmtTime - 12) * 15 * Math.PI / 180;

    // Calculate sun position in 3D space relative to Earth center
    const sunDistance = 50; // Distance from Earth center (arbitrary units)

    // Convert spherical coordinates to Cartesian coordinates
    // X-axis points toward Prime Meridian at GMT noon
    // Y-axis points toward North Pole
    // Z-axis completes right-handed coordinate system
    const x = sunDistance * Math.cos(declination) * Math.cos(hourAngle);
    const y = sunDistance * Math.sin(declination);
    const z = sunDistance * Math.cos(declination) * Math.sin(hourAngle);

    return {
      x, y, z,
      declination,
      hourAngle,
      gmtTime,
      dayOfYear,
      gmtHours,
      gmtMinutes
    };
  }

  // Update sun position and lighting based on GMT
  function updateSunPosition() {
    if (!sunLight) return;

    const sunPos = calculateSunPosition();

    // Update sun light position
    sunLight.position.set(sunPos.x, sunPos.y, sunPos.z);
    sunLight.lookAt(0, 0, 0);

    // Calculate lighting intensity based on sun position
    // When sun is "behind" Earth (negative x), it's night for the Prime Meridian
    const isDay = sunPos.x > 0;
    const sunHeight = Math.max(0, sunPos.x / 50); // Normalize to 0-1

    // Note: Lighting intensity is now handled by the setupLightingControls function
    // This function only updates sun position and determines day/night status
    // The actual lighting values are applied by applyLightingIntensity()

    // Update day/night indicator
    updateDayNightIndicator(isDay, sunHeight, sunPos);

    // Enhanced logging with GMT time details
    const gmtTimeStr = `${String(sunPos.gmtHours).padStart(2, '0')}:${String(sunPos.gmtMinutes).padStart(2, '0')} GMT`;
    const lightType = isDay ? 'Day' : 'Night';
    const seasonInfo = `Day ${sunPos.dayOfYear}/365`;
    console.log(`☀️ Sun position updated - GMT: ${gmtTimeStr} (${seasonInfo}, ${lightType})`);

    return { isDay, sunHeight, position: sunPos, gmtTime: sunPos.gmtTime };
  }

  // Start the day/night update cycle
  function startDayNightCycle() {
    // Update immediately
    updateSunPosition();
    updateGMTClock();

    // Set up interval for regular updates
    dayNightUpdateInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastSunUpdate >= SUN_UPDATE_INTERVAL) {
        updateSunPosition();
        lastSunUpdate = now;
      }
      // Update GMT clock every second
      updateGMTClock();
    }, 1000); // Update every second for smooth clock

    console.log('     🔄 Day/night cycle started (updates every minute)');
    console.log('     🕐 GMT clock started (updates every second)');
  }

  // Update the day/night indicator UI with GMT time
  function updateDayNightIndicator(isDay, sunHeight, sunPos) {
    const indicator = document.getElementById('day-night-indicator');
    const icon = indicator?.querySelector('.indicator-icon');
    const status = document.getElementById('lighting-status');

    if (!indicator || !status) return;

    // Get current lighting mode
    const lightingModeSelect = document.getElementById('lighting-mode');
    const currentMode = lightingModeSelect ? lightingModeSelect.value : 'auto';

    // Remove existing classes
    indicator.classList.remove('day', 'night', 'transition');

    // Handle different lighting modes
    switch (currentMode) {
      case 'day':
        indicator.classList.add('day');
        icon.textContent = '☀️';
        status.textContent = 'Always Day Mode';
        break;

      case 'night':
        indicator.classList.add('night');
        icon.textContent = '🌙';
        status.textContent = 'Always Night Mode';
        break;

      case 'auto':
      default:
        // Auto mode: Show actual day/night based on GMT
        if (isDay) {
          indicator.classList.add('day');
          // Update icon based on sun height (GMT-based)
          if (sunHeight > 0.7) {
            icon.textContent = '☀️'; // High sun
            status.textContent = 'Bright Daylight';
          } else if (sunHeight > 0.4) {
            icon.textContent = '🌤️'; // Medium sun
            status.textContent = 'Daylight';
          } else {
            icon.textContent = '🌅'; // Low sun (GMT sunrise/sunset)
            status.textContent = 'Golden Hour';
          }
        } else {
          indicator.classList.add('night');
          icon.textContent = '🌙';
          status.textContent = 'Nighttime';
        }
        break;
    }

    // Add current GMT time (more precise than UTC string parsing)
    const gmtTimeStr = `${String(sunPos.gmtHours).padStart(2, '0')}:${String(sunPos.gmtMinutes).padStart(2, '0')}`;
    status.textContent += ` (GMT ${gmtTimeStr})`;

    // Add seasonal information for auto mode
    if (currentMode === 'auto') {
      const season = getSeason(sunPos.dayOfYear);
      status.textContent += ` • ${season}`;
    }
  }

  // Helper function to determine season based on day of year
  function getSeason(dayOfYear) {
    if (dayOfYear >= 80 && dayOfYear < 172) return 'Spring';
    if (dayOfYear >= 172 && dayOfYear < 266) return 'Summer';
    if (dayOfYear >= 266 && dayOfYear < 355) return 'Autumn';
    return 'Winter';
  }

  // Update the GMT clock display
  function updateGMTClock() {
    const now = new Date();
    const gmtTimeElement = document.getElementById('gmt-time');
    const gmtDateElement = document.getElementById('gmt-date');

    if (!gmtTimeElement || !gmtDateElement) return;

    // Format GMT time with seconds
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    gmtTimeElement.textContent = `${hours}:${minutes}:${seconds} GMT`;

    // Format GMT date
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    };
    const dateStr = now.toLocaleDateString('en-US', options);
    gmtDateElement.textContent = dateStr;
  }

  // Stop the day/night cycle (cleanup)
  function stopDayNightCycle() {
    if (dayNightUpdateInterval) {
      clearInterval(dayNightUpdateInterval);
      dayNightUpdateInterval = null;
      console.log('     ⏹️ Day/night cycle stopped');
    }
  }

  function createMarkers() {
    try {      const locations = [
        {
          id: "nyc",
          name: "New York HQ",
          lat: 40.7128,
          lng: -74.0060,
          color: "#ff4444",
          established: 1995,
          employees: 2500,
          role: "Global Headquarters",
          focus: ["Financial Services", "Technology Innovation", "Strategic Planning"],
          description: "Our flagship headquarters in Manhattan, driving global strategy and innovation.",
          achievements: [
            {
              title: "Fortune 500 Recognition",
              category: "award",
              year: 2023,
              description: "Ranked #127 in Fortune 500 companies for outstanding financial performance and market leadership.",
              impact: "Global recognition for excellence and sustainable growth",
              metrics: { revenue: "$2.8B", growth: "15%", marketCap: "$12.5B" }
            },
            {
              title: "Green Building Certification",
              category: "sustainability",
              year: 2022,
              description: "LEED Platinum certification for our Manhattan headquarters building.",
              impact: "40% reduction in energy consumption and carbon footprint",
              metrics: { energySavings: "$1.2M", co2Reduction: "500 tons", efficiency: "92%" }
            },
            {
              title: "AI Innovation Center Launch",
              category: "innovation",
              year: 2024,
              description: "Opened state-of-the-art AI research facility with quantum computing capabilities.",
              impact: "Leading breakthrough in machine learning and predictive analytics",
              metrics: { patents: "25", researchers: "150", funding: "$50M" }
            }
          ]
        },        {
          id: "london",
          name: "London Office",
          lat: 51.5074,
          lng: -0.1278,
          color: "#4488ff",
          established: 1998,
          employees: 1800,
          role: "European Operations Hub",
          focus: ["Financial Markets", "Regulatory Compliance", "European Expansion"],
          description: "Strategic hub for European operations in the heart of London's financial district.",
          achievements: [
            {
              title: "Brexit Resilience Award",
              category: "award",
              year: 2023,
              description: "Recognized for exceptional business continuity and adaptation during Brexit transition.",
              impact: "Maintained 100% service levels throughout regulatory changes",
              metrics: { clientRetention: "98%", compliance: "100%", growth: "12%" }
            },
            {
              title: "Digital Transformation Initiative",
              category: "innovation",
              year: 2022,
              description: "Complete digitization of European operations with blockchain integration.",
              impact: "50% improvement in processing efficiency and security",
              metrics: { efficiency: "50%", security: "99.9%", cost: "-30%" }
            }
          ]
        },        {
          id: "tokyo",
          name: "Tokyo Branch",
          lat: 35.6762,
          lng: 139.6503,
          color: "#ff8844",
          established: 2001,
          employees: 1200,
          role: "Asia Pacific Hub",
          focus: ["Technology Integration", "Cultural Adaptation", "Regional Partnerships"],
          description: "Innovation center driving technological advancement across Asia Pacific region.",
          achievements: [
            {
              title: "Robotics Partnership",
              category: "innovation",
              year: 2023,
              description: "Strategic partnership with leading Japanese robotics companies for automation solutions.",
              impact: "Revolutionary automation in financial services processing",
              metrics: { automation: "75%", accuracy: "99.8%", speed: "+200%" }
            },
            {
              title: "Cultural Integration Award",
              category: "award",
              year: 2024,
              description: "Excellence in cross-cultural business practices and employee satisfaction.",
              impact: "Model for international business cultural integration",
              metrics: { satisfaction: "96%", retention: "94%", diversity: "85%" }
            }
          ]
        },        {
          id: "sydney",
          name: "Sydney Branch",
          lat: -33.8688,
          lng: 151.2093,
          color: "#44ff88",
          established: 2005,
          employees: 850,
          role: "Oceania Regional Office",
          focus: ["Sustainable Finance", "Environmental Innovation", "Community Impact"],
          description: "Leading sustainable business practices and environmental stewardship in Oceania.",
          achievements: [
            {
              title: "Great Barrier Reef Conservation",
              category: "sustainability",
              year: 2023,
              description: "Major funding and technology support for Great Barrier Reef restoration project.",
              impact: "Contributing to the preservation of world's largest coral reef system",
              metrics: { funding: "$5M", area: "1000 hectares", species: "200+" }
            },
            {
              title: "Indigenous Partnership Program",
              category: "social",
              year: 2022,
              description: "Comprehensive partnership with Aboriginal communities for sustainable development.",
              impact: "Empowering indigenous communities through education and economic opportunities",
              metrics: { communities: "15", jobs: "200", training: "500 people" }
            }
          ]
        }
      ];

      locations.forEach(location => {
        // Create enhanced marker group for better visual hierarchy
        const markerGroup = new THREE.Group();

        // Enhanced marker geometry with optimized size for visibility
        const markerGeometry = new THREE.SphereGeometry(0.14, 24, 24); // Larger and smoother

        // High-contrast, vibrant colors for better visibility
        const enhancedColors = {
          "#ff4444": { color: 0x00FFFF, emissive: 0x00CCCC }, // Bright Cyan
          "#44ff44": { color: 0x00FF00, emissive: 0x00CC00 }, // Neon Green
          "#4444ff": { color: 0xFFD700, emissive: 0xFFB000 }, // Golden Yellow
          "#4488ff": { color: 0xFFD700, emissive: 0xFFB000 }, // Golden Yellow (London)
          "#ff44ff": { color: 0xFF1493, emissive: 0xCC1177 }, // Deep Pink
          "#ff8844": { color: 0xFF1493, emissive: 0xCC1177 }, // Deep Pink (Tokyo)
          "#ffff44": { color: 0xFF4500, emissive: 0xCC3300 }, // Orange Red
          "#44ffff": { color: 0x9370DB, emissive: 0x7B68EE }, // Medium Slate Blue
          "#44ff88": { color: 0x00FF00, emissive: 0x00CC00 }  // Neon Green (Sydney)
        };

        // Get enhanced color or use bright cyan as default
        const colorConfig = enhancedColors[location.color] || { color: 0x00FFFF, emissive: 0x00CCCC };

        // Create main marker with enhanced materials for maximum visibility
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: colorConfig.color,
          emissive: colorConfig.emissive,
          emissiveIntensity: 0.8, // High emissive intensity for glow effect
          transparent: false
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);

        // Add enhanced glowing outer ring for maximum visibility
        const ringGeometry = new THREE.RingGeometry(0.18, 0.22, 20); // Larger ring
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: colorConfig.color,
          emissive: colorConfig.emissive,
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        const glowRing = new THREE.Mesh(ringGeometry, ringMaterial);

        // Add subtle outer glow effect
        const outerGlowGeometry = new THREE.RingGeometry(0.24, 0.28, 16);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
          color: colorConfig.color,
          emissive: colorConfig.emissive,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);

        // Convert lat/lng to 3D position
        const phi = (90 - location.lat) * (Math.PI / 180);
        const theta = (location.lng + 180) * (Math.PI / 180);
        const radius = EARTH_RADIUS + MARKER_HEIGHT;

        const markerPosition = new THREE.Vector3(
          -(radius * Math.sin(phi) * Math.cos(theta)),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );

        marker.position.copy(markerPosition);

        // Position and orient the glow rings
        glowRing.position.copy(markerPosition);
        glowRing.lookAt(0, 0, 0); // Face the center of Earth

        outerGlow.position.copy(markerPosition);
        outerGlow.lookAt(0, 0, 0); // Face the center of Earth

        // Add all visual elements to group
        markerGroup.add(marker);
        markerGroup.add(glowRing);
        markerGroup.add(outerGlow);

        // Store references for animation and interaction
        markerGroup.userData = location;
        markerGroup.userData.marker = marker;
        markerGroup.userData.glowRing = glowRing;
        markerGroup.userData.outerGlow = outerGlow;
        markerGroup.userData.originalColor = colorConfig;

        markers.push(markerGroup);
        scene.add(markerGroup);
      });

      console.log('✅ Markers created:', markers.length);
    } catch (error) {
      console.error('❌ Failed to create markers:', error);
    }
  }

  async function initControls() {
    try {
      console.log('🎮 Initializing camera controls...');

      // Try multiple CDN sources for better reliability
      const cdnSources = [
        'https://unpkg.com/three@0.157.0/examples/jsm/controls/MapControls.js',
        'https://cdn.skypack.dev/three@0.157.0/examples/jsm/controls/MapControls.js',
        'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/MapControls.js'
      ];

      let controlsLoaded = false;

      // Try MapControls first
      for (const source of cdnSources) {
        try {
          console.log('🔄 Trying MapControls from:', source);
          const { MapControls } = await import(source);
          controls = new MapControls(camera, renderer.domElement);
          setupControls();
          console.log('✅ MapControls loaded successfully from:', source);
          controlsLoaded = true;
          break;
        } catch (error) {
          console.warn('⚠️ Failed to load MapControls from:', source, error.message);
        }
      }

      // Fallback to OrbitControls if MapControls failed
      if (!controlsLoaded) {
        const orbitSources = [
          'https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js',
          'https://cdn.skypack.dev/three@0.157.0/examples/jsm/controls/OrbitControls.js',
          'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js'
        ];

        for (const source of orbitSources) {
          try {
            console.log('🔄 Trying OrbitControls from:', source);
            const { OrbitControls } = await import(source);
            controls = new OrbitControls(camera, renderer.domElement);
            setupControls();
            console.log('✅ OrbitControls loaded successfully from:', source);
            controlsLoaded = true;
            break;
          } catch (error) {
            console.warn('⚠️ Failed to load OrbitControls from:', source, error.message);
          }
        }
      }

      // If all CDN attempts fail, implement basic manual controls
      if (!controlsLoaded) {
        console.warn('⚠️ All CDN attempts failed, implementing manual controls...');
        initManualControls();
      }

    } catch (error) {
      console.error('❌ Failed to initialize controls:', error);
      initManualControls();
    }
  }

  function setupControls() {
    if (!controls) return;

    console.log('🔧 Configuring controls...');

    // Enable smooth damping for Google Earth-style interaction
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Set zoom limits (5.5 to 50 earth-radii)
    controls.minDistance = MIN_ZOOM_DISTANCE;
    controls.maxDistance = MAX_ZOOM_DISTANCE;

    // Disable panning to keep focus on globe
    controls.enablePan = false;
    controls.screenSpacePanning = false;

    // Configure rotation and zoom speeds
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.0;

    // Allow full rotation
    controls.maxPolarAngle = Math.PI;

    // Configure rotation direction for intuitive Google Earth-style controls
    console.log('🔄 Configuring rotation direction for:', controls.constructor.name);

    // Apply rotation direction fix based on control type
    if (controls.constructor.name === 'MapControls') {
      // MapControls typically has correct vertical rotation but may need horizontal adjustment
      console.log('🔧 MapControls: Testing rotation direction');

      // Start with standard rotation speed and test
      controls.rotateSpeed = 0.5;
      console.log('   Using standard rotation - horizontal should feel natural');
      console.log('   If horizontal feels inverted, we may need negative rotateSpeed');

    } else if (controls.constructor.name === 'OrbitControls') {
      // OrbitControls typically has good default rotation direction
      console.log('🔧 OrbitControls: Using standard configuration');

      // OrbitControls usually has intuitive rotation by default
      controls.rotateSpeed = 0.5;
      console.log('   OrbitControls should have natural rotation direction');
    }

    // Note: If CDN controls still feel wrong, we can add event handler overrides
    console.log('🧭 CDN Controls configured - test rotation direction:');
    console.log('   Expected: Drag LEFT → rotate left, Drag UP → tilt up');
    console.log('   If wrong, manual controls will be used as fallback');

    console.log('✅ Rotation direction configured - test by dragging to verify');
    console.log('   Expected: Drag LEFT → Globe rotates LEFT, Drag UP → Globe tilts UP');

    // Auto-rotate settings
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Event listeners for interaction feedback and rotation direction testing
    let interactionCount = 0;
    let lastCameraPosition = null;

    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      console.log('🎮 User interaction started');
      lastCameraPosition = camera.position.clone();
    });

    controls.addEventListener('end', () => {
      // Resume auto-rotate after 3 seconds of inactivity
      setTimeout(() => {
        if (controls) {
          controls.autoRotate = true;
          console.log('🔄 Auto-rotate resumed');
        }
      }, 3000);
    });

    controls.addEventListener('change', () => {
      // Monitor rotation direction for the first few interactions
      if (interactionCount < 3 && lastCameraPosition) {
        const currentPos = camera.position;
        const deltaX = currentPos.x - lastCameraPosition.x;
        const deltaZ = currentPos.z - lastCameraPosition.z;

        if (Math.abs(deltaX) > 0.1 || Math.abs(deltaZ) > 0.1) {
          console.log(`🔍 Camera movement detected: ΔX=${deltaX.toFixed(2)}, ΔZ=${deltaZ.toFixed(2)}`);
          interactionCount++;
        }

        lastCameraPosition = currentPos.clone();
      }
    });

    // Ensure controls are enabled
    controls.enabled = true;

    console.log('✅ Controls configured successfully');
    console.log('   - Zoom range:', MIN_ZOOM_DISTANCE, 'to', MAX_ZOOM_DISTANCE);
    console.log('   - Damping factor:', controls.dampingFactor);
    console.log('   - Auto-rotate:', controls.autoRotate);
  }

  // Manual controls fallback when CDN loading fails
  function initManualControls() {
    console.log('🛠️ Implementing manual camera controls...');

    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let currentRotationX = 0, currentRotationY = 0;
    let cameraDistance = 15;
    let targetDistance = 15;

    const domElement = renderer.domElement;

    // Mouse events for desktop
    domElement.addEventListener('mousedown', onMouseDown, false);
    domElement.addEventListener('mousemove', onMouseMove, false);
    domElement.addEventListener('mouseup', onMouseUp, false);
    domElement.addEventListener('wheel', onMouseWheel, false);

    // Touch events for mobile
    domElement.addEventListener('touchstart', onTouchStart, false);
    domElement.addEventListener('touchmove', onTouchMove, false);
    domElement.addEventListener('touchend', onTouchEnd, false);

    function onMouseDown(event) {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
      domElement.style.cursor = 'grabbing';
    }

    function onMouseMove(event) {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      // Fix rotation direction for intuitive Google Earth-style controls
      // Invert horizontal: dragging left should rotate globe left (show right side)
      // Keep vertical normal: dragging up should tilt up (show southern hemisphere)
      targetRotationY -= deltaX * 0.01;  // Inverted horizontal (correct)
      targetRotationX += deltaY * 0.01;  // Normal vertical (drag up = tilt up)

      // Clamp vertical rotation
      targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));

      mouseX = event.clientX;
      mouseY = event.clientY;
    }

    function onMouseUp() {
      isMouseDown = false;
      domElement.style.cursor = 'grab';
    }

    function onMouseWheel(event) {
      event.preventDefault();
      const delta = event.deltaY * 0.01;
      targetDistance += delta;
      targetDistance = Math.max(MIN_ZOOM_DISTANCE, Math.min(MAX_ZOOM_DISTANCE, targetDistance));
    }

    // Touch handling for mobile
    let lastTouchDistance = 0;
    let lastTouchX = 0, lastTouchY = 0;

    function onTouchStart(event) {
      event.preventDefault();
      if (event.touches.length === 1) {
        // Single touch - rotation
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        // Two touches - zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    }

    function onTouchMove(event) {
      event.preventDefault();
      if (event.touches.length === 1) {
        // Single touch - rotation
        const deltaX = event.touches[0].clientX - lastTouchX;
        const deltaY = event.touches[0].clientY - lastTouchY;

        // Fix rotation direction for intuitive touch controls
        // Same as mouse controls for consistency
        targetRotationY -= deltaX * 0.01;  // Inverted horizontal (correct)
        targetRotationX += deltaY * 0.01;  // Normal vertical (drag up = tilt up)
        targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));

        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        // Two touches - zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance > 0) {
          const delta = (lastTouchDistance - distance) * 0.01;
          targetDistance += delta;
          targetDistance = Math.max(MIN_ZOOM_DISTANCE, Math.min(MAX_ZOOM_DISTANCE, targetDistance));
        }

        lastTouchDistance = distance;
      }
    }

    function onTouchEnd(event) {
      event.preventDefault();
      lastTouchDistance = 0;
    }

    // Update camera position in animation loop
    function updateManualCamera() {
      // Smooth interpolation for damping effect
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;
      cameraDistance += (targetDistance - cameraDistance) * 0.05;

      // Update camera position
      const x = cameraDistance * Math.sin(currentRotationY) * Math.cos(currentRotationX);
      const y = cameraDistance * Math.sin(currentRotationX);
      const z = cameraDistance * Math.cos(currentRotationY) * Math.cos(currentRotationX);

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
    }

    // Create a manual controls object to mimic the API
    controls = {
      update: updateManualCamera,
      enabled: true,
      autoRotate: false,
      addEventListener: () => {}, // Stub for compatibility
      minDistance: MIN_ZOOM_DISTANCE,
      maxDistance: MAX_ZOOM_DISTANCE
    };

    domElement.style.cursor = 'grab';
    console.log('✅ Manual controls implemented successfully');
  }

  function animate() {
    requestAnimationFrame(animate);

    // Update controls (both CDN-loaded and manual)
    if (controls && controls.update) {
      controls.update();
    }

    // Auto-rotate Earth when enabled and no user interaction
    if (controls && controls.autoRotate && !isUserInteracting()) {
      earth.rotation.y += 0.005;
    } else if (!controls) {
      // Fallback rotation if no controls at all
      earth.rotation.y += 0.005;
    }

    // Update adaptive marker scaling based on camera distance
    updateMarkerScaling();

    // Enhanced marker animations with adaptive scaling
    const time = Date.now() * 0.001;
    markers.forEach(markerGroup => {
      // Enhanced pulsing effect for main marker
      const marker = markerGroup.userData.marker;
      const glowRing = markerGroup.userData.glowRing;
      const outerGlow = markerGroup.userData.outerGlow;

      // Get adaptive scale factor
      const adaptiveScale = markerGroup.userData.adaptiveScale || 1.0;

      if (marker) {
        // Main marker pulsing with adaptive scaling
        const pulseScale = 1 + 0.15 * Math.sin(time * 2.5);
        marker.scale.setScalar(pulseScale * adaptiveScale);

        // Dynamic emissive intensity for better visibility in all lighting
        const baseIntensity = 0.8;
        const pulseIntensity = 0.3 * Math.sin(time * 4);
        marker.material.emissiveIntensity = baseIntensity + pulseIntensity;
      }

      if (glowRing) {
        // Glow ring with different frequency and adaptive scaling
        const pulseScale = 1 + 0.2 * Math.sin(time * 3);
        glowRing.scale.setScalar(pulseScale * adaptiveScale);

        // Opacity pulsing for glow effect (reduced at larger scales to avoid overwhelming)
        const baseOpacity = 0.8 * Math.min(1.0, 1.5 / adaptiveScale);
        const pulseOpacity = 0.2 * Math.sin(time * 2);
        glowRing.material.opacity = baseOpacity + pulseOpacity;

        // Emissive intensity variation
        glowRing.material.emissiveIntensity = 0.7 + 0.2 * Math.sin(time * 3.5);
      }

      if (outerGlow) {
        // Outer glow with slower animation and adaptive scaling
        const pulseScale = 1 + 0.3 * Math.sin(time * 1.5);
        outerGlow.scale.setScalar(pulseScale * adaptiveScale);

        // Subtle opacity pulsing (reduced at larger scales)
        const baseOpacity = 0.3 * Math.min(1.0, 1.2 / adaptiveScale);
        const pulseOpacity = 0.2 * Math.sin(time * 1.8);
        outerGlow.material.opacity = baseOpacity + pulseOpacity;

        // Gentle emissive intensity variation
        outerGlow.material.emissiveIntensity = 0.4 + 0.1 * Math.sin(time * 2.2);
      }
    });

    // Update day/night lighting more frequently for smooth transitions
    const now = Date.now();
    if (now - lastSunUpdate >= 30000) { // Update every 30 seconds in animation loop
      updateSunPosition();
      lastSunUpdate = now;
    }

    // Monitor and update LOD system based on camera distance
    updateLODSystem();

    // Animate space background elements
    animateSpaceBackground();

    // Update connection arrow position if dialog is open
    updateConnectionArrow();

    renderer.render(scene, camera);
  }

  // Update LOD system based on camera distance
  function updateLODSystem() {
    if (!window.earthLOD || !camera) return;

    const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const lod = window.earthLOD;
    let newLevel = 'high';

    // Determine appropriate LOD level
    if (cameraDistance > lod.zoomThresholds.low) {
      newLevel = 'low';
    } else if (cameraDistance > lod.zoomThresholds.medium) {
      newLevel = 'medium';
    } else {
      newLevel = 'high';
    }

    // Update LOD if changed
    if (newLevel !== lod.currentLevel) {
      lod.currentLevel = newLevel;
      console.log(`🔧 LOD updated to ${newLevel} level (distance: ${cameraDistance.toFixed(1)})`);

      // Adjust texture filtering based on distance
      if (lod.baseTexture) {
        switch (newLevel) {
          case 'high':
            lod.baseTexture.minFilter = THREE.LinearMipmapLinearFilter;
            lod.baseTexture.magFilter = THREE.LinearFilter;
            break;
          case 'medium':
            lod.baseTexture.minFilter = THREE.LinearMipmapNearestFilter;
            lod.baseTexture.magFilter = THREE.LinearFilter;
            break;
          case 'low':
            lod.baseTexture.minFilter = THREE.NearestMipmapLinearFilter;
            lod.baseTexture.magFilter = THREE.NearestFilter;
            break;
        }
        lod.baseTexture.needsUpdate = true;
      }
    }
  }

  // Update adaptive marker scaling based on camera distance
  function updateMarkerScaling() {
    if (!camera || markers.length === 0) return;

    // Calculate camera distance from Earth center
    const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));

    // Define scaling parameters based on MapControls limits
    const minDistance = 0.6 * EARTH_RADIUS; // Closest zoom (markers should be smallest)
    const maxDistance = 5 * EARTH_RADIUS;   // Farthest zoom (markers should be largest)

    // Calculate adaptive scale factor (inverse relationship with distance)
    // When camera is close (small distance), scale should be small
    // When camera is far (large distance), scale should be large
    const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - minDistance) / (maxDistance - minDistance)));

    // Scale factor ranges from 0.3 (close) to 2.0 (far) with smooth curve
    const minScale = 0.3;
    const maxScale = 2.0;
    const adaptiveScale = minScale + (maxScale - minScale) * Math.pow(normalizedDistance, 0.7);

    // Debug logging (throttled to avoid spam)
    if (!window.lastScaleLog || Date.now() - window.lastScaleLog > 2000) {
      console.log(`📏 Adaptive scaling: distance=${cameraDistance.toFixed(1)}, normalized=${normalizedDistance.toFixed(2)}, scale=${adaptiveScale.toFixed(2)}`);
      window.lastScaleLog = Date.now();
    }

    // Apply adaptive scaling to all markers
    markers.forEach(markerGroup => {
      if (markerGroup.userData) {
        // Store the adaptive scale for use in animation
        markerGroup.userData.adaptiveScale = adaptiveScale;

        // Apply base scaling to all marker components
        const marker = markerGroup.userData.marker;
        const glowRing = markerGroup.userData.glowRing;
        const outerGlow = markerGroup.userData.outerGlow;

        if (marker) {
          // Base scale will be modified by pulsing animation
          marker.userData.baseScale = adaptiveScale;
        }

        if (glowRing) {
          glowRing.userData.baseScale = adaptiveScale;
        }

        if (outerGlow) {
          outerGlow.userData.baseScale = adaptiveScale;
        }
      }
    });
  }

  // Enhanced space background animation with prominent individual star twinkling
  function animateSpaceBackground() {
    if (!window.spaceBackground || !window.spaceBackground.stars) return;

    const time = Date.now() * 0.001; // Time in seconds for better control
    const bg = window.spaceBackground;

    // Subtle rotation of star field for parallax effect (unchanged)
    bg.stars.rotation.y = time * 0.0001 * 0.1;
    bg.stars.rotation.x = Math.sin(time * 0.0001 * 0.3) * 0.05;

    // Enhanced individual star twinkling animation
    if (bg.starGeometry && bg.originalColors && bg.originalSizes) {
      const colors = bg.starGeometry.attributes.color.array;
      const sizes = bg.starGeometry.attributes.size.array;
      const twinklePhases = bg.twinklePhases;
      const twinkleFreqs = bg.twinkleFreqs;

      // Update each star's twinkling individually
      for (let i = 0; i < bg.starCount; i++) {
        const i3 = i * 3;

        // Calculate individual twinkling intensity with enhanced amplitude
        const phase = twinklePhases[i] + time * twinkleFreqs[i];
        const twinkleIntensity = 0.7 + 0.3 * Math.sin(phase); // Enhanced from 0.1 to 0.3 amplitude

        // Apply twinkling to color (brightness variation)
        colors[i3] = bg.originalColors[i3] * twinkleIntensity;         // Red
        colors[i3 + 1] = bg.originalColors[i3 + 1] * twinkleIntensity; // Green
        colors[i3 + 2] = bg.originalColors[i3 + 2] * twinkleIntensity; // Blue

        // Apply subtle size variation for enhanced sparkle effect
        const sizeVariation = 0.8 + 0.4 * Math.sin(phase * 1.3); // Slightly different frequency for size
        sizes[i] = bg.originalSizes[i] * sizeVariation;
      }

      // Mark attributes as needing update
      bg.starGeometry.attributes.color.needsUpdate = true;
      bg.starGeometry.attributes.size.needsUpdate = true;
    }

    // Enhanced overall material opacity variation for atmospheric effect
    if (bg.starMaterial) {
      // Subtle overall brightness variation to simulate atmospheric scintillation
      const atmosphericTwinkle = 0.95 + 0.05 * Math.sin(time * 0.5);
      bg.starMaterial.opacity = atmosphericTwinkle;
    }
  }

  // Helper function to detect user interaction
  function isUserInteracting() {
    // For CDN-loaded controls, check if they're currently being used
    if (controls && controls.constructor.name === 'MapControls' || controls.constructor.name === 'OrbitControls') {
      return controls.enabled && (controls._state !== undefined ? controls._state !== 0 : false);
    }
    // For manual controls, we handle this in the manual control logic
    return false;
  }

  // Handle window resize
  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', handleResize);

  // Create enhanced achievements dialog with comprehensive information
  function createAchievementsDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'achievements-drawer';
    drawer.className = 'achievements-drawer hidden';

    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="location-header">
          <h2 id="drawer-location-name">Location Details</h2>
          <div class="location-subtitle">
            <span id="drawer-location-role">Role</span> •
            <span id="drawer-location-established">Est. Year</span>
          </div>
        </div>
        <button id="drawer-close" class="drawer-close-btn" aria-label="Close dialog">×</button>
      </div>

      <div class="drawer-body">
        <!-- Location Information Section -->
        <div class="location-info-section">
          <div class="location-description">
            <p id="drawer-location-description">Location description</p>
          </div>

          <div class="location-stats">
            <div class="stat-item">
              <div class="stat-label">Employees</div>
              <div class="stat-value" id="drawer-employees">-</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Established</div>
              <div class="stat-value" id="drawer-established">-</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Focus Areas</div>
              <div class="stat-value" id="drawer-focus">-</div>
            </div>
          </div>
        </div>

        <!-- Achievement Filters -->
        <div class="achievement-filters">
          <h3>Achievements & Recognition</h3>
          <div class="filter-controls">
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
        </div>

        <!-- Achievements List -->
        <div class="drawer-content">
          <div id="drawer-achievements-list" role="list"></div>
        </div>
      </div>

      <!-- Visual Connection Arrow -->
      <div class="connection-arrow" id="connection-arrow">
        <div class="arrow-line"></div>
        <div class="arrow-head"></div>
      </div>
    `;

    document.body.appendChild(drawer);

    // Event listeners
    document.getElementById('drawer-close').addEventListener('click', closeAchievementsDrawer);
    document.getElementById('drawer-category-filter').addEventListener('change', updateDrawerContent);
    document.getElementById('drawer-year-filter').addEventListener('change', updateDrawerContent);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
        closeAchievementsDrawer();
      }
    });

    return drawer;
  }

  // Open achievements drawer with comprehensive information
  function openAchievementsDrawer(location) {
    let drawer = document.getElementById('achievements-drawer');
    if (!drawer) {
      drawer = createAchievementsDrawer();
    }

    currentLocation = location;

    // Populate location header information
    document.getElementById('drawer-location-name').textContent = location.name;
    document.getElementById('drawer-location-role').textContent = location.role || 'Office';
    document.getElementById('drawer-location-established').textContent = `Est. ${location.established || 'N/A'}`;

    // Populate location description
    document.getElementById('drawer-location-description').textContent =
      location.description || 'Strategic business location driving company growth and innovation.';

    // Populate location statistics
    document.getElementById('drawer-employees').textContent =
      location.employees ? location.employees.toLocaleString() : 'N/A';
    document.getElementById('drawer-established').textContent = location.established || 'N/A';
    document.getElementById('drawer-focus').textContent =
      location.focus ? location.focus.join(', ') : 'General Operations';

    // Reset filters
    document.getElementById('drawer-category-filter').value = 'all';
    document.getElementById('drawer-year-filter').value = 'all';

    // Update achievements content
    updateDrawerContent();

    // Position and show visual connection arrow
    positionConnectionArrow(location);

    // Show drawer with animation
    drawer.classList.remove('hidden');

    // Add smooth entrance animation
    setTimeout(() => {
      drawer.classList.add('drawer-visible');
    }, 10);

    console.log('📍 Opened location details for:', location.name);
  }

  // Close achievements drawer
  function closeAchievementsDrawer() {
    const drawer = document.getElementById('achievements-drawer');
    if (drawer) {
      drawer.classList.remove('drawer-visible');
      setTimeout(() => {
        drawer.classList.add('hidden');
      }, 300); // Match CSS transition duration
    }
    currentLocation = null;
    console.log('📍 Closed location details');
  }

  // Update drawer content based on filters
  function updateDrawerContent() {
    if (!currentLocation) return;

    const categoryFilter = document.getElementById('drawer-category-filter').value;
    const yearFilter = document.getElementById('drawer-year-filter').value;
    const achievementsList = document.getElementById('drawer-achievements-list');

    let filteredAchievements = currentLocation.achievements || [];

    // Apply filters
    if (categoryFilter !== 'all') {
      filteredAchievements = filteredAchievements.filter(a => a.category === categoryFilter);
    }
    if (yearFilter !== 'all') {
      filteredAchievements = filteredAchievements.filter(a => a.year.toString() === yearFilter);
    }

    // Clear and populate achievements
    achievementsList.innerHTML = '';

    if (filteredAchievements.length === 0) {
      achievementsList.innerHTML = `
        <div class="no-achievements">
          <div class="no-achievements-icon">🏆</div>
          <div class="no-achievements-text">No achievements match current filters</div>
          <div class="no-achievements-hint">Try adjusting the category or year filters above</div>
        </div>
      `;
      return;
    }

    // Create achievement items with comprehensive information
    filteredAchievements.forEach((achievement, index) => {
      const achievementDiv = document.createElement('div');
      achievementDiv.className = `drawer-achievement-item ${achievement.category}`;
      achievementDiv.setAttribute('role', 'listitem');
      achievementDiv.setAttribute('tabindex', '0');

      // Format metrics for display
      const metricsHtml = achievement.metrics ?
        Object.entries(achievement.metrics).map(([key, value]) =>
          `<span class="metric-badge">${key}: ${value}</span>`
        ).join('') : '';

      achievementDiv.innerHTML = `
        <div class="achievement-header">
          <div class="achievement-title">${achievement.title}</div>
          <div class="achievement-meta">
            <span class="achievement-year">${achievement.year}</span>
            <span class="achievement-category-badge ${achievement.category}">${achievement.category}</span>
          </div>
        </div>

        <div class="achievement-description">${achievement.description || 'Outstanding achievement in ' + achievement.category}</div>

        ${achievement.impact ? `
          <div class="achievement-impact">
            <div class="impact-label">Impact:</div>
            <div class="impact-text">${achievement.impact}</div>
          </div>
        ` : ''}

        ${metricsHtml ? `
          <div class="achievement-metrics">
            <div class="metrics-label">Key Metrics:</div>
            <div class="metrics-list">${metricsHtml}</div>
          </div>
        ` : ''}
      `;

      // Add click handler for expansion (future enhancement)
      achievementDiv.addEventListener('click', () => {
        achievementDiv.classList.toggle('expanded');
      });

      // Keyboard accessibility
      achievementDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          achievementDiv.classList.toggle('expanded');
        }
      });

      achievementsList.appendChild(achievementDiv);
    });

    console.log(`📊 Displayed ${filteredAchievements.length} achievements for ${currentLocation.name}`);
  }

  // Position visual connection arrow between marker and dialog
  function positionConnectionArrow(location) {
    const arrow = document.getElementById('connection-arrow');
    if (!arrow) return;

    // Find the marker for this location
    const marker = markers.find(m => m.userData.name === location.name);
    if (!marker) return;

    // Get marker's screen position
    const markerPosition = marker.position.clone();
    markerPosition.project(camera);

    // Convert to screen coordinates
    const markerScreenX = (markerPosition.x * 0.5 + 0.5) * window.innerWidth;
    const markerScreenY = (markerPosition.y * -0.5 + 0.5) * window.innerHeight;

    // Get drawer position (assuming it's on the right side)
    const drawer = document.getElementById('achievements-drawer');
    const drawerRect = drawer.getBoundingClientRect();
    const drawerX = drawerRect.left;
    const drawerY = drawerRect.top + drawerRect.height * 0.3; // Point to upper part of drawer

    // Calculate arrow position and rotation
    const deltaX = drawerX - markerScreenX;
    const deltaY = drawerY - markerScreenY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    // Position and style the arrow
    arrow.style.left = markerScreenX + 'px';
    arrow.style.top = markerScreenY + 'px';
    arrow.style.width = distance + 'px';
    arrow.style.transform = `rotate(${angle}deg)`;
    arrow.style.display = 'block';

    // Add pulsing animation to draw attention
    arrow.classList.add('arrow-pulse');

    console.log(`🎯 Positioned connection arrow from marker to dialog`);
  }

  // Update arrow position when camera moves
  function updateConnectionArrow() {
    if (currentLocation && !document.getElementById('achievements-drawer').classList.contains('hidden')) {
      positionConnectionArrow(currentLocation);
    }
  }

  // Setup all event handlers
  function setupEventHandlers() {
    console.log('     🖱️ Setting up click handlers...');
    setupClickHandlers();

    console.log('     📱 Setting up resize handlers...');
    setupResizeHandlers();

    console.log('     ⌨️ Setting up keyboard handlers...');
    setupKeyboardHandlers();
  }

  // Setup click handlers for marker interaction
  function setupClickHandlers() {
    if (!renderer || !renderer.domElement) {
      console.error('❌ Renderer not available for click handlers');
      return;
    }

    renderer.domElement.addEventListener('click', function(event) {
      try {
        // Prevent click during camera movement
        if (isUserInteracting && isUserInteracting()) {
          return;
        }

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        // Enhanced raycasting for marker groups with better precision
        raycaster.params.Points.threshold = 0.1;

        // Create array of all marker objects for raycasting
        const markerObjects = [];
        markers.forEach(markerGroup => {
          if (markerGroup.userData.marker) {
            markerObjects.push(markerGroup.userData.marker);
          }
          if (markerGroup.userData.glowRing) {
            markerObjects.push(markerGroup.userData.glowRing);
          }
          if (markerGroup.userData.outerGlow) {
            markerObjects.push(markerGroup.userData.outerGlow);
          }
        });

        const intersects = raycaster.intersectObjects(markerObjects);

        if (intersects.length > 0) {
          // Found a marker click - get the parent group
          const clickedObject = intersects[0].object;
          let markerGroup = null;

          // Find the parent marker group
          markers.forEach(group => {
            if (group.userData.marker === clickedObject ||
                group.userData.glowRing === clickedObject ||
                group.userData.outerGlow === clickedObject) {
              markerGroup = group;
            }
          });

          if (markerGroup) {
            console.log('🎯 Clicked marker:', markerGroup.userData.name);

            // Enhanced visual feedback for clicked marker
            const marker = markerGroup.userData.marker;
            const glowRing = markerGroup.userData.glowRing;
            const originalColor = markerGroup.userData.originalColor;

            if (marker) {
              marker.material.emissiveIntensity = 1.2; // Bright flash
              marker.material.emissive.setHex(0xFFFFFF); // White flash

              setTimeout(() => {
                marker.material.emissiveIntensity = 0.8;
                marker.material.emissive.setHex(originalColor.emissive);
              }, 300);
            }

            if (glowRing) {
              glowRing.material.emissiveIntensity = 1.0;
              setTimeout(() => {
                glowRing.material.emissiveIntensity = 0.6;
              }, 300);
            }

            showAchievementModal(markerGroup.userData);
          }
        } else {
          // Clicked empty space - close drawer if open
          console.log('🎯 Clicked empty space - closing dialog');
          closeAchievementModal();
        }
      } catch (error) {
        console.error('❌ Error in click handler:', error);
      }
    });
  }

  // Setup window resize handlers
  function setupResizeHandlers() {
    window.addEventListener('resize', function() {
      try {
        if (camera && renderer) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          console.log('📱 Window resized, camera and renderer updated');
        }
      } catch (error) {
        console.error('❌ Error in resize handler:', error);
      }
    });
  }

  // Setup keyboard handlers
  function setupKeyboardHandlers() {
    document.addEventListener('keydown', function(event) {
      try {
        if (event.key === 'Escape') {
          closeAchievementModal();
          console.log('⌨️ Escape key pressed - closed dialog');
        }
      } catch (error) {
        console.error('❌ Error in keyboard handler:', error);
      }
    });
  }

  // Achievement Modal Functions
  function showAchievementModal(location) {
    const modal = document.getElementById('achievement-modal');
    if (!modal) {
      console.error('❌ Achievement modal not found in DOM');
      return;
    }

    // Update modal content
    updateModalContent(location);

    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('open');
    }, 10);

    // Store current location globally
    currentLocation = location;

    // Setup modal event handlers
    setupModalEventHandlers();

    console.log('📋 Achievement modal opened for:', location.name);
  }

  function updateModalContent(location) {
    // Update location information
    document.getElementById('modal-location-name').textContent = location.name;
    document.getElementById('modal-established').textContent = location.established || 'N/A';
    document.getElementById('modal-employees').textContent =
      location.employees ? location.employees.toLocaleString() : 'N/A';
    document.getElementById('modal-role').textContent = location.role || 'Office';
    document.getElementById('modal-description').textContent =
      location.description || 'Strategic business location driving company growth and innovation.';

    // Update achievements list
    updateModalAchievements(location.achievements || []);
  }

  function updateModalAchievements(achievements) {
    const achievementsList = document.getElementById('modal-achievements-list');
    if (!achievementsList) return;

    achievementsList.innerHTML = '';

    if (achievements.length === 0) {
      achievementsList.innerHTML = '<p style="text-align: center; color: #ccc;">No achievements found for this location.</p>';
      return;
    }

    achievements.forEach(achievement => {
      const achievementDiv = document.createElement('div');
      achievementDiv.className = `modal-achievement-item ${achievement.category}`;

      achievementDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <h4 style="margin: 0; color: #00BFFF; font-size: 18px;">${achievement.title}</h4>
          <span style="background: rgba(0, 191, 255, 0.2); color: #00BFFF; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${achievement.year}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span style="background: rgba(255, 255, 255, 0.1); color: #fff; padding: 3px 8px; border-radius: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${achievement.category}</span>
        </div>
        <p style="margin: 10px 0; color: #ddd; line-height: 1.5;">${achievement.description}</p>
        <div style="margin: 10px 0; padding: 10px; background: rgba(0, 191, 255, 0.1); border-radius: 8px; border-left: 3px solid #00BFFF;">
          <strong style="color: #00BFFF;">Impact:</strong> ${achievement.impact}
        </div>
        ${achievement.metrics ? `
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
            ${Object.entries(achievement.metrics).map(([key, value]) =>
              `<span style="background: rgba(50, 205, 50, 0.2); color: #32CD32; padding: 4px 8px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(50, 205, 50, 0.3);">
                ${key}: ${value}
              </span>`
            ).join('')}
          </div>
        ` : ''}
      `;

      achievementsList.appendChild(achievementDiv);
    });
  }

  function setupModalEventHandlers() {
    const modal = document.getElementById('achievement-modal');
    const closeBtn = document.getElementById('close-modal');
    const overlay = modal.querySelector('.modal-overlay');
    const categoryFilter = document.getElementById('modal-category-filter');
    const yearFilter = document.getElementById('modal-year-filter');

    // Close button
    if (closeBtn) {
      closeBtn.onclick = closeAchievementModal;
    }

    // Overlay click
    if (overlay) {
      overlay.onclick = closeAchievementModal;
    }

    // Filter handlers
    if (categoryFilter) {
      categoryFilter.onchange = () => filterModalAchievements();
    }

    if (yearFilter) {
      yearFilter.onchange = () => filterModalAchievements();
    }
  }

  function filterModalAchievements() {
    if (!currentLocation || !currentLocation.achievements) return;

    const categoryFilter = document.getElementById('modal-category-filter').value;
    const yearFilter = document.getElementById('modal-year-filter').value;

    let filteredAchievements = currentLocation.achievements;

    if (categoryFilter !== 'all') {
      filteredAchievements = filteredAchievements.filter(a => a.category === categoryFilter);
    }

    if (yearFilter !== 'all') {
      filteredAchievements = filteredAchievements.filter(a => a.year.toString() === yearFilter);
    }

    updateModalAchievements(filteredAchievements);
  }

  function closeAchievementModal() {
    const modal = document.getElementById('achievement-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('open');
      currentLocation = null;
      console.log('📋 Achievement modal closed');
    }
  }

  // Setup lighting controls functionality
  function setupLightingControls() {
    console.log('💡 Setting up lighting controls...');

    // Global lighting intensity variable
    let lightingIntensity = 1.0;

    // Get control elements
    const lightingModeSelect = document.getElementById('lighting-mode');
    const lightingIntensitySlider = document.getElementById('lighting-intensity');
    const intensityValueDisplay = document.getElementById('intensity-value');
    const atmosphericEffectsCheckbox = document.getElementById('atmospheric-effects');

    if (!lightingModeSelect || !lightingIntensitySlider || !intensityValueDisplay) {
      console.warn('⚠️ Lighting control elements not found');
      return;
    }

    // Update intensity display function
    function updateIntensityDisplay(value) {
      const percentage = Math.round(value * 100);
      intensityValueDisplay.textContent = `${percentage}%`;
    }

    // Apply lighting intensity to the scene
    function applyLightingIntensity(intensity) {
      if (!sunLight || !ambientLight) {
        console.warn('⚠️ Lighting objects not available yet');
        return;
      }

      // Store the base intensity
      lightingIntensity = intensity;

      // Get current lighting mode
      const currentMode = lightingModeSelect.value;

      // Get current day/night status for auto mode
      const now = new Date();
      const sunPos = calculateSunPosition();
      const isDay = sunPos.x > 0;
      const sunHeight = Math.max(0, sunPos.x / 50);

      // Apply intensity based on current mode with enhanced ranges for visibility
      switch (currentMode) {
        case 'day':
          // Day mode: Enhanced intensity range for dramatic effect
          sunLight.intensity = Math.max(0.1, 2.5 * intensity); // Range: 0.25 to 5.0
          sunLight.color.setHex(0xffffff);
          ambientLight.intensity = Math.max(0.05, 0.8 * intensity); // Range: 0.08 to 1.6
          ambientLight.color.setHex(0xffffff);
          ambientLight.visible = true;
          if (nightAmbientLight) nightAmbientLight.visible = false;
          break;

        case 'night':
          // Night mode: Enhanced intensity range for dramatic effect
          sunLight.intensity = Math.max(0.01, 0.2 * intensity); // Range: 0.02 to 0.4
          sunLight.color.setHex(0x4444aa);
          ambientLight.intensity = Math.max(0.02, 0.15 * intensity); // Range: 0.015 to 0.3
          ambientLight.color.setHex(0x404040);
          if (nightAmbientLight) {
            nightAmbientLight.intensity = Math.max(0.05, 0.4 * intensity); // Range: 0.04 to 0.8
            nightAmbientLight.visible = true;
          }
          ambientLight.visible = true;
          break;

        case 'auto':
        default:
          // Auto mode: Dynamic lighting based on GMT time with enhanced intensity multiplier
          if (isDay) {
            // Daylight with enhanced user intensity
            const baseSunIntensity = 1.5 + sunHeight * 0.5; // Base range: 1.5 to 2.0
            const baseAmbientIntensity = 0.6 + sunHeight * 0.2; // Base range: 0.6 to 0.8

            sunLight.intensity = Math.max(0.1, baseSunIntensity * intensity); // Range: 0.15 to 4.0
            sunLight.color.setHex(0xffffff);
            ambientLight.intensity = Math.max(0.05, baseAmbientIntensity * intensity); // Range: 0.06 to 1.6
            ambientLight.color.setHex(0xffffff);
            ambientLight.visible = true;
            if (nightAmbientLight) nightAmbientLight.visible = false;
          } else {
            // Nighttime with enhanced user intensity
            sunLight.intensity = Math.max(0.01, 0.1 * intensity); // Range: 0.01 to 0.2
            sunLight.color.setHex(0x4444aa);
            ambientLight.intensity = Math.max(0.02, 0.12 * intensity); // Range: 0.012 to 0.24
            ambientLight.color.setHex(0x404040);
            if (nightAmbientLight) {
              nightAmbientLight.intensity = Math.max(0.05, 0.35 * intensity); // Range: 0.035 to 0.7
              nightAmbientLight.visible = true;
            }
            ambientLight.visible = true;
          }
          break;
      }

      console.log(`💡 Applied lighting intensity: ${intensity} (${Math.round(intensity * 100)}%) - Mode: ${currentMode}`);
    }

    // Lighting intensity slider event listener
    lightingIntensitySlider.addEventListener('input', function(event) {
      const intensity = parseFloat(event.target.value);
      updateIntensityDisplay(intensity);
      applyLightingIntensity(intensity);
    });

    // Lighting mode change event listener
    lightingModeSelect.addEventListener('change', function(event) {
      const mode = event.target.value;
      console.log(`🌅 Lighting mode changed to: ${mode}`);

      // Reapply current intensity with new mode
      applyLightingIntensity(lightingIntensity);

      // Update day/night indicator
      const indicator = document.getElementById('day-night-indicator');
      const status = document.getElementById('lighting-status');

      if (indicator && status) {
        // Remove existing mode classes
        indicator.classList.remove('day', 'night', 'transition');

        switch (mode) {
          case 'day':
            indicator.classList.add('day');
            status.textContent = 'Always Day Mode';
            break;
          case 'night':
            indicator.classList.add('night');
            status.textContent = 'Always Night Mode';
            break;
          case 'auto':
            indicator.classList.add('transition');
            status.textContent = 'Auto GMT Mode';
            break;
        }
      }
    });

    // Atmospheric effects toggle
    if (atmosphericEffectsCheckbox) {
      atmosphericEffectsCheckbox.addEventListener('change', function(event) {
        const enabled = event.target.checked;
        console.log(`🌫️ Atmospheric effects: ${enabled ? 'enabled' : 'disabled'}`);

        // Toggle atmosphere visibility if it exists
        if (typeof atmosphere !== 'undefined' && atmosphere) {
          atmosphere.visible = enabled;
        }
      });
    }

    // Initialize with default values
    updateIntensityDisplay(lightingIntensity);
    applyLightingIntensity(lightingIntensity);

    console.log('✅ Lighting controls setup complete');
  }

  console.log('🌍 Globe setup complete');
});
