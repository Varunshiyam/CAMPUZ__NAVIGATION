import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = () => {

  useEffect(() => {

    /* ---------- MAP ---------- */
    const map = L.map("map").setView([10.8795, 77.0213], 17);

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

    /* ---------- NODES ---------- */
    const nodes = {
      BlockA: { lat: 10.879577, lon: 77.021792 },
      BlockB: { lat: 10.878834, lon: 77.022383 },
      BlockBPath1: { lat: 10.879386, lon: 77.022571 },
      BlockBPath2: { lat: 10.879884, lon: 77.022519 },
      Entrance: { lat: 10.880306, lon: 77.022466 },
      L1: { lat: 10.880269, lon: 77.022019 },
      A1: { lat: 10.879846, lon: 77.022077 },
      A2: { lat: 10.879371, lon: 77.022130 },
      A3: { lat: 10.879804, lon: 77.021593 },
      D1: { lat: 10.879345, lon: 77.021678 },
      M1: { lat: 10.879736, lon: 77.021072 },
      C1: { lat: 10.879282, lon: 77.021157 },
      BlockC: { lat: 10.879050, lon: 77.020435 },
      Library: { lat: 10.880436, lon: 77.021530 },
      Canteen: { lat: 10.878697, lon: 77.021417 },
      BlockM: { lat: 10.880272, lon: 77.020950 },
      BlockD: { lat: 10.879103, lon: 77.021530 },
      GirlsHostel: { lat: 10.877919, lon: 77.022621 },
      C3: { lat: 10.878889, lon: 77.021216 },
      Auditorium1: { lat: 10.878837, lon: 77.021208 },
      Ragavendra: { lat: 10.878473, lon: 77.021210 },
      E1: { lat: 10.878245, lon: 77.021259 },
      BoysHostel: { lat: 10.878142, lon: 77.021698 },
      E2: { lat: 10.878193, lon: 77.020046 },
      BlockE: { lat: 10.876864, lon: 77.020491 },
      E3: { lat: 10.876841, lon: 77.021232 },
      E4: { lat: 10.878192, lon: 77.019728 },
      Academichall: { lat: 10.877527, lon: 77.019626 }
    };

    /* ---------- ADJACENCY ---------- */
    const adjacency = {
      GirlsHostel: ["BlockB"],
      BlockB: ["BlockBPath1", "GirlsHostel"],
      BlockBPath1: ["BlockB", "BlockBPath2", "A2"],
      BlockBPath2: ["BlockBPath1", "Entrance"],
      Entrance: ["BlockBPath2", "L1"],
      L1: ["Library", "A1"],
      A1: ["L1", "A2"],
      A2: ["D1", "BlockBPath1"],
      Library: ["BlockM", "L1", "A3"],
      A3: ["A1", "Library", "M1", "D1"],
      D1: ["BlockD", "C1", "A3", "A2"],
      BlockD: ["C1", "D1"],
      C1: ["D1", "M1", "BlockC", "C3"],
      BlockC: ["C1"],
      M1: ["C1", "A3"],
      BlockM: ["Library", "M1"],
      BlockA: ["D1", "A2", "A1", "A3"],
      Canteen: ["C1", "Auditorium1"],
      Auditorium1: ["Canteen", "Ragavendra"],
      Ragavendra: ["Auditorium1", "E1"],
      E1: ["Ragavendra", "BoysHostel", "E2", "E3"],
      BoysHostel: ["E1"],
      E2: ["E1", "BlockE", "E4"],
      E3: ["E1", "BlockE"],
      BlockE: ["E2", "E3"],
      E4: ["E2", "Academichall"],
      Academichall: ["E4"]
    };

    /* ---------- DESTINATION FROM NAVIGATION STATE ---------- */
    // Get destination from navigation state (passed from MapPage START button)
    const urlParams = new URLSearchParams(window.location.search);
    const destinationFromUrl = urlParams.get('destination');

    // Try to get from React Router state first, fallback to URL param
    let goalDestination = null;

    // Check if destination was passed via React Router state
    if (window.history.state && window.history.state.usr && window.history.state.usr.destination) {
      goalDestination = window.history.state.usr.destination;
    } else if (destinationFromUrl) {
      goalDestination = destinationFromUrl;
    }

    // If no destination provided, prompt user (fallback)
    if (!goalDestination) {
      const input = prompt(
        "Enter destination name:\\n\\n" +
        Object.keys(nodes).join(", ")
      );

      if (!input) {
        alert("No destination selected. Redirecting to home...");
        window.location.href = "/";
        return;
      }

      goalDestination = Object.keys(nodes).find(
        k => k.toLowerCase() === input.toLowerCase()
      );
    }

    // Validate destination exists in nodes
    const goal = Object.keys(nodes).find(
      k => k.toLowerCase() === (goalDestination || '').toLowerCase()
    );

    if (!goal) {
      alert("Invalid destination. Redirecting to home...");
      window.location.href = "/";
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

      nodes.User = { lat: latitude, lon: longitude };
      adjacency.User = [nearest];
      adjacency[nearest].push("User");

      const graph = buildGraph();
      const path = astar(graph, "User", goal);

      const latlngs = path.map(p => [nodes[p].lat, nodes[p].lon]);
      L.polyline(latlngs, { color: "red", weight: 5 }).addTo(map);

      L.marker([latitude, longitude], { icon: redIcon })
        .addTo(map)
        .bindPopup("You are here");

      L.marker([nodes[goal].lat, nodes[goal].lon], { icon: redIcon })
        .addTo(map)
        .bindPopup(goal);

      map.fitBounds(latlngs);

    });

    return () => map.remove();

  }, []);

  return <div id="map" style={{ height: "100vh", width: "100%" }} />;
};

export default MapView;
