# 📍 Campus Navigator App

A modern and user-friendly mobile web application designed to help students, visitors, and faculty navigate the college campus with ease.  
The system provides **real-time navigation**, **building information**, **smart search**, and **route visualization**, all optimized for mobile usage.

---

## 🚀 Features

### 🔹 1. Smart Search  
Search instantly for any building, block, hall, or lab.

- 🏢 Blocks (A, B, C, D…)
- 🧪 Labs
- 🎓 Academic halls
- 🍽️ Food Court
- 🏛️ Auditorium & Seminar Halls

> Search results filter dynamically as the user types.

---

### 🔹 2. Navigation & Route Mapping  
Users can select a destination and follow a clearly marked route on the campus map.

- Red path visualization for directions  
- Live position marker (Blue dot)
- Start/Stop navigation controls

📌 **Preview:**  

<img width="1470" height="956" alt="Home_UI_HTML" src="https://github.com/user-attachments/assets/8b904c7d-4ae9-4cbc-ab80-f3f713859261" />


---

### 🔹 3. Interactive Map UI  
The main map screen includes:

- Search bar  
- Map markers  
- Category filter shortcuts  
- Route start button
  
📌 **Preview:**

<img width="1470" height="956" alt="Home_Nav_HTML" src="https://github.com/user-attachments/assets/e7b3d9e7-2fc7-42c0-bb5c-bec837290f8d" />



---

### 🔹 4. Categorized Building View  

Browse buildings based on type — **Blocks, Labs, Halls**, etc.

📌 **Preview:**

https://github.com/user-attachments/assets/8d07ebeb-32d9-42b0-9437-78e69bde35d0



Users can quickly pick a category to minimize searching effort.

---

### 🔹 5. Detailed Building List with Status  
Each building card displays:

- 🟢 Open or 🔴 Closed indicator  
- Opening/Closing time  
- Image preview  
- Navigation arrow to start route


<img width="999" height="956" alt="Building_HTML" src="https://github.com/user-attachments/assets/065e2df4-a37e-4226-87e7-35250ffb073d" />

---

## 🧰 Tech Stack

### **Frontend**
- **HTML5** — structure and layout of the interface  
- **CSS3 (Custom Styling)** — responsive mobile UI, animations, dark theme  
- **JavaScript (Vanilla JS)** — map logic, filtering, UI interaction, and navigation system  
- **Leaflet.js** — interactive map rendering and tile management  
- **OpenStreetMap Tiles** — base map layer (public mapping source)

---

### **UI & Design Enhancements**
- **Google Fonts (Inter)** — modern readable font  
- **Font Awesome Icons** — icons used for search, navigation, categories, and map interactions  
- **Custom CSS Animations** — smooth transitions, pulsing marker effects, and collapsible UI behavior  
- **Mobile-First App Layout** — bottom navigation, round elements, scroll-based chip filters

---

### **Navigation & Logic**
- **Custom A\* Pathfinding Algorithm** — calculates the shortest route between campus nodes  
- **Dynamic Route Rendering** — primary and alternate route visualization  
- **Interactive Map Markers** — building points, tooltips, and clickable navigation triggers  
- **Location-Based View Updates** — zoom, highlight selection, and map movement based on user input

---

### **Data Layer**
- **Hard-coded campus node dataset (JSON-like object)** — lat/lon values of campus roads, buildings, labs, halls  
- **Graph-based adjacency mapping** — defines walkable paths between each navigation point  
- **Category-based filtering system** — dynamically groups buildings (Blocks, Labs, Halls, Hostels, Food, Sports)

---

### **Deployment & Compatibility**
- **Fully client-side (No backend required)**  
- **Works offline once loaded (static hosting support)**  
- **Optimized for mobile PWA-like usage (max-width viewport, tap-friendly UI)**  

---

> This stack makes the app lightweight, fast, and able to function without servers — ideal for student campuses, QR-based navigation systems, and kiosk displays.



---

## 🔧 How It Works

1. User opens the app and sees building list + categories.  
2. They select a building or use search.  
3. The map updates with a navigable route.  
4. The user follows the displayed path to reach the destination.

---



## 👨‍💻 Authors

- Varunshiyam S
```
Student Developer — Karpagam College of Engineering
📍 Building smart tools for smart campuses.
```

- Shanupriya T
```
Student Developer — Karpagam College of Engineering
📍 Building smart tools for smart campuses.
```
