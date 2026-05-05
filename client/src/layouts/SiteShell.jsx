import AnimatedBackground from "../components/AnimatedBackground";
import CursorAura from "../components/CursorAura";
import Navbar from "../components/Navbar";

export default function SiteShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-ink">
      <AnimatedBackground />
      <CursorAura />
      <Navbar />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
