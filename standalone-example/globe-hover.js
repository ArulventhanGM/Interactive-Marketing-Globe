/**
 * Hover Interaction for Globe Markers
 * Handles hover effects, leader lines, and tooltips
 */

// Store references to hover elements
let hoverLabel, hoverLine, hoveredMarker = null;

/**
 * Initialize hover interaction elements
 */
function initHoverInteraction() {
    // Create hover label container
    hoverLabel = document.createElement('div');
    hoverLabel.className = 'globe-hover-label';
    hoverLabel.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        pointer-events: none;
        font-size: 14px;
        max-width: 200px;
        text-align: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1000;
    `;
    document.body.appendChild(hoverLabel);

    // Create curved line for hover effect
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
    });
    
    hoverLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(hoverLine);
    
    // Setup raycaster for hover detection
    setupMarkerHover();
}

/**
 * Setup hover events for markers
 */
function setupMarkerHover() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Variables to track hover state
    let isHovering = false;
    
    function onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(markers, true);
        
        if (intersects.length > 0) {
            const marker = findParentMarker(intersects[0].object);
            if (marker && marker.userData) {
                if (!isHovering) {
                    onMarkerHover(marker);
                    isHovering = true;
                }
                updateHoverElements(marker, intersects[0].point);
                return;
            }
        }
        
        if (isHovering) {
            onMarkerHoverEnd();
            isHovering = false;
        }
    }
    
    window.addEventListener('mousemove', onMouseMove, false);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (hoveredMarker) {
            updateHoverElements(hoveredMarker);
        }
    });
}

/**
 * Find the parent marker group of an object
 */
function findParentMarker(object) {
    while (object && !object.userData?.isMarker) {
        object = object.parent;
        if (!object) return null;
    }
    return object;
}

/**
 * Handle marker hover
 */
function onMarkerHover(marker) {
    hoveredMarker = marker;
    
    // Get marker data
    const data = marker.userData;
    
    // Update label content
    hoverLabel.textContent = `${data.name} — ${data.role || 'Global Office'}${data.year ? ` since ${data.year}` : ''}`;
    hoverLabel.style.opacity = '1';
    
    // Show line
    hoverLine.material.opacity = 0.7;
    
    // Add highlight effect to marker
    if (marker.userData.marker) {
        marker.userData.marker.material.emissive.setHex(0xffffff);
        marker.userData.marker.material.emissiveIntensity = 0.5;
    }
}

/**
 * Handle end of marker hover
 */
function onMarkerHoverEnd() {
    hoverLabel.style.opacity = '0';
    hoverLine.material.opacity = 0;
    
    // Remove highlight from marker
    if (hoveredMarker?.userData?.marker) {
        const data = hoveredMarker.userData;
        hoveredMarker.userData.marker.material.emissive.set(data.originalColor.emissive || 0x000000);
        hoveredMarker.userData.marker.material.emissiveIntensity = 0.3;
    }
    
    hoveredMarker = null;
}

/**
 * Update hover elements position
 */
function updateHoverElements(marker, worldPosition) {
    if (!worldPosition) {
        const position = new THREE.Vector3();
        marker.getWorldPosition(position);
        worldPosition = position;
    }
    
    // Update line position (curve from marker to outside)
    const start = worldPosition.clone();
    const end = start.clone().normalize().multiplyScalar(EARTH_RADIUS * 1.5);
    
    // Create a curved line using a quadratic bezier curve
    const curve = new THREE.QuadraticBezierCurve3(
        start,
        new THREE.Vector3().lerpVectors(start, end, 0.5).add(new THREE.Vector3(0, 1, 0)),
        end
    );
    
    const points = curve.getPoints(20);
    hoverLine.geometry.setFromPoints(points);
    
    // Update label position
    const screenPosition = end.clone().project(camera);
    const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPosition.y * 0.5) + 0.5) * window.innerHeight;
    
    hoverLabel.style.left = `${x - hoverLabel.offsetWidth / 2}px`;
    hoverLabel.style.top = `${y - hoverLabel.offsetHeight - 10}px`;
    
    // Make sure label stays visible
    const rect = hoverLabel.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        hoverLabel.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
        hoverLabel.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
    if (rect.left < 0) {
        hoverLabel.style.left = '10px';
    }
    if (rect.top < 0) {
        hoverLabel.style.top = '10px';
    }
}

// Export functions for global access
window.initHoverInteraction = initHoverInteraction;
