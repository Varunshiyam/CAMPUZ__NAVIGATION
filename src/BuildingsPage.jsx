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
import { groupRoomsByFloor } from "./utils/roomUtils";
import { useSearchPlaceholder } from "./hooks/useSearchPlaceholder";

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
  const searchPlaceholder = useSearchPlaceholder();
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
  const filteredBuildings = useMemo(() => {
    const searchLower = search.toLowerCase();
    return Object.values(locationData).filter((b) => {
      if (b.type !== "destination") return false;
      if (filter === "open" && !isOpen(b)) return false;
      if (filter !== "all" && filter !== "open" && b.category !== filter)
        return false;
      
      if (!searchLower) return true;
      if (b.name.toLowerCase().includes(searchLower)) return true;

      // Check if any indoor location for this building matches the search
      const hasMatchingRoom = Object.values(locationData).some(
        (loc) => loc.type === "indoor" && loc.parentBuilding === b.id && (
          loc.name.toLowerCase().includes(searchLower) || 
          loc.id.toLowerCase().includes(searchLower) ||
          (loc.shortName && loc.shortName.toLowerCase().includes(searchLower))
        )
      );

      return hasMatchingRoom;
    });
  }, [filter, search, isOpen]);

  // Get indoor locations for a specific building
  const getIndoorLocations = useCallback((buildingId) => {
    const searchLower = search.toLowerCase();
    const building = locationData[buildingId];
    const buildingMatches = searchLower && building && building.name.toLowerCase().includes(searchLower);

    return Object.values(locationData).filter(
      (loc) => {
        if (loc.type !== "indoor" || loc.parentBuilding !== buildingId) return false;
        if (!searchLower || buildingMatches) return true;
        
        return loc.name.toLowerCase().includes(searchLower) || 
               loc.id.toLowerCase().includes(searchLower) ||
               (loc.shortName && loc.shortName.toLowerCase().includes(searchLower));
      }
    );
  }, [search]);

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


        <div className="search-box">
          <FaSearch />
          <input
            placeholder={searchPlaceholder}
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
