import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* HELPER FUNCTIONS - Outside component for performance */
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

const CampusMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const goal = location.state?.destination;
  const cachedUserLocation = location.state?.userLocation;

  const mapRef = useRef(null);
  const routeRef = useRef(null);
  const userRef = useRef(null);
  const destRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const map = L.map("map").setView([10.8795, 77.0213], 17);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
    }).addTo(map);

    console.log("CampusMap - Received goal:", goal);
    console.log("CampusMap - Goal exists in nodes:", !!nodes[goal]);

    if (!goal || !nodes[goal]) {
      console.error("CampusMap - No valid goal. Goal:", goal, "Available nodes:", Object.keys(nodes).slice(0, 10));
      setError("Invalid destination");
      setLoading(false);
      return;
    }

    // Use shallow copy instead of structuredClone (much faster)
    const localNodes = { ...nodes };
    const localAdj = Object.keys(adjacency).reduce((acc, key) => {
      acc[key] = [...adjacency[key]];
      return acc;
    }, {});

    const processRoute = (user, localNodes, localAdj) => {
      let nearest = null;
      let min = Infinity;

      for (const k in localNodes) {
        const d = haversine(
          user.lat,
          user.lon,
          localNodes[k].lat,
          localNodes[k].lon
        );
        if (d < min) {
          min = d;
          nearest = k;
        }
      }

      localNodes.User = user;
      localAdj.User = [nearest];
      localAdj[nearest].push("User");

      const graph = buildGraph(localNodes, localAdj);
      const path = astar(graph, "User", goal);

      if (!path.length) {
        setError("Could not find route");
        setLoading(false);
        return;
      }

      const latlngs = path.map((p) => [
        localNodes[p].lat,
        localNodes[p].lon,
      ]);

      routeRef.current = L.polyline(latlngs, {
        color: "red",
        weight: 5,
      }).addTo(map);

      userRef.current = L.marker([user.lat, user.lon])
        .addTo(map)
        .bindPopup("You");

      destRef.current = L.marker([
        localNodes[goal].lat,
        localNodes[goal].lon,
      ])
        .addTo(map)
        .bindPopup(goal);

      map.fitBounds(latlngs, { padding: [40, 40] });
      setLoading(false);
    };

    // Use cached location if available, otherwise fetch fresh
    if (cachedUserLocation) {
      console.log("Using cached location:", cachedUserLocation);
      processRoute(cachedUserLocation, localNodes, localAdj);
    } else {
      // Add timeout to geolocation request
      let locationTimeout = setTimeout(() => {
        setError("Location request timed out. Please ensure location services are enabled.");
        setLoading(false);
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(locationTimeout);
          const user = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          };
          processRoute(user, localNodes, localAdj);
        },
        (err) => {
          clearTimeout(locationTimeout);
          console.error("Geolocation error:", err);
          setError("Unable to get your location. Please enable location services.");
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 10000
        }
      );
    }

    return () => map.remove();
  }, [goal]);

  const handleExit = () => {
    const map = mapRef.current;
    if (!map) return;

    if (routeRef.current) map.removeLayer(routeRef.current);
    if (userRef.current) map.removeLayer(userRef.current);
    if (destRef.current) map.removeLayer(destRef.current);

    map.setView([10.8795, 77.0213], 17);
    navigate("/map");
  };

  return (
    <>
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '30px 40px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '18px',
          color: '#333'
        }}>
          <div style={{ marginBottom: '15px' }}>🧭 Calculating route...</div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#ff6b6b',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      <button className="exit-btn" onClick={handleExit}>
        <FaTimes /> Exit
      </button>

      <div id="map"></div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <nav className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/")}>
          <FaHome />
          <span>Home</span>
        </div>

        <div className="nav-item" onClick={() => navigate("/buildings")}>
          <FaBuilding />
          <span>Buildings</span>
        </div>

        <div className="nav-item" onClick={() => navigate("/categories")}>
          <FaThLarge />
          <span>Categories</span>
        </div>

        <div className="nav-item active">
          <FaMap />
          <span>Map</span>
        </div>
      </nav>
    </>
  );
};

export default CampusMap;
