import { useState, useMemo } from "react";
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
  FaCompass,
  FaUserTie,
  FaBriefcase
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { locationData } from "./data";
import { formatRoomLocation } from "./utils/roomUtils";

/* ---------------- DATA MAPPING ---------------- */
const CATEGORY_CONFIG = {
  hall: { title: "Halls & Auditoriums", icon: <FaUniversity /> },
  sports: { title: "Sports & Grounds", icon: <FaRunning /> },
  block: { title: "Academic Blocks", icon: <FaBuilding /> },
  library: { title: "Library", icon: <FaGraduationCap /> },
  lab: { title: "Labs & Centres", icon: <FaFlask /> },
  food: { title: "Food & Snacks", icon: <FaUtensils /> },
  hostel: { title: "Hostels", icon: <FaHome /> },
  faculty: { title: "Faculty Rooms", icon: <FaUserTie /> },
  office: { title: "Offices & Cells", icon: <FaBriefcase /> },
  cell: { title: "Special Cells", icon: <FaBriefcase /> },
  classroom: { title: "Classrooms", icon: <FaChalkboard /> },
  other: { title: "General", icon: <FaCompass /> }
};

const FILTERS = [
  { label: "All", value: "all", icon: <FaThLarge /> },
  { label: "Halls", value: "hall", icon: <FaUniversity /> },
  { label: "Sports", value: "sports", icon: <FaRunning /> },
  { label: "Blocks", value: "block", icon: <FaBuilding /> },
  { label: "Library", value: "library", icon: <FaGraduationCap /> },
  { label: "Labs", value: "lab", icon: <FaFlask /> },
  { label: "Food", value: "food", icon: <FaUtensils /> },
  { label: "Classrooms", value: "classroom", icon: <FaChalkboard /> },
  { label: "Faculty", value: "faculty", icon: <FaUserTie /> }
];

/* ---------------- COMPONENT ---------------- */

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* Group Data - Memoized for performance */
  const groupedData = useMemo(() =>
    Object.values(locationData).reduce((acc, item) => {
      // Filter logic - include both destination and indoor types
      if (filter !== "all" && item.category !== filter) return acc;
      if (!item.name.toLowerCase().includes(search.toLowerCase())) return acc;

      const catInfo = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
      const catTitle = catInfo.title;

      if (!acc[catTitle]) {
        acc[catTitle] = {
          title: catTitle,
          icon: catInfo.icon,
          category: item.category,
          items: []
        };
      }
      acc[catTitle].items.push(item);
      return acc;
    }, {}), [filter, search]
  );

  // Flat list for filtered views
  const flatItems = useMemo(() => {
    if (filter === "all") return [];
    return Object.values(groupedData).flatMap(section => section.items);
  }, [groupedData, filter]);

  const displayedSections = useMemo(() =>
    Object.values(groupedData), [groupedData]
  );

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
        {filter === "all" ? (
          // Grouped view for "All" filter
          <>
            {displayedSections.map((section, idx) => (
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
                  {section.items.map(item => {
                    // For indoor locations, navigate to parent building
                    const destination = item.type === 'indoor' && item.parentBuilding
                      ? item.parentBuilding
                      : item.id;

                    return (
                      <div
                        key={item.id}
                        className="sub-item"
                      >
                        <div className="sub-item-content"
                          onClick={() => navigate("/map", { state: { destination } })}
                        >
                          <div className="sub-item-name">{item.name}</div>
                          {item.type === 'indoor' && (
                            <div className="sub-item-context">{formatRoomLocation(item, locationData)}</div>
                          )}
                        </div>

                        <div className="sub-item-buttons">
                          <button
                            className="glass-button start-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/map", { state: { destination } });
                            }}
                          >
                            Start
                          </button>
                          <button
                            className="glass-button explore-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // No action - reserved for future functionality
                            }}
                          >
                            Explore
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {displayedSections.length === 0 && (
              <div className="no-results">
                No categories found matching your search.
              </div>
            )}
          </>
        ) : (
          // Flat list view for specific filters
          <>
            {flatItems.map((item, index) => {
              const destination = item.type === 'indoor' && item.parentBuilding
                ? item.parentBuilding
                : item.id;

              return (
                <div
                  key={item.id}
                  className="flat-item"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flat-item-content"
                    onClick={() => navigate("/map", { state: { destination } })}
                  >
                    <div className="flat-item-name">{item.name}</div>
                    {item.type === 'indoor' && (
                      <div className="flat-item-context">{formatRoomLocation(item, locationData)}</div>
                    )}
                  </div>

                  <div className="flat-item-buttons">
                    <button
                      className="glass-button start-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/map", { state: { destination } });
                      }}
                    >
                      Start
                    </button>
                    <button
                      className="glass-button explore-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // No action - reserved for future functionality
                      }}
                    >
                      Explore
                    </button>
                  </div>
                </div>
              );
            })}

            {flatItems.length === 0 && (
              <div className="no-results">
                No items found in this category.
              </div>
            )}
          </>
        )}
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
          <FaBuilding />
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
          className={`nav-item ${location.pathname === "/explore" ? "active" : ""}`}
          onClick={() => navigate("/explore")}
        >
          <FaCompass />
          <span>Explore</span>
        </div>
      </nav>

    </div>
  );
}
