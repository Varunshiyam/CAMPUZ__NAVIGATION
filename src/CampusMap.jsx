import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nodes, adjacency } from "./data";
import "./Map.css";

import {
  FaHome,
  FaBuilding,
  FaThLarge,
  FaMap,
  FaTimes
} from "react-icons/fa";

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

  const mapRef = useRef(null);
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
      userRef.current = L.marker([user.lat, user.lon])
        .addTo(mapRef.current)
        .bindPopup("You");
      console.log("✅ Created user marker");
    } else {
      // Direct Leaflet update - no React re-render
      userRef.current.setLatLng([user.lat, user.lon]);
      console.log("✅ Updated user marker position");
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
      console.log("🗑️ Removing old route");
      mapRef.current.removeLayer(routeRef.current);
    }

    routeRef.current = L.polyline(latlngs, {
      color: "red",
      weight: 5,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(mapRef.current);

    console.log("✅ RED POLYLINE CREATED AND ADDED TO MAP!");
    console.log("🔴 Polyline options:", routeRef.current.options);

    // Trigger navigation completed event for feedback reminder
    window.dispatchEvent(new Event('navigationCompleted'));
  };

  /* -------- MAP INIT + LIVE TRACKING (OPTIMIZED) -------- */
  useEffect(() => {
    // GPS Optimization: Prevent map recreation
    if (mapInitializedRef.current) return;

    if (isInvalid) return;

    // GPS Optimization: Precompute graph once
    if (!graphRef.current) {
      graphRef.current = buildGraph(nodes, adjacency);
    }

    const bounds = L.latLngBounds(
      [10.8725, 77.0160], // SOUTH expanded
      [10.8845, 77.0265]  // NORTH safe buffer
    );

    const map = L.map("map", {
      maxBounds: bounds,
      maxBoundsViscosity: 1.0, // Strict boundary enforcement
      minZoom: 17,
      maxZoom: 19,
      zoomControl: true,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: false,
    }).setView([10.8795, 77.0213], 17);

    mapRef.current = map;
    mapInitializedRef.current = true;

    // GPS Optimization: Enhanced tile layer settings
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 17,
      keepBuffer: 4,              // Aggressive caching
      updateWhenIdle: true,       // Load tiles after movement stops
      updateWhenZooming: false,   // No reload during zoom
      updateInterval: 250,        // Throttle tile updates
      crossOrigin: true,
      errorTileUrl: '',
      detectRetina: false,
      noWrap: true,
      bounds: bounds,
    }).addTo(map);

    destRef.current = L.marker([
      nodes[goal].lat,
      nodes[goal].lon,
    ]).addTo(map);

    // GPS Optimization: Throttled watchPosition
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current;

        // Throttle: only update every 1.5 seconds
        if (timeSinceLastUpdate < 1500) {
          return; // Skip this update
        }

        lastUpdateRef.current = now;

        const user = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };

        updateRoute(user);
        setLoading(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setError("Location unavailable. Enable GPS for live routing.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,      // Reuse recent location (2s)
        timeout: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapInitializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);

  const handleExit = () => {
    navigate("/");
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

      <div id="map"></div>

      <nav className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/")}>
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
