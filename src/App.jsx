import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import WelcomePage from "./WelcomePage";
import BuildingsPage from "./BuildingsPage";
import MapPage from "./MapPage";
import CategoriesPage from "./CategoriesPage";
import CampusMap from "./CampusMap";
import ExplorePage from "./ExplorePage";
import PageTransition from "./components/PageTransition";
import { MapProvider } from "./components/MapProvider";

function App() {
  const location = useLocation();

  return (
    <MapProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><WelcomePage /></PageTransition>} />
          <Route path="/home" element={<PageTransition><MapPage /></PageTransition>} />
          <Route path="/buildings" element={<PageTransition><BuildingsPage /></PageTransition>} />
          <Route path="/categories" element={<PageTransition><CategoriesPage /></PageTransition>} />
          <Route path="/map" element={<PageTransition><CampusMap /></PageTransition>} />
          <Route path="/explore" element={<PageTransition><ExplorePage /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </MapProvider>
  );
}

export default App;
