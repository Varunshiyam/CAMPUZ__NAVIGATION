import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nodes, adjacency, locationData } from "./data";
import { FaTimes } from "react-icons/fa";

const MapView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    /* ---------- MAP ---------- */
    const map = L.map("map").setView([10.8795, 77.0213], 17);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    /* ---------- DISTANCE ---------- */
    const toRadians = (deg) => deg * Math.PI / 180;

    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      lat1 = toRadians(lat1);
      lat2 = toRadians(lat2);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    /* ---------- DESTINATION FROM NAVIGATION STATE ---------- */
    let goalDestination = null;

    // Check if destination was passed via React Router state
    if (location.state?.destination) {
      goalDestination = location.state.destination;
    }

    // If no destination provided, redirect to home
    if (!goalDestination) {
      alert("No destination selected. Redirecting to home...");
      navigate("/");
      return;
    }

    // Get destination location data
    const destLocation = locationData[goalDestination];
    if (!destLocation) {
      alert("Invalid destination. Redirecting to home...");
      navigate("/");
      return;
    }

    // Handle indoor locations - navigate to parent building
    const actualDestId = destLocation.type === 'indoor'
      ? destLocation.parentBuilding
      : goalDestination;

    // Validate destination exists in nodes
    const goal = nodes[actualDestId];
    if (!goal) {
      alert("Invalid destination. Redirecting to home...");
      navigate("/");
      return;
    }

    /* ---------- ICON ---------- */
    const redIcon = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    /* ---------- GRAPH ---------- */
    const buildGraph = () => {
      const g = {};
      for (const n in adjacency) {
        g[n] = adjacency[n].map(v => ({
          to: v,
          distance: haversine(
            nodes[n].lat, nodes[n].lon,
            nodes[v].lat, nodes[v].lon
          )
        }));
      }
      return g;
    };

    /* ---------- A* ---------- */
    const astar = (graph, start, goal) => {
      const g = {}, f = {}, came = {};
      Object.keys(nodes).forEach(n => g[n] = f[n] = Infinity);
      g[start] = 0;

      const open = [start];

      while (open.length) {
        open.sort((a, b) => f[a] - f[b]);
        const cur = open.shift();

        if (cur === goal) {
          const path = [];
          let c = cur;
          while (came[c]) { path.push(c); c = came[c]; }
          path.push(start);
          return path.reverse();
        }

        (graph[cur] || []).forEach(e => {
          const t = g[cur] + e.distance;
          if (t < g[e.to]) {
            came[e.to] = cur;
            g[e.to] = t;
            f[e.to] = t;
            if (!open.includes(e.to)) open.push(e.to);
          }
        });
      }
      return [];
    };

    /* ---------- GEOLOCATION ---------- */
    navigator.geolocation.getCurrentPosition(pos => {

      const { latitude, longitude } = pos.coords;

      let nearest = null, min = Infinity;
      for (const k in nodes) {
        const d = haversine(latitude, longitude, nodes[k].lat, nodes[k].lon);
        if (d < min) { min = d; nearest = k; }
      }

      // Create temporary user node
      const tempNodes = { ...nodes, User: { lat: latitude, lon: longitude } };
      const tempAdjacency = { ...adjacency, User: [nearest] };
      tempAdjacency[nearest] = [...(adjacency[nearest] || []), "User"];

      const graph = buildGraph();
      const path = astar(graph, "User", actualDestId);

      const latlngs = path.map(p => [tempNodes[p].lat, tempNodes[p].lon]);
      L.polyline(latlngs, { color: "#007AFF", weight: 5 }).addTo(map);

      L.marker([latitude, longitude], { icon: redIcon })
        .addTo(map)
        .bindPopup("📍 You are here");

      L.marker([goal.lat, goal.lon], { icon: redIcon })
        .addTo(map)
        .bindPopup(destLocation.name || actualDestId);

      map.fitBounds(latlngs);

    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to get your location. Please enable location services.");
      navigate("/");
    });

    return () => map.remove();

  }, [location.state, navigate]);

  const handleExit = () => {
    navigate("/");
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <div id="map" style={{ height: "100%", width: "100%" }} />
      <button
        onClick={handleExit}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          width: "44px",
          height: "44px",
          background: "rgba(28, 28, 30, 0.92)",
          backdropFilter: "blur(20px)",
          border: "none",
          borderRadius: "50%",
          color: "white",
          fontSize: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)"
        }}
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default MapView;
