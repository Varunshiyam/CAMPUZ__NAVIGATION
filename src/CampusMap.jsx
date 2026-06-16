import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nodes, adjacency, locationData } from "./data";
import { useMap } from "./components/MapProvider";
import "./Map.css";

import {
  FaHome,
  FaBuilding,
  FaThLarge,
  FaMap,
  FaTimes,
  FaPlus,
  FaMinus,
  FaLocationArrow,
  FaCompass,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaMapMarkerAlt,
  FaPlay,
  FaPause,
  FaStop
} from "react-icons/fa";
import { useCompassHeading } from "./hooks/useCompassHeading";
import { useUserLocation } from "./hooks/useUserLocation";
import { useMapAutoRotate } from "./hooks/useMapAutoRotate";

/* FIX LEAFLET ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ---------------- HELPERS ---------------- */
const toRad = (d) => (d * Math.PI) / 180;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

const buildGraph = (localNodes, localAdj) => {
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

/* ---------------- COMPONENT ---------------- */
const CampusMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const goal = location.state?.destination;

  const { map, attachMap, detachMap, isInitialized } = useMap();
  const mapContainerRef = useRef(null);
  const routeRef = useRef(null);
  const userRef = useRef(null);
  const destRef = useRef(null);

  // GPS Optimization: Precompute graph once
  const graphRef = useRef(null);
  // GPS Optimization: Track current path for smart recalculation
  const currentPathRef = useRef(null);
  const mapInitializedRef = useRef(false);

  const isInvalid = !goal || !nodes[goal];
  const [loading, setLoading] = useState(!isInvalid);
  const [error, setError] = useState(isInvalid ? "Invalid destination" : null);

  // Custom walking navigation hooks
  const { heading, permissionStatus, requestPermission } = useCompassHeading();
  const { location: userLocation, error: gpsError, loading: gpsLoading } = useUserLocation({ throttleMs: 1500 });

  // Simulation State
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [simulatedHeading, setSimulatedHeading] = useState(null);
  const [simSegmentIndex, setSimSegmentIndex] = useState(0);
  const [simProgress, setSimProgress] = useState(0);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);

  // Fallback start support: if real GPS is not available, default to Entrance node
  const fallbackLocation = useMemo(() => ({
    lat: nodes["Entrance"].lat,
    lon: nodes["Entrance"].lon,
    accuracy: 5,
    speed: 0,
    heading: 0
  }), []);

  // Determine active location and heading source
  const hasGps = userLocation !== null;
  const activeLocation = useMemo(() => {
    if (simulationActive && simulatedLocation) return simulatedLocation;
    if (hasGps) return userLocation;
    // Only use fallback if GPS has finished loading (either has error or timeout)
    if (!gpsLoading) return fallbackLocation;
    return null;
  }, [simulationActive, simulatedLocation, userLocation, hasGps, gpsLoading, fallbackLocation]);

  const activeHeading = useMemo(() => {
    if (simulationActive && simulatedHeading !== null) return simulatedHeading;
    if (heading !== null) return heading;
    if (activeLocation && activeLocation.heading !== null && !isNaN(activeLocation.heading)) return activeLocation.heading;
    return 0;
  }, [simulationActive, simulatedHeading, heading, activeLocation]);

  const { isAutoFollow, recenter, resetNorth } = useMapAutoRotate(map, activeLocation, activeHeading, {
    enabled: true,
    userMarker: userRef
  });

  useEffect(() => {
    if (gpsError && !hasGps) {
      console.warn("GPS error, using campus entrance fallback:", gpsError);
    }
  }, [gpsError, hasGps]);

  /* -------- HELPER: DISTANCE FROM PATH -------- */
  const distanceFromPath = (userPos, path) => {
    if (!path || path.length === 0) return Infinity;

    let minDist = Infinity;
    for (const nodeId of path) {
      const node = nodes[nodeId];
      if (!node) continue;
      const dist = haversine(userPos.lat, userPos.lon, node.lat, node.lon);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  };

  /* -------- HELPERS FOR TURN HUD -------- */
  const getNodeName = (nodeId) => {
    if (!nodeId) return 'the pathway';
    if (locationData && locationData[nodeId]) {
      return locationData[nodeId].name;
    }
    if (nodeId.startsWith('EX')) return 'Exit Route';
    if (nodeId.startsWith('BH')) return 'Boys Hostel Pathway';
    if (nodeId.startsWith('AH')) return 'Academic Hall Pathway';
    if (nodeId.startsWith('C') && nodeId !== 'COE') return 'Block C Pathway';
    if (nodeId.startsWith('E') && nodeId !== 'Entrance' && nodeId !== 'Exit') return 'Block E Pathway';
    if (nodeId.startsWith('M')) return 'Block M Pathway';
    if (nodeId.startsWith('L') && nodeId !== 'Library') return 'Library Pathway';
    if (nodeId.startsWith('A') && nodeId !== 'Auditorium') return 'Block A Pathway';
    if (nodeId.startsWith('B')) return 'Block B Pathway';
    return 'the pathway';
  };

  const getTurnIcon = (type) => {
    switch (type) {
      case 'left':
        return <FaArrowLeft />;
      case 'right':
        return <FaArrowRight />;
      case 'bear-left':
        return <FaArrowLeft style={{ transform: 'rotate(45deg)' }} />;
      case 'bear-right':
        return <FaArrowRight style={{ transform: 'rotate(-45deg)' }} />;
      case 'arrive':
        return <FaMapMarkerAlt className="hud-dest-icon" />;
      case 'straight':
      default:
        return <FaArrowUp />;
    }
  };

  const getTurnInstruction = (info) => {
    if (!info) return '';
    if (info.turnType === 'arrive') {
      return `Arriving at ${info.nextNodeName}`;
    }
    const action = {
      'left': 'turn left',
      'right': 'turn right',
      'bear-left': 'bear left',
      'bear-right': 'bear right',
      'straight': 'continue straight'
    }[info.turnType] || 'continue straight';

    return `In ${info.distanceToNextNode}m, ${action} onto ${info.nextNodeName}`;
  };

  /* -------- DYNAMIC HUD SELECTOR -------- */
  const navigationInfo = useMemo(() => {
    if (!currentPathRef.current || currentPathRef.current.length === 0) return null;

    const pathNodes = currentPathRef.current.filter(n => n !== 'User');
    if (pathNodes.length === 0) return null;

    // Find nearest path node index to activeLocation
    let nearestIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < pathNodes.length; i++) {
      const node = nodes[pathNodes[i]];
      if (!node) continue;
      const d = haversine(activeLocation.lat, activeLocation.lon, node.lat, node.lon);
      if (d < minDist) {
        minDist = d;
        nearestIndex = i;
      }
    }

    const isLastNode = nearestIndex === pathNodes.length - 1;
    const nextNodeIndex = isLastNode ? nearestIndex : nearestIndex + 1;
    const nextNodeId = pathNodes[nextNodeIndex];
    const nextNode = nodes[nextNodeId];

    const distanceToNextNode = nextNode 
      ? haversine(activeLocation.lat, activeLocation.lon, nextNode.lat, nextNode.lon)
      : 0;

    let remainingDistance = distanceToNextNode;
    for (let i = nextNodeIndex; i < pathNodes.length - 1; i++) {
      const nA = nodes[pathNodes[i]];
      const nB = nodes[pathNodes[i + 1]];
      if (nA && nB) {
        remainingDistance += haversine(nA.lat, nA.lon, nB.lat, nB.lon);
      }
    }

    const totalDurationSeconds = remainingDistance / 1.4;
    const remainingMinutes = Math.ceil(totalDurationSeconds / 60);

    let turnType = 'straight';
    let nextNodeName = getNodeName(nextNodeId);

    if (isLastNode) {
      turnType = 'arrive';
    } else if (nextNodeIndex < pathNodes.length - 1) {
      const nodeA = nodes[pathNodes[nearestIndex]];
      const nodeB = nodes[pathNodes[nextNodeIndex]];
      const nodeC = nodes[pathNodes[nextNodeIndex + 1]];
      if (nodeA && nodeB && nodeC) {
        const bearing1 = calculateBearing(nodeA.lat, nodeA.lon, nodeB.lat, nodeB.lon);
        const bearing2 = calculateBearing(nodeB.lat, nodeB.lon, nodeC.lat, nodeC.lon);
        let turnAngle = bearing2 - bearing1;
        while (turnAngle < -180) turnAngle += 360;
        while (turnAngle > 180) turnAngle -= 360;

        if (turnAngle > 45) {
          turnType = 'right';
        } else if (turnAngle < -45) {
          turnType = 'left';
        } else if (turnAngle > 15) {
          turnType = 'bear-right';
        } else if (turnAngle < -15) {
          turnType = 'bear-left';
        }
      }
    }

    let totalPathDist = 0;
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const nA = nodes[pathNodes[i]];
      const nB = nodes[pathNodes[i + 1]];
      if (nA && nB) totalPathDist += haversine(nA.lat, nA.lon, nB.lat, nB.lon);
    }
    const progressPercent = totalPathDist > 0 
      ? Math.min(100, Math.max(0, ((totalPathDist - remainingDistance) / totalPathDist) * 100))
      : 0;

    return {
      distanceToNextNode: Math.round(distanceToNextNode),
      remainingDistance: Math.round(remainingDistance),
      remainingMinutes,
      nextNodeName,
      turnType,
      progressPercent,
      isLastNode
    };
  }, [activeLocation]);

  /* -------- ROUTE CALCULATION (OPTIMIZED) -------- */
  const updateRoute = (user) => {
    // GPS Optimization: Check if we need to recalculate route
    const DEVIATION_THRESHOLD = 8; // meters
    const shouldRecalculate = !currentPathRef.current ||
      distanceFromPath(user, currentPathRef.current) > DEVIATION_THRESHOLD;

    // Always update user marker position (visual update only)
    if (!userRef.current) {
      const userIcon = L.divIcon({
        className: 'user-location-marker-container',
        html: `
          <div class="user-direction-indicator">
            <div class="user-pulse-ring"></div>
            <div class="user-direction-beam"></div>
            <div class="user-blue-dot"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
      });

      userRef.current = L.marker([user.lat, user.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup("You");
    }

    // Only recalculate route if user deviated significantly
    if (!shouldRecalculate) {
      return; // Route is still valid
    }

    // Find nearest node to user
    let nearest = null;
    let min = Infinity;
    for (const k in nodes) {
      const d = haversine(
        user.lat,
        user.lon,
        nodes[k].lat,
        nodes[k].lon
      );
      if (d < min) {
        min = d;
        nearest = k;
      }
    }

    // Build temporary graph with user position
    const tempNodes = { ...nodes, User: user };
    const tempAdj = { ...adjacency };
    tempAdj.User = [nearest];
    tempAdj[nearest] = [...(adjacency[nearest] || []), "User"];

    const tempGraph = buildGraph(tempNodes, tempAdj);
    const path = astar(tempGraph, "User", goal);

    if (!path.length) {
      setError("No route found to destination");
      return;
    }

    // Store current path for future deviation checks
    currentPathRef.current = path;

    const latlngs = path.map((p) => [
      tempNodes[p].lat,
      tempNodes[p].lon,
    ]);

    if (routeRef.current) {
      routeRef.current.setLatLngs(latlngs);
    } else {
      routeRef.current = L.polyline(latlngs, {
        color: "#007AFF",
        weight: 6,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(map);
    }

    // Trigger navigation completed event for feedback reminder
    window.dispatchEvent(new Event('navigationCompleted'));
  };

  /* -------- SIMULATION TIMER EFFECT -------- */
  useEffect(() => {
    if (!simulationActive || !currentPathRef.current) return;

    const pathNodes = currentPathRef.current.filter((n) => n !== "User");
    if (pathNodes.length < 2) {
      setSimulationActive(false);
      return;
    }

    let lastTime = performance.now();
    let segmentIndex = simSegmentIndex;
    let progress = simProgress;

    const baseSpeed = 1.4; // walking speed ~1.4 m/s
    let animationFrameId;

    const tick = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (segmentIndex >= pathNodes.length - 1) {
        setSimulationActive(false);
        alert("🎉 You have arrived at your destination!");
        window.dispatchEvent(new Event('navigationCompleted'));
        return;
      }

      const nodeA = nodes[pathNodes[segmentIndex]];
      const nodeB = nodes[pathNodes[segmentIndex + 1]];

      if (!nodeA || !nodeB) {
        setSimulationActive(false);
        return;
      }

      const segmentDistance = haversine(nodeA.lat, nodeA.lon, nodeB.lat, nodeB.lon);

      if (segmentDistance <= 0) {
        segmentIndex++;
        progress = 0;
        lastTime = performance.now();
        setSimSegmentIndex(segmentIndex);
        setSimProgress(progress);
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const speed = baseSpeed * simSpeedMultiplier;
      const distanceMoved = speed * dt;

      progress += distanceMoved / segmentDistance;

      if (progress >= 1.0) {
        let overflowDistance = (progress - 1.0) * segmentDistance;
        segmentIndex++;

        if (segmentIndex >= pathNodes.length - 1) {
          setSimSegmentIndex(pathNodes.length - 1);
          setSimProgress(1.0);
          setSimulationActive(false);
          alert("🎉 You have arrived at your destination!");
          window.dispatchEvent(new Event('navigationCompleted'));
          return;
        }

        const nextA = nodes[pathNodes[segmentIndex]];
        const nextB = nodes[pathNodes[segmentIndex + 1]];
        const nextSegmentDist = haversine(nextA.lat, nextA.lon, nextB.lat, nextB.lon);
        progress = nextSegmentDist > 0 ? overflowDistance / nextSegmentDist : 0;
      }

      setSimSegmentIndex(segmentIndex);
      setSimProgress(progress);

      const curA = nodes[pathNodes[segmentIndex]];
      const curB = nodes[pathNodes[segmentIndex + 1]];
      const lat = curA.lat + (curB.lat - curA.lat) * progress;
      const lon = curA.lon + (curB.lon - curA.lon) * progress;

      setSimulatedLocation({ lat, lon });

      const bearing = calculateBearing(curA.lat, curA.lon, curB.lat, curB.lon);
      setSimulatedHeading(bearing);

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [simulationActive, simSegmentIndex, simProgress, simSpeedMultiplier]);

  const handleStartSimulation = () => {
    if (!currentPathRef.current || currentPathRef.current.length < 2) {
      alert("No active path calculated yet!");
      return;
    }
    setSimSegmentIndex(0);
    setSimProgress(0);
    setSimulationActive(true);
  };

  const handleStopSimulation = () => {
    setSimulationActive(false);
    setSimulatedLocation(null);
    setSimulatedHeading(null);
  };

  /* -------- MAP INIT + LIVE ROUTING (OPTIMIZED) -------- */
  useEffect(() => {
    if (mapInitializedRef.current) return;
    if (isInvalid) return;

    if (!graphRef.current) {
      graphRef.current = buildGraph(nodes, adjacency);
    }

    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current || !map) return;
      attachMap(mapContainerRef.current);
      
      mapInitializedRef.current = true;

      const destIcon = L.divIcon({
        className: "dest-marker-container",
        html: `
          <div class="dest-marker-inner">
            <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" alt="destination" style="width: 25px; height: 41px;" />
          </div>
        `,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      destRef.current = L.marker([
        nodes[goal].lat,
        nodes[goal].lon,
      ], { icon: destIcon }).addTo(map);

      if (activeLocation) {
        updateRoute(activeLocation);
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(initTimer);
      
      if (map) {
        if (destRef.current && map.hasLayer(destRef.current)) {
          map.removeLayer(destRef.current);
          destRef.current = null;
        }
        if (userRef.current && map.hasLayer(userRef.current)) {
          map.removeLayer(userRef.current);
          userRef.current = null;
        }
        if (routeRef.current && map.hasLayer(routeRef.current)) {
          map.removeLayer(routeRef.current);
          routeRef.current = null;
        }
      }
      
      detachMap();
      mapInitializedRef.current = false;
    };
  }, [goal, isInitialized, map, attachMap, detachMap]);

  useEffect(() => {
    if (!map || !activeLocation || !mapInitializedRef.current) return;
    updateRoute(activeLocation);
    setLoading(false);
  }, [map, activeLocation]);

  const handleExit = () => {
    navigate("/home");
  };

  return (
    <>
      {loading && (
        <div className="route-loading-overlay">
          <div className="loading-radar">
            <img
              src="/route-loading-icon.png"
              alt=""
              className="radar-center-icon"
            />
            <div className="radar-ring"></div>
            <div className="radar-ring"></div>
            <div className="radar-ring"></div>
          </div>
          <div className="loading-text">Calculating Route...</div>
        </div>
      )}

      {error && <div className="route-error">{error}</div>}

      <button className="exit-btn" onClick={handleExit}>
        <FaTimes /> Exit
      </button>

      <div 
        className="map-nav-wrapper" 
        style={{ width: '100%', height: '100%', flex: 1, minHeight: '60vh', position: 'relative', overflow: 'hidden' }}
      >
        <div id="map-container-CampusMap" ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}></div>

        {/* TOP HUD turn instruction */}
        {navigationInfo && !loading && (
          <div className="nav-top-hud">
            <div className="nav-top-hud-icon-container">
              {getTurnIcon(navigationInfo.turnType)}
            </div>
            <div className="nav-top-hud-content">
              <div className="nav-top-hud-instruction">
                {getTurnInstruction(navigationInfo)}
              </div>
            </div>
          </div>
        )}

        {/* Custom Map Controls */}
        {map && (
          <div className="map-overlay-controls" style={{ top: '90px' }}>
            <button className="map-overlay-btn" onClick={() => map.zoomIn()} title="Zoom In">
              <FaPlus />
            </button>
            <button className="map-overlay-btn" onClick={() => map.zoomOut()} title="Zoom Out">
              <FaMinus />
            </button>
            <button 
              className={`map-overlay-btn ${isAutoFollow ? 'active' : ''}`} 
              onClick={recenter} 
              title="Follow Me"
            >
              <FaLocationArrow />
            </button>
            <button 
              className="map-overlay-btn" 
              onClick={resetNorth} 
              title="North Up"
            >
              <FaCompass 
                className="compass-icon-rotate" 
                style={{ transform: `rotate(${-((activeHeading || 0))}deg)` }} 
              />
            </button>
          </div>
        )}

        {/* Floating Recenter Button */}
        {map && !isAutoFollow && activeLocation && (
          <button className="recenter-nav-btn" onClick={recenter}>
            <FaLocationArrow /> Recenter Navigation
          </button>
        )}

        {/* Device Orientation Permission Request Prompt */}
        {permissionStatus === 'prompt' && !simulationActive && (
          <button 
            className="recenter-nav-btn" 
            style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#FFD700', color: '#000000' }}
            onClick={requestPermission}
          >
            <FaCompass /> Enable Compass Calibration
          </button>
        )}

        {/* BOTTOM HUD details and simulator control */}
        {navigationInfo && !loading && (
          <div className="nav-bottom-sheet">
            <div className="nav-bottom-sheet-main">
              <div className="nav-eta-container">
                <span className="nav-eta-value">{navigationInfo.remainingMinutes}</span>
                <span className="nav-eta-unit">min</span>
              </div>
              <div className="nav-stats-container">
                <div className="nav-distance-text">
                  {navigationInfo.remainingDistance >= 1000 
                    ? `${(navigationInfo.remainingDistance / 1000).toFixed(1)} km` 
                    : `${navigationInfo.remainingDistance} m`}
                </div>
                <div className="nav-destination-label">
                  to {locationData[goal]?.name || goal}
                  {!hasGps && <span className="gps-badge-amber">GPS Fallback</span>}
                </div>
              </div>
              
              <div className="nav-controls-divider"></div>

              {/* Simulation Play/Pause/Stop */}
              <div className="nav-sim-actions">
                {!simulationActive ? (
                  <button 
                    className="nav-sim-btn play-btn" 
                    onClick={handleStartSimulation}
                    title="Simulate Movement"
                  >
                    <FaPlay /> Simulate
                  </button>
                ) : (
                  <button 
                    className="nav-sim-btn pause-btn" 
                    onClick={() => setSimulationActive(false)}
                    title="Pause Simulation"
                  >
                    <FaPause /> Pause
                  </button>
                )}
                
                {simulationActive && (
                  <button 
                    className="nav-sim-btn stop-btn" 
                    onClick={handleStopSimulation}
                    title="Stop Simulation"
                  >
                    <FaStop /> Stop
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="nav-progress-bar-container">
              <div 
                className="nav-progress-bar-fill" 
                style={{ width: `${navigationInfo.progressPercent}%` }}
              ></div>
            </div>

            {/* Speed Multipliers */}
            {simulationActive && (
              <div className="nav-sim-speed-selector">
                <span className="speed-label">Speed:</span>
                {[1, 2, 5, 10].map((mult) => (
                  <button
                    key={mult}
                    className={`speed-pill ${simSpeedMultiplier === mult ? 'active' : ''}`}
                    onClick={() => setSimSpeedMultiplier(mult)}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/home")}>
          <FaHome /><span>Home</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/buildings")}>
          <FaBuilding /><span>Buildings</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/categories")}>
          <FaThLarge /><span>Categories</span>
        </div>
        <div className="nav-item active">
          <FaMap /><span>Map</span>
        </div>
      </nav>
    </>
  );
};

export default CampusMap;
