import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";

const roles = ["client", "freelancer", "admin"];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success(`Welcome to SkillSphere, ${res.data.user.name || "creator"}!`);
      navigate("/profile");
    } catch (err) {
      const message = err.response?.data?.msg || "Registration failed";
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
        className="w-full max-w-3xl rounded-[32px] border border-white/15 bg-white/10 p-8 shadow-[0_30px_120px_rgba(8,15,31,0.45)] backdrop-blur-2xl sm:p-10"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Create account</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">Join SkillSphere</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">
            Choose your role and launch your premium profile.
          </div>
        </div>

        <form onSubmit={handleRegister} className="grid gap-4 sm:grid-cols-2">
          <input
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-teal-300/50 focus:bg-white/15 placeholder:text-slate-300 sm:col-span-2"
            placeholder="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <input
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-teal-300/50 focus:bg-white/15 placeholder:text-slate-300 sm:col-span-2"
            placeholder="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-teal-300/50 focus:bg-white/15 placeholder:text-slate-300"
            placeholder="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />

          <select
            className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-teal-300/50"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-teal-300 to-cyan-300 px-4 py-3 font-bold text-slate-950 transition duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          >
            {loading ? <ButtonLoader label="Creating account" /> : "Register"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-amber-300">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
