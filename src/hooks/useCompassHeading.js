import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to get the device's compass heading.
 * Handles iOS permission requests and filters sensor noise.
 */
export function useCompassHeading() {
  const [heading, setHeading] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'unknown', 'prompt', 'granted', 'denied', 'unsupported'
  const headingRef = useRef(null);

  // Check support on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasPermissionAPI = 
      typeof DeviceOrientationEvent !== 'undefined' && 
      typeof DeviceOrientationEvent.requestPermission === 'function';

    if (!hasPermissionAPI) {
      // For non-iOS or older devices, check if orientation events are supported
      if ('ondeviceorientation' in window || 'ondeviceorientationabsolute' in window) {
        setPermissionStatus('granted'); // Auto-granted/no explicit permission needed
      } else {
        setPermissionStatus('unsupported');
      }
    } else {
      // iOS 13+ devices require explicit permission requests
      setPermissionStatus('prompt');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (
      typeof DeviceOrientationEvent === 'undefined' || 
      typeof DeviceOrientationEvent.requestPermission !== 'function'
    ) {
      return true;
    }

    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        setPermissionStatus('granted');
        return true;
      } else {
        setPermissionStatus('denied');
        return false;
      }
    } catch (e) {
      console.error("DeviceOrientation permission request failed:", e);
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  useEffect(() => {
    if (permissionStatus !== 'granted') return;

    let lastHeading = null;
    const alphaFilterWeight = 0.15; // Low-pass filter weight to smooth compass heading

    const handleOrientation = (event) => {
      let rawHeading = null;

      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        rawHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null && event.alpha !== undefined) {
        // alpha increases counter-clockwise. Map to clockwise.
        rawHeading = (360 - event.alpha) % 360;
      }

      if (rawHeading !== null) {
        // Handle wrap-around (359 -> 0 -> 1)
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

    // Listen to absolute event first (Android/standard), fallback to normal orientation
    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(eventName, handleOrientation, true);

    return () => {
      window.removeEventListener(eventName, handleOrientation, true);
    };
  }, [permissionStatus]);

  return { heading, permissionStatus, requestPermission };
}
