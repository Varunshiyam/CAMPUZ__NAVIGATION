import { useState, useEffect, useRef } from 'react';

// Helper: Convert degrees to radians
const toRad = (d) => (d * Math.PI) / 180;

// Helper: Calculate Haversine distance between two coordinates in meters
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Helper: Calculate bearing from coordinate 1 to coordinate 2
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

/**
 * Hook to watch user location with throttle support.
 * @param {Object} options Geolocation options and throttleMs
 */
export function useUserLocation(options = {}) {
  const { throttleMs = 1500, ...geoOptions } = options;
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const optionsRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const lastGpsHeadingRef = useRef(null);

  // Keep a stable options reference
  const optionsKey = JSON.stringify(geoOptions);
  useEffect(() => {
    optionsRef.current = geoOptions;
  }, [optionsKey]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 2000,
      ...optionsRef.current
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < throttleMs && lastUpdateRef.current !== 0) {
          return; // Skip throttled update
        }
        lastUpdateRef.current = now;

        const newLat = pos.coords.latitude;
        const newLon = pos.coords.longitude;
        const speed = pos.coords.speed;
        const rawHeading = pos.coords.heading;

        let computedHeading = lastGpsHeadingRef.current;

        if (lastCoordsRef.current) {
          const dist = haversine(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lon,
            newLat,
            newLon
          );
          // Only calculate bearing if moved > 2 meters to avoid stationary noise
          if (dist > 2) {
            computedHeading = calculateBearing(
              lastCoordsRef.current.lat,
              lastCoordsRef.current.lon,
              newLat,
              newLon
            );
            lastGpsHeadingRef.current = computedHeading;
            lastCoordsRef.current = { lat: newLat, lon: newLon };
          }
        } else {
          lastCoordsRef.current = { lat: newLat, lon: newLon };
        }

        const activeHeading =
          rawHeading !== null && rawHeading !== undefined && !isNaN(rawHeading)
            ? rawHeading
            : computedHeading;

        setLocation({
          lat: newLat,
          lon: newLon,
          accuracy: pos.coords.accuracy,
          speed: speed,
          heading: activeHeading,
          gpsHeading: computedHeading
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useUserLocation GPS error:", err);
        setError("Location unavailable. Enable GPS for live routing.");
        setLoading(false);
      },
      defaultOptions
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [throttleMs, optionsKey]);

  return { location, error, loading };
}

