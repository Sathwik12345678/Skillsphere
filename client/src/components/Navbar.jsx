import { motion } from "framer-motion";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const guestNavItems = [
  { to: "/", label: "Home" },
  { to: "/gigs", label: "Gigs" },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" },
];

const authedNavItems = [
  { to: "/", label: "Home" },
  { to: "/gigs", label: "Gigs" },
  { to: "/collaboration", label: "Messages" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar() {
  const navigate = useNavigate();
  useLocation();
  const isAuthed = Boolean(localStorage.getItem("token"));
  const navItems = isAuthed ? authedNavItems : guestNavItems;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="fixed inset-x-0 top-0 z-40 px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-white/10 px-5 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <Link to="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-white to-cyan-300 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20 transition group-hover:rotate-6">
            S
          </span>
          <div>
            <p className="font-display text-lg font-bold text-white">SkillSphere</p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300">
              find your skill match
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white/16 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthed ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/15 hover:text-white"
            >
              Logout
            </button>
          ) : null}
        </nav>
      </div>
    </motion.header>
  );
}
