import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useMapAutoRotate
 *
 * Manages map visual rotation, user-marker animation, and auto-follow behavior.
 *
 * ══════════════════════════════════════════════════════════════════════
 *  ARCHITECTURE — two strictly independent values
 * ══════════════════════════════════════════════════════════════════════
 *
 *  userHeading  (READ-ONLY inside this hook)
 *    • Source : device compass / GPS / simulation (passed in as `compassHeading`)
 *    • Used for : navigation calculations, turn guidance, direction-beam on marker
 *    • Never overwritten by map gestures or bearing changes
 *
 *  mapBearing   (VISUAL ONLY — never fed back as userHeading)
 *    • Source : interpolated animation towards a target bearing
 *    • Target  : userHeading (auto-follow ON) | frozen (user dragged) | 0° (North-Up)
 *    • Applied : CSS transform rotate() on the Leaflet map container
 *    • Exported: so consumers can show the real map orientation in UI (e.g. compass icon)
 *
 *  Rule : mapBearing changes NEVER propagate to userHeading.
 * ══════════════════════════════════════════════════════════════════════
 */
export function useMapAutoRotate(map, userCoords, compassHeading, options = {}) {
  const {
    enabled = true,
    onManualInteraction = () => {},
    userMarker = null,
  } = options;

  // ── State ─────────────────────────────────────────────────────────
  const [isAutoFollow, setIsAutoFollow] = useState(enabled);

  // Reactive mapBearing: updated periodically from the rAF loop for UI consumers.
  // Throttled to avoid excessive re-renders (~0.5° threshold).
  const [mapBearing, setMapBearing] = useState(0);

  // ── Internal refs ─────────────────────────────────────────────────

  /**
   * mapBearingRef — current visual rotation of the map container (degrees).
   * This is the ONLY thing applied to mapContainer.style.transform.
   * NEVER written by anything related to navigation logic.
   */
  const mapBearingRef = useRef(0);

  /**
   * lastSyncedBearingRef — tracks the last value pushed to setMapBearing()
   * so we only trigger a React state update when the change is significant.
   */
  const lastSyncedBearingRef = useRef(0);

  /**
   * userHeadingRef — real-world heading from the device compass / GPS / simulation.
   * READ-ONLY in the animation loop. Never overwritten by map events or bearing logic.
   * Consumed by:
   *   • mapBearing target (when auto-follow is active)
   *   • direction-beam CSS property on the user marker
   */
  const userHeadingRef = useRef(compassHeading);

  /** smoothedUserHeadingRef — low-pass interpolated version of userHeading
   *  used exclusively for the marker direction beam (smooth visual). */
  const smoothedUserHeadingRef = useRef(0);

  const resetToNorthRef = useRef(false);
  const rAFRef = useRef(null);

  // Position interpolation
  const currentLatRef = useRef(null);
  const currentLonRef = useRef(null);

  // Stable ref aliases so the rAF loop never re-creates
  const userCoordsRef = useRef(userCoords);
  const userMarkerRef = useRef(userMarker);

  // ── Keep refs in sync (never re-create the rAF loop for these) ────

  useEffect(() => {
    // Update position ref; seed interpolation on first fix
    userCoordsRef.current = userCoords;
    if (userCoords && currentLatRef.current === null) {
      currentLatRef.current = userCoords.lat;
      currentLonRef.current = userCoords.lon;
    }
  }, [userCoords]);

  useEffect(() => {
    // Update userHeading ref — this is the ONLY place it is written.
    // Map events must never write to userHeadingRef.
    userHeadingRef.current = compassHeading;
  }, [compassHeading]);

  useEffect(() => {
    userMarkerRef.current = userMarker;
  }, [userMarker]);

  // ── Manual interaction detection ──────────────────────────────────
  // When the user drags / zooms / rotates the map:
  //   • Disable auto-follow   → mapBearing freezes at its current value
  //   • userHeading is left completely untouched
  useEffect(() => {
    if (!map || typeof map.on !== 'function') return;

    const handleUserInteraction = () => {
      if (isAutoFollow) {
        setIsAutoFollow(false);
        onManualInteraction();
      }
      // Cancel any in-progress North-Up reset (visual-only operation)
      resetToNorthRef.current = false;
      // sync bearing just in case
      if (typeof map.getBearing === 'function') {
        mapBearingRef.current = map.getBearing();
      }
    };

    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('mousedown', handleUserInteraction);
    map.on('touchstart', handleUserInteraction);
    
    // Sync mapBearing state when leaflet-rotate fires a rotation event (e.g. pinch-rotate)
    const handleRotate = () => {
      if (typeof map.getBearing === 'function') {
        const currentB = map.getBearing();
        mapBearingRef.current = currentB;
        if (Math.abs(currentB - lastSyncedBearingRef.current) > 0.5) {
          lastSyncedBearingRef.current = currentB;
          setMapBearing(currentB);
        }
      }
    };
    map.on('rotate', handleRotate);

    return () => {
      if (typeof map.off === 'function') {
        map.off('dragstart', handleUserInteraction);
        map.off('zoomstart', handleUserInteraction);
        map.off('mousedown', handleUserInteraction);
        map.off('touchstart', handleUserInteraction);
        map.off('rotate', handleRotate);
      }
    };
  }, [map, isAutoFollow, onManualInteraction]);

  // ── Campus center fallback ────────────────────────────────────────
  // Used when GPS is unavailable and recenter is pressed.
  const CAMPUS_CENTER = { lat: 12.8406, lon: 80.1534 };

  // ── recenter ──────────────────────────────────────────────────────
  // Re-enables auto-follow and pans the map to the user's live position.
  // Effect on heading: NONE — userHeading is never modified here.
  // Effect on mapBearing: auto-follow ON → bearing will re-align with userHeading
  //                       via the normal animation loop on next frames.
  const recenter = useCallback(() => {
    setIsAutoFollow(true);
    resetToNorthRef.current = false;

    const panTo = (lat, lon) => {
      if (!map || typeof map.setView !== 'function') return;
      const zoom = typeof map.getZoom === 'function' ? map.getZoom() : 18;
      currentLatRef.current = lat;
      currentLonRef.current = lon;
      map.setView([lat, lon], zoom, { animate: true, duration: 0.5 });
    };

    const uCoords = userCoordsRef.current;
    if (uCoords) {
      panTo(uCoords.lat, uCoords.lon);
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // GPS not yet received — one-shot fetch before panning
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          userCoordsRef.current = { lat, lon };
          currentLatRef.current = lat;
          currentLonRef.current = lon;
          panTo(lat, lon);
        },
        () => panTo(CAMPUS_CENTER.lat, CAMPUS_CENTER.lon),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    } else {
      panTo(CAMPUS_CENTER.lat, CAMPUS_CENTER.lon);
    }
  }, [map]);

  // ── resetNorth ────────────────────────────────────────────────────
  // Smoothly rotates mapBearing back to 0° (North-Up view).
  // Effect on heading: NONE — userHeading is not touched.
  const resetNorth = useCallback(() => {
    setIsAutoFollow(false);
    resetToNorthRef.current = true;
  }, []);

  // ── Main rAF animation loop ───────────────────────────────────────
  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function') return;

    const mapContainer = map.getContainer();
    if (!mapContainer) return;

    let active = true;

    const tick = () => {
      if (!active) return;

      // ── Step 1 : Compute target mapBearing ─────────────────────────
      //
      // The target is determined exclusively by navigation/view state:
      //   • auto-follow ON → align map visually with userHeading (device compass)
      //   • resetNorth     → animate towards 0°
      //   • else           → freeze at current mapBearing (user dragged)
      //
      // userHeadingRef is READ-ONLY here. We never assign to it.

      const uHeading = userHeadingRef.current; // real-world heading — do not modify

      let targetBearing = mapBearingRef.current; // default: stay frozen

      if (isAutoFollow && uHeading !== null && uHeading !== undefined) {
        targetBearing = uHeading; // track real heading visually
      } else if (resetToNorthRef.current) {
        targetBearing = 0;        // North-Up visual reset
      }
      // else: frozen — mapBearing stays where the user left it

      // Interpolate mapBearing towards target (smooth rotation)
      // Only do this if we are actively controlling the bearing (auto-follow or reset-north)
      if (isAutoFollow || resetToNorthRef.current) {
        const currentMapBearing = mapBearingRef.current;
        let diff = targetBearing - currentMapBearing;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;

        const nextMapBearing = currentMapBearing + diff * 0.1;
        mapBearingRef.current = nextMapBearing;

        if (typeof map.setBearing === 'function') {
           map.setBearing(nextMapBearing);
        } else {
           // Fallback if leaflet-rotate is missing
           mapContainer.style.transform = `rotate(${-nextMapBearing}deg)`;
           mapContainer.style.transformOrigin = 'center';
        }
        
        // Keep providing the CSS variable for any custom UI elements (like compass HUD)
        mapContainer.style.setProperty('--map-rotation', `${nextMapBearing}deg`);

        // Sync reactive mapBearing state for UI consumers (throttled)
        if (Math.abs(nextMapBearing - lastSyncedBearingRef.current) > 0.5) {
          lastSyncedBearingRef.current = nextMapBearing;
          setMapBearing(nextMapBearing);
        }

        // Finish North-Up reset when close enough
        if (resetToNorthRef.current && Math.abs(nextMapBearing) < 0.1) {
          resetToNorthRef.current = false;
          mapBearingRef.current = 0;
          if (typeof map.setBearing === 'function') map.setBearing(0);
        }
      }

      // ── Step 2 : Interpolate user marker position ─────────────────
      const uCoords = userCoordsRef.current;
      if (uCoords && currentLatRef.current !== null) {
        const nextLat = currentLatRef.current + (uCoords.lat - currentLatRef.current) * 0.08;
        const nextLon = currentLonRef.current + (uCoords.lon - currentLonRef.current) * 0.08;

        currentLatRef.current = nextLat;
        currentLonRef.current = nextLon;

        // Move user marker smoothly
        const marker = userMarkerRef.current;
        if (marker) {
          const m = marker.current || marker;
          if (m && typeof m.setLatLng === 'function') {
            m.setLatLng([nextLat, nextLon]);
          }
        }

        // Only keep map centred when auto-follow is active
        if (isAutoFollow && typeof map.setView === 'function') {
          map.setView([nextLat, nextLon], map.getZoom(), { animate: false });
        }
      }

      // ── Step 3 : Rotate direction beam on user marker ─────────────
      //
      // Uses userHeading (real-world) — completely independent from mapBearing.
      // The beam always points in the true compass direction, even when the map
      // is rotated manually to a different angle.
      if (uHeading !== null && uHeading !== undefined) {
        let diffH = uHeading - smoothedUserHeadingRef.current;
        while (diffH < -180) diffH += 360;
        while (diffH > 180) diffH -= 360;

        const nextHeading = smoothedUserHeadingRef.current + diffH * 0.15;
        smoothedUserHeadingRef.current = nextHeading;

        const marker = userMarkerRef.current;
        if (marker) {
          const m = marker.current || marker;
          if (m && typeof m.getElement === 'function') {
            const el = m.getElement();
            if (el) {
              // CSS var consumed by .user-direction-beam transform
              el.style.setProperty('--user-heading', `${nextHeading}deg`);
            }
          }
        }
      }

      rAFRef.current = requestAnimationFrame(tick);
    };

    rAFRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      if (mapContainer) {
        mapContainer.style.transform = '';
        mapContainer.style.removeProperty('--map-rotation');
      }
      if (typeof map.setBearing === 'function') {
        map.setBearing(0);
      }
    };
  }, [map, isAutoFollow]);

  // ── Public API ────────────────────────────────────────────────────
  return {
    /** Whether the map is currently locked to follow the user's position/heading */
    isAutoFollow,
    setIsAutoFollow,
    /** Pan map to user location and re-enable auto-follow */
    recenter,
    /** Visually rotate map back to North-Up (0°) — does not touch userHeading */
    resetNorth,
    /**
     * Current visual rotation of the map container (degrees).
     * Use this for compass UI that should reflect how the MAP is oriented,
     * NOT the device/user heading.
     * For navigation calculations always use the raw compass/GPS heading directly.
     */
    mapBearing,
  };
}
