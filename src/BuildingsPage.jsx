import { useEffect, useState, useMemo, useCallback } from "react";
import "./BuildingsPage.css";
import {
  FaSearch,
  FaHome,
  FaThLarge,
  FaCompass,
  FaBuilding,
  FaChevronRight,
  FaChevronDown
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { locationData } from "./data";
import RoomTypeIcon from "./components/RoomTypeIcon";
import FloorBadge from "./components/FloorBadge";
import { groupRoomsByFloor, getFloorName } from "./utils/roomUtils";

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
  const [expandedBuilding, setExpandedBuilding] = useState(null);
  const [expandedFloors, setExpandedFloors] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = useCallback((b) => {
    if (b.opens === undefined || b.closes === undefined) return true;
    if (b.opens <= b.closes) {
      return currentHour >= b.opens && currentHour < b.closes;
    }
    return currentHour >= b.opens || currentHour < b.closes;
  }, [currentHour]);

  // Get all buildings (type: destination)
  const filteredBuildings = useMemo(() =>
    Object.values(locationData).filter((b) => {
      if (b.type !== "destination") return false;
      if (filter === "open" && !isOpen(b)) return false;
      if (filter !== "all" && filter !== "open" && b.category !== filter)
        return false;
      if (!b.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), [filter, search, isOpen]
  );

  // Get indoor locations for a specific building
  const getIndoorLocations = useCallback((buildingId) => {
    return Object.values(locationData).filter(
      (loc) => loc.type === "indoor" && loc.parentBuilding === buildingId
    );
  }, []);

  // Toggle building expansion
  const toggleBuilding = (buildingId) => {
    if (expandedBuilding === buildingId) {
      setExpandedBuilding(null);
      setExpandedFloors({});
    } else {
      setExpandedBuilding(buildingId);
      setExpandedFloors({});
    }
  };

  // Toggle floor expansion
  const toggleFloor = (floorNumber) => {
    setExpandedFloors(prev => ({
      ...prev,
      [floorNumber]: !prev[floorNumber]
    }));
  };

  // Navigate to room on map
  const navigateToRoom = (room) => {
    // For indoor locations, navigate to the parent building block
    const destination = room.type === 'indoor' && room.parentBuilding
      ? room.parentBuilding
      : room.id;
    navigate("/map", { state: { destination } });
  };

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
        {filteredBuildings.map((b) => {
          const indoorLocations = getIndoorLocations(b.id);
          const isExpanded = expandedBuilding === b.id;
          const groupedByFloor = groupRoomsByFloor(indoorLocations);
          const floorNumbers = Object.keys(groupedByFloor).map(Number).sort((a, b) => a - b);

          return (
            <div key={b.id} className="building-item">
              <div
                className="row"
                onClick={() => {
                  if (indoorLocations.length > 0) {
                    toggleBuilding(b.id);
                  } else {
                    navigate("/map", { state: { destination: b.id } });
                  }
                }}
              >
                <div className="row-info">
                  <h3>
                    {b.name}
                    {indoorLocations.length > 0 && (
                      <span className="room-count">{indoorLocations.length} rooms</span>
                    )}
                  </h3>
                  <p className={isOpen(b) ? "open" : "closed"}>
                    {isOpen(b) ? "● Open" : "● Closed"}
                  </p>
                </div>
                {indoorLocations.length > 0 ? (
                  isExpanded ? <FaChevronDown className="chevron" /> : <FaChevronRight className="chevron" />
                ) : (
                  <FaChevronRight />
                )}
              </div>

              {/* Expandable Indoor Locations */}
              {isExpanded && indoorLocations.length > 0 && (
                <div className="indoor-locations">
                  {floorNumbers.map((floorNum) => {
                    const rooms = groupedByFloor[floorNum];
                    const isFloorExpanded = expandedFloors[floorNum];

                    return (
                      <div key={floorNum} className="floor-section">
                        <div
                          className="floor-header"
                          onClick={() => toggleFloor(floorNum)}
                        >
                          <div className="floor-header-left">
                            <FloorBadge floor={floorNum} size="small" variant="subtle" />
                            <span className="floor-room-count">{rooms.length} rooms</span>
                          </div>
                          {isFloorExpanded ? <FaChevronDown className="floor-chevron" /> : <FaChevronRight className="floor-chevron" />}
                        </div>

                        {isFloorExpanded && (
                          <div className="room-list">
                            {rooms.map((room) => (
                              <div
                                key={room.id}
                                className="room-item"
                                onClick={() => navigateToRoom(room)}
                              >
                                <RoomTypeIcon roomType={room.roomType} size="small" />
                                <div className="room-details">
                                  <div className="room-name">{room.name}</div>
                                  <div className="room-id">{room.id}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
          className={`nav-item ${location.pathname === "/buildings" ? "active" : ""
            }`}
          onClick={() => navigate("/buildings")}
        >
          <FaBuilding />
          <span>Building</span>
        </div>

        <div
          className={`nav-item ${location.pathname === "/categories" ? "active" : ""
            }`}
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
