import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";
import { demoCourses, demoGigs } from "../data/demoData";

const tabs = [
  { id: "all", label: "All" },
  { id: "project", label: "Projects" },
  { id: "internship", label: "Internships" },
  { id: "job", label: "Jobs" },
  { id: "course", label: "Courses" },
];

const categories = [
  "Web Development",
  "AI Services",
  "UI/UX Design",
  "Data",
  "Marketing",
  "Business",
  "Cybersecurity",
  "Cloud",
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const getEnrollments = () => {
  try {
    return JSON.parse(localStorage.getItem("skillsphereEnrollments")) || [];
  } catch {
    return [];
  }
};

const formatMoney = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const normalizeListing = (gig) => ({
  ...gig,
  listingType: gig.listingType || "project",
  company: gig.company || gig.client?.name || "SkillSphere client",
  location: gig.location || gig.distance || "Remote",
  stipend: gig.stipend || gig.budget,
});

const initialGigForm = {
  title: "",
  description: "",
  category: "Web Development",
  listingType: "project",
  skills: "",
  budget: "",
  deadline: "",
  company: "",
  location: "Remote",
  duration: "",
  experienceLevel: "Entry level",
};

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(getStoredUser);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    status: "open",
    skills: "",
    minBudget: "",
    maxBudget: "",
  });
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
  const [gigForm, setGigForm] = useState(initialGigForm);
  const [savingGig, setSavingGig] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [proposalForm, setProposalForm] = useState({ coverLetter: "", bidAmount: "", timeline: "" });
  const [submittingProposal, setSubmittingProposal] = useState("");
  const [enrollments, setEnrollments] = useState(getEnrollments);
  const [payingCourse, setPayingCourse] = useState("");

  const isFreelancer = user?.role === "freelancer" || user?.role === "admin";
  const isClient = user?.role === "client" || user?.role === "admin";

  const listings = useMemo(() => {
    const liveGigs = gigs.map(normalizeListing);
    const sourceGigs = liveGigs.length ? liveGigs : demoGigs.map(normalizeListing);
    const sourceCourses = demoCourses.map((course) => ({ ...course, listingType: "course", status: "open" }));
    return [...sourceGigs, ...sourceCourses];
  }, [gigs]);

  const shownListings = useMemo(() => {
    return listings.filter((item) => {
      const q = filters.q.toLowerCase().trim();
      const skills = filters.skills.toLowerCase().trim();
      const min = Number(filters.minBudget || 0);
      const max = Number(filters.maxBudget || 0);
      const searchable = `${item.title} ${item.description} ${item.category} ${item.company || ""} ${(item.skills || []).join(" ")}`.toLowerCase();
      const price = Number(item.price || item.budget || item.stipend || 0);
      const matchesTab = activeTab === "all" || item.listingType === activeTab;
      const matchesQ = !q || searchable.includes(q);
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesStatus = item.listingType === "course" || !filters.status || item.status === filters.status;
      const matchesSkills = !skills || (item.skills || []).join(" ").toLowerCase().includes(skills);
      const matchesMin = !min || price >= min;
      const matchesMax = !max || price <= max;
      return matchesTab && matchesQ && matchesCategory && matchesStatus && matchesSkills && matchesMin && matchesMax;
    });
  }, [activeTab, filters, listings]);

  const stats = useMemo(() => {
    const count = (type) => listings.filter((item) => item.listingType === type).length;
    return [
      { label: "Open projects", value: count("project") },
      { label: "Internships", value: count("internship") },
      { label: "Jobs", value: count("job") },
      { label: "Courses", value: count("course") },
    ];
  }, [listings]);

  const loadGigs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/gigs");
      setGigs(res.data.gigs || []);
    } catch (error) {
      setGigs([]);
      toast.error(error.response?.data?.msg || "Showing demo listings while live data loads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGigs();
    if (localStorage.getItem("token")) {
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some((item) => item.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "all" ? {} : { tab });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ q: "", category: "", status: "open", skills: "", minBudget: "", maxBudget: "" });
  };

  const createGig = async (event) => {
    event.preventDefault();
    setSavingGig(true);
    try {
      const payload = {
        ...gigForm,
        budget: Number(gigForm.budget),
        stipend: Number(gigForm.budget),
      };
      const res = await api.post("/gigs", payload);
      setGigs((current) => [normalizeListing(res.data.gig), ...current]);
      setGigForm(initialGigForm);
      toast.success(`${payload.listingType === "project" ? "Project" : "Opportunity"} posted`);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not post listing");
    } finally {
      setSavingGig(false);
    }
  };

  const openApplication = (gig) => {
    setSelectedGig(gig);
    setProposalForm({
      coverLetter:
        gig.listingType === "internship"
          ? "I am interested in this internship and can contribute with the listed skills."
          : "",
      bidAmount: gig.stipend || gig.budget || "",
      timeline: gig.duration || "Available immediately",
    });
  };

  const submitProposal = async (event) => {
    event.preventDefault();
    if (!selectedGig) return;
    if (String(selectedGig._id).startsWith("demo-")) {
      toast.success("Application saved in demo mode. Login and use a live listing to submit to backend.");
      setSelectedGig(null);
      setProposalForm({ coverLetter: "", bidAmount: "", timeline: "" });
      return;
    }

    setSubmittingProposal(selectedGig._id);
    try {
      await api.post(`/gigs/${selectedGig._id}/proposals`, proposalForm);
      toast.success(selectedGig.listingType === "project" ? "Proposal submitted" : "Application submitted");
      setSelectedGig(null);
      setProposalForm({ coverLetter: "", bidAmount: "", timeline: "" });
      loadGigs();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not submit application");
    } finally {
      setSubmittingProposal("");
    }
  };

  const enrollCourse = async (course) => {
    setPayingCourse(course._id);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const next = [...new Set([...enrollments, course._id])];
    setEnrollments(next);
    localStorage.setItem("skillsphereEnrollments", JSON.stringify(next));
    const ledger = JSON.parse(localStorage.getItem("skillsphereCoursePayments") || "[]");
    localStorage.setItem(
      "skillsphereCoursePayments",
      JSON.stringify([
        {
          _id: `course-pay-${Date.now()}`,
          course: course.title,
          amount: course.price,
          provider: "SkillSphere MockPay",
          status: "paid",
          paidAt: new Date().toISOString(),
        },
        ...ledger,
      ])
    );
    setPayingCourse("");
    setSelectedCourse(course);
    toast.success("Payment complete. Course enrolled.");
  };

  const renderAction = (item) => {
    if (item.listingType === "course") {
      const enrolled = enrollments.includes(item._id);
      return (
        <button
          type="button"
          disabled={enrolled || payingCourse === item._id}
          onClick={() => enrollCourse(item)}
          className="rounded-2xl bg-[#108a00] px-5 py-3 font-black text-white hover:-translate-y-1 hover:bg-[#0b7200] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enrolled ? "Enrolled" : payingCourse === item._id ? "Paying..." : "Enroll & Pay"}
        </button>
      );
    }

    const ownsGig = String(item.client?._id || item.client) === String(user?._id);
    const canApply = user && isFreelancer && !ownsGig && item.status === "open";
    if (canApply || String(item._id).startsWith("demo-")) {
      return (
        <button type="button" onClick={() => openApplication(item)} className="rounded-2xl bg-[#108a00] px-5 py-3 font-black text-white hover:-translate-y-1 hover:bg-[#0b7200]">
          {item.listingType === "project" ? "Submit Proposal" : "Apply Now"}
        </button>
      );
    }
    return !user ? (
      <Link to="/login" className="rounded-2xl bg-zinc-950 px-5 py-3 text-center font-black text-white hover:-translate-y-1">
        Login to apply
      </Link>
    ) : null;
  };

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-4 pb-16 pt-32 text-zinc-950 sm:px-6 lg:px-10">
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="grid content-start gap-6">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-lime-700">Opportunity marketplace</p>
            <h1 className="mt-3 font-display text-4xl font-black text-zinc-950">Work, internships, and courses</h1>
            <p className="mt-4 leading-7 text-zinc-600">
              A SkillSphere marketplace that blends Upwork-style applications with Coursera-style paid learning.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-2xl font-black text-zinc-950">{stat.value}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <form className="mt-6 grid gap-3">
              <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="q" value={filters.q} onChange={handleFilterChange} placeholder="Search jobs, internships, courses..." />
              <select className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <select className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">Any status</option>
                <option value="open">Open</option>
                <option value="in_review">In review</option>
                <option value="closed">Closed</option>
              </select>
              <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="skills" value={filters.skills} onChange={handleFilterChange} placeholder="Skills: React, Excel, Python" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="minBudget" type="number" min="0" value={filters.minBudget} onChange={handleFilterChange} placeholder="Min amount" />
                <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="maxBudget" type="number" min="0" value={filters.maxBudget} onChange={handleFilterChange} placeholder="Max amount" />
              </div>
              <button type="button" onClick={resetFilters} className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 font-black text-zinc-700 hover:-translate-y-1 hover:border-lime-500">
                Reset filters
              </button>
            </form>
          </section>

          {isClient ? (
            <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-lime-700">Post listing</p>
              <h2 className="mt-3 font-display text-3xl font-black text-zinc-950">Create work opportunity</h2>
              <form onSubmit={createGig} className="mt-6 grid gap-3">
                <select className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.listingType} onChange={(event) => setGigForm((current) => ({ ...current, listingType: event.target.value }))}>
                  <option value="project">Freelance project</option>
                  <option value="internship">Internship</option>
                  <option value="job">Full-time job</option>
                </select>
                <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.title} onChange={(event) => setGigForm((current) => ({ ...current, title: event.target.value }))} placeholder="Listing title" required />
                <textarea className="min-h-28 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.description} onChange={(event) => setGigForm((current) => ({ ...current, description: event.target.value }))} placeholder="Responsibilities, outcomes, and requirements" required />
                <select className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.category} onChange={(event) => setGigForm((current) => ({ ...current, category: event.target.value }))}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" type="number" min="1" value={gigForm.budget} onChange={(event) => setGigForm((current) => ({ ...current, budget: event.target.value }))} placeholder="Budget / stipend / salary" required />
                  <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.company} onChange={(event) => setGigForm((current) => ({ ...current, company: event.target.value }))} placeholder="Company name" />
                </div>
                <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.skills} onChange={(event) => setGigForm((current) => ({ ...current, skills: event.target.value }))} placeholder="Required skills" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.location} onChange={(event) => setGigForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
                  <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" value={gigForm.duration} onChange={(event) => setGigForm((current) => ({ ...current, duration: event.target.value }))} placeholder="Duration / notice" />
                </div>
                <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" type="date" value={gigForm.deadline} onChange={(event) => setGigForm((current) => ({ ...current, deadline: event.target.value }))} />
                <button type="submit" disabled={savingGig} className="rounded-2xl bg-[#108a00] px-5 py-3 font-black text-white hover:-translate-y-1 hover:bg-[#0b7200] disabled:opacity-70">
                  {savingGig ? <ButtonLoader label="Posting listing" /> : "Post Listing"}
                </button>
              </form>
            </section>
          ) : null}
        </aside>

        <section className="grid content-start gap-4">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-lime-700">Search results</p>
                <h2 className="mt-2 font-display text-3xl font-black text-zinc-950">{shownListings.length} listings found</h2>
                {!gigs.length ? <p className="mt-1 text-sm font-semibold text-zinc-500">Showing rich demo data until your backend has live listings.</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button key={tab.id} type="button" onClick={() => selectTab(tab.id)} className={`rounded-full px-4 py-2 text-sm font-black transition ${activeTab === tab.id ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-700 hover:border-lime-500"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-zinc-200 bg-white p-10 text-center text-zinc-600">
              <ButtonLoader label="Loading marketplace" />
            </div>
          ) : shownListings.length ? (
            shownListings.map((item) => (
              <article key={item._id} className="group rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_18px_60px_rgba(24,24,27,0.07)] hover:-translate-y-1 hover:border-lime-500 hover:shadow-[0_26px_80px_rgba(16,138,0,0.14)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black capitalize text-lime-800">{item.listingType}</span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">{item.category}</span>
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">{item.match || item.level || "AI matched"}</span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-black text-zinc-950 group-hover:text-lime-700">{item.title}</h3>
                    <p className="mt-2 font-bold text-zinc-500">{item.company || item.provider} - {item.location || item.duration}</p>
                    <p className="mt-3 line-clamp-3 leading-7 text-zinc-600">{item.description}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 px-5 py-4 text-left lg:min-w-44">
                    <p className="text-sm font-bold text-lime-300">{item.listingType === "course" ? "Course fee" : item.listingType === "project" ? "Budget" : "Pay"}</p>
                    <p className="mt-1 text-2xl font-extrabold text-white">{formatMoney(item.price || item.budget || item.stipend)}</p>
                    <p className="mt-1 text-xs font-bold text-zinc-300">{item.duration || item.deadlineLabel || "Flexible"}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(item.skills || []).map((skill) => (
                    <span key={skill} className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700">{skill}</span>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-5 text-sm font-semibold text-zinc-500 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {item.listingType === "course" ? (
                      <>
                        <span>{item.provider}</span>
                        <span>{item.lessons} lessons</span>
                        <span>{item.rating} rating</span>
                        <span>{item.learners.toLocaleString("en-IN")} learners</span>
                      </>
                    ) : (
                      <>
                        <span>{item.company || item.client?.name || "SkillSphere client"}</span>
                        <span>Applications: {item.proposalCount || item.applicants || 0}</span>
                        {item.deadline ? <span>Apply by: {new Date(item.deadline).toLocaleDateString()}</span> : null}
                      </>
                    )}
                  </div>
                  {renderAction(item)}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-zinc-200 bg-white p-10 text-center text-zinc-500">
              No listings match those filters yet.
            </div>
          )}
        </section>
      </motion.section>

      {selectedGig ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4 py-8 backdrop-blur-xl">
          <motion.form initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} onSubmit={submitProposal} className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-[0_30px_120px_rgba(24,24,27,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-lime-700">{selectedGig.listingType === "project" ? "Proposal" : "Application"}</p>
                <h2 className="mt-2 font-display text-3xl font-black text-zinc-950">{selectedGig.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedGig(null)} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 hover:border-lime-500">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <textarea className="min-h-36 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="coverLetter" value={proposalForm.coverLetter} onChange={(event) => setProposalForm((current) => ({ ...current, coverLetter: event.target.value }))} placeholder="Explain your fit, experience, and approach" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="bidAmount" type="number" min="1" value={proposalForm.bidAmount} onChange={(event) => setProposalForm((current) => ({ ...current, bidAmount: event.target.value }))} placeholder="Expected pay / bid" required />
                <input className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 outline-none focus:border-lime-500" name="timeline" value={proposalForm.timeline} onChange={(event) => setProposalForm((current) => ({ ...current, timeline: event.target.value }))} placeholder="Availability or timeline" required />
              </div>
              <button type="submit" disabled={submittingProposal === selectedGig._id} className="rounded-2xl bg-[#108a00] px-5 py-3 font-black text-white hover:-translate-y-1 hover:bg-[#0b7200] disabled:opacity-70">
                {submittingProposal === selectedGig._id ? <ButtonLoader label="Submitting" /> : "Submit"}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}

      {selectedCourse ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4 py-8 backdrop-blur-xl">
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-[0_30px_120px_rgba(24,24,27,0.35)]">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-lime-700">Course unlocked</p>
            <h2 className="mt-2 font-display text-3xl font-black text-zinc-950">{selectedCourse.title}</h2>
            <p className="mt-4 leading-7 text-zinc-600">Your mock payment is complete. The course is marked as enrolled and saved in this browser.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setSelectedCourse(null)} className="rounded-2xl bg-[#108a00] px-5 py-3 font-black text-white">
                Start Learning
              </button>
              <Link to="/payments" className="rounded-2xl border border-zinc-200 px-5 py-3 font-black text-zinc-700">
                View Payments
              </Link>
            </div>
          </motion.div>
        </div>
      ) : null}
    </main>
  );
}
