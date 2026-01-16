import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ExplorePage.css';
import { nodes, locationData } from './data';
import { FaHome, FaBuilding, FaThLarge, FaCompass, FaTimes } from 'react-icons/fa';

const ExplorePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const userMarkerRef = useRef(null);
    const initialized = useRef(false);

    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ---------- MAP INITIALIZATION (MATCHING MAPPAGE) ---------- */
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const bounds = L.latLngBounds(
            [10.8725, 77.0160], // SOUTH expanded (E-Block + Hostels)
            [10.8845, 77.0265]  // NORTH safe buffer
        );

        const map = L.map('explore-map', {
            maxBounds: bounds,
            maxBoundsViscosity: 0.4,
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

        // Match MapPage default view
        map.setView([10.8772, 77.0218], 18);
        mapRef.current = map;

        // Use same tile layer as MapPage
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

        setLoading(false);

        /* ---------- BLUE DOT MARKERS (MATCHING MAPPAGE) ---------- */
        Object.values(locationData).forEach((loc) => {
            const node = nodes[loc.id];
            if (!node) return;

            const blueDotIcon = L.divIcon({
                className: 'blue-dot-marker',
                html: '<div class="blue-dot"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
                popupAnchor: [0, -8],
            });

            const popupContent = `
                <div class="premium-popup-card">
                    <h3 class="popup-location-title">${loc.name}</h3>
                </div>
            `;

            const marker = L.marker([node.lat, node.lon], {
                icon: blueDotIcon,
                title: loc.name,
                riseOnHover: true,
            })
                .addTo(map)
                .bindPopup(popupContent, {
                    className: 'premium-popup',
                    closeButton: false,
                    offset: [0, -5],
                    autoPan: false,
                })
                .on('click', () => {
                    setSelectedBuilding({
                        id: loc.id,
                        ...loc,
                        lat: node.lat,
                        lon: node.lon
                    });
                    // Smooth fly to location
                    map.flyTo([node.lat, node.lon], 18, {
                        duration: 1,
                        easeLinearity: 0.25
                    });
                });

            markersRef.current[loc.id] = marker;
        });

        return () => map.remove();
    }, []);

    /* ---------- USER LOCATION ---------- */
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        let updateTimeout = null;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;

                if (updateTimeout) clearTimeout(updateTimeout);

                updateTimeout = setTimeout(() => {
                    setUserLocation({ lat: latitude, lon: longitude });

                    if (!userMarkerRef.current) {
                        const userIcon = L.divIcon({
                            className: 'user-location-marker',
                            html: '<div class="pulse-dot"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });

                        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
                            .addTo(map)
                            .bindPopup('📍 You are here');
                    } else {
                        userMarkerRef.current.setLatLng([latitude, longitude]);
                    }
                }, 500);
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
            navigator.geolocation.clearWatch(watchId);
            if (updateTimeout) clearTimeout(updateTimeout);
        };
    }, []);

    /* ---------- HANDLE BACK NAVIGATION ---------- */
    const handleBack = () => {
        // Navigate back to previous page
        navigate(-1);
    };

    const handleDirections = (buildingId) => {
        navigate('/map', {
            state: { destination: buildingId }
        });
    };

    return (
        <div className="explore-page">
            {loading && (
                <div className="map-loading">Loading map...</div>
            )}

            <div id="explore-map"></div>

            {/* Back Button */}
            <button className="back-button" onClick={handleBack}>
                <FaTimes />
            </button>

            {/* Selected Building Card */}
            {selectedBuilding && (
                <>
                    <div className="building-card-overlay" onClick={() => setSelectedBuilding(null)} />
                    <div className="building-detail-card">
                        <button className="close-card-btn" onClick={() => setSelectedBuilding(null)}>
                            <FaTimes />
                        </button>

                        <div className="card-header">
                            <h2>{selectedBuilding.name}</h2>
                            {selectedBuilding.category && (
                                <span className="category-badge">{selectedBuilding.category}</span>
                            )}
                        </div>

                        {selectedBuilding.description && (
                            <p className="card-description">{selectedBuilding.description}</p>
                        )}

                        <button className="directions-btn" onClick={() => handleDirections(selectedBuilding.id)}>
                            Get Directions →
                        </button>
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
