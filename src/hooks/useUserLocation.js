import { useState, useEffect, useRef } from 'react';

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

        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading
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
