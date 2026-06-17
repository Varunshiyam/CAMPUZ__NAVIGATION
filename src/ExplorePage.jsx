import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ExplorePage.css';
import { nodes, locationData } from './data';
import { useMap } from "./components/MapProvider";
import { FaHome, FaBuilding, FaThLarge, FaCompass, FaTimes, FaDirections } from 'react-icons/fa';

const ExplorePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { map, attachMap, detachMap, isInitialized } = useMap();
    const mapContainerRef = useRef(null);
    const markersRef = useRef({});
    const userMarkerRef = useRef(null);
    const watchIdRef = useRef(null);

    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const loading = !isInitialized;

    /* ---------- GET CUSTOM ICON FOR LOCATION ---------- */
    const getCustomIcon = () => {
        return L.divIcon({
            className: "minimal-professional-marker",
            html: `
                <div class="minimal-pin">
                    <div class="minimal-pin-inner"></div>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
        });
    };

    /* ---------- MAP INITIALIZATION ---------- */
    useEffect(() => {
        if (!isInitialized || !mapContainerRef.current || !map) return;
        
        attachMap(mapContainerRef.current);

        // --- Dynamic Zoom Scaling ---
        const updateZoomScale = () => {
            if (!map || !mapContainerRef.current) return;
            const currentZoom = map.getZoom();
            const scale = Math.pow(2, currentZoom - 18);
            mapContainerRef.current.style.setProperty('--map-icon-scale', scale);
        };
        
        updateZoomScale();
        map.on('zoom', updateZoomScale);

        /* ---------- CHUNKED CUSTOM ICON MARKERS ---------- */
        const locations = Object.values(locationData);
        let index = 0;
        const chunkSize = 20;

        const renderChunk = () => {
            if (!mapContainerRef.current) return;

            const endIndex = Math.min(index + chunkSize, locations.length);
            for (let i = index; i < endIndex; i++) {
                const loc = locations[i];
                if (loc.type === 'indoor') continue;

                const node = nodes[loc.id];
                if (!node) continue;

                const customIcon = getCustomIcon();

                const marker = L.marker([node.lat, node.lon], {
                    icon: customIcon,
                    title: loc.name,
                    riseOnHover: true,
                })
                    .addTo(map)
                    .on('click', () => {
                        document.querySelector('.minimal-professional-marker.selected')?.classList.remove('selected');

                        const iconElement = marker.getElement();
                        if (iconElement) {
                            iconElement.classList.add('selected');
                        }

                        setSelectedBuilding({
                            id: loc.id,
                            ...loc,
                            lat: node.lat,
                            lon: node.lon
                        });
                        map.flyTo([node.lat, node.lon], 18, {
                            duration: 1,
                            easeLinearity: 0.25
                        });
                    });

                markersRef.current[loc.id] = marker;

                // Auto-select and highlight if navigated from another page via highlightId state
                const highlightId = location.state?.highlightId;
                if (highlightId && loc.id === highlightId) {
                    setSelectedBuilding({
                        id: loc.id,
                        ...loc,
                        lat: node.lat,
                        lon: node.lon
                    });
                    map.flyTo([node.lat, node.lon], 18, {
                        duration: 1,
                        easeLinearity: 0.25
                    });
                    setTimeout(() => {
                        const iconElement = marker.getElement();
                        if (iconElement) {
                            iconElement.classList.add('selected');
                        }
                    }, 100);
                }
            }

            index = endIndex;
            if (index < locations.length) {
                requestAnimationFrame(() => {
                    setTimeout(renderChunk, 0);
                });
            }
        };

        setTimeout(renderChunk, 100);

        return () => {
            if (map) {
                map.off('zoom', updateZoomScale);
            }
            // Clear markers on unmount
            Object.values(markersRef.current).forEach(m => {
              if (map.hasLayer(m)) map.removeLayer(m);
            });
            markersRef.current = {};
            detachMap();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInitialized, attachMap, detachMap, map]);

    /* ---------- USER LOCATION MARKER (IMMEDIATE) ---------- */
    useEffect(() => {
        if (!map) return;

        const createUserMarker = (latitude, longitude) => {
            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([latitude, longitude]);
            } else {
                const userIcon = L.icon({
                    iconUrl: '/Map_Icons/user_location_professional.svg',
                    iconSize: [48, 48],
                    iconAnchor: [24, 24],
                    popupAnchor: [0, -24],
                    className: 'user-location-marker'
                });

                userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('📍 You are here');
            }
        };

        // Get position IMMEDIATELY without delay
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                createUserMarker(pos.coords.latitude, pos.coords.longitude);
            },
            (error) => {
                console.error('Geolocation error (immediate):', error);
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 0
            }
        );

        // Then continue watching for updates
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                createUserMarker(pos.coords.latitude, pos.coords.longitude);
            },
            (error) => {
                console.error('Geolocation error (watch):', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 1000
            }
        );

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (userMarkerRef.current && map.hasLayer(userMarkerRef.current)) {
                map.removeLayer(userMarkerRef.current);
                userMarkerRef.current = null;
            }
        };
    }, [map]);




    /* ---------- HANDLE EXIT ---------- */
    const handleExit = () => {
        navigate('/home');
    };

    const handleDirections = (buildingId) => {
        navigate('/map', {
            state: {
                destination: buildingId,
                fromPage: 'explore'
            }
        });
    };

    return (
        <div className="explore-page">
            {loading && (
                <div className="map-loading">Loading map...</div>
            )}

            <div id="explore-map-container" ref={mapContainerRef} style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}></div>

            {/* Exit Button - Hidden when sidebar is open */}
            {!selectedBuilding && (
                <button className="exit-button" onClick={handleExit}>
                    Exit
                </button>
            )}

            {/* Selected Building Card - Apple Maps Style */}
            {selectedBuilding && (
                <>
                    <div className="building-overlay" onClick={() => {
                        document.querySelector('.minimal-professional-marker.selected')?.classList.remove('selected');
                        setSelectedBuilding(null);
                    }} />
                    <div className="building-detail-sheet">
                        <div className="sheet-handle"></div>

                        <button className="close-sheet-btn" onClick={() => {
                            document.querySelector('.minimal-professional-marker.selected')?.classList.remove('selected');
                            setSelectedBuilding(null);
                        }}>
                            X
                        </button>

                        <div className="sheet-content">
                            {/* Building Image */}
                            {selectedBuilding.category && (
                                <div className="building-image-container">
                                    <img
                                        src={(() => {
                                            // Specific nodes
                                            if (selectedBuilding.id === 'SnacksBox') return '/Map_Icons/SnacksBox.png';
                                            if (selectedBuilding.id === 'OpenAuditorium') return '/Map_Icons/Open-Auditorium.png';
                                            if (selectedBuilding.id === 'Auditorium') return '/Map_Icons/Auditorium.png';
                                            if (selectedBuilding.id === 'Library') return '/Map_Icons/Library.png';
                                            if (selectedBuilding.id === 'TennisCourt') return '/Map_Icons/TennisCourt.png';
                                            if (selectedBuilding.id === 'Kabbadi Ground') return '/Map_Icons/KabbadiCourt.png';
                                            if (selectedBuilding.id === 'TurfGround') return '/Map_Icons/FootBallCourt.png';
                                            if (selectedBuilding.id === 'NewPlacementCell') return '/Map_Icons/Placement_Cell.png';
                                            if (selectedBuilding.id === 'Entrance' || selectedBuilding.id === 'Exit') return '/Map_Icons/Gate.png';

                                            // Category mapping
                                            const categoryMap = {
                                                'block': 'Blocks',
                                                'lab': 'Computer_Lab',
                                                'food': 'FoodCourt',
                                                'hostel': 'Hostel',
                                                'office': 'Store',
                                                'hall': 'Open-Auditorium',
                                                'library': 'Library',
                                                'sport': 'FootBallCourt',
                                                'other': 'Gate'
                                            };
                                            return `/Map_Icons/${categoryMap[selectedBuilding.category] || 'Blocks'}.png`;
                                        })()}
                                        alt={selectedBuilding.name}
                                        className="building-image"
                                    />
                                </div>
                            )}

                            {/* Building Info */}
                            <div className="building-info">
                                <h2 className="building-name">{selectedBuilding.name}</h2>
                                {selectedBuilding.category && (
                                    <span className="building-category">{selectedBuilding.category}</span>
                                )}
                            </div>

                            {/* Description */}
                            {selectedBuilding.description && (
                                <p className="building-description">{selectedBuilding.description}</p>
                            )}

                            {/* Facilities */}
                            {selectedBuilding.facilities && selectedBuilding.facilities.length > 0 && (
                                <div className="facilities-section">
                                    <h3>Facilities</h3>
                                    <div className="facilities-grid">
                                        {selectedBuilding.facilities.map((facility, idx) => (
                                            <div key={idx} className="facility-chip">{facility}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Directions Button */}
                            <button className="directions-button" onClick={() => handleDirections(selectedBuilding.id)}>
                                <FaDirections />
                                <span>Directions</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <div className="nav-item" onClick={() => navigate('/home')}>
                    <FaHome />
                    <span>Home</span>
                </div>

                <div className="nav-item" onClick={() => navigate('/buildings')}>
                    <FaBuilding />
                    <span>Buildings</span>
                </div>

                <div className="nav-item" onClick={() => navigate('/categories')}>
                    <FaThLarge />
                    <span>Categories</span>
                </div>

                <div className="nav-item active">
                    <FaCompass />
                    <span>Explore</span>
                </div>
            </nav>
        </div>
    );
};

export default ExplorePage;
