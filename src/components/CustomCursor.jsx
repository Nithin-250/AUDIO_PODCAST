import React, { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const speed = 0.18; // smoothing for the ring

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      // dot snaps to cursor
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
      }
    };

    const animate = () => {
      x += (tx - x) * speed;
      y += (ty - y) * speed;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
      raf = requestAnimationFrame(animate);
    };

    let raf = requestAnimationFrame(animate);
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  // Hide on touch devices
  const isTouch = typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if (isTouch) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed z-[60] top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-fuchsia-400/70 shadow-[0_0_60px_rgba(236,72,153,0.45)] backdrop-blur-sm"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed z-[61] top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)]"
      />
    </>
  );
}
