import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";

const categories = [
  "Web Development",
  "Mobile App",
  "UI/UX Design",
  "Content Writing",
  "Marketing",
  "Data",
];

const emptyGig = {
  title: "",
  description: "",
  category: "Web Development",
  skills: "",
  budget: "",
  deadline: "",
};

const emptyProposal = {
  coverLetter: "",
  bidAmount: "",
  timeline: "",
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

export default function Marketplace() {
  const [user, setUser] = useState(getStoredUser);
  const [gigs, setGigs] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingGig, setSavingGig] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState("");
  const [selectedGig, setSelectedGig] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    skills: "",
    minBudget: "",
    maxBudget: "",
    status: "open",
  });
  const [gigForm, setGigForm] = useState(emptyGig);
  const [proposalForm, setProposalForm] = useState(emptyProposal);

  const isClient = user?.role === "client" || user?.role === "admin";
  const isFreelancer = user?.role === "freelancer" || user?.role === "admin";

  const proposalByGig = useMemo(() => {
    const map = new Map();
    myProposals.forEach((proposal) => {
      const gigId = proposal.gig?._id || proposal.gig;
      if (gigId) map.set(String(gigId), proposal);
    });
    return map;
  }, [myProposals]);

  const loadGigs = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => String(value).trim())
      );
      const res = await api.get("/gigs", { params });
      setGigs(res.data.gigs || []);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not load gigs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      await loadGigs();

      if (localStorage.getItem("token")) {
        try {
          const [profileRes, proposalRes] = await Promise.all([
            api.get("/auth/me"),
            api.get("/proposals/mine"),
          ]);
          setUser(profileRes.data.user);
          setMyProposals(proposalRes.data.proposals || []);
          localStorage.setItem("user", JSON.stringify(profileRes.data.user));
        } catch {
          setMyProposals([]);
        }
      }
    };

    bootstrap();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleGigChange = (event) => {
    const { name, value } = event.target;
    setGigForm((current) => ({ ...current, [name]: value }));
  };

  const handleProposalChange = (event) => {
    const { name, value } = event.target;
    setProposalForm((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadGigs(filters);
  };

  const resetFilters = () => {
    const nextFilters = {
      q: "",
      category: "",
      skills: "",
      minBudget: "",
      maxBudget: "",
      status: "open",
    };
    setFilters(nextFilters);
    loadGigs(nextFilters);
  };

  const createGig = async (event) => {
    event.preventDefault();
    setSavingGig(true);

    try {
      const res = await api.post("/gigs", gigForm);
      setGigs((current) => [res.data.gig, ...current]);
      setGigForm(emptyGig);
      toast.success("Gig posted");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not post gig");
    } finally {
      setSavingGig(false);
    }
  };

  const submitProposal = async (event) => {
    event.preventDefault();

    if (!selectedGig) return;

    setSubmittingProposal(selectedGig._id);

    try {
      const res = await api.post(`/gigs/${selectedGig._id}/proposals`, proposalForm);
      setMyProposals((current) => [res.data.proposal, ...current]);
      setGigs((current) =>
        current.map((gig) =>
          gig._id === selectedGig._id
            ? { ...gig, proposalCount: (gig.proposalCount || 0) + 1 }
            : gig
        )
      );
      setProposalForm(emptyProposal);
      setSelectedGig(null);
      toast.success("Proposal submitted");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not submit proposal");
    } finally {
      setSubmittingProposal("");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-16 pt-32 lg:px-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]"
      >
        <aside className="grid content-start gap-6">
          <section className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Gig marketplace</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-white">Find project matches</h1>
            <p className="mt-4 leading-7 text-slate-300">
              Browse open gigs, filter by skills and budget, and submit focused proposals.
            </p>

            <form onSubmit={applyFilters} className="mt-6 grid gap-3">
              <input
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Search gigs"
              />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <select
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">Any status</option>
                  <option value="open">Open</option>
                  <option value="in_review">In review</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <input
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                placeholder="Skills: React, Node.js"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="minBudget"
                  type="number"
                  min="0"
                  value={filters.minBudget}
                  onChange={handleFilterChange}
                  placeholder="Min budget"
                />
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="maxBudget"
                  type="number"
                  min="0"
                  value={filters.maxBudget}
                  onChange={handleFilterChange}
                  placeholder="Max budget"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/15"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          {isClient ? (
            <section className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Post a gig</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">Create a brief</h2>

              <form onSubmit={createGig} className="mt-6 grid gap-3">
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="title"
                  value={gigForm.title}
                  onChange={handleGigChange}
                  placeholder="Gig title"
                  required
                />
                <textarea
                  className="min-h-28 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="description"
                  value={gigForm.description}
                  onChange={handleGigChange}
                  placeholder="Project goals, deliverables, and expectations"
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                    name="category"
                    value={gigForm.category}
                    onChange={handleGigChange}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <input
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                    name="budget"
                    type="number"
                    min="1"
                    value={gigForm.budget}
                    onChange={handleGigChange}
                    placeholder="Budget"
                    required
                  />
                </div>
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="skills"
                  value={gigForm.skills}
                  onChange={handleGigChange}
                  placeholder="Required skills"
                />
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  name="deadline"
                  type="date"
                  value={gigForm.deadline}
                  onChange={handleGigChange}
                />
                <button
                  type="submit"
                  disabled={savingGig}
                  className="rounded-2xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingGig ? <ButtonLoader label="Posting gig" /> : "Post Gig"}
                </button>
              </form>
            </section>
          ) : null}
        </aside>

        <section className="grid content-start gap-4">
          <div className="flex flex-col gap-3 rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Search results</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">{gigs.length} gigs found</h2>
            </div>
            {!user ? (
              <Link
                to="/login"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center font-semibold text-white hover:bg-white/15"
              >
                Login to propose
              </Link>
            ) : null}
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-10 text-center text-white backdrop-blur-2xl">
              <ButtonLoader label="Loading gigs" />
            </div>
          ) : gigs.length ? (
            gigs.map((gig) => {
              const existingProposal = proposalByGig.get(String(gig._id));
              const ownsGig = String(gig.client?._id || gig.client) === String(user?._id);
              const canPropose = user && isFreelancer && !ownsGig && gig.status === "open";

              return (
                <article
                  key={gig._id}
                  className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.32)] backdrop-blur-2xl"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                          {gig.category}
                        </span>
                        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold capitalize text-emerald-100">
                          {gig.status.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-2xl font-bold text-white">{gig.title}</h3>
                      <p className="mt-3 line-clamp-3 leading-7 text-slate-300">{gig.description}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-left lg:min-w-36">
                      <p className="text-sm text-amber-100">Budget</p>
                      <p className="mt-1 text-2xl font-extrabold text-white">${Number(gig.budget).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(gig.skills || []).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 text-sm text-slate-300 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <span>Client: {gig.client?.name || "SkillSphere client"}</span>
                      <span>Proposals: {gig.proposalCount || 0}</span>
                      {gig.deadline ? (
                        <span>Due: {new Date(gig.deadline).toLocaleDateString()}</span>
                      ) : null}
                    </div>

                    {existingProposal ? (
                      <span className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-center font-semibold capitalize text-emerald-100">
                        Proposal {existingProposal.status}
                      </span>
                    ) : canPropose ? (
                      <button
                        type="button"
                        onClick={() => setSelectedGig(gig)}
                        className="rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1"
                      >
                        Submit Proposal
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-10 text-center text-slate-300 backdrop-blur-2xl">
              No gigs match those filters yet.
            </div>
          )}
        </section>
      </motion.section>

      {selectedGig ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 py-8 backdrop-blur-xl">
          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onSubmit={submitProposal}
            className="w-full max-w-2xl rounded-[28px] border border-white/15 bg-slate-950/95 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.55)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Proposal</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">{selectedGig.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGig(null)}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <textarea
                className="min-h-36 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                name="coverLetter"
                value={proposalForm.coverLetter}
                onChange={handleProposalChange}
                placeholder="Explain your approach and why you are a strong fit"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="bidAmount"
                  type="number"
                  min="1"
                  value={proposalForm.bidAmount}
                  onChange={handleProposalChange}
                  placeholder="Bid amount"
                  required
                />
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  name="timeline"
                  value={proposalForm.timeline}
                  onChange={handleProposalChange}
                  placeholder="Timeline, e.g. 2 weeks"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingProposal === selectedGig._id}
                className="rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingProposal === selectedGig._id ? (
                  <ButtonLoader label="Submitting proposal" />
                ) : (
                  "Send Proposal"
                )}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}
    </main>
  );
}
