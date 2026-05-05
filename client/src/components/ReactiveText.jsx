import { useMemo, useState } from "react";

const radius = 24;

export default function ReactiveText({
  as: Component = "span",
  text,
  className = "",
  letterClassName = "",
}) {
  const letters = useMemo(() => Array.from(text), [text]);
  const [mouseX, setMouseX] = useState(null);

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMouseX(event.clientX - rect.left);
  };

  const handleLeave = () => {
    setMouseX(null);
  };

  return (
    <Component
      className={`${className} inline-block`}
      data-cursor="text"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {letters.map((letter, index) => {
        const centerX = index * 15 + 8;
        const intensity =
          mouseX === null ? 0 : Math.max(0, 1 - Math.abs(mouseX - centerX) / radius);
        const scale = 1 + intensity * 0.45;
        const y = intensity * -4;
        const opacity = 0.92 + intensity * 0.08;

        return (
          <span
            key={`${letter}-${index}`}
            className={`${letterClassName} inline-block whitespace-pre will-change-transform`}
            style={{
              transform: `translateY(${y}px) scale(${scale})`,
              opacity,
              transition: "transform 150ms ease, opacity 150ms ease, color 150ms ease",
            }}
          >
            {letter}
          </span>
        );
      })}
    </Component>
  );
}
