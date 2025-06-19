# Enhanced Globe with Google Earth-style Features

This enhanced globe implementation provides a smooth, interactive 3D globe experience with accurate anchored labels, deep zoom capabilities, and click-to-show achievements functionality.

## Features

### ✅ **Accurate, Anchored Labels**
- Labels and markers stay exactly positioned at their lat/lng coordinates
- Labels remain visually glued to their spots regardless of camera tilt or zoom
- Auto-occlusion strategy prevents overlapping labels
- Progressive labeling system (continents → countries → cities)
- Gentle scaling based on zoom level

### ✅ **Smooth, Deep Zoom**
- Seamless zoom from whole-earth view down to ~5km altitude equivalent
- Camera distance range: 5.5 to 50 earth-radii units
- No hard stops or camera trapping
- Momentum and damping for Google Earth-like fluid motion
- MapControls with fallback to OrbitControls

### ✅ **Click → Show Achievements**
- Precise raycasting for marker selection
- Right-side achievements drawer with filtering
- Category and year filters synchronized with main page
- Keyboard accessibility support
- Smooth slide-in/out animations

### ✅ **Performance Optimizations**
- Efficient marker positioning using `latLngToVector3()` utility
- Auto-occlusion reduces rendering overhead
- Smooth animations with requestAnimationFrame
- Responsive design for mobile devices

### ✅ **Accessibility**
- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly

## Technical Implementation

### Position Math
- Uses `latLngToVector3(lat, lng, altitude)` for accurate sphere positioning
- Converts lat/lng to normalized Vector3 coordinates each frame
- Ensures camera changes never desync label placement

### Camera Controls
- **Primary**: MapControls for map-like interaction
- **Fallback**: OrbitControls if MapControls unavailable
- **Settings**:
  ```javascript
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = EARTH_RADIUS * 1.1;  // ~5.5 units
  controls.maxDistance = EARTH_RADIUS * 10;   // ~50 units
  ```

### Ray-casting for Clicks
- Uses THREE.Raycaster for precise marker intersection
- Handles marker mesh selection and location lookup
- Opens achievements drawer with filtered content

### Label Rendering
- HTML/CSS labels with CSS transforms for positioning
- Auto-occlusion algorithm prevents overlaps
- Priority-based display (continent > country > city)
- Smooth opacity and scale transitions

## Files Structure

```
standalone-example/
├── index.html              # Main HTML file
├── globe.js                # Enhanced globe implementation
├── styles.css              # Styles including achievements drawer
├── achievements-data.json  # Sample achievements dataset
└── README.md              # This file
```

## Usage

### Basic Setup
1. Include Three.js library
2. Load the enhanced globe.js file
3. Ensure achievements-data.json is accessible
4. The globe will automatically initialize on page load

### Swapping Achievement Datasets

To use your own achievements data, replace `achievements-data.json` with your dataset following this structure:

```json
[
  {
    "id": 1,
    "title": "Achievement Title",
    "category": "innovation",
    "location": "Location Name",
    "lat": 40.7128,
    "lng": -74.0060,
    "year": 2024,
    "description": "Detailed description of the achievement",
    "impact": "Impact statement describing the significance",
    "metrics": {
      "key1": "value1",
      "key2": "value2"
    }
  }
]
```

### Required Fields
- `id`: Unique identifier (number)
- `title`: Achievement title (string)
- `category`: One of: "award", "innovation", "sustainability", "operational", "partnership", "social"
- `location`: Must match a location name in the globe's location data
- `lat`, `lng`: Latitude and longitude coordinates (numbers)
- `year`: Year of achievement (number)
- `description`: Detailed description (string)
- `impact`: Impact statement (string)
- `metrics`: Object with key-value pairs for metrics

### Adding New Locations

To add new office locations, update the `locationData` array in `globe.js`:

```javascript
const locationData = [
  {
    id: 7,
    name: "New Office Name",
    lat: 12.9716,
    lng: 77.5946,
    description: "Office description",
    established: 2024,
    employees: 500,
    totalRevenue: "1.0B",
    marketShare: "15%",
    color: "#44aa88",
    achievements: [] // Will be populated from achievements-data.json
  }
];
```

### Customization

#### Zoom Limits
Adjust zoom limits in the constants:
```javascript
const MIN_ZOOM_DISTANCE = EARTH_RADIUS * 1.1; // Closest zoom
const MAX_ZOOM_DISTANCE = EARTH_RADIUS * 10;   // Farthest zoom
```

#### Label Visibility
Modify label visibility thresholds:
```javascript
{ name: "City Name", lat: 40.7128, lng: -74.0060, minZoom: 10, type: "city" }
```

#### Colors and Styling
Update category colors in `styles.css`:
```css
.drawer-achievement-item.innovation { border-left-color: #00BFFF; }
```

## Browser Compatibility

- Modern browsers with WebGL support
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- Mobile browsers with WebGL support

## Performance Notes

- Optimized for hundreds of achievements
- Auto-occlusion reduces label rendering overhead
- Efficient marker positioning and animation
- Responsive design adapts to screen size

## Troubleshooting

### Labels Not Appearing
- Check browser console for JavaScript errors
- Verify achievements-data.json is accessible
- Ensure location names match between data and locations

### Poor Performance
- Reduce number of visible labels by adjusting minZoom values
- Check for console errors
- Ensure WebGL is supported and enabled

### Controls Not Working
- Check if MapControls/OrbitControls are loading properly
- Verify Three.js version compatibility
- Check browser console for import errors
