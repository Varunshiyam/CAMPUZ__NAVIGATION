import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage automatic map rotation and centering based on heading and location.
 */
export function useMapAutoRotate(map, userCoords, compassHeading, options = {}) {
  const {
    enabled = true,
    onManualInteraction = () => {},
    userMarker = null,
  } = options;

  const [isAutoFollow, setIsAutoFollow] = useState(enabled);
  const currentBearingRef = useRef(0);
  const rAFRef = useRef(null);
  const resetToNorthRef = useRef(false);

  // References for position and compass heading interpolation
  const currentLatRef = useRef(null);
  const currentLonRef = useRef(null);
  const currentCompassHeadingRef = useRef(0);

  const userCoordsRef = useRef(userCoords);
  const compassHeadingRef = useRef(compassHeading);
  const userMarkerRef = useRef(userMarker);

  // Keep references updated to avoid resetting the animation frame loop
  useEffect(() => {
    userCoordsRef.current = userCoords;
    if (userCoords && currentLatRef.current === null) {
      currentLatRef.current = userCoords.lat;
      currentLonRef.current = userCoords.lon;
    }
  }, [userCoords]);

  useEffect(() => {
    compassHeadingRef.current = compassHeading;
  }, [compassHeading]);

  useEffect(() => {
    userMarkerRef.current = userMarker;
  }, [userMarker]);

  // Detect manual interactions to disable auto-follow
  useEffect(() => {
    if (!map || typeof map.on !== 'function') return;

    const handleUserInteraction = () => {
      if (isAutoFollow) {
        setIsAutoFollow(false);
        onManualInteraction();
      }
      resetToNorthRef.current = false;
    };

    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('mousedown', handleUserInteraction);
    map.on('touchstart', handleUserInteraction);

    return () => {
      if (typeof map.off === 'function') {
        map.off('dragstart', handleUserInteraction);
        map.off('zoomstart', handleUserInteraction);
        map.off('mousedown', handleUserInteraction);
        map.off('touchstart', handleUserInteraction);
      }
    };
  }, [map, isAutoFollow, onManualInteraction]);

  // Recenter map and re-enable auto-follow
  const recenter = useCallback(() => {
    setIsAutoFollow(true);
    resetToNorthRef.current = false;
    const uCoords = userCoordsRef.current;
    if (map && uCoords && typeof map.setView === 'function') {
      const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : 18;
      // Initialize currentLatRef and currentLonRef to current map center or target coords so it starts animating from there
      currentLatRef.current = uCoords.lat;
      currentLonRef.current = uCoords.lon;
      map.setView([uCoords.lat, uCoords.lon], currentZoom, { animate: true, duration: 0.5 });
    }
  }, [map]);

  // Reset orientation to North Up
  const resetNorth = useCallback(() => {
    setIsAutoFollow(false);
    resetToNorthRef.current = true;
  }, []);

  // Smooth rotation and position animation loop using requestAnimationFrame
  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function') return;

    const mapContainer = map.getContainer();
    if (!mapContainer) return;

    let active = true;

    const updateRotationAndPosition = () => {
      if (!active) return;

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

      // Set CSS Custom Property for child/marker counter-rotation
      mapContainer.style.setProperty('--map-rotation', `${nextBearing}deg`);

      // If resetting to North Up is close enough, mark it as done
      if (resetToNorthRef.current && Math.abs(nextBearing) < 0.1) {
        resetToNorthRef.current = false;
        currentBearingRef.current = 0;
      }

      // 2. Interpolate User Marker Position & Map Center
      const uCoords = userCoordsRef.current;
      if (uCoords && currentLatRef.current !== null) {
        const currentLat = currentLatRef.current;
        const currentLon = currentLonRef.current;

        const diffLat = uCoords.lat - currentLat;
        const diffLon = uCoords.lon - currentLon;

        // Use a smoothing factor (0.08) for coordinates
        const nextLat = currentLat + diffLat * 0.08;
        const nextLon = currentLon + diffLon * 0.08;

        currentLatRef.current = nextLat;
        currentLonRef.current = nextLon;

        // Update the user marker position smoothly
        const marker = userMarkerRef.current;
        if (marker) {
          const markerInstance = marker.current || marker;
          if (markerInstance && typeof markerInstance.setLatLng === 'function') {
            markerInstance.setLatLng([nextLat, nextLon]);
          }
        }

        // Recenter map only if auto-follow is active
        if (isAutoFollow && typeof map.setView === 'function') {
          map.setView([nextLat, nextLon], map.getZoom(), { animate: false });
        }
      }

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

      rAFRef.current = requestAnimationFrame(updateRotationAndPosition);
    };

    rAFRef.current = requestAnimationFrame(updateRotationAndPosition);

    return () => {
      active = false;
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
      }
      // Reset rotation on cleanup
      if (mapContainer) {
        mapContainer.style.transform = '';
        mapContainer.style.removeProperty('--map-rotation');
      }
    };
  }, [map, isAutoFollow]);

  return { isAutoFollow, recenter, resetNorth, setIsAutoFollow };
}

