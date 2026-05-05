import { motion } from "framer-motion";

const orbs = [
  "left-[8%] top-[12%] h-56 w-56 bg-cyan-400/20",
  "right-[10%] top-[18%] h-72 w-72 bg-amber-300/20",
  "left-[28%] bottom-[8%] h-64 w-64 bg-emerald-400/15",
  "right-[24%] bottom-[12%] h-52 w-52 bg-fuchsia-400/15",
];

const stars = Array.from({ length: 110 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + (index % 9) * 7) % 100}%`,
  top: `${(index * 19 + (index % 11) * 5) % 100}%`,
  size: ((index * 7) % 3) + 1,
  delay: (index % 14) * 0.22,
  duration: 2.8 + (index % 8) * 0.65,
  opacity: 0.28 + (index % 6) * 0.09,
  glow:
    index % 10 === 0
      ? "rgba(191, 219, 254, 0.95)"
      : index % 4 === 0
        ? "rgba(253, 224, 71, 0.9)"
        : "rgba(255, 255, 255, 0.85)",
}));

const shootingStars = Array.from({ length: 6 }, (_, index) => ({
  id: index,
  top: `${-12 - index * 15}%`,
  left: `${14 + index * 13}%`,
  delay: index * 1.9,
  duration: 3.2 + index * 0.3,
}));

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_24%),radial-gradient(circle_at_80%_20%,_rgba(250,204,21,0.14),_transparent_18%),radial-gradient(circle_at_50%_100%,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#040814_0%,_#06101f_42%,_#081423_100%)]" />
      <div className="absolute inset-0 opacity-90">
        {stars.map((star) => (
          <span
            key={star.id}
            className="star-twinkle absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: `0 0 10px ${star.glow}`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {shootingStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute opacity-0"
            style={{
              top: star.top,
              left: star.left,
            }}
            animate={{
              y: ["0vh", "120vh"],
              opacity: [0, 0.95, 0.9, 0],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              repeatDelay: 5.4,
              ease: "linear",
            }}
          >
            <span
              className="block h-24 w-px rounded-full bg-gradient-to-b from-white via-cyan-200 to-transparent"
              style={{ boxShadow: "0 0 18px rgba(125,211,252,0.65)" }}
            />
          </motion.div>
        ))}
      </div>

      {orbs.map((className, index) => (
        <motion.div
          key={className}
          className={`absolute rounded-full blur-3xl ${className}`}
          animate={{
            x: [0, index % 2 === 0 ? 40 : -36, 0],
            y: [0, index % 2 === 0 ? -26 : 30, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 12 + index * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
