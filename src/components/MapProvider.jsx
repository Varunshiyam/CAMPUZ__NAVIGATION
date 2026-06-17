/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-rotate';

const MapContext = createContext(null);

export const useMap = () => {
    return useContext(MapContext);
};

export const MapProvider = ({ children }) => {
    const [map, setMap] = useState(null);
    const [tileLayer, setTileLayer] = useState(null);
    const globalMapContainerRef = useRef(null);
    const globalElementRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const timeoutsRef = useRef([]);

    useEffect(() => {
        if (!globalMapContainerRef.current) return;

        // Create the map container element
        const mapElement = document.createElement('div');
        mapElement.id = 'global-leaflet-map';
        mapElement.style.position = 'absolute';
        mapElement.style.width = '150%';
        mapElement.style.height = '150%';
        mapElement.style.top = '-25%';
        mapElement.style.left = '-25%';
        globalMapContainerRef.current.appendChild(mapElement);
        
        globalElementRef.current = mapElement;

        const bounds = L.latLngBounds(
            [10.8725, 77.0160], // SOUTH expanded (E-Block + Hostels)
            [10.8845, 77.0265]  // NORTH safe buffer
        );

        const leafletMap = L.map(mapElement, {
            maxBounds: bounds,
            maxBoundsViscosity: 1.0,
            minZoom: 17,
            maxZoom: 19,
            zoomControl: false,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            touchZoom: true,
            inertia: true,
            preferCanvas: true,
            zoomAnimation: true,
            zoomAnimationThreshold: 4,
            fadeAnimation: true,
            markerZoomAnimation: false,
            wheelPxPerZoomLevel: 120,
            zoomSnap: 1,
            zoomDelta: 1,
            rotate: true,
            touchRotate: true,
            rotateControl: false,
        });

        leafletMap.setView([10.8772, 77.0218], 18);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMap(leafletMap);

        const layer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            minZoom: 17,
            maxZoom: 19,
            keepBuffer: 4,
            updateWhenIdle: true,
            updateWhenZooming: false,
            updateInterval: 250,
            maxNativeZoom: 19,
            tileSize: 256,
            crossOrigin: true,
            errorTileUrl: '',
            detectRetina: false,
            noWrap: true,
            bounds: bounds,
            tapTolerance: 15,
        });

        layer.addTo(leafletMap);
        setTileLayer(layer);

        setIsInitialized(true);

        // Add ResizeObserver to auto-invalidate size when container changes (fixes grey tiles on page transition)
        const resizeObserver = new ResizeObserver(() => {
            leafletMap.invalidateSize();
        });
        resizeObserver.observe(mapElement);

        return () => {
            resizeObserver.disconnect();
            leafletMap.remove();
            setMap(null);
            setTileLayer(null);
            globalElementRef.current = null;
            setIsInitialized(false);
            // Clear all pending timeouts on unmount
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
        };
    }, []);

    // Function to attach the map DOM element to a specific container in a page
    const attachMap = (containerNode) => {
        if (map && containerNode && globalElementRef.current) {
            const mapElement = globalElementRef.current;
            if (mapElement.parentNode !== containerNode) {
                containerNode.appendChild(mapElement);
                
                // Fix size when moved
                map.invalidateSize(); 

                // Force Leaflet to redraw tiles by reapplying the current view
                const currentCenter = map.getCenter();
                const currentZoom = map.getZoom();
                map.setView(currentCenter, currentZoom, { animate: false });

                // Clear previous timeouts before scheduling new ones
                timeoutsRef.current.forEach(clearTimeout);
                timeoutsRef.current = [];

                // Staggered timeouts to catch layout shifts after Framer Motion page transitions
                const t1 = setTimeout(() => {
                    if (map && globalElementRef.current) {
                        map.invalidateSize();
                    }
                }, 50);
                const t2 = setTimeout(() => {
                    if (map && globalElementRef.current) {
                        map.invalidateSize();
                        // One final forced redraw after full transition
                        const finalCenter = map.getCenter();
                        const finalZoom = map.getZoom();
                        map.setView(finalCenter, finalZoom, { animate: false });
                    }
                }, 350); // After the 0.3s transition

                timeoutsRef.current.push(t1, t2);
            }
        }
    };

    // Function to detach the map DOM element (put it back in the hidden container)
    const detachMap = () => {
        if (globalMapContainerRef.current && globalElementRef.current) {
            const mapElement = globalElementRef.current;
            if (mapElement.parentNode !== globalMapContainerRef.current) {
                globalMapContainerRef.current.appendChild(mapElement);
            }
        }
    };

    return (
        <MapContext.Provider value={{
            map,
            tileLayer,
            attachMap,
            detachMap,
            isInitialized
        }}>
            {/* Hidden container for the map when not attached to any specific page */}
            <div ref={globalMapContainerRef} style={{ display: 'none' }} />
            {children}
        </MapContext.Provider>
    );
};
