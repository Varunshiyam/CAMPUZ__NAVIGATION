import { useEffect, useState } from "react";
import "./BuildingsPage.css";
import {
  FaSearch,
  FaHome,
  FaThLarge,
  FaMap,
  FaBuilding,
  FaChevronRight
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BUILDINGS = [
  { name: "Block A", category: "block", opens: 8, closes: 17 },
  { name: "Block B", category: "block", opens: 8, closes: 17 },
  { name: "Block C", category: "block", opens: 8, closes: 17 },
  { name: "Block D", category: "block", opens: 8, closes: 17 },
  { name: "Block E", category: "block", opens: 8, closes: 17 },
  { name: "Library", category: "block", opens: 8, closes: 20 },
  { name: "Food Court", category: "food", opens: 7, closes: 21 },
  { name: "Kabaddi Ground", category: "sport", opens: 0, closes: 24 },
  { name: "Auditorium", category: "hall", opens: 9, closes: 17 },
  {name:"NewHall 1",category:"hall",opens:9,closes:18},
  {name:"NewHall 2",category:"hall",opens:9,closes:18},
  {name:"Academic Block",category:"hall",opens:9,closes:17}
  
];

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Open Now", value: "open" },
  { label: "Blocks", value: "block" },
  { label: "Halls", value: "hall" },
  { label: "Food", value: "food" },
  { label: "Sports", value: "sport" }
];

export default function BuildingsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = (b) => {
    if (b.opens <= b.closes) {
      return currentHour >= b.opens && currentHour < b.closes;
    }
    return currentHour >= b.opens || currentHour < b.closes;
  };

  const filteredBuildings = BUILDINGS.filter((b) => {
    if (filter === "open" && !isOpen(b)) return false;
    if (filter !== "all" && filter !== "open" && b.category !== filter)
      return false;
    if (!b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
 const navigate=useNavigate();
  return (
    <div className="page">

      {/* HEADER */}
      <div className="header">
        <h1>Buildings</h1>

        <div className="search-box">
          <FaSearch />
          <input
            placeholder="Search buildings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`chip ${filter === c.value ? "active" : ""}`}
              onClick={() => setFilter(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="list">
        {filteredBuildings.map((b) => (
          <div key={b.name} className="row">
            <div className="row-info">
              <h3>{b.name}</h3>
              <p className={isOpen(b) ? "open" : "closed"}>
                {isOpen(b) ? "● Open" : "● Closed"}
              </p>
            </div>
            <FaChevronRight />
          </div>
        ))}
      </div>
      {/* NAVBAR */}
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
      <FaBuilding />

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
    className={`nav-item ${location.pathname === "/map" ? "active" : ""}`}
    onClick={() => navigate("/map")}
  >
    <FaMap />
    <span>Map</span>
  </div>
</nav>
    </div>
  
  );
}
