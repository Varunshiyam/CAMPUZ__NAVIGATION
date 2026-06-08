import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPage.css";
import { nodes, locationData } from "./data";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaThLarge, FaCompass, FaBuilding, FaSearch, FaPlus, FaMinus, FaLocationArrow } from "react-icons/fa";
import { formatRoomLocation } from "./utils/roomUtils";
import FeedbackReminder from "./components/FeedbackReminder";
import { useSearchPlaceholder } from "./hooks/useSearchPlaceholder";
import { useMap } from "./components/MapProvider";
import { useCompassHeading } from "./hooks/useCompassHeading";
import { useUserLocation } from "./hooks/useUserLocation";
import { useMapAutoRotate } from "./hooks/useMapAutoRotate";

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

/* ---------- GET IMAGE FOR LOCATION ---------- */
const getLocationImage = (loc) => {
  const id = loc.id;
  const cat = loc.category || "";
  
  if (id === 'Library') return '/Map_Icons/Library.png';
  if (id === 'FoodCourt' || cat === 'food') {
    if (id === 'SnacksBox') return '/Map_Icons/SnacksBox.png';
    return '/Map_Icons/FoodCourt.png';
  }
  if (id === 'Auditorium') return '/Map_Icons/Auditorium.png';
  if (id === 'OpenAuditorium') return '/Map_Icons/Open-Auditorium.png';
  if (id === 'TurfGround') return '/Map_Icons/FootBallCourt.png';
  if (id === 'Kabbadi Ground') return '/Map_Icons/KabbadiCourt.png';
  if (id === 'TennisCourt') return '/Map_Icons/TennisCourt.png';
  if (cat === 'hostel' || id.toLowerCase().includes('hostel')) return '/Map_Icons/Hostel.png';
  if (id === 'Entrance' || id === 'Exit') return '/Map_Icons/Gate.png';
  if (cat === 'lab' || id.toLowerCase().includes('lab')) return '/Map_Icons/Computer_Lab.png';
  if (id === 'NewPlacementCell' || id === 'COE') return '/Map_Icons/Placement_Cell.png';
  if (id === 'Store' || id === 'Ragavendra') return '/Map_Icons/Store.png';
  
  // Default for blocks and others
  if (cat === 'block' || id.toLowerCase().includes('block')) return '/Map_Icons/Blocks.png';
  
  return '/Map_Icons/Blocks.png'; // default fallback
};

export default function MapPage() {
  const searchPlaceholder = useSearchPlaceholder();
  const { map, attachMap, detachMap, isInitialized } = useMap();
  const mapContainerRef = useRef(null);
  
  const userMarkerRef = useRef(null);
  const markersRef = useRef({});
  const popupListenersRef = useRef([]);
  // GPS Optimization: Timestamp-based throttling
  const lastGpsUpdateRef = useRef(0);

  const [goal, setGoal] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!isInitialized);
  const [locationError, setLocationError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('online');

  const navigate = useNavigate();
  const location = useLocation();

  // Custom Navigation hooks
  const { heading, permissionStatus, requestPermission } = useCompassHeading();
  const { location: userLocation, error: gpsError } = useUserLocation({ throttleMs: 1500 });
  const { isAutoFollow, recenter, resetNorth } = useMapAutoRotate(map, userLocation, heading, { enabled: true });

  useEffect(() => {
    if (gpsError) {
      setLocationError(gpsError);
    } else {
      setLocationError(null);
    }
  }, [gpsError]);

  const normalize = (s) => s.toLowerCase().replace(/\s+/g, "");

  /* ---------- MAP RESIZING SYSTEM ---------- */
  const [mapHeight, setMapHeight] = useState(window.innerWidth < 768 ? 320 : 450);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = mapHeight;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.classList.add("is-resizing");
  };

  const animationFrameRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(180, Math.min(800, startHeightRef.current + deltaY));
      setMapHeight(newHeight);
      
      if (map) {
        map.invalidateSize({ animate: false });
      }
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.classList.remove("is-resizing");
  };

  // Touch drag handlers for mobile responsiveness
  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = mapHeight;
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.body.classList.add("is-resizing");
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const deltaY = e.touches[0].clientY - startYRef.current;
      const newHeight = Math.max(160, Math.min(600, startHeightRef.current + deltaY));
      setMapHeight(newHeight);
      
      if (map) {
        map.invalidateSize({ animate: false });
      }
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    document.body.classList.remove("is-resizing");
  };

  // Cleanup resize listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.body.classList.remove("is-resizing");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapHeight]);

  /* ---------- MAP INIT (FIXED) ---------- */
  useEffect(() => {
    if (!isInitialized || !mapContainerRef.current || !map) return;
    
    attachMap(mapContainerRef.current);
    setLoading(false);

    /* ---------- CHUNKED INTERACTIVE MARKERS ---------- */
    const locations = Object.values(locationData);
    let index = 0;
    const chunkSize = 20;

    // Defensively clear any leaked markers from other pages (e.g. ExplorePage during PageTransition)
    map.eachLayer((layer) => {
      // Don't remove the tile layer or user location marker
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
        map.removeLayer(layer);
      }
    });

    const renderChunk = () => {
      // Check if we are still attached
      if (!mapContainerRef.current) return;

      const endIndex = Math.min(index + chunkSize, locations.length);
      for (let i = index; i < endIndex; i++) {
        const loc = locations[i];
        const node = nodes[loc.id];
        if (!node) continue;

        const minimalIcon = L.divIcon({
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

        const popupContent = `
          <div style="padding: 5px; text-align: center; font-weight: bold;">
            ${loc.name}
          </div>
        `;

        const marker = L.marker([node.lat, node.lon], {
          icon: minimalIcon,
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
      }

      index = endIndex;
      if (index < locations.length) {
        requestAnimationFrame(() => {
          setTimeout(renderChunk, 0); // Yield to main thread
        });
      }
    };

    // Start rendering markers after a short delay to let the map tile rendering breathe
    setTimeout(renderChunk, 100);

    return () => {
      // Clear markers on unmount to not pollute other pages using the shared map
      Object.values(markersRef.current).forEach(m => {
        if (map.hasLayer(m)) map.removeLayer(m);
      });
      markersRef.current = {};
      detachMap();
    };
  }, [isInitialized, attachMap, detachMap, map]);

  /* ---------- NETWORK STATUS MONITORING ---------- */
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  /* ---------- LIVE USER LOCATION ---------- */
  useEffect(() => {
    if (!map || !userLocation) return;

    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'user-location-marker-container',
        html: `
          <div class="user-direction-indicator">
            <div class="user-pulse-ring"></div>
            <div class="user-direction-beam"></div>
            <div class="user-blue-dot"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup("📍 You are here");
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
    }

    // Update direction indicator rotation relative to map
    const el = userMarkerRef.current.getElement();
    if (el) {
      const relativeHeading = heading !== null ? heading : 0;
      el.style.setProperty('--user-heading', `${relativeHeading}deg`);
    }
  }, [map, userLocation, heading]);

  /* ---------- DESTINATION UPDATE ---------- */
  useEffect(() => {
    if (!map) return;

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
          map.setView(marker.getLatLng(), 18);

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
              popupListenersRef.current.push({ el: popupElement, handler: toggleHandler });
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
          map.setView(marker.getLatLng(), 18);
        }
      }
    }

    // Cleanup function
    return () => {
      // Clear timers
      if (timersRef.collapse) clearTimeout(timersRef.collapse);
      if (timersRef.listener) clearTimeout(timersRef.listener);

      // Remove event listeners
      popupListenersRef.current.forEach(({ el, handler }) => {
        if (el) el.removeEventListener('click', handler);
      });
      popupListenersRef.current = [];
    };
  }, [goal, map]);

  /* ---------- START ---------- */
  const handleStart = async () => {
    if (!goal) {
      alert("Please select a destination");
      return;
    }

    if (permissionStatus === 'prompt') {
      await requestPermission();
    }

    navigate("/map", {
      state: { destination: goal },
    });
  };

  /* ---------- LISTEN FOR POPUP START BUTTON ---------- */
  useEffect(() => {
    const handlePopupStart = async (event) => {
      const destinationId = event.detail;
      if (destinationId) {
        if (permissionStatus === 'prompt') {
          await requestPermission();
        }
        navigate("/map", {
          state: { destination: destinationId },
        });
      }
    };

    window.addEventListener('startNavigation', handlePopupStart);
    return () => window.removeEventListener('startNavigation', handlePopupStart);
  }, [navigate, permissionStatus, requestPermission]);

  // Enhanced filtering to include indoor locations and show building context
  const sortedLocations = useMemo(() => {
    const filteredLocations = Object.values(locationData).filter((loc) => {
      const matchesSearch = normalize(loc.name).includes(normalize(search)) ||
        normalize(loc.id).includes(normalize(search));
      return matchesSearch;
    });

    // Separate and sort: buildings first, then indoor locations
    return filteredLocations.sort((a, b) => {
      if (a.type === 'destination' && b.type === 'indoor') return -1;
      if (a.type === 'indoor' && b.type === 'destination') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [search]);



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
        <FaSearch className="search-icon" />
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

      <div 
        className="map-scroll-wrapper" 
        style={{ height: `${mapHeight}px`, flex: 'none', position: 'relative', overflow: 'hidden' }}
      >
        <div id="map-container-MapPage" ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}></div>
        <button className="start-btn" onClick={handleStart}>
          START ➤
        </button>

        {/* Custom Map Controls */}
        {map && (
          <div className="map-overlay-controls" style={{ top: '16px' }}>
            <button className="map-overlay-btn" onClick={() => map.zoomIn()} title="Zoom In">
              <FaPlus />
            </button>
            <button className="map-overlay-btn" onClick={() => map.zoomOut()} title="Zoom Out">
              <FaMinus />
            </button>
            <button 
              className={`map-overlay-btn ${isAutoFollow ? 'active' : ''}`} 
              onClick={recenter} 
              title="Follow Me"
            >
              <FaLocationArrow />
            </button>
            <button 
              className="map-overlay-btn" 
              onClick={resetNorth} 
              title="North Up"
            >
              <FaCompass 
                className="compass-icon-rotate" 
                style={{ transform: `rotate(${-((heading || 0))}deg)` }} 
              />
            </button>
          </div>
        )}

        {/* Floating Recenter Button */}
        {map && !isAutoFollow && userLocation && (
          <button className="recenter-nav-btn" onClick={recenter}>
            <FaLocationArrow /> Recenter Navigation
          </button>
        )}

        {/* Device Orientation Permission Request Prompt */}
        {permissionStatus === 'prompt' && (
          <button 
            className="recenter-nav-btn" 
            style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#FFD700', color: '#000000' }}
            onClick={requestPermission}
          >
            <FaCompass /> Enable Compass Calibration
          </button>
        )}
      </div>

      {/* Elegant Draggable Resizer Divider */}
      <div 
        className="map-resize-divider"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title="Drag up or down to resize the map"
      >
        <div className="divider-line"></div>
        <div className="divider-handle">
          <span className="drag-dots">•••</span>
        </div>
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
              <div className="building-card-image-wrapper">
                <img 
                  src={getLocationImage(loc)} 
                  alt={loc.name} 
                  className="building-card-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/Map_Icons/Blocks.png';
                  }}
                />
              </div>
              <div className="building-card-info">
                <div className="building-card-name">{loc.name}</div>
                {loc.type === 'indoor' && (
                  <div className="building-card-context">{formatRoomLocation(loc, locationData)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="bottom-nav">
        <div
          className={`nav-item ${location.pathname === "/home" ? "active" : ""
            }`}
          onClick={() => navigate("/home")}
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
