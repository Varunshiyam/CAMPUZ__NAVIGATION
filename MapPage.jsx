import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPage.css";
import { nodes, adjacency } from "./data";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaThLarge, FaMap, FaBuilding } from "react-icons/fa";

/* ✅ DESTINATIONS */
const DESTINATIONS = {
  "Library": "Library",
  "A Block": "ABlock",
  "B Block": "BBlock",
  "C Block": "Cblock",
  "D Block": "DBlock",
  "E Block": "E-Block",
  "Turf Ground": "TurfGround",
  "Food Court": "FoodCourt",
  "Girls Hostel": "GirlsHostel",
  "Exit": "Exit"
};

const MapPage = () => {
  const mapRef = useRef(null);
  const routeRef = useRef(null);
  const initialized = useRef(false);

  const [goal, setGoal] = useState(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  /* ---------- HELPERS ---------- */
  const normalize = (s) => s.toLowerCase().replace(/\s+/g, "");

  const toRad = (d) => (d * Math.PI) / 180;
  const haversine = (a, b, c, d) => {
    const R = 6371e3;
    const dLat = toRad(c - a);
    const dLon = toRad(d - b);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a)) *
        Math.cos(toRad(c)) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  /* ---------- MAP INIT WITH CAMPUS BOUNDS ---------- */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    /* 🔒 KCE CAMPUS BOUNDARY */
    const southWest = L.latLng(10.8755, 77.0165);
    const northEast = L.latLng(10.8835, 77.0255);
    const campusBounds = L.latLngBounds(southWest, northEast);

    const map = L.map("map", {
      maxBounds: campusBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 16
    });

    map.fitBounds(campusBounds);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 0);

    return () => map.remove();
  }, []);

  /* ---------- GRAPH ---------- */
  const buildGraph = (adj, nodeSet) => {
    const g = {};
    for (const n in adj) {
      g[n] = adj[n].map(v => ({
        to: v,
        d: haversine(
          nodeSet[n].lat,
          nodeSet[n].lon,
          nodeSet[v].lat,
          nodeSet[v].lon
        )
      }));
    }
    return g;
  };

  /* ---------- A* ---------- */
  const astar = (graph, start, end, nodeSet) => {
    const g = {}, f = {}, prev = {};
    Object.keys(nodeSet).forEach(n => (g[n] = f[n] = Infinity));

    g[start] = 0;
    f[start] = 0;

    const open = [start];

    while (open.length) {
      open.sort((a, b) => f[a] - f[b]);
      const cur = open.shift();

      if (cur === end) {
        const path = [];
        let c = cur;
        while (prev[c]) {
          path.push(c);
          c = prev[c];
        }
        return [start, ...path.reverse()];
      }

      (graph[cur] || []).forEach(e => {
        const t = g[cur] + e.d;
        if (t < g[e.to]) {
          prev[e.to] = cur;
          g[e.to] = t;
          f[e.to] =
            t +
            haversine(
              nodeSet[e.to].lat,
              nodeSet[e.to].lon,
              nodeSet[end].lat,
              nodeSet[end].lon
            );
          if (!open.includes(e.to)) open.push(e.to);
        }
      });
    }
    return [];
  };

  /* ---------- START NAVIGATION ---------- */
  const startNavigation = () => {
    if (!goal) {
      alert("Select a destination");
      return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      const map = mapRef.current;

      if (routeRef.current) {
        map.removeLayer(routeRef.current);
        routeRef.current = null;
      }

      const localNodes = structuredClone(nodes);
      const localAdj = structuredClone(adjacency);

      let nearest = "Entrance";
      let min = Infinity;

      for (const k in localNodes) {
        const d = haversine(
          latitude,
          longitude,
          localNodes[k].lat,
          localNodes[k].lon
        );
        if (d < min) {
          min = d;
          nearest = k;
        }
      }

      localNodes.User = { lat: latitude, lon: longitude };
      localAdj.User = [nearest];
      localAdj[nearest] = [...localAdj[nearest], "User"];

      const graph = buildGraph(localAdj, localNodes);
      const path = astar(graph, "User", goal, localNodes);

      if (!path.length) {
        alert("No path found");
        return;
      }

      const latlngs = path.map(p => [
        localNodes[p].lat,
        localNodes[p].lon
      ]);

      routeRef.current = L.polyline(latlngs, {
        color: "red",
        weight: 5
      }).addTo(map);

      map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 19 });
    });
  };

  /* ---------- UI ---------- */
  return (
    <div className="app-container">

      <div className="search-bar">
        <input
          placeholder="Search buildings..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="chips">
        {Object.entries(DESTINATIONS)
          .filter(([label]) =>
            normalize(label).includes(normalize(search))
          )
          .map(([label, node]) => (
            <button
              key={node}
              className={`chip ${goal === node ? "active" : ""}`}
              onClick={() => setGoal(node)}
            >
              {label}
            </button>
          ))}
      </div>

      <div className="map-scroll-wrapper">
        <div id="map"></div>
        <button className="start-btn" onClick={startNavigation}>
          START ➤
        </button>
      </div>

      {/* ---------- NAVBAR ---------- */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <FaHome />
          <span>Home</span>
        </div>

        <div
          className={`nav-item ${
            location.pathname === "/buildings" ? "active" : ""
          }`}
          onClick={() => navigate("/buildings")}
        >
          <div className="center-btn">
            <FaBuilding />
          </div>
          <span>Building</span>
        </div>

        <div
          className={`nav-item ${
            location.pathname === "/categories" ? "active" : ""
          }`}
          onClick={() => navigate("/categories")}
        >
          <FaThLarge />
          <span>Categories</span>
        </div>

        <div
          className={`nav-item ${
            location.pathname === "/map" ? "active" : ""
          }`}
          onClick={() => navigate("/map")}
        >
          <FaMap />
          <span>Map</span>
        </div>
      </nav>

    </div>
  );
};

export default MapPage;

