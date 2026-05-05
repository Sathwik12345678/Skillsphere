import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success(`Welcome back, ${res.data.user.name || "creator"}!`);
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.msg || "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75 }}
        className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/15 bg-white/10 shadow-[0_30px_120px_rgba(8,15,31,0.45)] backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr]"
      >
        <div className="hidden flex-col justify-between border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-10 lg:flex">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Access portal</p>
            <h2 className="mt-6 font-display text-4xl font-bold text-white">
              Enter your next premium freelance workspace.
            </h2>
            <p className="mt-4 max-w-md text-slate-300">
              Seamless sign-in, immersive visuals, and fast account-aware onboarding.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/30 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">Experience</p>
            <p className="mt-3 text-lg text-white">
              Glass surfaces, animated ambience, soft cursor trails, and instant feedback.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Welcome back</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">Login to SkillSphere</h2>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/15 placeholder:text-slate-300"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/15 placeholder:text-slate-300"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-4 py-3 font-bold text-slate-950 transition duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <ButtonLoader label="Logging in" /> : "Login"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-300">
            Need an account?{" "}
            <Link to="/register" className="font-semibold text-amber-300">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
