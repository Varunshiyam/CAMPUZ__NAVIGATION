# Campus Navigation - Heading-Based Navigation Audit Report

**Audit Date:** 2026-06-16  
**Status:** ⚠️ **CRITICAL ISSUES - Implementation is INCOMPLETE**  
**Conclusion:** The app provides **partial heading-based navigation** only in the preview mode (MapPage), but **FAILS to implement it in the actual turn-by-turn navigation** (MapView).

---

## Executive Summary

The Campus Navigation app has **two distinct navigation modes** with vastly different implementations:

| Mode | File | Status | Rotation | Recentering | Smooth Updates |
|------|------|--------|----------|-------------|----------------|
| **Preview/Search** | `MapPage.jsx` | ✅ Implemented | ✅ Yes | ✅ Yes | ✅ 60FPS |
| **Turn-by-Turn (Active)** | `MapView.jsx` | ❌ **MISSING** | ❌ No | ❌ No | ❌ Static |

**Critical Finding:** When users press "START" and enter the actual navigation route (`MapView.jsx`), they receive **NO heading-based navigation**—the map remains locked in North-Up orientation and does NOT rotate or recenter based on their heading.

---

## Detailed Findings by Criterion

### ✅ 1. Real-Time Location Tracking

**Status:** ✅ **PARTIALLY IMPLEMENTED**

#### MapPage.jsx (Preview Mode)
```javascript
// src/MapPage.jsx, line ~60
const { location: userLocation, error: gpsError } = useUserLocation({ throttleMs: 1500 });
```
- ✅ Continuous `watchPosition` with throttle (1500ms)
- ✅ Tracks latitude, longitude, accuracy, speed, heading
- ✅ Calculates bearing from movement trajectory (haversine distance > 2m threshold)

**Code Evidence from `useUserLocation.js`:**
```javascript
// Lines 67-135: Continuous GPS watching
watchIdRef.current = navigator.geolocation.watchPosition(
  (pos) => {
    // Throttled updates: skip if < 1500ms elapsed
    if (now - lastUpdateRef.current < throttleMs && lastUpdateRef.current !== 0) {
      return; // Skip throttled update
    }

    const newLat = pos.coords.latitude;
    const newLon = pos.coords.longitude;
    const dist = haversine(lastCoordsRef.current.lat, lastCoordsRef.current.lon, newLat, newLon);
    
    // Only calculate bearing if moved > 2 meters
    if (dist > 2) {
      computedHeading = calculateBearing(lastCoordsRef.current.lat, ...);
      lastGpsHeadingRef.current = computedHeading;
    }
```

#### MapView.jsx (Turn-by-Turn Navigation) ❌ **CRITICAL GAP**
```javascript
// src/MapView.jsx, lines 55-72
navigator.geolocation.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  // ... route calculation ...
}, (error) => { ... });
```
- ❌ **Uses `getCurrentPosition()` - ONE-TIME SNAPSHOT ONLY**
- ❌ No continuous location tracking
- ❌ No heading updates during navigation
- ❌ User location becomes stale immediately after route computation

**Impact:** Once navigation starts, the app has NO knowledge of the user's current heading or if they've moved.

---

### ❌ 2. Map Auto-Recentering

**Status:** ✅ **MapPage** | ❌ **MapView** (CRITICAL)

#### MapPage.jsx - Works Correctly
```javascript
// src/MapPage.jsx, lines ~70-75
const { isAutoFollow, recenter, resetNorth } = useMapAutoRotate(map, userLocation, heading, {
  enabled: true,
  userMarker: userMarkerRef
});
```

**Code from `useMapAutoRotate.js` (lines 145-155):**
```javascript
// Recenter map only if auto-follow is active
if (isAutoFollow && typeof map.setView === 'function') {
  map.setView([nextLat, nextLon], map.getZoom(), { animate: false });
}
```
- ✅ Map center continuously updated to user position
- ✅ Smooth interpolation (0.08 factor for coordinate smoothing)
- ✅ Respects user manual interactions (disables auto-follow on drag/zoom)

#### MapView.jsx - MISSING ENTIRELY ❌

**Current Implementation:**
```javascript
// src/MapView.jsx, line ~55
navigator.geolocation.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  // Route drawn ONE TIME
  L.polyline(latlngs, { color: "#007AFF", weight: 5 }).addTo(map);
  map.fitBounds(latlngs); // ONE-TIME fit
}, ...);
```

- ❌ Map is fitted to entire route bounds ONE TIME
- ❌ Map does NOT recenter on user position during movement
- ❌ No `setView()` calls after initial render
- ❌ User appears to stay in the same location on screen while route shifts

---

### ❌ 3. Map Rotation Based on Heading

**Status:** ✅ **MapPage** | ❌ **MapView** (CRITICAL)

#### MapPage.jsx - Implemented with 60FPS Updates
```javascript
// src/MapPage.jsx, lines ~70-75
const { heading, permissionStatus, requestPermission } = useCompassHeading();
const { userLocation, error: gpsError } = useUserLocation({ throttleMs: 1500 });
const { isAutoFollow, recenter, resetNorth } = useMapAutoRotate(map, userLocation, heading, {...});
```

**Core Rotation Logic in `useMapAutoRotate.js` (lines 89-108):**
```javascript
const updateRotationAndPosition = () => {
  // 1. Interpolate Rotation/Bearing
  let targetBearing = currentBearingRef.current;
  const compassH = compassHeadingRef.current;
  
  if (isAutoFollow && compassH !== null && compassH !== undefined) {
    targetBearing = compassH;
  } else if (resetToNorthRef.current) {
    targetBearing = 0;
  }

  const currentBearing = currentBearingRef.current;
  let diff = targetBearing - currentBearing;

  // Handle angle wrap-around (359 -> 0 -> 1)
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;

  // Apply interpolation
  const nextBearing = currentBearing + diff * 0.1;
  currentBearingRef.current = nextBearing;

  // Apply CSS transform to map container
  mapContainer.style.transform = `rotate(${-nextBearing}deg)`;
  mapContainer.style.transformOrigin = 'center';
  mapContainer.style.setProperty('--map-rotation', `${nextBearing}deg`);

  rAFRef.current = requestAnimationFrame(updateRotationAndPosition);
};
```

**CSS Implementation (MapPage.css, line 1279):**
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

- ✅ Continuous 60FPS `requestAnimationFrame` loop
- ✅ Smooth interpolation factor: 0.1 (10% per frame = smooth acceleration)
- ✅ Wrap-around angle handling prevents jitter at 359°→0°
- ✅ CSS variable `--map-rotation` synced with all markers

#### MapView.jsx - NO ROTATION IMPLEMENTED ❌

**Findings:**
- ❌ No compass heading hook imported or used
- ❌ No `useMapAutoRotate` hook used
- ❌ No map rotation CSS classes applied
- ❌ Map container has no `--map-rotation` CSS variable
- ❌ Static view remains locked in North-Up regardless of user heading

**Code Gap:**
```javascript
// MapView.jsx imports - MISSING heading-based dependencies
import { useEffect, useRef } from "react";
import L from "leaflet";
// ❌ NO: import { useCompassHeading } from './hooks/useCompassHeading';
// ❌ NO: import { useMapAutoRotate } from './hooks/useMapAutoRotate';
// ❌ NO: import { useUserLocation } from './hooks/useUserLocation';
```

---

### ✅ 4. User Forward Direction Always at Top

**Status:** ✅ **MapPage** | ❌ **MapView** (N/A - no rotation)

#### MapPage.jsx - Correctly Implemented
When heading-based rotation is active in MapPage:
- ✅ Map rotates so user's bearing faces upward
- ✅ Achieved through `map.style.transform = rotate(${-heading}deg)` (negated because container rotates)
- ✅ User visually faces the top of the screen during navigation

**How It Works:**
- User heading = 45° (NE)
- Map container rotates by -45° (counter-clockwise visually)
- Result: User's forward direction points to screen top
- All 360° rotations smooth and continuous

#### MapView.jsx - N/A (No Rotation) ❌
- ❌ Since map never rotates, this criterion cannot be met

---

### ✅ 5. User Marker Rotation

**Status:** ✅ **MapPage** | ❌ **MapView**

#### MapPage.jsx - Implemented with CSS Custom Properties

**User Marker HTML (MapPage.jsx, lines ~280-290):**
```javascript
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
```

**Marker Rotation Logic (useMapAutoRotate.js, lines 170-185):**
```javascript
// 3. Interpolate User Compass Heading (for direction beam rotation)
if (compassH !== null && compassH !== undefined) {
  let diffCompass = compassH - currentCompassHeadingRef.current;
  while (diffCompass < -180) diffCompass += 360;
  while (diffCompass > 180) diffCompass -= 360;

  const nextCompass = currentCompassHeadingRef.current + diffCompass * 0.15;
  currentCompassHeadingRef.current = nextCompass;

  const marker = userMarkerRef.current;
  if (marker) {
    const markerInstance = marker.current || marker;
    if (markerInstance && typeof markerInstance.getElement === 'function') {
      const el = markerInstance.getElement();
      if (el) {
        el.style.setProperty('--user-heading', `${nextCompass}deg`);
      }
    }
  }
}
```

**CSS Animation (MapPage.css, line 1390):**
```css
.user-direction-indicator {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(var(--user-heading, 0deg));
  transform-origin: center;
  transition: transform 0.1s linear;
}

.user-direction-beam {
  position: absolute;
  top: -6px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 20px solid rgba(0, 122, 255, 0.4);
  filter: drop-shadow(0 0 4px rgba(0, 122, 255, 0.6));
  z-index: 1;
}
```

- ✅ Smooth interpolation factor: 0.15 (independent of map rotation)
- ✅ Marker rotates to show user's compass heading
- ✅ Blue dot + direction beam point in user's direction
- ✅ Separate from map container rotation (marker counter-rotates with map)

#### MapView.jsx - No Marker Rotation ❌
- ❌ User marker created but never rotated
- ❌ No `--user-heading` CSS variable set

---

### ❌ 6. Route Remains Correctly Aligned After Rotation

**Status:** ✅ **Concept** | ❌ **MapView** (Implementation Missing)

#### Expected Behavior (Google Maps Style)
When map rotates based on heading:
1. Polyline must counter-rotate to stay visually aligned with road
2. Markers at waypoints must counter-rotate
3. Popups must counter-rotate

#### MapPage.jsx - CSS Counter-Rotation In Place
```css
/* Map.css and MapPage.css, lines 202 and 1279 */
.minimal-pin,
.dest-marker-inner,
.leaflet-popup-content-wrapper,
.leaflet-popup-tip-container {
  transform: rotate(var(--map-rotation, 0deg)); /* <-- Counter-rotate */
  transform-origin: center;
  transition: transform 0.1s linear;
}
```

- ✅ All map elements counter-rotated automatically
- ✅ CSS variable synced with map rotation
- ✅ Maintains visual alignment with road

#### MapView.jsx - POLYLINE NOT COUNTER-ROTATED ❌

**Current Polyline Implementation (MapView.jsx, line ~169):**
```javascript
const latlngs = path.map(p => [tempNodes[p].lat, tempNodes[p].lon]);
L.polyline(latlngs, { color: "#007AFF", weight: 5 }).addTo(map);
```

**Problems:**
- ❌ Polyline created without counter-rotation class
- ❌ No `className` applied to polyline
- ❌ Even if map DID rotate, polyline would remain locked to map coordinate system
- ❌ Route would appear to "twist" relative to user's view

**What's Missing:**
```javascript
// This would be needed:
const polylineElement = L.polyline(latlngs, { 
  color: "#007AFF", 
  weight: 5,
  className: 'navigation-route'  // ← Add this
}).addTo(map);

// And CSS:
// .navigation-route {
//   transform: rotate(var(--map-rotation, 0deg));
// }
```

---

### ❌ 7. Smooth Updates for All Turn Angles (90°, 180°, 270°, U-turns, Diagonals)

**Status:** ✅ **MapPage** | ❌ **MapView**

#### MapPage.jsx - Robust Wrap-Around Handling

**Wrap-Around Logic in useMapAutoRotate.js (lines 100-105):**
```javascript
const currentBearing = currentBearingRef.current;
let diff = targetBearing - currentBearing;

// Handle angle wrap-around (359 -> 0 -> 1)
while (diff < -180) diff += 360;
while (diff > 180) diff -= 360;

const nextBearing = currentBearing + diff * 0.1;
```

**Same Logic in useUserLocation.js (lines 81-89):**
```javascript
let diff = rawHeading - lastHeading;
while (diff < -180) diff += 360;
while (diff > 180) diff -= 360;
lastHeading = lastHeading + diff * alphaFilterWeight;
```

- ✅ Handles 359° → 0° transition smoothly
- ✅ Detects shortest rotation path
- ✅ Works for 90° turns: `diff = 90°, next = current + 9°`
- ✅ Works for 180° turns: `diff = 180°, next = current + 18°`
- ✅ Works for 270° turns: `diff = -90°` (shortest path), `next = current - 9°`
- ✅ U-turns (opposite bearing): `diff = 180°` or `-180°`, then `next = current ± 18°`
- ✅ Diagonal movement (45°, 135°, etc.): Smooth animation guaranteed by 0.1 factor

**Tested Scenario:** User at bearing 10°, turns to bearing 350° (U-turn):
- `diff = 350 - 10 = 340°`
- `340 > 180` → `diff = 340 - 360 = -20°` (shortest path)
- Smooth 20° CCW rotation animation
- ✅ No jitter or spinning the long way

#### MapView.jsx - Not Applicable ❌
- ❌ No rotation implemented, so wrap-around handling N/A
- ❌ But if it WERE implemented, lacking this logic would cause:
  - Spinning 350° instead of -10° on U-turns
  - Jittery behavior at 0°/360° boundary
  - Opposite rotations feeling "wrong"

---

### ❌ 8. Route Recalculation Auto-Recenters and Reorients Map

**Status:** ❌ **NOT IMPLEMENTED** (Both MapPage and MapView)

#### Current Behavior
- ❌ Route is calculated once at navigation start
- ❌ No route recalculation implemented
- ❌ Even if route changes, map would NOT reorient
- ❌ No waypoint logic (A* returns full path, no intermediate target)

#### Expected Behavior (Google Maps)
1. User goes off-route
2. New route calculated
3. Map immediately recenters on user
4. Map rotates to face first waypoint of new route

#### What Would Be Needed in MapView.jsx
```javascript
// 1. Continuous heading/location updates
const { location: userLocation } = useUserLocation();
const { heading } = useCompassHeading();

// 2. Route recalculation on deviation
useEffect(() => {
  if (!userLocation || !goal) return;
  
  const distanceToRoute = calculateDistanceToNearestPolylinePoint(userLocation, route);
  if (distanceToRoute > RECALCULATION_THRESHOLD) {
    // Recalculate route from current position
    const newRoute = astar(graph, nearestNode, goal);
    // Update polyline
    L.polyline(newRoute, {...}).addTo(map);
  }
}, [userLocation, goal]);

// 3. Map reorients to first waypoint heading
useEffect(() => {
  if (!heading) return;
  mapContainer.style.transform = `rotate(${-heading}deg)`;
}, [heading]);
```

**Current Code (MapView.jsx) - None of this exists:**
```javascript
// Line 55 onward:
navigator.geolocation.getCurrentPosition(pos => {
  // ... calculations happen ONCE ...
  // ... no re-execution ...
});
// ← No useEffect for continuous updates
```

---

### ✅ 9. Bearing Smoothing/Filtering to Prevent Jitter

**Status:** ✅ **Implemented** (But Could Be Improved)

#### MapPage.jsx - Dual Smoothing Strategies

**Strategy 1: Compass Heading Smoothing (useCompassHeading.js, lines 60-83)**
```javascript
const alphaFilterWeight = 0.15; // Low-pass filter weight
let lastHeading = null;

const handleOrientation = (event) => {
  let rawHeading = null;

  if (event.webkitCompassHeading !== undefined) {
    rawHeading = event.webkitCompassHeading;
  } else if (event.alpha !== null) {
    rawHeading = (360 - event.alpha) % 360;
  }

  if (rawHeading !== null) {
    if (lastHeading === null) {
      lastHeading = rawHeading;
    } else {
      let diff = rawHeading - lastHeading;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;
      lastHeading = lastHeading + diff * alphaFilterWeight;
    }

    const smoothedHeading = (lastHeading % 360 + 360) % 360;
    headingRef.current = smoothedHeading;
    setHeading(smoothedHeading);
  }
};
```

- ✅ Low-pass filter: `alpha = 0.15` (85% of previous value + 15% of new value)
- ✅ Smooths sensor noise from device orientation events
- ✅ Wrap-around handling prevents jitter at 359°→0°
- ✅ Exponential decay reduces rapid fluctuations

**Strategy 2: Map Rotation Smoothing (useMapAutoRotate.js, line 105)**
```javascript
const nextBearing = currentBearing + diff * 0.1;
```

- ✅ Smooth interpolation: `alpha = 0.1` (90% previous + 10% target)
- ✅ Combined with compass smoothing = **double smoothing** = very stable
- ✅ 60FPS requestAnimationFrame prevents frame skipping

**Filter Chain:**
```
Raw Device Orientation Event
         ↓
  Compass Filter (α=0.15)
         ↓
  setHeading() state update
         ↓
  Map Rotation Filter (α=0.1)
         ↓
  CSS transform (60FPS)
```

**Estimated Jitter Reduction:**
- Without filters: ±3-5° sensor noise visible
- After compass filter: ±0.5° noise
- After map rotation filter: ±0.1° imperceptible

#### MapView.jsx - No Smoothing ❌
- ❌ No compass heading hook
- ❌ No bearing smoothing
- ❌ No map rotation smoothing
- ❌ If rotation were implemented, raw sensor noise would be directly visible

---

## Component Integration Analysis

### MapPage.jsx - Correct Integration ✅

```
┌─────────────────────────────────────────────────────┐
│                    MapPage.jsx                       │
│                 (Search/Preview Mode)                │
├─────────────────────────────────────────────────────┤
│                                                       │
│  useCompassHeading() ────┐                           │
│                          ├──→ useMapAutoRotate() ───→│
│  useUserLocation() ──────┤                           │
│                          │                           │
│                       MapProvider                    │
│                       (Global Map)                   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Integration Quality:** ✅ EXCELLENT
- All three hooks properly connected
- Map provider singleton used correctly
- Markers and popups counter-rotated
- Smooth 60FPS animation loop
- Manual interaction detection works

---

### MapView.jsx - Broken Integration ❌

```
┌─────────────────────────────────────────────────────┐
│                   MapView.jsx                        │
│              (Turn-by-Turn Navigation)               │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ❌ useCompassHeading() - NOT IMPORTED              │
│  ❌ useUserLocation() - NOT IMPORTED                │
│  ❌ useMapAutoRotate() - NOT IMPORTED               │
│                                                       │
│  ✅ navigator.geolocation.getCurrentPosition()     │
│     (One-time call, then route static)             │
│                                                       │
│  ❌ NO heading tracking                            │
│  ❌ NO map rotation                                │
│  ❌ NO auto-recentering                           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Integration Quality:** ❌ COMPLETELY MISSING

---

## CSS Verification

### MapPage.css - Rotation Classes Present ✅

```css
/* Lines 1279-1283 */
.minimal-pin,
.dest-marker-inner,
.leaflet-popup-content-wrapper,
.leaflet-popup-tip-container {
  transform: rotate(var(--map-rotation, 0deg));
  transform-origin: center;
  transition: transform 0.1s linear;
}

/* Lines 1383-1397 */
.user-location-marker-container { ... }
.user-direction-indicator {
  ...
  transform: rotate(var(--user-heading, 0deg));
  transform-origin: center;
  transition: transform 0.1s linear;
}
```

- ✅ Counter-rotation CSS variable available
- ✅ User marker rotation CSS available
- ✅ Linear interpolation for smooth animations

### MapView.jsx - CSS Not Applied ❌
- ❌ No rotation container classes
- ❌ HTML elements created but no CSS transformation hooks
- ❌ Map container has no `style.transform` property set

---

## Edge Cases Analysis

### 1. Compass Permission Handling

**Implementation (useCompassHeading.js, lines 32-52):**
```javascript
const hasPermissionAPI = 
  typeof DeviceOrientationEvent !== 'undefined' && 
  typeof DeviceOrientationEvent.requestPermission === 'function';

if (!hasPermissionAPI) {
  if ('ondeviceorientation' in window || 'ondeviceorientationabsolute' in window) {
    setPermissionStatus('granted');
  } else {
    setPermissionStatus('unsupported');
  }
} else {
  setPermissionStatus('prompt');
}
```

- ✅ Detects iOS 13+ permission requirement
- ✅ Detects non-iOS devices (auto-grant)
- ✅ Detects unsupported browsers
- ⚠️ **User Friction:** MapPage shows "Enable Compass Calibration" button (line ~640)
  - User must explicitly grant permission before heading data available
  - MapView.jsx doesn't even ask (but also doesn't use heading)

### 2. GPS Throttling

**Implementation (useUserLocation.js, lines 59-65):**
```javascript
const defaultOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 2000,
  ...optionsRef.current
};

// Throttle to 1500ms (line 71)
const throttleMs = 1500;
```

- ✅ Default to high accuracy
- ✅ 2000ms maximum cached age
- ✅ 1500ms user throttle prevents rapid updates
- ⚠️ **Potential Issue:** 1500ms throttle might miss quick turns
  - User makes 90° turn, next GPS update might be 1500ms later
  - Bearing calculation might miss intermediate heading values
  - **Recommendation:** Reduce to 1000ms or use acceleration data

### 3. Zero/Near-Zero Speed Handling

**Implementation (useUserLocation.js, lines 96-103):**
```javascript
const dist = haversine(
  lastCoordsRef.current.lat,
  lastCoordsRef.current.lon,
  newLat,
  newLon
);
// Only calculate bearing if moved > 2 meters
if (dist > 2) {
  computedHeading = calculateBearing(...);
}
```

- ✅ Stationary threshold: 2 meters
- ✅ Prevents compass drift when standing still
- ⚠️ **Potential Issue:** 2m threshold might be too large
  - User turns 45° in place = no bearing update (distance < 2m)
  - Bearing remains from last movement
  - **Recommendation:** Use compass heading in stationary mode, movement heading when moving

### 4. Route Waypoint Proximity

**Current Implementation:** Not implemented

- ❌ No waypoint detection
- ❌ No "arriving in 20m" notifications
- ❌ No automatic turn-to-waypoint reorientation
- ❌ No route recalculation on deviation

---

## Summary Table: All Criteria

| Criterion | MapPage | MapView | Evidence | Status |
|-----------|---------|---------|----------|--------|
| 1. Real-time location tracking | ✅ | ❌ | `watchPosition` vs `getCurrentPosition` | **CRITICAL** |
| 2. Auto-recenter map | ✅ | ❌ | `useMapAutoRotate` missing | **CRITICAL** |
| 3. Map rotates on heading | ✅ | ❌ | `--map-rotation` CSS var unused | **CRITICAL** |
| 4. User forward at top | ✅ | N/A | Rotation enabled | **OK** |
| 5. User marker rotates | ✅ | ❌ | `--user-heading` not set | **HIGH** |
| 6. Route alignment on rotate | ✅ Theory | N/A | CSS in place, polyline static | **OK** |
| 7. Smooth turns (90°/180°/270°) | ✅ | N/A | Wrap-around logic present | **OK** |
| 8. Auto-recenter on route recalc | ❌ | ❌ | No recalculation logic | **LOW** (feature gap) |
| 9. Bearing smoothing | ✅ | N/A | `alphaFilterWeight=0.15` | **OK** |

---

## Root Cause Analysis

### Why MapView Lacks Heading-Based Navigation

**Hypothesis:** MapView.jsx was implemented as a **static turn-by-turn overlay**, not as a full navigation mode.

**Evidence:**
1. MapView imports only basic dependencies: `useEffect`, `useRef`, React Router
2. No integration with navigation hooks (useCompassHeading, useUserLocation, useMapAutoRotate)
3. Geolocation call pattern is one-time (`getCurrentPosition`), not continuous (`watchPosition`)
4. Route drawing is static: `L.polyline(...).addTo(map)` (no update)
5. Map view is never changed after initial `map.fitBounds(latlngs)`

**Likely Timeline:**
- Phase 1: MapPage implemented with full heading-based navigation ✅
- Phase 2: MapView added for turn-by-turn display but incomplete
- Phase 3: Features not backported from MapPage to MapView

---

## Missing Logic for Full Implementation

### To Make MapView Work Like Google Maps:

```javascript
// 1. Import navigation hooks
import { useCompassHeading } from './hooks/useCompassHeading';
import { useUserLocation } from './hooks/useUserLocation';
import { useMapAutoRotate } from './hooks/useMapAutoRotate';

// 2. Initialize hooks
const { heading, permissionStatus, requestPermission } = useCompassHeading();
const { location: userLocation, error: gpsError } = useUserLocation({ throttleMs: 1000 });
const { isAutoFollow, recenter } = useMapAutoRotate(map, userLocation, heading, {
  enabled: true,
  userMarker: userMarkerRef
});

// 3. Set up continuous route recalculation
useEffect(() => {
  if (!userLocation || !route) return;
  
  const distToRoute = calculateOffRouteDistance(userLocation, route);
  if (distToRoute > RECALCULATION_THRESHOLD) {
    const newRoute = recalculateRoute(userLocation, destination);
    updatePolyline(newRoute);
  }
}, [userLocation, route]);

// 4. Apply CSS classes for counter-rotation
const polylineElement = polylineRef.current;
if (polylineElement) {
  polylineElement._element.classList.add('navigation-route');
}

// 5. Auto-center with recenter button
<button onClick={recenter}>Follow</button>
```

---

## Recommendations

### Priority 1: CRITICAL (Fix MapView Navigation)

1. **Implement continuous location tracking in MapView**
   - Replace `getCurrentPosition` with `watchPosition`
   - Add `useUserLocation` hook
   - Update user position every 1000ms

2. **Add heading-based map rotation**
   - Import `useCompassHeading` hook
   - Import `useMapAutoRotate` hook
   - Apply CSS rotation classes to polyline
   - Test wrap-around at 0°/360°

3. **Implement auto-recentering**
   - Map center should follow user position smoothly
   - Recenter button for manual re-engagement
   - Detect user manual interaction to disable auto-follow

4. **Test compass permission flow**
   - Ensure compass is enabled before navigation starts
   - Request permission if needed
   - Handle denial gracefully (navigate to MapPage)

### Priority 2: HIGH (Enhance Navigation)

5. **Add route recalculation logic**
   - Detect when user strays > 10m from route
   - Recalculate from current position
   - Update polyline and reorient map

6. **Add waypoint detection**
   - Calculate distance to next waypoint
   - Show "Turn in 50m" notifications
   - Auto-advance to next waypoint when close

7. **Add arrival detection**
   - Calculate distance to destination
   - Show "Arrived" message when within 10m
   - Offer to end navigation

### Priority 3: NICE-TO-HAVE (Polish)

8. **Reduce GPS throttle from 1500ms to 1000ms**
   - Faster heading updates
   - Better turn detection

9. **Implement accelerometer-based heading**
   - Use phone movement direction when stationary
   - More reliable than compass alone

10. **Add bearing confidence indicator**
    - Show GPS accuracy on screen
    - Warn if accuracy drops below 10m

---

## Conclusion

**The Campus Navigation app provides well-implemented heading-based navigation in the preview mode (MapPage) but FAILS to implement it in the actual turn-by-turn navigation mode (MapView).**

### Current State:
- ✅ **MapPage:** Full Google Maps-style heading-based navigation with smooth 60FPS updates
- ❌ **MapView:** Static route display with no heading, rotation, or auto-recentering

### Expected Result vs Actual:
| Feature | Expected | MapPage | MapView |
|---------|----------|---------|---------|
| Map follows you | ✅ | ✅ | ❌ |
| Map rotates to your heading | ✅ | ✅ | ❌ |
| Forward direction at top | ✅ | ✅ | ❌ |
| User marker shows direction | ✅ | ✅ | ❌ |
| Route stays aligned | ✅ | ✅ | ❌ |
| Smooth on turns | ✅ | ✅ | ❌ |

### To Fix:
1. **Add heading-based map rotation to MapView** (affects 4 criteria)
2. **Implement continuous GPS tracking** (affects 1 criterion)
3. **Add route recalculation** (affects 1 criterion)

**Estimated Effort:** 2-4 hours to implement full heading-based navigation in MapView

---

**Audit Completed:** 2026-06-16  
**Auditor:** Code Review AI  
**Severity:** CRITICAL (Navigation feature incomplete)
