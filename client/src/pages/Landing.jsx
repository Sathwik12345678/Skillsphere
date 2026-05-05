import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ReactiveText from "../components/ReactiveText";

const stats = [
  { label: "Active Creators", value: "2.4K+" },
  { label: "Projects Delivered", value: "18K+" },
  { label: "Avg. Match Time", value: "3 min" },
];

const highlights = [
  "Glassmorphism workspace",
  "Intelligent freelancer discovery",
  "Fast onboarding with role-based access",
];

export default function Landing() {
  return (
    <main className="relative min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pb-16 pt-32 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-200 backdrop-blur-xl">
              <ReactiveText text="Intelligent Freelance Ecosystem" />
            </span>

            <div className="mt-6">
              <ReactiveText
                as="h1"
                text="SkillSphere"
                className="font-display text-5xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl"
              />
              <ReactiveText
                as="span"
                text="Modern talent flow with living motion."
                className="mt-2 block bg-gradient-to-r from-white via-cyan-100 to-amber-200 bg-clip-text font-display text-4xl font-bold leading-tight text-transparent sm:text-5xl lg:text-6xl"
              />
            </div>

            <ReactiveText
              as="p"
              text="A premium glass-driven marketplace where clients, freelancers, and teams connect through elegant workflows, immersive UI, and trust-first collaboration."
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-300"
            />

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-6 py-3 text-center font-bold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] transition duration-300 hover:-translate-y-1"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-center font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <span
                  key={item}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200 backdrop-blur-xl"
              >
                  <ReactiveText text={item} />
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-6 top-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -right-6 bottom-10 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />

            <div className="relative rounded-[32px] border border-white/15 bg-white/10 p-5 shadow-[0_30px_120px_rgba(8,15,31,0.45)] backdrop-blur-2xl">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <ReactiveText
                      as="p"
                      text="Live dashboard"
                      className="text-sm uppercase tracking-[0.3em] text-cyan-200"
                    />
                    <ReactiveText
                      as="h2"
                      text="Premium collaboration pulse"
                      className="mt-2 font-display text-2xl font-bold text-white"
                    />
                  </div>
                  <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Online
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  {stats.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.12 }}
                      className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl"
                    >
                      <ReactiveText
                        as="p"
                        text={item.value}
                        className="text-3xl font-extrabold text-white"
                      />
                      <ReactiveText
                        as="p"
                        text={item.label}
                        className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-300"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
