import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Collaboration from "./pages/Collaboration";
import Payments from "./pages/Payments";
import SiteShell from "./layouts/SiteShell";
import PageLoader from "./components/PageLoader";

function App() {
  const location = useLocation();

  return (
    <>
      <PageLoader />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgba(8, 15, 31, 0.9)",
            color: "#eff6ff",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(18px)",
          },
        }}
      />
      <SiteShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gigs" element={<Marketplace />} />
              <Route path="/jobs" element={<Navigate to="/gigs?tab=job" replace />} />
              <Route path="/internships" element={<Navigate to="/gigs?tab=internship" replace />} />
              <Route path="/courses" element={<Navigate to="/gigs?tab=course" replace />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/collaboration" element={<Collaboration />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </SiteShell>
    </>
  );
}

export default App;
