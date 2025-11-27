<!-- HEADER -->
<p align="center">
  
<img width="2912" height="1440" alt="Gemini_Generated_Image_igmt3aigmt3aigmt" src="https://github.com/user-attachments/assets/b971fa21-09ae-4727-b345-e896498e0741" />

</p>


<h1 align="center">📍 Campus Navigator</h1>

<p align="center">
A Smart, Real-Time Campus Mapping & Navigation System for <b>Karpagam College of Engineering</b>  
<br>Designed to help students, visitors, and staff navigate effortlessly.
</p>

---

<!-- STATUS + BADGES -->
<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Progress-yellow?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Prototype-HTML%2FCSS%2FJS-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Rebuild-React%20%2B%20Node.js-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Maps-Leaflet%20%2B%20OpenStreetMap-lightgrey?style=for-the-badge"/>
</p>

---

## 🌍 About the Project

Campus Navigator started as a **quick HTML-based prototype** to explore campus routing visually using OpenStreetMap.  
Now, the project is evolving into a full-stack system powered by:

- ⚛️ **React (Next Stage UI)**  
- 🟢 **Node.js + Express (Backend APIs)**  
- 🗄️ **Database to manage building metadata & routes**

The goal is to transform campus navigation into a smooth, app-like experience with live routing, voice navigation, offline support, and custom map layers.

---

## 📱 Interface Preview

<table>
<tr>
<td align="center"><img src=https://github.com/user-attachments/assets/d944ce66-a33f-46af-9326-92cb4d375a5d width="500"/><br>🏠 Home</td>
<td align="center"><img src=https://github.com/user-attachments/assets/640cc1cb-b54a-40d1-abd1-3eebabb6cbf5 width=500"/><br>🏛️ Building List + Search</td>
</tr>
<tr>
<td align="center"><img src="https://github.com/user-attachments/assets/3d7d960f-75d8-43f3-8ecb-44ea9a3b92f2" width="500"/><br>🧭 Live Navigation Preview</td>
<td align="center"><img src="https://github.com/user-attachments/assets/5ff1832a-51e8-48b4-8a2e-0dec8dabf0c8" width="500"/><br>📂 Category-Based Filtering</td>
</tr>
</table>


---


## 🛠 Developer Tools (Internal Feature)

To avoid manually entering GPS coordinates and adjacency values from Google Maps, a **visual helper tool** was developed.

<table>
<tr>
<td align="center"><img src="https://github.com/user-attachments/assets/b1e5b8ab-ec2b-4ece-ad02-3d8e8f6d4b6f" width="350"/><br>🧪 Path Testing Mode</td>
<td align="center"><img src="https://github.com/user-attachments/assets/5675f141-21f7-49f5-9a89-1ee2d4d3953b" width="350"/><br>🛠 Node and Route Editor</td>
</tr>
</table>

### Why This Tool Exists:

✔ Automatically generates latitude/longitude  
✔ Builds routing graph visually  
✔ Exports code directly for navigation logic  
✔ Speeds up map development significantly  

---

## 🚀 Roadmap

| Phase | Technology | Progress |
|-------|------------|----------|
| Prototype | HTML + Leaflet.js | ✅ Completed |
| UI Migration | React + Tailwind | ⏳ In Progress |
| Backend API | Node.js + Express + MongoDB | 🔜 Planned |
| Offline Support | PWA + Cache + GPS | 🔜 Planned |
| Live Tracking | GPS + Sensors | 🔜 Next |
| Voice Navigation | Web Speech API | ⏳ Future |

---

## 🧰 Tech Stack

### 🔹 Current Prototype
- HTML5  
- CSS3  
- Vanilla JavaScript  
- Leaflet.js + OpenStreetMap  

### 🔹 Upcoming Full Build
- React.js  
- Node.js + Express  
- MongoDB / Firestore  
- Service Workers for PWA  
- Better route engine + offline support  

---


## 🗺️ Contribution to OpenStreetMap

Thanks to multiple on-ground measurements, satellite referencing, and continuous improvement,  
we contributed a fully mapped, updated, and walkable path layout of `Karpagam College of Engineering` directly to the OpenStreetMap community.

This ensures:

- 🚶 Better pedestrian routing  
- 🎓 Easier onboarding for new students  
- 🧭 Accurate building identities and pathways  
- 🧩 A foundation for smart-navigation systems (including this project)

<br>

### 🔍 Before vs After


| 🕘 Before (Initial OSM View) | 🚀 After Contribution |
|----------------------------|----------------------|
| <img src="https://github.com/user-attachments/assets/df2d7790-93a2-4855-8005-d6509374c789" width="400"/> | <img src="https://github.com/user-attachments/assets/95316886-20ba-4b16-8441-6afa3d43ca03" width="400"/> |

> ✔ Updated campus roads  
> ✔ Named academic blocks, labs & hostels  
> ✔ Added pedestrian pathways, sports arenas and functional facilities  
> ✔ Made routing-ready for GIS and navigation engines  

A formal request and verification was also completed with the institution to ensure accuracy and authenticity before submitting changes.

<br>

---

## 👥 Authors & Contributors

This project is designed, developed, tested, and continuously improved by:

| Name | Role |
|------|------|
| **Shanupriya T** | Lead Developer, System Engineer, Frontend/Backend Engineering & Automation  |
| **Varunshiyam S** |  Research, UI/UX Planner, OSM Editor & Navigator Logic Contributor, Developer |

> 💡 _Both contributors are students of Karpagam College of Engineering, building this project as a real-world solution and open-source asset._

<br>

---



## 📂 Planned Folder Structure

```bash
CampusNavigator/
│── client/         # React Frontend
│── server/         # Node.js Backend
│── assets/         # Images/Audios/Icons
│── tools/          # Route Builder (Editor)
│── README.md
