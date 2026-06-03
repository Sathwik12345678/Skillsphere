import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const trustedCompanies = ["Google", "Microsoft", "Amazon", "Adobe", "Nvidia"];
const headlineWords = "How work should work".split(" ");

const popularCategories = [
  { title: "Web Dev", detail: "MERN, Shopify, WordPress", accent: "bg-lime-100 text-lime-900" },
  { title: "Design", detail: "Logos, UI kits, social posts", accent: "bg-rose-100 text-rose-900" },
  { title: "AI/ML", detail: "Chatbots, automations, data", accent: "bg-violet-100 text-violet-900" },
  { title: "Video Editing", detail: "Reels, ads, YouTube cuts", accent: "bg-sky-100 text-sky-900" },
  { title: "Home Tutors", detail: "Verified local educators", accent: "bg-amber-100 text-amber-900" },
  { title: "Photography", detail: "Events, product, portraits", accent: "bg-emerald-100 text-emerald-900" },
];

const freelancers = [
  {
    name: "Aarav Mehta",
    role: "Full-stack Developer",
    meta: "2 km away",
    price: "Rs. 1,200/hr",
    score: "98% match",
    color: "from-lime-300 to-emerald-400",
  },
  {
    name: "Nisha Rao",
    role: "Brand Designer",
    meta: "3.5 km away",
    price: "Rs. 900/hr",
    score: "95% match",
    color: "from-rose-300 to-orange-300",
  },
  {
    name: "Kabir Khan",
    role: "AI Automation Expert",
    meta: "5 km away",
    price: "Rs. 1,600/hr",
    score: "92% match",
    color: "from-violet-300 to-sky-300",
  },
];

const projects = [
  { title: "Build MERN Portfolio Website", budget: 8000, distance: "2 km away", proposals: 10 },
  { title: "AI Resume Builder", budget: 15000, distance: "5 km away", proposals: 7 },
  { title: "Website Design", budget: 15000, distance: "Nearby", proposals: 12 },
];

const services = [
  "Web Development",
  "Graphic Design",
  "Video Editing",
  "AI Solutions",
  "Home Tutors",
  "Photography",
];

const fadeUp = {
  hidden: { opacity: 0, y: 80 },
  show: { opacity: 1, y: 0 },
};

const sectionMotion = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.18 },
  variants: fadeUp,
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11 } },
};

function CountUp({ value, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;

    let frame;
    const start = performance.now();
    const duration = 1250;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

function HeroVisual() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 140, damping: 22 });
  const smoothY = useSpring(y, { stiffness: 140, damping: 22 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-2, 2]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [2, -2]);

  const onMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="ai-match-card group relative min-h-[440px] overflow-hidden rounded-[30px] bg-[#f4efe8] shadow-[0_28px_90px_rgba(24,24,27,0.12)]"
    >
      <img
        src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85"
        alt="Creative workspace"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#fbfaf6]/10 via-transparent to-[#fbfaf6]/20" />
      <motion.div
        className="glass-panel absolute left-6 top-6 rounded-3xl p-5"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-700">AI Match</p>
        <p className="mt-2 text-3xl font-black text-zinc-950">98%</p>
        <p className="text-sm font-bold text-zinc-500">local fit score</p>
      </motion.div>
      <div className="glass-panel-dark absolute bottom-6 right-6 w-72 rounded-3xl p-5 text-white">
        <p className="text-sm font-bold text-lime-300">Nearby Talent</p>
        <h3 className="mt-2 text-2xl font-black">Hire top freelancers powered by AI</h3>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-extrabold">
          <span className="rounded-2xl bg-white/10 px-2 py-3">Fast</span>
          <span className="rounded-2xl bg-white/10 px-2 py-3">Local</span>
          <span className="rounded-2xl bg-white/10 px-2 py-3">Secure</span>
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeading({ kicker, title, copy }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-lime-700">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl">
        {title}
      </h2>
      {copy ? <p className="mt-4 text-lg leading-8 text-zinc-600">{copy}</p> : null}
    </div>
  );
}

export default function Landing() {
  return (
    <main className="relative bg-[#fbfaf6] text-zinc-950">
      <section className="relative overflow-hidden border-b border-zinc-200/70 bg-[#fbfaf6]/92 px-4 pb-12 pt-28 sm:px-6 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,_rgba(14,165,233,0.12),_transparent_26%),radial-gradient(circle_at_78%_10%,_rgba(132,204,22,0.16),_transparent_23%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.86fr_1.14fr]">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.7 }}>
            <h1 className="max-w-xl font-serif text-6xl font-black leading-[0.94] tracking-tight text-zinc-950 sm:text-7xl lg:text-8xl">
              {headlineWords.map((word, index) => (
                <motion.span
                  key={word}
                  className="gradient-text-reveal mr-4 inline-block"
                  initial={{ opacity: 0, y: 42, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.72, delay: index * 0.13, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl text-xl font-semibold leading-8 text-zinc-800">
              Find verified talent, internships, full-time jobs, and career courses in one AI-powered marketplace.
            </p>

            <div className="search-pulse mt-7 flex max-w-2xl items-center gap-3 rounded-full border border-zinc-200 bg-white p-2 shadow-[0_18px_60px_rgba(24,24,27,0.08)]">
              <span className="pl-4 text-xl text-zinc-400">⌕</span>
              <input
                className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                placeholder="Search jobs, internships, courses..."
              />
              <Link
                to="/gigs"
                className="startup-primary group rounded-full px-6 py-3 text-sm font-extrabold text-white"
              >
                Search <span className="button-arrow">-&gt;</span>
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-bold text-zinc-600">
              <span className="text-zinc-400">Popular:</span>
              {["Web Dev", "Design", "AI", "Internships", "Courses"].map((item) => (
                <Link key={item} to={item === "Courses" ? "/gigs?tab=course" : item === "Internships" ? "/gigs?tab=internship" : "/gigs"} className="hover-chip rounded-full border border-zinc-200 bg-white px-3 py-1.5">
                  {item}
                </Link>
              ))}
            </div>

            <div className="mt-8 overflow-hidden text-sm font-extrabold text-zinc-400">
              <span>Trusted by</span>
              <div className="company-marquee mt-3 flex gap-8 whitespace-nowrap text-zinc-500">
                {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
                  <span key={`${company}-${index}`}>{company}</span>
                ))}
              </div>
            </div>
          </motion.div>

          <HeroVisual />
        </div>
      </section>

      <motion.section {...sectionMotion} className="px-4 py-10 sm:px-6">
        <motion.div variants={stagger} className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {["Nearby Talent", "AI Matched Professionals", "Secure Milestone Payments"].map((item) => (
            <motion.div key={item} variants={fadeUp} className="startup-card rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_14px_42px_rgba(24,24,27,0.06)]">
              <p className="text-lg font-black text-zinc-950">{item}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">Built for quick trust, clean discovery, and confident local hiring.</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section {...sectionMotion} className="px-4 py-16 sm:px-6" id="categories">
        <SectionHeading
          kicker="Browse services"
          title="Popular Services Near You"
          copy="Fiverr-style services, Upwork-style work applications, and Coursera-style courses in one clean marketplace."
        />
        <motion.div variants={stagger} className="mx-auto mt-10 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularCategories.map((category) => (
            <motion.div key={category.title} variants={fadeUp}>
            <Link
              key={category.title}
              to="/gigs"
              className="service-card group block rounded-[26px] border border-zinc-200 bg-white p-6 shadow-[0_14px_42px_rgba(24,24,27,0.06)]"
            >
              <span className={`inline-flex rounded-2xl px-4 py-2 text-sm font-black ${category.accent}`}>{category.title}</span>
              <h3 className="mt-8 text-2xl font-black text-zinc-950 group-hover:text-lime-700">{category.title}</h3>
              <p className="mt-2 font-semibold text-zinc-500">{category.detail}</p>
            </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section {...sectionMotion} className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[34px] bg-zinc-950 text-white shadow-[0_28px_100px_rgba(24,24,27,0.18)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 sm:p-12">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-lime-300">Unique AI match</p>
            <h2 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
              Expert care for your project, matched in seconds.
            </h2>
            <p className="mt-5 text-lg leading-8 text-zinc-300">
              SkillSphere ranks nearby freelancers by skill, proof, distance, availability, and budget fit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="startup-primary group rounded-full px-6 py-3 font-black text-white">Hire Talent <span className="button-arrow">-&gt;</span></Link>
              <Link to="/register" className="startup-secondary rounded-full px-6 py-3 font-black text-white">Become Freelancer</Link>
              <Link to="/gigs?tab=course" className="startup-secondary rounded-full px-6 py-3 font-black text-white">Browse Courses</Link>
            </div>
          </div>
          <div className="grid gap-4 bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.22),_transparent_34%),linear-gradient(135deg,_#18181b,_#09090b)] p-6 sm:grid-cols-2 sm:p-10">
            {freelancers.map((person) => (
              <div key={person.name} className="freelancer-card group rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <div className={`avatar-glow h-16 w-16 rounded-full bg-gradient-to-br ${person.color}`} />
                <h3 className="mt-5 text-xl font-black">{person.name}</h3>
                <p className="font-semibold text-zinc-300">{person.role}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-lime-300 px-3 py-1.5 text-zinc-950">{person.score}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">{person.meta}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">{person.price}</span>
                </div>
                <div className="freelancer-reveal mt-4 grid gap-2 text-xs font-black text-white/85">
                  <span>24h response</span>
                  <span>32 verified jobs</span>
                  <Link to="/gigs?tab=project" className="quick-hire rounded-full bg-white px-4 py-2 text-center text-zinc-950">Quick Hire</Link>
                </div>
              </div>
            ))}
            <div className="rounded-[26px] border border-white/10 bg-lime-300 p-5 text-zinc-950">
              <p className="text-sm font-black uppercase tracking-[0.2em]">Live local map</p>
              <div className="relative mt-5 h-44 rounded-[22px] bg-white/70">
                <span className="absolute left-[24%] top-[32%] h-4 w-4 rounded-full bg-zinc-950 shadow-[0_0_0_10px_rgba(24,24,27,0.12)]" />
                <span className="absolute left-[58%] top-[52%] h-4 w-4 rounded-full bg-lime-700 shadow-[0_0_0_12px_rgba(77,124,15,0.16)]" />
                <span className="absolute left-[72%] top-[24%] h-4 w-4 rounded-full bg-rose-500 shadow-[0_0_0_10px_rgba(244,63,94,0.14)]" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...sectionMotion} className="px-4 py-16 sm:px-6">
        <SectionHeading kicker="Recent projects" title="Nearby Projects" copy="Freelancer.com style project cards with distance, proposals, and clear budgets." />
        <motion.div variants={stagger} className="mx-auto mt-10 grid max-w-7xl gap-4 lg:grid-cols-3">
          {projects.map((project) => (
            <motion.article key={project.title} variants={fadeUp} className="project-card rounded-[26px] border border-zinc-200 bg-white p-6 shadow-[0_14px_42px_rgba(24,24,27,0.06)]">
              <p className="status-glow text-sm font-black uppercase tracking-[0.18em] text-lime-700">Open project</p>
              <h3 className="mt-4 min-h-16 text-2xl font-black leading-tight text-zinc-950">{project.title}</h3>
              <div className="mt-5 flex flex-wrap gap-2 text-sm font-extrabold text-zinc-600">
                <span className="rounded-full bg-zinc-100 px-3 py-1.5">Rs. <CountUp value={project.budget} /></span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5">{project.distance}</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5"><CountUp value={project.proposals} /> proposals</span>
              </div>
              <Link to="/gigs?tab=project" className="startup-primary group mt-7 inline-flex rounded-full px-5 py-3 font-black text-white">
                View Project <span className="button-arrow">-&gt;</span>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <motion.section {...sectionMotion} className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[30px] bg-lime-300 p-8 text-zinc-950">
            <p className="text-sm font-black uppercase tracking-[0.24em]">Milestone payments</p>
            <h2 className="mt-4 font-display text-4xl font-black">Pay safely. Release only when work is approved.</h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-zinc-700">Secure milestone flow keeps clients confident and freelancers protected.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <div key={service} className="service-card rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_14px_42px_rgba(24,24,27,0.06)]">
                <p className="text-xl font-black text-zinc-950">{service}</p>
                <p className="mt-2 text-sm font-semibold text-zinc-500">Verified local experts ready this week.</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section {...sectionMotion} className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-[30px] bg-zinc-950 p-6 text-white shadow-[0_28px_100px_rgba(24,24,27,0.18)] sm:grid-cols-3 sm:p-10">
          {[
            { value: 50000, suffix: "+", label: "Users" },
            { value: 15000, suffix: "+", label: "Projects" },
            { value: 10, prefix: "Rs. ", suffix: "Cr+", label: "Payments" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[24px] border border-white/10 bg-white/10 p-6 text-center backdrop-blur-xl">
              <p className="font-display text-4xl font-black text-lime-300">
                <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-zinc-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...sectionMotion} className="px-4 py-16 sm:px-6">
        <div className="testimonial-track mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-white/72 p-8 shadow-[0_18px_70px_rgba(24,24,27,0.08)] backdrop-blur-xl sm:p-12">
          <div className="testimonial-marquee flex gap-5">
            {[
              ["SkillSphere helped us find a nearby AI freelancer in one evening. The match felt personal, fast, and legit.", "Priya S. - Startup founder"],
              ["The marketplace feels polished, fast, and surprisingly human. We hired design help without the usual friction.", "Rohan M. - Product lead"],
              ["Milestones and local matching gave our team confidence from the first chat.", "Anika D. - Agency owner"],
              ["SkillSphere helped us find a nearby AI freelancer in one evening. The match felt personal, fast, and legit.", "Priya S. - Startup founder"],
            ].map(([quote, name], index) => (
              <article key={`${name}-${index}`} className="glass-testimonial min-w-[min(82vw,560px)] rounded-[28px] p-7">
                <p className="font-serif text-3xl font-black leading-tight text-zinc-950 sm:text-4xl">"{quote}"</p>
                <p className="mt-6 font-black text-lime-700">{name}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <footer className="footer-glow relative overflow-hidden px-4 pb-10 pt-16 sm:px-6">
        <div className="footer-wave absolute inset-x-0 top-0 h-14" />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-zinc-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-black text-[#108a00]">SkillSphere</p>
            <p className="mt-1 font-semibold text-zinc-500">Find Talent | Find Work | Learn Skills</p>
          </div>
          <div className="flex flex-wrap gap-3 font-bold text-zinc-600">
            <Link className="social-bounce" to="/gigs">Marketplace</Link>
            <Link className="social-bounce" to="/gigs?tab=course">Courses</Link>
            <Link className="social-bounce" to="/register">Sign up</Link>
            <Link className="social-bounce" to="/login">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
