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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* -------- ROUTE CALCULATION (REUSABLE) -------- */
  const updateRoute = (user) => {
    const localNodes = { ...nodes };
    const localAdj = {};

    Object.keys(adjacency).forEach((k) => {
      localAdj[k] = [...adjacency[k]];
    });

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

    if (!path.length) return;

    const latlngs = path.map((p) => [
      localNodes[p].lat,
      localNodes[p].lon,
    ]);

    if (routeRef.current) {
      mapRef.current.removeLayer(routeRef.current);
    }

    routeRef.current = L.polyline(latlngs, {
      color: "red",
      weight: 5,
    }).addTo(mapRef.current);

    if (!userRef.current) {
      userRef.current = L.marker([user.lat, user.lon])
        .addTo(mapRef.current)
        .bindPopup("You");
    } else {
      userRef.current.setLatLng([user.lat, user.lon]);
    }
  };

  /* -------- MAP INIT + LIVE TRACKING -------- */
  useEffect(() => {
    if (!goal || !nodes[goal]) {
      setError("Invalid destination");
      setLoading(false);
      return;
    }

    const map = L.map("map").setView([10.8795, 77.0213], 17);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
    }).addTo(map);

    destRef.current = L.marker([
      nodes[goal].lat,
      nodes[goal].lon,
    ]).addTo(map);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const user = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };

        updateRoute(user);
        setLoading(false);
      },
      (err) => {
        setError("Unable to track location. Enable GPS.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
    };
  }, [goal]);

  const handleExit = () => {
    navigate("/map");
  };

  return (
    <>
      {loading && (
        <div className="route-loading">🧭 Tracking your route…</div>
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
