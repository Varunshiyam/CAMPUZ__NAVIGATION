import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage automatic map rotation and centering based on heading and location.
 */
export function useMapAutoRotate(map, userCoords, compassHeading, options = {}) {
  const {
    enabled = true,
    onManualInteraction = () => {},
  } = options;

  const [isAutoFollow, setIsAutoFollow] = useState(enabled);
  const currentBearingRef = useRef(0);
  const rAFRef = useRef(null);
  const resetToNorthRef = useRef(false);

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
    if (map && userCoords && typeof map.setView === 'function') {
      const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : 18;
      map.setView([userCoords.lat, userCoords.lon], currentZoom, { animate: true, duration: 0.5 });
    }
  }, [map, userCoords]);

  // Reset orientation to North Up
  const resetNorth = useCallback(() => {
    setIsAutoFollow(false);
    resetToNorthRef.current = true;
  }, []);

  // Smooth rotation animation loop using requestAnimationFrame
  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function') return;

    const mapContainer = map.getContainer();
    if (!mapContainer) return;

    let active = true;

    const updateRotation = () => {
      if (!active) return;

      let targetBearing = currentBearingRef.current;
      if (isAutoFollow && compassHeading !== null && compassHeading !== undefined) {
        targetBearing = compassHeading;
      } else if (resetToNorthRef.current) {
        targetBearing = 0;
      }

      const currentBearing = currentBearingRef.current;
      let diff = targetBearing - currentBearing;

      // Handle angle wrap-around (359 -> 0 -> 1)
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;

      // Apply interpolation (low-pass filter)
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

      rAFRef.current = requestAnimationFrame(updateRotation);
    };

    rAFRef.current = requestAnimationFrame(updateRotation);

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
  }, [map, compassHeading, isAutoFollow]);

  // Keep user centered when user location changes and auto-follow is active
  useEffect(() => {
    if (map && userCoords && isAutoFollow && typeof map.panTo === 'function') {
      map.panTo([userCoords.lat, userCoords.lon], { animate: true, duration: 1.0 });
    }
  }, [map, userCoords, isAutoFollow]);

  return { isAutoFollow, recenter, resetNorth, setIsAutoFollow };
}
