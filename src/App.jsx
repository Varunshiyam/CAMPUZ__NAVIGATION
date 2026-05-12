import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import BuildingsPage from "./BuildingsPage";
import MapPage from "./MapPage";
import CategoriesPage from "./CategoriesPage";
import CampusMap from "./CampusMap";
import ExplorePage from "./ExplorePage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DashboardHome from "./pages/DashboardHome";
import AdvancedFeatures from "./pages/admin/AdvancedFeatures";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<PageTransition><MapPage /></PageTransition>} />
        <Route path="/buildings" element={<PageTransition><BuildingsPage /></PageTransition>} />
        <Route path="/categories" element={<PageTransition><CategoriesPage /></PageTransition>} />
        <Route path="/map" element={<PageTransition><CampusMap /></PageTransition>} />
        <Route path="/explore" element={<PageTransition><ExplorePage /></PageTransition>} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/admin/*" element={
          <PageTransition>
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          </PageTransition>
        }>
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="features" element={<AdvancedFeatures />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
