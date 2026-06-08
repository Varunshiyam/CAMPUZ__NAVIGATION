import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nodes, adjacency } from "./data";
import { useMap } from "./components/MapProvider";
import "./Map.css";

import {
  FaHome,
  FaBuilding,
  FaThLarge,
  FaMap,
  FaTimes,
  FaPlus,
  FaMinus,
  FaLocationArrow,
  FaCompass
} from "react-icons/fa";
import { useCompassHeading } from "./hooks/useCompassHeading";
import { useUserLocation } from "./hooks/useUserLocation";
import { useMapAutoRotate } from "./hooks/useMapAutoRotate";

/* FIX LEAFLET ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ---------------- HELPERS ---------------- */
const toRad = (d) => (d * Math.PI) / 180;

const haversine = (a, b, c, d) => {
  const R = 6371e3;
  const x = toRad(c - a);
  const y = toRad(d - b);
  const m =
    Math.sin(x / 2) ** 2 +
    Math.cos(toRad(a)) *
    Math.cos(toRad(c)) *
    Math.sin(y / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(m));
};

const buildGraph = (localNodes, localAdj) => {
  const g = {};
  for (const k in localAdj) {
    g[k] = localAdj[k].map((n) => ({
      to: n,
      d: haversine(
        localNodes[k].lat,
        localNodes[k].lon,
        localNodes[n].lat,
        localNodes[n].lon
      ),
    }));
  }
  return g;
};

const astar = (g, start, end) => {
  const open = [start];
  const prev = {};
  const cost = { [start]: 0 };

  while (open.length) {
    open.sort((a, b) => cost[a] - cost[b]);
    const cur = open.shift();

    if (cur === end) {
      const path = [];
      for (let x = end; x; x = prev[x]) path.push(x);
      return path.reverse();
    }

    g[cur]?.forEach((e) => {
      const n = cost[cur] + e.d;
      if (cost[e.to] == null || n < cost[e.to]) {
        cost[e.to] = n;
        prev[e.to] = cur;
        open.push(e.to);
      }
    });
  }
  return [];
};

/* ---------------- COMPONENT ---------------- */
const CampusMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const goal = location.state?.destination;

  const { map, attachMap, detachMap, isInitialized } = useMap();
  const mapContainerRef = useRef(null);
  const routeRef = useRef(null);
  const userRef = useRef(null);
  const destRef = useRef(null);
  const watchIdRef = useRef(null);

  // GPS Optimization: Precompute graph once
  const graphRef = useRef(null);
  // GPS Optimization: Throttle updates (1.5 seconds)
  const lastUpdateRef = useRef(0);
  // GPS Optimization: Track current path for smart recalculation
  const currentPathRef = useRef(null);
  const mapInitializedRef = useRef(false);

  const isInvalid = !goal || !nodes[goal];
  const [loading, setLoading] = useState(!isInvalid);
  const [error, setError] = useState(isInvalid ? "Invalid destination" : null);

  // Custom walking navigation hooks
  const { heading, permissionStatus, requestPermission } = useCompassHeading();
  const { location: userLocation, error: gpsError } = useUserLocation({ throttleMs: 1500 });
  const { isAutoFollow, recenter, resetNorth } = useMapAutoRotate(map, userLocation, heading, { enabled: true });

  useEffect(() => {
    if (gpsError) {
      setError(gpsError);
      setLoading(false);
    }
  }, [gpsError]);

  /* -------- HELPER: DISTANCE FROM PATH -------- */
  const distanceFromPath = (userPos, path) => {
    if (!path || path.length === 0) return Infinity;

    let minDist = Infinity;
    for (const nodeId of path) {
      const node = nodes[nodeId];
      if (!node) continue;
      const dist = haversine(userPos.lat, userPos.lon, node.lat, node.lon);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  };

  /* -------- ROUTE CALCULATION (OPTIMIZED) -------- */
  const updateRoute = (user) => {
    console.log("🔄 updateRoute called with user:", user);
    console.log("📍 Goal destination:", goal);

    // GPS Optimization: Check if we need to recalculate route
    const DEVIATION_THRESHOLD = 8; // meters
    const shouldRecalculate = !currentPathRef.current ||
      distanceFromPath(user, currentPathRef.current) > DEVIATION_THRESHOLD;

    console.log("🔍 Should recalculate:", shouldRecalculate);

    // Always update user marker position (visual update only)
    if (!userRef.current) {
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

      userRef.current = L.marker([user.lat, user.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup("You");
      console.log("✅ Created user marker");
    } else {
      // Direct Leaflet update - no React re-render
      userRef.current.setLatLng([user.lat, user.lon]);
      console.log("✅ Updated user marker position");
    }

    // Update direction indicator rotation relative to map
    const el = userRef.current.getElement();
    if (el) {
      const relativeHeading = heading !== null ? heading : 0;
      el.style.setProperty('--user-heading', `${relativeHeading}deg`);
    }

    // Only recalculate route if user deviated significantly
    if (!shouldRecalculate) {
      console.log("⏭️ Skipping route recalculation (route still valid)");
      return; // Route is still valid, just updated marker
    }

    // GPS Optimization: Precomputed graph not used in this scope directly since we build a temp one

    // Find nearest node to user
    let nearest = null;
    let min = Infinity;
    for (const k in nodes) {
      const d = haversine(
        user.lat,
        user.lon,
        nodes[k].lat,
        nodes[k].lon
      );
      if (d < min) {
        min = d;
        nearest = k;
      }
    }

    console.log("📌 Nearest node to user:", nearest, "distance:", min.toFixed(2), "meters");

    // Build temporary graph with user position
    const tempNodes = { ...nodes, User: user };
    const tempAdj = { ...adjacency };
    tempAdj.User = [nearest];
    tempAdj[nearest] = [...(adjacency[nearest] || []), "User"];

    const tempGraph = buildGraph(tempNodes, tempAdj);
    const path = astar(tempGraph, "User", goal);

    console.log("🛤️ Path calculated:", path);
    console.log("📏 Path length:", path.length);

    if (!path.length) {
      console.error("❌ No path found from user to goal!");
      setError("No route found to destination");
      return;
    }

    // Store current path for future deviation checks
    currentPathRef.current = path;

    const latlngs = path.map((p) => [
      tempNodes[p].lat,
      tempNodes[p].lon,
    ]);

    console.log("🗺️ Creating polyline with", latlngs.length, "points");

    if (routeRef.current) {
      console.log("🔄 Updating existing route");
      routeRef.current.setLatLngs(latlngs);
    } else {
      console.log("✅ Creating new route polyline");
      routeRef.current = L.polyline(latlngs, {
        color: "red",
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(map);
    }

    // Trigger navigation completed event for feedback reminder
    window.dispatchEvent(new Event('navigationCompleted'));
  };

  /* -------- MAP INIT + LIVE ROUTING (OPTIMIZED) -------- */
  useEffect(() => {
    // GPS Optimization: Prevent map recreation
    if (mapInitializedRef.current) return;

    if (isInvalid) return;

    // GPS Optimization: Precompute graph once
    if (!graphRef.current) {
      graphRef.current = buildGraph(nodes, adjacency);
    }

    // Delay initialization to let Framer Motion page transition complete
    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current || !map) return;
      attachMap(mapContainerRef.current);
      
      mapInitializedRef.current = true;

      // Custom counter-rotatable destination marker
      const destIcon = L.divIcon({
        className: "dest-marker-container",
        html: `
          <div class="dest-marker-inner">
            <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" alt="destination" style="width: 25px; height: 41px;" />
          </div>
        `,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      destRef.current = L.marker([
        nodes[goal].lat,
        nodes[goal].lon,
      ], { icon: destIcon }).addTo(map);

      if (userLocation) {
        updateRoute(userLocation);
        setLoading(false);
      }
    }, 300); // 300ms delay for page transition

    return () => {
      clearTimeout(initTimer);
      
      if (map) {
        if (destRef.current && map.hasLayer(destRef.current)) {
          map.removeLayer(destRef.current);
          destRef.current = null;
        }
        if (userRef.current && map.hasLayer(userRef.current)) {
          map.removeLayer(userRef.current);
          userRef.current = null;
        }
        if (routeRef.current && map.hasLayer(routeRef.current)) {
          map.removeLayer(routeRef.current);
          routeRef.current = null;
        }
      }
      
      detachMap();
      mapInitializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, isInitialized, map, attachMap, detachMap]);

  useEffect(() => {
    if (!map || !userLocation || !mapInitializedRef.current) return;
    updateRoute(userLocation);
    setLoading(false);
  }, [map, userLocation]);

  const handleExit = () => {
    navigate("/home");
  };

  return (
    <>
      {loading && (
        <div className="route-loading-overlay">
          <div className="loading-radar">
            <img
              src="/route-loading-icon.png"
              alt=""
              className="radar-center-icon"
            />
            <div className="radar-ring"></div>
            <div className="radar-ring"></div>
            <div className="radar-ring"></div>
          </div>
          <div className="loading-text">Calculating Route...</div>
        </div>
      )}

      {error && <div className="route-error">{error}</div>}

      <button className="exit-btn" onClick={handleExit}>
        <FaTimes /> Exit
      </button>

      <div 
        className="map-nav-wrapper" 
        style={{ width: '100%', height: '100%', flex: 1, minHeight: '60vh', position: 'relative', overflow: 'hidden' }}
      >
        <div id="map-container-CampusMap" ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}></div>

        {/* Custom Map Controls */}
        {map && (
          <div className="map-overlay-controls" style={{ top: '80px' }}>
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

      <nav className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/home")}>
          <FaHome /><span>Home</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/buildings")}>
          <FaBuilding /><span>Buildings</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/categories")}>
          <FaThLarge /><span>Categories</span>
        </div>
        <div className="nav-item active">
          <FaMap /><span>Map</span>
        </div>
      </nav>
    </>
  );
};

export default CampusMap;
