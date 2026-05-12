import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ExplorePage.css';
import { nodes, locationData } from './data';
import { FaHome, FaBuilding, FaThLarge, FaCompass, FaTimes, FaDirections } from 'react-icons/fa';

const ExplorePage = () => {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const userMarkerRef = useRef(null);
    const initialized = useRef(false);
    const lastGpsUpdateRef = useRef(0);
    const watchIdRef = useRef(null);

    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [loading, setLoading] = useState(true);



    /* ---------- GET CUSTOM ICON FOR LOCATION ---------- */
    const getCustomIcon = (loc) => {
        // Check for specific node names first
        if (loc.id === 'SnacksBox') {
            return L.icon({
                iconUrl: '/Map_Icons/SnacksBox.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }

        if (loc.id === 'OpenAuditorium') {
            return L.icon({
                iconUrl: '/Map_Icons/Open_Auditorium.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }

        if (loc.id === 'Auditorium') {
            return L.icon({
                iconUrl: '/Map_Icons/Auditorium.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }

        if (loc.id === 'Library') {
            return L.icon({
                iconUrl: '/Map_Icons/Library.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }

        if (loc.id === 'TennisCourt') {
            return L.icon({
                iconUrl: '/Map_Icons/TennisCourt.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }

        if (loc.id === 'Kabbadi Ground') {
            return L.icon({
                iconUrl: '/Map_Icons/KabbadiCourt.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }

        if (loc.id === 'TurfGround') {
            return L.icon({
                iconUrl: '/Map_Icons/FootBallCourt.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }


        if (loc.id === 'Entrance' || loc.id === 'Exit') {
            return L.icon({
                iconUrl: '/Map_Icons/Gate.png',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
                className: 'custom-map-icon'
            });
        }

        // Category-based mapping
        const iconMap = {
            'block': '/Map_Icons/Blocks.png',
            'lab': '/Map_Icons/Computer_Lab.png',
            'food': '/Map_Icons/FoodCourt.png',
            'hostel': '/Map_Icons/Hostel.png',
            'office': '/Map_Icons/Store.png',
            'hall': '/Map_Icons/Computer_Lab.png',
            'library': '/Map_Icons/Library.png',
            'sport': '/Map_Icons/FootBallCourt.png',
            'other': '/Map_Icons/Gate.png',
        };

        const iconUrl = iconMap[loc.category] || '/Map_Icons/Blocks.png';

        return L.icon({
            iconUrl: iconUrl,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28],
            className: 'custom-map-icon'
        });
    };

    /* ---------- MAP INITIALIZATION ---------- */
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const bounds = L.latLngBounds(
            [10.8725, 77.0160],
            [10.8845, 77.0265]
        );

        const map = L.map('explore-map', {
            maxBounds: bounds,
            maxBoundsViscosity: 1.0,
            minZoom: 17,
            maxZoom: 19,
            zoomControl: true,
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
        });

        map.setView([10.8772, 77.0218], 18);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
        }).addTo(map);

        setTimeout(() => setLoading(false), 0);

        /* ---------- CUSTOM ICON MARKERS ---------- */
        Object.values(locationData).forEach((loc) => {
            if (loc.type === 'indoor') return;

            const node = nodes[loc.id];
            if (!node) return;

            const customIcon = getCustomIcon(loc);

            const marker = L.marker([node.lat, node.lon], {
                icon: customIcon,
                title: loc.name,
                riseOnHover: true,
            })
                .addTo(map)
                .on('click', () => {
                    // Remove animation from previously selected marker
                    document.querySelector('.custom-map-icon.selected')?.classList.remove('selected');

                    // Add animation to newly selected marker
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
        });

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            map.remove();
        };
    }, []);



    /* ---------- USER LOCATION WITH GPS OPTIMIZATION ---------- */
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;

                // GPS Optimization: Throttle updates to 1.5 seconds
                const now = Date.now();
                if (now - lastGpsUpdateRef.current < 1500) {
                    return;
                }
                lastGpsUpdateRef.current = now;

                if (!userMarkerRef.current) {
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
                } else {
                    userMarkerRef.current.setLatLng([latitude, longitude]);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);



    /* ---------- HANDLE EXIT ---------- */
    const handleExit = () => {
        navigate('/');
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

            <div id="explore-map"></div>

            {/* Exit Button */}
            <button className="exit-button" onClick={handleExit}>
                <FaTimes />
            </button>

            {/* Selected Building Card - Apple Maps Style */}
            {selectedBuilding && (
                <>
                    <div className="building-overlay" onClick={() => {
                        document.querySelector('.custom-map-icon.selected')?.classList.remove('selected');
                        setSelectedBuilding(null);
                    }} />
                    <div className="building-detail-sheet">
                        <div className="sheet-handle"></div>

                        <button className="close-sheet-btn" onClick={() => {
                            document.querySelector('.custom-map-icon.selected')?.classList.remove('selected');
                            setSelectedBuilding(null);
                        }}>
                            <FaTimes />
                        </button>

                        <div className="sheet-content">
                            {/* Building Image */}
                            {selectedBuilding.category && (
                                <div className="building-image-container">
                                    <img
                                        src={(() => {
                                            // Specific nodes
                                            if (selectedBuilding.id === 'SnacksBox') return '/Map_Icons/SnacksBox.png';
                                            if (selectedBuilding.id === 'OpenAuditorium') return '/Map_Icons/Open_Auditorium.png';
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
                                                'hall': 'Open_Auditorium',
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
                <div className="nav-item" onClick={() => navigate('/')}>
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
