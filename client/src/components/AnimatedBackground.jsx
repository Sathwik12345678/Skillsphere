const stars = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + (index % 7) * 9) % 100}%`,
  top: `${(index * 23 + (index % 5) * 11) % 100}%`,
  size: index % 6 === 0 ? 2 : 1,
  opacity: 0.18 + (index % 5) * 0.08,
}));

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,_rgba(14,165,233,0.16),_transparent_28%),radial-gradient(circle_at_86%_18%,_rgba(132,204,22,0.12),_transparent_24%),linear-gradient(180deg,_#06101f_0%,_#071423_100%)]" />
      <div className="grid-overlay absolute inset-0 opacity-[0.08]" />
      <div className="absolute inset-0 opacity-80">
        {stars.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
