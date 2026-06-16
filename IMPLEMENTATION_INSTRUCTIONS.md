# Campus Navigation - Required Code Changes

## CRITICAL: MapView.jsx Must Be Fixed for Heading-Based Navigation

---

## File 1: src/MapView.jsx

### Change 1: Add Missing Imports (Line 5)

**Current (lines 1-5):**
```javascript
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nodes, adjacency, locationData } from "./data";
```

**Add These Imports:**
```javascript
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nodes, adjacency, locationData } from "./data";
// ✅ ADD THESE THREE LINES:
import { useCompassHeading } from "./hooks/useCompassHeading";
import { useUserLocation } from "./hooks/useUserLocation";
import { useMapAutoRotate } from "./hooks/useMapAutoRotate";
```

---

### Change 2: Replace Geolocation Logic (Lines 55-160)

**Current (BROKEN - one-time snapshot):**
```javascript
    /* ---------- GEOLOCATION ---------- */
    navigator.geolocation.getCurrentPosition(pos => {

      const { latitude, longitude } = pos.coords;

      let nearest = null, min = Infinity;
      for (const k in nodes) {
        const d = haversine(latitude, longitude, nodes[k].lat, nodes[k].lon);
        if (d < min) { min = d; nearest = k; }
      }

      // Create temporary user node
      const tempNodes = { ...nodes, User: { lat: latitude, lon: longitude } };
      const tempAdjacency = { ...adjacency, User: [nearest] };
      tempAdjacency[nearest] = [...(adjacency[nearest] || []), "User"];

      const graph = buildGraph();
      const path = astar(graph, "User", actualDestId);

      const latlngs = path.map(p => [tempNodes[p].lat, tempNodes[p].lon]);
      L.polyline(latlngs, { color: "#007AFF", weight: 5 }).addTo(map);

      L.marker([latitude, longitude], { icon: redIcon })
        .addTo(map)
        .bindPopup("📍 You are here");

      L.marker([goal.lat, goal.lon], { icon: redIcon })
        .addTo(map)
        .bindPopup(destLocation.name || actualDestId);

      map.fitBounds(latlngs);

    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to get your location. Please enable location services.");
      navigate("/");
    });
```

**Replace With (NEW - continuous tracking with heading-based rotation):**
```javascript
    /* ---------- HEADING-BASED NAVIGATION HOOKS ---------- */
    const userMarkerRef = useRef(null);
    const polylineRef = useRef(null);
    const destMarkerRef = useRef(null);
    const routeCalculatedRef = useRef(false);
    
    const { heading, permissionStatus, requestPermission } = useCompassHeading();
    const { location: userLocation, error: gpsError } = useUserLocation({ throttleMs: 1000 });
    const { isAutoFollow, recenter } = useMapAutoRotate(map, userLocation, heading, {
      enabled: true,
      userMarker: userMarkerRef
    });

    /* ---------- INITIAL ROUTE CALCULATION ---------- */
    useEffect(() => {
      if (!map || routeCalculatedRef.current) return;

      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;

        let nearest = null, min = Infinity;
        for (const k in nodes) {
          const d = haversine(latitude, longitude, nodes[k].lat, nodes[k].lon);
          if (d < min) { min = d; nearest = k; }
        }

        // Create temporary user node for initial route calculation
        const tempNodes = { ...nodes, User: { lat: latitude, lon: longitude } };
        const tempAdjacency = { ...adjacency, User: [nearest] };
        tempAdjacency[nearest] = [...(adjacency[nearest] || []), "User"];

        const graph = buildGraph();
        const path = astar(graph, "User", actualDestId);

        const latlngs = path.map(p => [tempNodes[p].lat, tempNodes[p].lon]);
        
        // Draw route with counter-rotation class for heading-based nav
        polylineRef.current = L.polyline(latlngs, { 
          color: "#007AFF", 
          weight: 5,
          className: 'navigation-route-polyline'
        }).addTo(map);

        // Add destination marker
        destMarkerRef.current = L.marker([goal.lat, goal.lon], { icon: redIcon })
          .addTo(map)
          .bindPopup(destLocation.name || actualDestId);

        // Set initial view to route bounds
        map.fitBounds(latlngs);
        routeCalculatedRef.current = true;

      }, (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enable location services.");
        navigate("/");
      });
    }, [map, goal, actualDestId, destLocation]);

    /* ---------- LIVE USER LOCATION MARKER ---------- */
    useEffect(() => {
      if (!map || !userLocation) return;

      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'user-location-marker-container',
          html: `
            <div class="user-direction-indicator">
              <div class="user-pulse-ring"></div>
              <div class="user-direction-beam"></div>
              <div class="user-blue-dot"></div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          popupAnchor: [0, -24],
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
          .addTo(map)
          .bindPopup("📍 You are here");
      }
      // Position and rotation handled by useMapAutoRotate at 60FPS
    }, [map, userLocation]);
```

---

### Change 3: Add Controls (After Existing Controls)

**Find This (around line ~185-190):**
```javascript
  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <div id="map" style={{ height: "100%", width: "100%" }} />
      <button
        onClick={handleExit}
        ...
```

**Add Before the Exit Button:**
```javascript
  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <div id="map" style={{ height: "100%", width: "100%" }} />
      
      {/* Navigation Controls */}
      {map && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000 }}>
          <button 
            onClick={recenter}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(28, 28, 30, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
            title="Follow Me"
          >
            📍
          </button>
          {permissionStatus === 'prompt' && (
            <button 
              onClick={requestPermission}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(255, 215, 0, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                color: '#000000',
                fontSize: '18px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
              title="Enable Compass"
            >
              🧭
            </button>
          )}
        </div>
      )}
      
      <button
        onClick={handleExit}
        ...
```

---

## File 2: src/MapPage.css

### Change: Add Polyline Counter-Rotation Class

**Find This Section (around line 1279):**
```css
.minimal-pin,
.dest-marker-inner,
.leaflet-popup-content-wrapper,
.leaflet-popup-tip-container {
  transform: rotate(var(--map-rotation, 0deg));
  transform-origin: center;
  transition: transform 0.1s linear;
}
```

**Add This After (NEW CLASS):**
```css
/* Navigation route counter-rotation for heading-based navigation */
.navigation-route-polyline {
  transform: rotate(var(--map-rotation, 0deg));
  transform-origin: center;
  transition: transform 0.1s linear;
}
```

---

## Summary of Changes

| File | Location | Type | Lines | Status |
|------|----------|------|-------|--------|
| MapView.jsx | Line 1-5 | Imports | +3 | Add |
| MapView.jsx | Line 55 | Constants | +5 | Add |
| MapView.jsx | Line 60-160 | Geolocation Logic | ~150 | Replace |
| MapView.jsx | Line 190 | Controls | +35 | Add |
| MapPage.css | Line 1283 | CSS Class | +5 | Add |

**Total Changes:** ~200 lines of code

---

## Verification Checklist

After making these changes:

1. **Import Compilation:**
   - [ ] No "Module not found" errors
   - [ ] All three hooks import successfully

2. **Component Renders:**
   - [ ] MapView loads without errors
   - [ ] Map displays correctly
   - [ ] Initial route drawn correctly

3. **Location Tracking:**
   - [ ] GPS permission requested on app start
   - [ ] User position updates continuously
   - [ ] Blue dot updates every ~1 second

4. **Heading Detection:**
   - [ ] Compass calibration button appears (if iOS 13+)
   - [ ] After permission, user marker rotates with heading
   - [ ] User facing different directions = marker rotates

5. **Map Rotation:**
   - [ ] Map container rotates smoothly
   - [ ] 90° turn = map rotates 90°
   - [ ] 180° turn (U-turn) = smooth rotation (not 270°)
   - [ ] No jitter or stuttering

6. **Auto-Recentering:**
   - [ ] User always stays centered on screen
   - [ ] Walk forward = map scrolls beneath you
   - [ ] Walk sideways = map pans sideways
   - [ ] Walk backward = map scrolls backward (disorienting!)

7. **Route Alignment:**
   - [ ] Route stays aligned with your forward direction
   - [ ] Route doesn't "twist" when you turn
   - [ ] Destination marker rotates with map

8. **Control Buttons:**
   - [ ] "Follow Me" button visible
   - [ ] Click = map recenters and starts following
   - [ ] Compass button appears on iOS (if needed)
   - [ ] Click compass = request orientation permission

---

## Testing Scenarios

### Scenario 1: Straight Navigation
1. Open app → Select destination → START
2. Walk forward toward destination
3. **Expected:** Map stays centered, scrolls beneath you, shows destination ahead
4. **Check:** No rotation needed (forward direction already up)

### Scenario 2: 90° Turn
1. While navigating, turn 90° left
2. **Expected:** Map rotates smoothly 90° counter-clockwise
3. **Expected:** New forward direction now points left (visually)
4. **Check:** Route rotates with map, destination stays ahead

### Scenario 3: U-Turn
1. While navigating, walk in full circle (180°)
2. **Expected:** Map rotates 180° smoothly (shortest path)
3. **Expected:** Destination now appears behind you
4. **Check:** No spinning the long way (270°)

### Scenario 4: Manual Pan
1. While navigating, manually drag map sideways
2. **Expected:** Auto-follow disables (map stops rotating)
3. **Expected:** "Recenter Navigation" button appears
4. **Expected:** Click button = auto-follow re-enables

### Scenario 5: Jitter Test
1. Stand still while facing one direction
2. **Expected:** Map does NOT jitter or wobble
3. **Expected:** Marker does NOT rotate rapidly
4. **Check:** Smooth and stable (smoothing filters working)

---

## Debugging Tips

### If map doesn't rotate:
- [ ] Check browser console for errors
- [ ] Verify `useMapAutoRotate` hook is being called
- [ ] Check if heading is `null` (permission not granted)
- [ ] Try clicking compass button to request permission

### If user marker doesn't rotate:
- [ ] Check if heading is updating (console log `heading`)
- [ ] Verify marker has `user-direction-indicator` class
- [ ] Check CSS `--user-heading` variable is being set
- [ ] Try different device orientation

### If map stutters:
- [ ] Check if map zoom is animating
- [ ] Look for excessive marker re-renders
- [ ] Check network tab for tile loading delays
- [ ] Reduce GPS throttle from 1000ms to 500ms

### If recenter doesn't work:
- [ ] Check if `userLocation` is available
- [ ] Verify `isAutoFollow` state changes
- [ ] Check if map `setView` is being called
- [ ] Look for console errors

---

## Performance Considerations

### requestAnimationFrame Loop
- Runs at 60FPS
- Updates map rotation smoothly
- Updates user marker rotation independently
- Low CPU impact (CSS transforms only)

### GPS Updates
- Throttled to 1000ms (1 update per second)
- High accuracy enabled
- Haversine distance calculation for bearing
- 2m threshold before bearing recalculation

### Compass Updates
- Device orientation event every ~50ms
- Low-pass filter (α=0.15) smooths noise
- Independent from map rotation (α=0.1)
- Very low CPU impact

### Memory Impact
- User marker: 1 Leaflet marker + 1 div
- Route polyline: 1 Leaflet polyline
- Refs: 5 useRef hooks
- Overall: Negligible

---

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Mobile |
|---------|--------|--------|---------|--------|
| Geolocation | ✅ | ✅ | ✅ | ✅ |
| DeviceOrientation | ✅ | ✅ (iOS 13+) | ✅ | ✅ |
| CSS Transform | ✅ | ✅ | ✅ | ✅ |
| requestAnimationFrame | ✅ | ✅ | ✅ | ✅ |
| Heading-Based Nav | ✅ | ✅ (requires permission) | ✅ | ✅ |

**iOS 13+:** Requires explicit permission for DeviceOrientation (handled by `requestPermission()`)

---

**Ready to Implement:** All code is provided above  
**Estimated Time:** 2-4 hours  
**Testing Time:** 30-60 minutes  
**Total:** 3-5 hours to full implementation + testing
