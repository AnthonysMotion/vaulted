"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.085,
      wheelMultiplier: 0.95,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
