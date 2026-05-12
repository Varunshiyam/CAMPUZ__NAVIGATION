import { useState, useEffect } from 'react';
import { FaCompass } from 'react-icons/fa';
import './CompassWidget.css';

const CompassWidget = ({ onResetNorth }) => {
    const [heading, setHeading] = useState(0);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if DeviceOrientation is supported
        if (window.DeviceOrientationEvent) {
            setTimeout(() => setIsSupported(true), 0);

            let lastUpdate = 0;
            const throttleDelay = 100; // Throttle to 100ms for performance

            const handleOrientation = (event) => {
                const now = Date.now();
                if (now - lastUpdate < throttleDelay) return;
                lastUpdate = now;

                // Get compass heading (alpha value)
                let compassHeading = event.alpha || 0;

                // Adjust for device orientation
                if (event.webkitCompassHeading) {
                    compassHeading = event.webkitCompassHeading;
                }

                setHeading(compassHeading);
            };

            // Request permission for iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                        }
                    })
                    .catch(console.error);
            } else {
                // Non-iOS devices
                window.addEventListener('deviceorientation', handleOrientation);
            }

            return () => {
                window.removeEventListener('deviceorientation', handleOrientation);
            };
        }
    }, []);

    const handleClick = () => {
        setHeading(0);
        if (onResetNorth) onResetNorth();
    };

    if (!isSupported) {
        // Static compass for desktop
        return (
            <div className="compass-widget static" onClick={handleClick}>
                <FaCompass className="compass-icon" />
                <span className="compass-label">N</span>
            </div>
        );
    }

    return (
        <div className="compass-widget" onClick={handleClick}>
            <div
                className="compass-container"
                style={{ transform: `rotate(${-heading}deg)` }}
            >
                <FaCompass className="compass-icon" />
                <span className="compass-label">N</span>
            </div>
        </div>
    );
};

export default CompassWidget;
