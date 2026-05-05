import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SiteShell from "./layouts/SiteShell";

function App() {
  return (
    <>
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
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </SiteShell>
    </>
  );
}

export default App;
