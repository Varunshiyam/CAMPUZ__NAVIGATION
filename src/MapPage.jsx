import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPage.css";
import { nodes, locationData } from "./data";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaThLarge, FaCompass, FaBuilding } from "react-icons/fa";
import { formatRoomLocation } from "./utils/roomUtils";
import FeedbackReminder from "./components/FeedbackReminder";
import { useSearchPlaceholder } from "./hooks/useSearchPlaceholder";

/* ---------- FIX LEAFLET ICON ---------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapPage() {
  const searchPlaceholder = useSearchPlaceholder();
  const mapRef = useRef(null);
  const initialized = useRef(false);
  const userMarkerRef = useRef(null);
  const markersRef = useRef({});
  // GPS Optimization: Timestamp-based throttling
  const lastGpsUpdateRef = useRef(0);

  const [goal, setGoal] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('online');

  const tileLayerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const normalize = (s) => s.toLowerCase().replace(/\s+/g, "");

  /* ---------- MAP INIT (FIXED) ---------- */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const bounds = L.latLngBounds(
      [10.8725, 77.0160], // SOUTH expanded (E-Block + Hostels)
      [10.8845, 77.0265]  // NORTH safe buffer
    );

    const map = L.map("map", {
      maxBounds: bounds,
      maxBoundsViscosity: 1.0, // GPS Optimization: strict boundary enforcement
      minZoom: 17,             // 1 zoom out
      maxZoom: 19,             // 2 zoom in
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      inertia: true,
      // Performance optimizations
      preferCanvas: true,           // Use canvas for better performance
      zoomAnimation: true,          // Smooth zoom transitions
      zoomAnimationThreshold: 4,    // Max zoom levels for animation
      fadeAnimation: true,          // Fade tiles in/out
      markerZoomAnimation: false,   // Disable marker animation (faster)
      // Zoom settings
      wheelPxPerZoomLevel: 120,     // Smoother scroll zoom
      zoomSnap: 1,                  // Snap to integer zoom levels
      zoomDelta: 1,                 // Zoom in/out by 1 level
    });

    // Default = middle zoom level
    map.setView([10.8772, 77.0218], 18);
    mapRef.current = map;

    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 17,
      maxZoom: 19,
      // Tile caching & performance optimizations
      keepBuffer: 4,              // Keep 4 tile rows/cols (more aggressive caching)
      updateWhenIdle: true,       // Only load tiles after user stops moving
      updateWhenZooming: false,   // Don't reload during zoom animation
      updateInterval: 250,        // Throttle tile updates (ms)
      // Network optimizations
      maxNativeZoom: 19,          // Max zoom level from server
      tileSize: 256,              // Standard tile size
      crossOrigin: true,          // Enable CORS for caching
      // Error handling for low network
      errorTileUrl: '',           // Don't show error tiles
      // Performance
      detectRetina: false,        // Disable retina detection for faster loading
      noWrap: true,               // Don't wrap tiles around world
      // Advanced network resilience
      bounds: bounds,             // Only load tiles within bounds
      // Mobile optimizations
      tapTolerance: 15,           // Better touch support
      // Retry logic for failed tiles
      retryAttempts: 3,           // Custom property for retry logic
      retryDelay: 1000,           // Custom property for retry delay
    });

    // Add retry logic for failed tile loads
    tileLayer.on('tileerror', function (error) {
      const tile = error.tile;
      const url = error.tile.src;
      let attempts = tile.getAttribute('data-retry') || 0;

      if (attempts < 3) {
        attempts++;
        tile.setAttribute('data-retry', attempts);
        setTimeout(() => {
          tile.src = url;
        }, 1000 * attempts); // Exponential backoff
      }
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    setLoading(false);

    /* ---------- INTERACTIVE MARKERS ---------- */
    Object.values(locationData).forEach((loc) => {
      const node = nodes[loc.id];
      if (!node) return;

      const blueDotIcon = L.divIcon({
        className: "blue-dot-marker",
        html: '<div class="blue-dot"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
      });

      const popupContent = `
        <div style="padding: 5px; text-align: center; font-weight: bold;">
          ${loc.name}
        </div>
      `;

      const marker = L.marker([node.lat, node.lon], {
        icon: blueDotIcon,
        title: loc.name,
        riseOnHover: true,
      })
        .addTo(map)
        .bindPopup(popupContent, {
          closeButton: false,
          offset: [0, -5],
          autoPan: false,
        })
        .on("click", () => setGoal(loc.id));

      markersRef.current[loc.id] = marker;
    });

    return () => map.remove();
  }, []);

  /* ---------- NETWORK STATUS MONITORING ---------- */
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      if (tileLayerRef.current && mapRef.current) {
        tileLayerRef.current.redraw();
      }
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
    };

    // Monitor connection quality
    const updateConnectionQuality = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'

          // Adjust tile loading based on connection
          if (tileLayerRef.current) {
            if (effectiveType === 'slow-2g' || effectiveType === '2g') {
              tileLayerRef.current.options.updateInterval = 500; // Slower updates
              tileLayerRef.current.options.keepBuffer = 2; // Less aggressive caching
            } else if (effectiveType === '3g') {
              tileLayerRef.current.options.updateInterval = 300;
              tileLayerRef.current.options.keepBuffer = 3;
            } else {
              tileLayerRef.current.options.updateInterval = 250;
              tileLayerRef.current.options.keepBuffer = 4;
            }
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality on mount and when it changes
    updateConnectionQuality();
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', updateConnectionQuality);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', updateConnectionQuality);
        }
      }
    };
  }, []);


  /* ---------- LIVE USER LOCATION ---------- */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // GPS Optimization: Timestamp-based throttling (1.5 seconds)
        const now = Date.now();
        if (now - lastGpsUpdateRef.current < 1500) {
          return; // Skip this update
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
            .bindPopup("📍 You are here");
        } else {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError(
          "Unable to access your location. Please enable location services."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000 // Cache position for 5 seconds
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  /* ---------- DESTINATION UPDATE ---------- */
  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup timers ref
    const timersRef = { collapse: null, listener: null };

    // Reset all markers
    Object.values(markersRef.current).forEach((m) => {
      m.setOpacity(0.7);
      m.closePopup();
    });

    if (goal) {
      const selectedLocation = locationData[goal];

      // Handle indoor locations (rooms, labs, etc.)
      if (selectedLocation && selectedLocation.type === 'indoor') {
        const parentBuilding = selectedLocation.parentBuilding;
        const marker = markersRef.current[parentBuilding];

        if (marker) {
          marker.setOpacity(1);
          mapRef.current.setView(marker.getLatLng(), 18);

          // Import the floor display utility
          const getFloorDisplayComplete = (floor) => {
            const floorNames = {
              0: 'Ground',
              1: 'First',
              2: 'Second',
              3: 'Third',
              4: 'Fourth',
              5: 'Fifth'
            };
            const name = floorNames[floor] || `${floor}th`;
            return `${name} (${floor})`;
          };

          // Create enhanced popup content
          const shortName = selectedLocation.shortName || selectedLocation.name;
          const blockName = selectedLocation.blockName || selectedLocation.parentBuilding;
          const roomId = selectedLocation.id;
          const floorDisplay = getFloorDisplayComplete(selectedLocation.floor);

          // Create popup HTML with enhanced styling
          const enhancedPopupContent = `
            <div class="enhanced-location-popup expanded" id="indoor-popup-${roomId}">
              <div class="popup-header">
                <div class="short-name">${shortName}</div>
                <div class="room-id">${roomId}</div>
              </div>
              <div class="popup-details">
                <div class="detail-row">
                  <span class="label">Floor:</span>
                  <span class="value">${floorDisplay}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Block:</span>
                  <span class="value">${blockName}</span>
                </div>
              </div>
              <button class="popup-start-btn" onclick="window.dispatchEvent(new CustomEvent('startNavigation', { detail: '${parentBuilding}' }))">
                START ➤
              </button>
            </div>
          `;

          // Bind the enhanced popup
          marker.bindPopup(enhancedPopupContent, {
            className: 'enhanced-indoor-popup',
            closeButton: false,
            offset: [0, -8],
            autoPan: true,
            maxWidth: 340,
            minWidth: 260
          }).openPopup();

          // Auto-collapse after 6 seconds
          timersRef.collapse = setTimeout(() => {
            const popupElement = document.getElementById(`indoor-popup-${roomId}`);
            if (popupElement && popupElement.classList.contains('expanded')) {
              popupElement.classList.remove('expanded');
              popupElement.classList.add('collapsed');

              // Update popup content to show only block name in collapsed state
              const shortNameEl = popupElement.querySelector('.short-name');
              if (shortNameEl) {
                shortNameEl.textContent = blockName;
              }
            }
          }, 6000);

          // Add click listener to toggle expand/collapse
          timersRef.listener = setTimeout(() => {
            const popupElement = document.getElementById(`indoor-popup-${roomId}`);
            if (popupElement) {
              const toggleHandler = function (e) {
                // Don't toggle if clicking the START button
                if (e.target.classList.contains('popup-start-btn')) return;

                if (this.classList.contains('collapsed')) {
                  this.classList.remove('collapsed');
                  this.classList.add('expanded');
                  const shortNameEl = this.querySelector('.short-name');
                  if (shortNameEl) {
                    shortNameEl.textContent = shortName;
                  }
                } else {
                  this.classList.remove('expanded');
                  this.classList.add('collapsed');
                  const shortNameEl = this.querySelector('.short-name');
                  if (shortNameEl) {
                    shortNameEl.textContent = blockName;
                  }
                }
              };

              popupElement.addEventListener('click', toggleHandler);
              // Store handler for cleanup
              popupElement._toggleHandler = toggleHandler;
            }
          }, 100);
        }
      } else {
        // Handle regular building destinations - keep simple popup
        const marker = markersRef.current[goal];
        if (marker) {
          marker.setOpacity(1);
          const popupContent = `
            <div style="padding: 5px; text-align: center; font-weight: bold;">
              ${selectedLocation.name}
            </div>
          `;
          marker.bindPopup(popupContent, {
            closeButton: false,
            offset: [0, -5],
            autoPan: false
          }).openPopup();
          mapRef.current.setView(marker.getLatLng(), 18);
        }
      }
    }

    // Cleanup function
    return () => {
      // Clear timers
      if (timersRef.collapse) clearTimeout(timersRef.collapse);
      if (timersRef.listener) clearTimeout(timersRef.listener);

      // Remove event listeners
      const popupElements = document.querySelectorAll('[id^="indoor-popup-"]');
      popupElements.forEach(el => {
        if (el._toggleHandler) {
          el.removeEventListener('click', el._toggleHandler);
          delete el._toggleHandler;
        }
      });
    };
  }, [goal]);

  /* ---------- START ---------- */
  const handleStart = () => {
    if (!goal) {
      alert("Please select a destination");
      return;
    }

    navigate("/map", {
      state: { destination: goal },
    });
  };

  /* ---------- LISTEN FOR POPUP START BUTTON ---------- */
  useEffect(() => {
    const handlePopupStart = (event) => {
      const destinationId = event.detail;
      if (destinationId) {
        navigate("/map", {
          state: { destination: destinationId },
        });
      }
    };

    window.addEventListener('startNavigation', handlePopupStart);
    return () => window.removeEventListener('startNavigation', handlePopupStart);
  }, [navigate]);

  // Enhanced filtering to include indoor locations and show building context
  const filteredLocations = Object.values(locationData).filter((loc) => {
    const matchesSearch = normalize(loc.name).includes(normalize(search)) ||
      normalize(loc.id).includes(normalize(search));
    return matchesSearch;
  });

  // Separate and sort: buildings first, then indoor locations
  const sortedLocations = filteredLocations.sort((a, b) => {
    if (a.type === 'destination' && b.type === 'indoor') return -1;
    if (a.type === 'indoor' && b.type === 'destination') return 1;
    return a.name.localeCompare(b.name);
  });



  return (
    <div className="app-container">
      {/* Feedback Reminder Banner */}
      <FeedbackReminder />

      {loading && (
        <div className="map-loading">Loading map...</div>
      )}

      {locationError && (
        <div className="location-error">{locationError}</div>
      )}

      {networkStatus === 'offline' && (
        <div className="network-status-offline">
          📡 Offline - Using cached map tiles
        </div>
      )}

      <div className="search-bar">
        <input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="chips">
        {sortedLocations.slice(0, 20).map((loc) => (
          <button
            key={loc.id}
            className={`chip ${goal === loc.id ? "active" : ""} ${loc.type === 'indoor' ? 'indoor-chip' : ''}`}
            onClick={() => setGoal(loc.id)}
          >
            {loc.type === 'indoor' ? (
              <span className="chip-content">
                <span className="chip-name">{loc.name}</span>
                <span className="chip-context">{formatRoomLocation(loc, locationData)}</span>
              </span>
            ) : (
              loc.name
            )}
          </button>
        ))}
      </div>

      <div className="map-scroll-wrapper">
        <div id="map"></div>
        <button className="start-btn" onClick={handleStart}>
          START ➤
        </button>
      </div>

      <div className="buildings-section">
        <h3>Nearby Locations</h3>
        <div className="buildings-row">
          {sortedLocations.slice(0, 10).map((loc) => (
            <div
              key={loc.id}
              className={`building-card ${goal === loc.id ? "active" : ""} ${loc.type === 'indoor' ? 'indoor-card' : ''}`}
              onClick={() => setGoal(loc.id)}
            >
              <div className="building-card-name">{loc.name}</div>
              {loc.type === 'indoor' && (
                <div className="building-card-context">{formatRoomLocation(loc, locationData)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <nav className="bottom-nav">
        <div
          className={`nav-item ${location.pathname === "/" ? "active" : ""
            }`}
          onClick={() => navigate("/")}
        >
          <FaHome />
          <span>Home</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/buildings" ? "active" : ""
            }`}
          onClick={() => navigate("/buildings")}
        >
          <FaBuilding />
          <span>Building</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/categories" ? "active" : ""
            }`}
          onClick={() => navigate("/categories")}
        >
          <FaThLarge />
          <span>Categories</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/explore" ? "active" : ""
            }`}
          onClick={() => navigate("/explore")}
        >
          <FaCompass />
          <span>Explore</span>
        </div>
      </nav>
    </div>
  );
}
