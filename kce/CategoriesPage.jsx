import { useState } from "react";
import "./CategoriesPage.css";
import {
  FaSearch,
  FaThLarge,
  FaUniversity,
  FaRunning,
  FaBuilding,
  FaFlask,
  FaUtensils,
  FaGraduationCap,
  FaMicrophone,
  FaChalkboard,
  FaDesktop,
  FaChevronRight,
  FaExternalLinkAlt,
  FaHome,
  FaMap
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

/* ---------------- DATA ---------------- */

const DATA = [
  {
    title: "Academic Halls",
    icon: <FaGraduationCap />,
    category: "hall",
    items: ["Academic Hall 1", "Academic Hall 2", "New Hall 1", "New Hall 2"]
  },
  {
    title: "Auditoriums",
    icon: <FaMicrophone />,
    category: "hall",
    items: ["Open Auditorium", "Closed Auditorium"]
  },
  {
    title: "Sports & Grounds",
    icon: <FaRunning />,
    category: "sports",
    items: ["Indoor Badminton Court", "Football Ground", "Gymnasium"]
  },
  {
    title: "Classrooms",
    icon: <FaChalkboard />,
    category: "block",
    items: ["A101 - Lecture Hall", "A102 - Smart Room", "B201 - Tutorial Room"]
  },
  {
    title: "Computer Centres",
    icon: <FaDesktop />,
    category: "lab",
    items: ["Oracle Academy Lab", "NVIDIA AI Centre"]
  },
  {
    title: "Academic Blocks",
    icon: <FaBuilding />,
    category: "block",
    items: ["Block A", "Block B", "Block C", "Block M"]
  },
  {
    title: "Food & Snacks",
    icon: <FaUtensils />,
    category: "food",
    items: ["Main Cafeteria", "Juice Center"]
  }
];

const FILTERS = [
  { label: "All", value: "all", icon: <FaThLarge /> },
  { label: "Halls & Audi", value: "hall", icon: <FaUniversity /> },
  { label: "Sports", value: "sports", icon: <FaRunning /> },
  { label: "Blocks", value: "block", icon: <FaBuilding /> },
  { label: "Labs", value: "lab", icon: <FaFlask /> },
  { label: "Food", value: "food", icon: <FaUtensils /> }
];

/* ---------------- COMPONENT ---------------- */

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const filteredData = DATA.filter(d => {
    if (filter !== "all" && d.category !== filter) return false;
    if (!d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="categories-page">

      {/* HEADER */}
      <div className="header-section">
        <div className="search-container">
          <FaSearch />
          <input
            className="search-input"
            placeholder="Search halls, blocks, sports..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setOpenIndex(null);
            }}
          />
        </div>

        <div className="top-chips-row">
          {FILTERS.map(f => (
            <div
              key={f.value}
              className={`top-chip ${filter === f.value ? "active" : ""}`}
              onClick={() => {
                setFilter(f.value);
                setSearch("");
                setOpenIndex(null);
              }}
            >
              {f.icon}
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="main-list-container">
        {filteredData.map((section, idx) => (
          <div key={section.title}>
            <div
              className={`list-item ${openIndex === idx ? "expanded" : ""}`}
              onClick={() =>
                setOpenIndex(openIndex === idx ? null : idx)
              }
            >
              <div className="item-icon">{section.icon}</div>
              <div className="item-text">{section.title}</div>
              <FaChevronRight className="item-arrow" />
            </div>

            <div className={`sub-list ${openIndex === idx ? "open" : ""}`}>
              {section.items.map(item => (
                <div key={item} className="sub-item">
                  {item}
                  <FaExternalLinkAlt />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <FaHome />
          <span>Home</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/buildings" ? "active" : ""}`}
          onClick={() => navigate("/buildings")}
        >
          <div className="nav-center-btn">
            <FaBuilding />
          </div>
          <span>Building</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/categories" ? "active" : ""}`}
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
