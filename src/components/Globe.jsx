// src/components/Globe.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const GlobeComponent = ({ filters = { category: 'all', year: 'all' } }) => {
  const globeRef = useRef();
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const scene = new THREE.Scene();

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

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000011);
    globeRef.current.appendChild(renderer.domElement);

    // Create a 3D Globe using Three.js Globe library
    const globe = new ThreeGlobe() // Correct instantiation
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg') // Earth texture
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png'); // Bump map for terrain    const globeMesh = globe; // Corrected instantiation
    globeMesh.scale.set(0.05, 0.05, 0.05); // Scale the globe to radius 5
    scene.add(globeMesh);    // Add realistic atmosphere with multiple layers
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
      vec3 atmosColor = mix(vec3(0.1, 0.3, 0.8), vec3(0.6, 0.8, 1.0), lightIntensity); // Adjusted colors for realism
      gl_FragColor = vec4(atmosColor, intensity * 0.8); // Increased intensity for better effect
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

    // Create advanced markers
    const markers = [];
    locations.forEach((location) => {
      const markerGroup = new THREE.Group();

      // Main marker
      const markerGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        emissive: 0xff4444,
        emissiveIntensity: 0.5
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);

      // Pulsing ring
      const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);

      // Convert lat/lng to 3D coordinates
      const phi = (90 - location.lat) * (Math.PI / 180);
      const theta = (location.lng + 180) * (Math.PI / 180);
      const x = -(5.15 * Math.sin(phi) * Math.cos(theta));
      const y = 5.15 * Math.cos(phi);
      const z = 5.15 * Math.sin(phi) * Math.sin(theta);

      marker.position.set(x, y, z);
      ring.position.copy(marker.position);
      ring.lookAt(0, 0, 0);

      markerGroup.add(marker);
      markerGroup.add(ring);
      markerGroup.userData = location;
      markers.push({ group: markerGroup, marker, ring, originalPos: marker.position.clone() });
      scene.add(markerGroup);
    });

    // Advanced lighting setup for day/night terminator
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(10, 0, 0);
    scene.add(sunLight);

    // Add rim lighting
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rimLight.position.set(-10, 0, 0);
    scene.add(rimLight);

    // Camera positioning and controls
    camera.position.set(12, 3, 12);
    camera.lookAt(0, 0, 0);

    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;
    let rotationX = 0;
    let rotationY = 0;

    const handleMouseMove = (event) => {
      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        rotationY += deltaX * 0.005;
        rotationX += deltaY * 0.005;
        rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationX));

        globeMesh.rotation.y = rotationY;
        globeMesh.rotation.x = rotationX;
        atmosphere.rotation.copy(globeMesh.rotation);

        // Update marker positions
        markers.forEach(({ group, marker, ring, originalPos }) => {
          const newPos = originalPos.clone();
          newPos.applyEuler(new THREE.Euler(rotationX, rotationY, 0));
          marker.position.copy(newPos);
          ring.position.copy(newPos);
          ring.lookAt(0, 0, 0);
        });
      }
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseDown = () => {
      isMouseDown = true;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleClick = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const markerMeshes = markers.map(m => m.marker);
      const intersects = raycaster.intersectObjects(markerMeshes);
      if (intersects.length > 0) {
        const clickedMarker = markers.find(m => m.marker === intersects[0].object);
        if (clickedMarker) {
          setSelectedLocation(clickedMarker.group.userData);
        }
      } else {
        setSelectedLocation(null);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

      // Slow auto-rotation
      if (!isMouseDown) {
        globeMesh.rotation.y += 0.001;
        atmosphere.rotation.y += 0.001;

        // Update marker positions for auto-rotation
        markers.forEach(({ marker, ring, originalPos }) => {
          const newPos = originalPos.clone();
          newPos.applyEuler(new THREE.Euler(0, globeMesh.rotation.y, 0));
          marker.position.copy(newPos);
          ring.position.copy(newPos);
          ring.lookAt(0, 0, 0);
        });
      }

      // Animate markers
      markers.forEach(({ ring }) => {
        ring.scale.setScalar(1 + 0.2 * Math.sin(time * 3));
        ring.material.opacity = 0.3 + 0.2 * Math.sin(time * 2);
      });

      // Rotate stars slowly
      stars.rotation.y += 0.0002;

      // Update atmosphere shader
      atmosphereMaterial.uniforms.time.value = time;

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="globe-wrapper">
      <div ref={globeRef} className="globe-container"></div>
      {selectedLocation && (
        <div className="location-tooltip">
          <h3>{selectedLocation.name}</h3>
          <p>{selectedLocation.description}</p>
          <button onClick={() => setSelectedLocation(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default GlobeComponent;
