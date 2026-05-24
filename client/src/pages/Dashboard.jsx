import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";

const roleCopy = {
  client: {
    title: "Client command center",
    focus: "Post projects, review talent, and track collaboration status.",
    actions: ["Post a gig", "Review freelancer matches", "Track proposals"],
  },
  freelancer: {
    title: "Freelancer workspace",
    focus: "Polish your profile, surface skills, and prepare for matched projects.",
    actions: ["Browse gig marketplace", "Tune skill tags", "Submit proposals"],
  },
  admin: {
    title: "Admin control room",
    focus: "Manage users, roles, and the health of the SkillSphere community.",
    actions: ["Review new users", "Adjust account roles", "Monitor platform activity"],
  },
};

const roles = ["client", "freelancer", "admin"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const dashboard = useMemo(() => roleCopy[user?.role] || roleCopy.client, [user]);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!localStorage.getItem("token")) {
        navigate("/login");
        return;
      }

      try {
        const profileRes = await api.get("/auth/me");
        const nextUser = profileRes.data.user;
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));

        if (nextUser.role === "admin") {
          const usersRes = await api.get("/auth/users");
          setUsers(usersRes.data.users);
        }
      } catch (error) {
        toast.error(error.response?.data?.msg || "Could not load dashboard");
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const updateRole = async (userId, role) => {
    setUpdatingId(userId);

    try {
      const res = await api.patch(`/auth/users/${userId}/role`, { role });
      setUsers((current) =>
        current.map((item) => (item._id === userId ? res.data.user : item))
      );
      toast.success("Role updated");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not update role");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-24 text-white">
        <ButtonLoader label="Loading dashboard" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-16 pt-32 lg:px-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"
      >
        <aside className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Dashboard</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white">{dashboard.title}</h1>
          <p className="mt-4 leading-7 text-slate-300">{dashboard.focus}</p>

          <div className="mt-8 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm text-slate-400">Signed in as</p>
              <p className="mt-1 font-semibold text-white">{user?.name}</p>
              <p className="text-sm text-slate-300">{user?.email}</p>
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-sm text-amber-100">Current role</p>
              <p className="mt-1 text-2xl font-extrabold capitalize text-white">{user?.role}</p>
            </div>
          </div>

          <Link
            to={user?.role === "freelancer" ? "/gigs" : "/profile"}
            className="mt-6 inline-flex w-full justify-center rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1"
          >
            {user?.role === "freelancer" ? "Browse Gigs" : "Edit Profile"}
          </Link>
        </aside>

        <section className="grid gap-6">
          <div className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Week 2 workspace</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">Role-based next steps</h2>
              </div>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                Active
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {dashboard.actions.map((action, index) => (
                <div key={action} className="rounded-2xl border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-bold text-cyan-200">0{index + 1}</p>
                  <p className="mt-3 font-semibold text-white">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {user?.role === "admin" ? (
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">User role management</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">Accounts</h2>

              <div className="mt-6 grid gap-3">
                {users.map((item) => (
                  <div
                    key={item._id}
                    className="grid gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-sm text-slate-300">{item.email}</p>
                    </div>
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                      value={item.role}
                      disabled={updatingId === item._id}
                      onChange={(event) => updateRole(item._id, event.target.value)}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </motion.section>
    </main>
  );
}
