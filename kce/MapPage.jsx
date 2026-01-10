import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPage.css";
import { nodes } from "./data";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaThLarge, FaMap, FaBuilding } from "react-icons/fa";

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

/* ---------- DESTINATIONS ---------- */
const DESTINATIONS = {
  Library: "Library",
  "A Block": "ABlock",
  "B Block": "BBlock",
  "C Block": "Cblock",
  "D Block": "DBlock",
  "E Block": "E-Block",
  "Turf Ground": "TurfGround",
  "Food Court": "FoodCourt",
  "Girls Hostel": "GirlsHostel",
  Exit: "Exit",
};

export default function MapPage() {
  const mapRef = useRef(null);
  const initialized = useRef(false);
  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  const [goal, setGoal] = useState(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const normalize = (s) => s.toLowerCase().replace(/\s+/g, "");

  /* ---------- MAP INIT ---------- */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const bounds = L.latLngBounds(
      [10.8755, 77.0165],
      [10.8835, 77.0255]
    );

    const map = L.map("map", {
      maxBounds: bounds,
      maxBoundsViscosity: 1,
      minZoom: 16,
    });

    map.fitBounds(bounds);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
    }).addTo(map);

    return () => map.remove();
  }, []);

  /* ---------- LIVE USER LOCATION ---------- */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("📍 You are here");
        } else {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }
      },
      () => alert("Location access denied"),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ---------- DESTINATION MARKER ---------- */
  useEffect(() => {
    if (!goal || !mapRef.current) return;

    const map = mapRef.current;

    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    const dest = nodes[goal];
    if (!dest) return;

    destMarkerRef.current = L.marker([dest.lat, dest.lon])
      .addTo(map)
      .bindPopup(`🎯 ${goal}`)
      .openPopup();

    /* ✅ FIT BOUNDS ONLY IF USER EXISTS */
    if (userMarkerRef.current) {
      const userLatLng = userMarkerRef.current.getLatLng();

      map.fitBounds(
        [
          [userLatLng.lat, userLatLng.lng],
          [dest.lat, dest.lon],
        ],
        { padding: [60, 60] }
      );
    } else {
      map.setView([dest.lat, dest.lon], 18);
    }
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

  return (
    <div className="app-container">

      {/* SEARCH */}
      <div className="search-bar">
        <input
          placeholder="Search buildings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CHIPS */}
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

      {/* MAP */}
      <div className="map-scroll-wrapper">
        <div id="map"></div>
        <button className="start-btn" onClick={handleStart}>
          START ➤
        </button>
      </div>

      {/* BUILDINGS */}
      <div className="buildings-section">
        <h3>Nearby Buildings</h3>  
        <div className="buildings-row">
          {Object.entries(DESTINATIONS).map(([label, node]) => (
            <div
              key={node}
              className={`building-card ${goal === node ? "active" : ""}`}
              onClick={() => setGoal(node)}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <FaHome /><span>Home</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/buildings" ? "active" : ""}`}
          onClick={() => navigate("/buildings")}
        >
          <div className="center-btn"><FaBuilding /></div>
          <span>Building</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/categories" ? "active" : ""}`}
          onClick={() => navigate("/categories")}
        >
          <FaThLarge /><span>Categories</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/map" ? "active" : ""}`}
          onClick={() => navigate("/map")}
        >
          <FaMap /><span>Map</span>
        </div>
      </nav>
    </div>
  );
}
