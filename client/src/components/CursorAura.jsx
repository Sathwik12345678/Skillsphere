import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorAura() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const trailX = useSpring(cursorX, { damping: 32, stiffness: 200, mass: 0.3 });
  const trailY = useSpring(cursorY, { damping: 32, stiffness: 200, mass: 0.3 });
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState("default");
  const frameRef = useRef(null);
  const lastVariantRef = useRef("default");

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    setEnabled(isFinePointer);

    if (!isFinePointer) {
      return undefined;
    }

    const handleMove = (event) => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        cursorX.set(event.clientX);
        cursorY.set(event.clientY);

        const target = event.target instanceof Element ? event.target : null;
        const nextVariant = target?.closest("[data-cursor='text']")
          ? "text"
          : target?.closest(
                "a, button, input, select, textarea, [role='button'], [data-cursor='interactive']"
              )
            ? "interactive"
            : "default";

        if (lastVariantRef.current !== nextVariant) {
          lastVariantRef.current = nextVariant;
          setVariant(nextVariant);
        }
      });
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [cursorX, cursorY]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[60] rounded-full border border-white/50 bg-white/25 mix-blend-screen"
        animate={
          variant === "interactive"
            ? { width: 26, height: 26, backgroundColor: "rgba(255,255,255,0.18)" }
            : variant === "text"
              ? { width: 18, height: 18, backgroundColor: "rgba(255,255,255,0.28)" }
              : { width: 14, height: 14, backgroundColor: "rgba(255,255,255,0.24)" }
        }
        transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.35 }}
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 rounded-full blur-xl"
        animate={
          variant === "interactive"
            ? {
                width: 96,
                height: 96,
                background:
                  "radial-gradient(circle, rgba(250,204,21,0.2) 0%, rgba(56,189,248,0.1) 38%, transparent 72%)",
              }
            : variant === "text"
              ? {
                  width: 72,
                  height: 72,
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(56,189,248,0.12) 42%, transparent 74%)",
                }
              : {
                  width: 120,
                  height: 120,
                  background:
                    "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.08) 32%, transparent 72%)",
                }
        }
        transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.45 }}
        style={{
          x: trailX,
          y: trailY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
