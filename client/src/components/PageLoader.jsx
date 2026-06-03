import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#050914] text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.22, delay: 0.25, ease: "easeOut" }}
    >
      <div className="w-[min(86vw,420px)] text-center">
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/10 font-display text-3xl font-black text-lime-300 shadow-[0_0_70px_rgba(132,204,22,0.35)] backdrop-blur-2xl"
          animate={{ scale: [0.96, 1] }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          S
        </motion.div>
        <motion.p
          className="mt-6 font-display text-3xl font-black tracking-tight"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05 }}
        >
          SkillSphere
        </motion.p>
        <p className="mt-2 text-sm font-bold text-zinc-400">Connecting Talent with Opportunity</p>
        <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-lime-300 to-emerald-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
