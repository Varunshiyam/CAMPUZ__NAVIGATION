import { Routes, Route } from "react-router-dom";
import BuildingsPage from "./BuildingsPage";
import MapPage from "./MapPage";
import CategoriesPage from "./CategoriesPage";
import CampusMap from "./Campusmap";
function App() {
  return (
      <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/buildings" element={<BuildingsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/map" element={<CampusMap />} />
    </Routes>
   /* <CampusMap/> */
  );
}

export default App;
