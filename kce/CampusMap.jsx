import { useEffect, useRef } from "react";
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

const CampusMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const goal = location.state?.destination;

  const mapRef = useRef(null);
  const routeRef = useRef(null);
  const userRef = useRef(null);
  const destRef = useRef(null);

  useEffect(() => {
    const map = L.map("map").setView([10.8795, 77.0213], 17);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
    }).addTo(map);

    if (!goal || !nodes[goal]) return;

    const localNodes = structuredClone(nodes);
    const localAdj = structuredClone(adjacency);

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

    const buildGraph = () => {
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

    navigator.geolocation.getCurrentPosition((pos) => {
      const user = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      };

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

      const graph = buildGraph();
      const path = astar(graph, "User", goal);
      if (!path.length) return;

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
    });

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
      <button className="exit-btn" onClick={handleExit}>
        <FaTimes /> Exit
      </button>

      <div id="map"></div>

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
