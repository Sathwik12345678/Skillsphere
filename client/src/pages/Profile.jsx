import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";

export default function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    bio: "",
    location: "",
    skills: "",
    skillProficiency: "",
    portfolio: "",
    resumeUrl: "",
    certifications: "",
    experience: "",
    availability: "",
    hourlyRate: "",
    milestoneRate: "",
    experienceYears: "",
    verificationBadge: false,
    reputationScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const skills = useMemo(
    () =>
      form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    [form.skills]
  );

  const parseLines = (value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const portfolioItems = useMemo(
    () =>
      parseLines(form.portfolio).map((line) => {
        const [title = "", url = "", description = ""] = line.split("|").map((part) => part.trim());
        return { title, url, description };
      }),
    [form.portfolio]
  );

  const certificationItems = useMemo(
    () =>
      parseLines(form.certifications).map((line) => {
        const [name = "", issuer = "", url = ""] = line.split("|").map((part) => part.trim());
        return { name, issuer, url };
      }),
    [form.certifications]
  );

  const experienceItems = useMemo(
    () =>
      parseLines(form.experience).map((line) => {
        const [title = "", company = "", description = ""] = line.split("|").map((part) => part.trim());
        return { title, company, description };
      }),
    [form.experience]
  );

  const availabilityItems = useMemo(
    () =>
      parseLines(form.availability).map((line) => {
        const [startsAt = "", endsAt = "", note = ""] = line.split("|").map((part) => part.trim());
        return {
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt: endsAt ? new Date(endsAt) : undefined,
          note,
        };
      }),
    [form.availability]
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!localStorage.getItem("token")) {
        navigate("/login");
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const user = res.data.user;
        setForm({
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          bio: user.bio || "",
          location: user.location || "",
          skills: (user.skills || []).join(", "),
          skillProficiency: (user.skillProficiency || [])
            .map((item) => `${item.name}|${item.level}`)
            .join("\n"),
          portfolio: (user.portfolio || [])
            .map((item) => `${item.title || ""}|${item.url || ""}|${item.description || ""}`)
            .join("\n"),
          resumeUrl: user.resumeUrl || "",
          certifications: (user.certifications || [])
            .map((item) => `${item.name || ""}|${item.issuer || ""}|${item.url || ""}`)
            .join("\n"),
          experience: (user.experience || [])
            .map((item) => `${item.title || ""}|${item.company || ""}|${item.description || ""}`)
            .join("\n"),
          availability: (user.availability || [])
            .map((item) => `${item.startsAt || ""}|${item.endsAt || ""}|${item.note || ""}`)
            .join("\n"),
          hourlyRate: user.hourlyRate || "",
          milestoneRate: user.milestoneRate || "",
          experienceYears: user.experienceYears || "",
          verificationBadge: Boolean(user.verificationBadge),
          reputationScore: user.reputationScore || 0,
        });
        localStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        toast.error(error.response?.data?.msg || "Please login again");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/uploads/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm((current) => ({ ...current, resumeUrl: res.data.url || current.resumeUrl }));
      toast.success("Resume uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await api.put("/auth/me", {
        name: form.name,
        bio: form.bio,
        location: form.location,
        skills,
        skillProficiency: parseLines(form.skillProficiency).map((line) => {
          const [name = "", level = "intermediate"] = line.split("|").map((part) => part.trim());
          return { name, level };
        }),
        portfolio: portfolioItems,
        resumeUrl: form.resumeUrl,
        certifications: certificationItems,
        experience: experienceItems,
        availability: availabilityItems,
        hourlyRate: form.hourlyRate,
        milestoneRate: form.milestoneRate,
        experienceYears: form.experienceYears,
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-24 text-white">
        <ButtonLoader label="Loading profile" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 pb-16 pt-32 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]"
      >
        <aside className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 via-white to-cyan-300 text-3xl font-extrabold text-slate-950">
            {form.name.charAt(0).toUpperCase() || "S"}
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-cyan-200">Profile page</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">{form.name}</h1>
          <p className="mt-2 text-slate-300">{form.email}</p>
          <span className="mt-5 inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold capitalize text-emerald-200">
            {form.role}
          </span>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm text-slate-400">Reputation</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{form.reputationScore}/100</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm text-slate-400">Verification</p>
              <p className="mt-1 font-bold text-white">{form.verificationBadge ? "Verified" : "Pending"}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.length ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-100"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Add skills to complete your profile.</span>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-slate-300">
            {form.location ? <p>Location: {form.location}</p> : null}
            {form.hourlyRate ? <p>Hourly: Rs. {Number(form.hourlyRate).toLocaleString("en-IN")}</p> : null}
            {form.milestoneRate ? <p>Milestone: Rs. {Number(form.milestoneRate).toLocaleString("en-IN")}</p> : null}
            {form.resumeUrl ? <p className="truncate">Resume: {form.resumeUrl}</p> : null}
          </div>

          <Link
            to="/dashboard"
            className="mt-8 inline-flex w-full justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/15"
          >
            View Dashboard
          </Link>
        </aside>

        <section className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Account details</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">Build your SkillSphere identity</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Full name
              <input
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Email
              <input
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300 outline-none"
                value={form.email}
                disabled
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Bio
              <textarea
                className="min-h-32 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Share what you do, what you need, or how you collaborate."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Location
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Hyderabad"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Experience years
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  name="experienceYears"
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={handleChange}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Resume URL
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="resumeUrl"
                  value={form.resumeUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Upload resume
              <input
                type="file"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeUpload}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white file:cursor-pointer file:border-0 file:bg-cyan-300/20 file:px-3 file:py-2 file:text-white"
              />
              {uploadingResume ? (
                <span className="text-sm text-cyan-200">Uploading resume...</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Skills
              <input
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="React, Node.js, UI Design"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Hourly rate
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  value={form.hourlyRate}
                  onChange={handleChange}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Milestone rate
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  name="milestoneRate"
                  type="number"
                  min="0"
                  value={form.milestoneRate}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Skill proficiency
              <textarea
                className="min-h-24 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="skillProficiency"
                value={form.skillProficiency}
                onChange={handleChange}
                placeholder={"React|expert\nNode.js|advanced"}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Portfolio gallery
              <textarea
                className="min-h-24 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="portfolio"
                value={form.portfolio}
                onChange={handleChange}
                placeholder={"AI Resume Builder|https://demo.com|Built MERN AI workflow\nBrand Kit|https://portfolio.com|Identity design"}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Certifications
              <textarea
                className="min-h-24 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="certifications"
                value={form.certifications}
                onChange={handleChange}
                placeholder={"MongoDB Developer|MongoDB|https://certificate.com"}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Work experience
              <textarea
                className="min-h-24 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="experience"
                value={form.experience}
                onChange={handleChange}
                placeholder={"Full-stack Developer|Startup Studio|Built dashboards and APIs"}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              Availability scheduler
              <textarea
                className="min-h-24 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="availability"
                value={form.availability}
                onChange={handleChange}
                placeholder={"2026-06-01T10:00|2026-06-01T14:00|Available for discovery calls"}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <ButtonLoader label="Saving profile" /> : "Save Profile"}
            </button>
          </form>
        </section>
      </motion.div>
    </main>
  );
}
