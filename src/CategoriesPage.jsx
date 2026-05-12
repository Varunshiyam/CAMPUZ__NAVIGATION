import { useState, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
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
import { useSearchPlaceholder } from "./hooks/useSearchPlaceholder";

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

const CATEGORY_ORDER = [
  "Labs & Centres",
  "Offices & Cells",
  "Halls & Auditoriums",
  "Classrooms",
  "Food & Snacks",
  "Faculty Rooms",
  "General"
];

const FILTERS = [
  { label: "All", value: "all", icon: <FaThLarge /> },
  { label: "Labs", value: "lab", icon: <FaFlask /> },
  { label: "Offices", value: "office", icon: <FaBriefcase /> },
  { label: "Halls", value: "hall", icon: <FaUniversity /> },
  { label: "Classrooms", value: "classroom", icon: <FaChalkboard /> },
  { label: "Food", value: "food", icon: <FaUtensils /> },
  { label: "Faculty", value: "faculty", icon: <FaUserTie /> },
  { label: "Blocks", value: "block", icon: <FaBuilding /> },
  { label: "Sports", value: "sports", icon: <FaRunning /> },
  { label: "Library", value: "library", icon: <FaGraduationCap /> }
];

const BLOCK_THEMES = {
  'ABlock': { label: 'A-Block', color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.15)', cardBg: 'rgba(212, 175, 55, 0.03)' },
  'BBlock': { label: 'B-Block', color: '#B76E79', bg: 'rgba(183, 110, 121, 0.15)', cardBg: 'rgba(183, 110, 121, 0.03)' },
  'Cblock': { label: 'C-Block', color: '#E5E4E2', bg: 'rgba(229, 228, 226, 0.15)', cardBg: 'rgba(229, 228, 226, 0.03)' },
  'DBlock': { label: 'D-Block', color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)', cardBg: 'rgba(205, 127, 50, 0.03)' },
  'E-Block': { label: 'E-Block', color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.15)', cardBg: 'rgba(192, 192, 192, 0.03)' },
  'M-Block': { label: 'M-Block', color: '#B08D57', bg: 'rgba(176, 141, 87, 0.15)', cardBg: 'rgba(176, 141, 87, 0.03)' },
  'default': { label: 'General - GL', color: '#8e8e93', bg: 'rgba(142, 142, 147, 0.15)', cardBg: 'rgba(255, 255, 255, 0.02)' }
};

/* ---------------- COMPONENT ---------------- */

export default function CategoriesPage() {
  const searchPlaceholder = useSearchPlaceholder();
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

  const displayedSections = useMemo(() => {
    return Object.values(groupedData).sort((a, b) => {
      let indexA = CATEGORY_ORDER.indexOf(a.title);
      let indexB = CATEGORY_ORDER.indexOf(b.title);
      
      // If a category isn't in the explicitly ordered list, put it at the end.
      if (indexA === -1) indexA = 999;
      if (indexB === -1) indexB = 999;
      
      // If both aren't in the explicit list, sort them alphabetically
      if (indexA === 999 && indexB === 999) {
        return a.title.localeCompare(b.title);
      }
      
      return indexA - indexB;
    });
  }, [groupedData]);

  return (
    <div className="categories-page">

      {/* HEADER */}
      <div className="header-section">

        <div className="search-container">
          <FaSearch />
          <input
            className="search-input"
            placeholder={searchPlaceholder}
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
              title={f.label}
            >
              {f.icon}
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

                <AnimatePresence initial={false}>
                  {openIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="sub-list"
                    >
                      {(() => {
                        const isLabSection = section.title === "Labs & Centres";
                        
                        if (isLabSection) {
                          const grouped = section.items.reduce((acc, item) => {
                            const themeKey = item.parentBuilding || 'default';
                            if (!acc[themeKey]) acc[themeKey] = [];
                            acc[themeKey].push(item);
                            return acc;
                          }, {});
                          
                          const sortedKeys = Object.keys(grouped).sort();
                          
                          return sortedKeys.map(themeKey => {
                            const blockItems = grouped[themeKey];
                            const theme = BLOCK_THEMES[themeKey] || BLOCK_THEMES['default'];
                            
                            return (
                                <div 
                                  key={themeKey} 
                                  className="block-group-box"
                                  style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                                  }}
                                >
                                <div className="block-group-header">
                                  <span className="blue-tag" style={{ marginLeft: 0, fontSize: '12px' }}>
                                    {theme.label}
                                  </span>
                                </div>
                                <div className="block-group-content">
                                  {blockItems.map(item => {
                                    const destination = item.type === 'indoor' && item.parentBuilding ? item.parentBuilding : item.id;
                                    return (
                                      <div key={item.id} className="sub-item group-sub-item">
                                        <div className="sub-item-content" onClick={() => navigate("/map", { state: { destination } })}>
                                          <div className="sub-item-name">{item.name}</div>
                                          {item.type === 'indoor' && (
                                            <div className="sub-item-context">{formatRoomLocation(item, locationData)}</div>
                                          )}
                                        </div>
                                        <div className="sub-item-buttons">
                                          <button className="action-btn start-button" onClick={(e) => { e.stopPropagation(); navigate("/map", { state: { destination } }); }}>Start</button>
                                          <button className="action-btn explore-button" onClick={(e) => { e.stopPropagation(); navigate("/explore", { state: { highlightId: destination } }); }}>Explore</button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        }
                        
                        // Normal un-grouped rendering
                        return section.items.map(item => {
                          const destination = item.type === 'indoor' && item.parentBuilding ? item.parentBuilding : item.id;
                          return (
                            <div key={item.id} className="sub-item">
                              <div className="sub-item-content" onClick={() => navigate("/map", { state: { destination } })}>
                                <div className="sub-item-name">
                                  {item.name}
                                  {item.parentBuilding && (
                                    <span className="blue-tag">
                                      {BLOCK_THEMES[item.parentBuilding]?.label || item.parentBuilding}
                                    </span>
                                  )}
                                </div>
                                {item.type === 'indoor' && (
                                  <div className="sub-item-context">{formatRoomLocation(item, locationData)}</div>
                                )}
                              </div>
                              <div className="sub-item-buttons">
                                <button className="action-btn start-button" onClick={(e) => { e.stopPropagation(); navigate("/map", { state: { destination } }); }}>Start</button>
                                <button className="action-btn explore-button" onClick={(e) => { e.stopPropagation(); navigate("/explore"); }}>Explore</button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  style={{ 
                    animationDelay: `${index * 0.03}s`,
                    backgroundColor: item.category === "lab" ? (BLOCK_THEMES[item.parentBuilding] || BLOCK_THEMES['default']).cardBg : undefined
                  }}
                >
                  <div className="flat-item-content"
                    onClick={() => navigate("/map", { state: { destination } })}
                  >
                    <div className="flat-item-name">
                      {item.name}
                      {item.parentBuilding && (
                        <span className="blue-tag">
                          {BLOCK_THEMES[item.parentBuilding]?.label || item.parentBuilding}
                        </span>
                      )}
                    </div>
                    {item.type === 'indoor' && (
                      <div className="flat-item-context">{formatRoomLocation(item, locationData)}</div>
                    )}
                  </div>

                  <div className="flat-item-buttons">
                    <button
                      className="action-btn start-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/map", { state: { destination } });
                      }}
                    >
                      Start
                    </button>
                    <button
                      className="action-btn explore-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/explore", { state: { highlightId: destination } });
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
