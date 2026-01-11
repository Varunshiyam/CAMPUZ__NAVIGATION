# 🧰 Route Builder & Helper Tool (Personal Reference)

This folder contains my **helper tools** used during the development of the Campus Navigation System.  
These tools were created to make the process of building paths, nodes, and route connections **faster, visual, and automated** — instead of manually collecting coordinates from Google Maps and typing them one by one.

This README is written for **my future self** so that I remember how and why this system works.

---

## 🔍 Why I Built This Tool

Originally, creating paths for campus navigation required:

❌ Manually getting latitude & longitude from Google Maps  
❌ Writing JSON by hand for every node  
❌ Typing adjacency (routes) manually  
❌ Debugging incorrect paths without visual feedback  

This was slow, repetitive, and prone to mistakes.

So I built a tool to:

✔ Create nodes visually  
✔ Drag nodes to adjust position  
✔ Click-to-connect paths  
✔ Automatically export updated JSON code  
✔ View directional arrows (One-way / Two-way)  
✔ Test shortest path results directly on the map

---

## 🧭 What This Helper Does

| Feature | Purpose |
|--------|---------|
| 🟦 Add nodes by clicking the map | No need to get coordinates manually |
| 🔗 Connect two nodes | Automatically updates adjacency list |
| ↔ Drag node to reposition | All paths update automatically |
| 📤 Export final JSON data | Ready to paste into main navigation app |
| 🧪 Path testing mode | Test A* routing inside the editor |

---

## 🛠 Modes

### **1. Test Mode**
- Click a **start node**
- Click an **end node**
- The tool runs the **A\* Pathfinding algorithm** and shows:
  - Path sequence
  - Total distance
  - Green preview route

Useful for verifying whether routes are valid.

---

### **2. Edit Mode**
- Add new nodes
- Move existing nodes
- Create or remove connections

This mode is used to build or update the map structure.

---

## 📷 Visual Reference

> Complete_Campuz_Nav.html

### 🧪 Path Testing Mode  
(Used to verify shortest route between nodes)

<img width="1470" height="956" alt="DEV-TEST_TestMode" src="https://github.com/user-attachments/assets/27dc1721-363a-477f-a4ff-542af69b413e" />


---

### 🧰 Route Editing Mode  
(Used to modify paths and node positions)

<img width="1470" height="802" alt="DEV-TEST_EditMode" src="https://github.com/user-attachments/assets/610f32ce-84a3-463d-94d3-3eec81ea697d" />

> Campuz_Nav_v6.html

### Route Editor Only:

<img width="1470" height="956" alt="DEVELOPER" src="https://github.com/user-attachments/assets/f3ff7d3b-bcb1-453e-84d8-a5221ead9f56" />

---

## 📤 Exporting Data

After editing the map:

1. Click **"Generate Updated Code"**
2. The tool outputs two blocks:

```js
// 1. Nodes
const nodes = {
  NODE_NAME: {lat: ..., lon: ... },
  ...
};

// 2. Graph/Adjacency
const adjacency = {
  NODE_NAME: [CONNECTED_NODES],

```

## 🧩 How the Code Works (Quick Reminder to Myself)

- Every blue dot = a node (road junction, building point, entry, etc.)

- Every connection between two nodes = an edge in a graph

- The routing system treats the map as a graph network

### A* algorithm uses:

- Distance between nodes (Haversine formula)

- Heuristic guess toward target

This makes navigation fast and accurate.
  ...
};
