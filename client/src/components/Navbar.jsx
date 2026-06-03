import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const guestNavItems = [
  { to: "/gigs?tab=project", label: "Find Talent" },
  { to: "/gigs?tab=job", label: "Find Work" },
  { to: "/gigs?tab=internship", label: "Internships" },
  { to: "/gigs?tab=course", label: "Courses" },
  { to: "/", label: "Why SkillSphere" },
];

const authedNavItems = [
  { to: "/gigs", label: "Marketplace" },
  { to: "/gigs?tab=course", label: "Courses" },
  { to: "/payments", label: "Payments" },
  { to: "/collaboration", label: "Messages" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthed = Boolean(localStorage.getItem("token"));
  const navItems = isAuthed ? authedNavItems : guestNavItems;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/20 bg-white/72 shadow-[0_18px_70px_rgba(15,23,42,0.12)] backdrop-blur-[20px]"
          : "border-b border-transparent bg-white/88 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-2xl font-black tracking-tight text-[#108a00]">SkillSphere</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={({ isActive }) =>
                `nav-link-underline relative rounded-full px-3 py-2 text-sm font-extrabold ${
                  isActive ? "is-active text-[#108a00]" : "text-zinc-700 hover:text-zinc-950"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden min-w-[260px] max-w-sm flex-1 items-center rounded-full border border-zinc-200 bg-white px-4 py-2 shadow-[0_8px_24px_rgba(24,24,27,0.05)] md:flex">
          <span className="text-lg text-zinc-400">⌕</span>
          <input
            className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
            placeholder="Search"
          />
          <span className="border-l border-zinc-200 pl-3 text-sm font-extrabold text-zinc-700">Market</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAuthed ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full px-4 py-2 text-sm font-extrabold text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-extrabold text-zinc-700 hover:bg-zinc-100 sm:inline-flex">
                Log in
              </Link>
              <Link to="/register" className="startup-primary group rounded-full px-5 py-2.5 text-sm font-extrabold text-white">
                Sign up <span className="button-arrow">-&gt;</span>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="hidden border-t border-zinc-100 bg-white md:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-7 overflow-x-auto px-4 text-sm font-bold text-zinc-700 sm:px-6">
          {[
            ["Development & IT", "/gigs?tab=project"],
            ["AI Services", "/gigs?tab=course"],
            ["Design & Creative", "/gigs?tab=project"],
            ["Internships", "/gigs?tab=internship"],
            ["Full-time Jobs", "/gigs?tab=job"],
            ["Courses", "/gigs?tab=course"],
          ].map(([item, to]) => (
            <Link key={item} to={to} className="shrink-0 hover:text-[#108a00]">
              {item}
            </Link>
          ))}
        </div>
      </div>
    </motion.header>
  );
}
