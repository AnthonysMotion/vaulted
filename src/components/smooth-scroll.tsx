"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const resizeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.085,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;

    const scheduleResize = () => {
      if (resizeFrameRef.current !== null) return;
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        lenis.resize();
      });
    };

    const handleResize = () => {
      scheduleResize();
    };
    const resizeObserver = new ResizeObserver(() => {
      scheduleResize();
    });
    const mutationObserver = new MutationObserver(() => {
      scheduleResize();
    });

    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener("resize", handleResize);

    return () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    const frame = requestAnimationFrame(() => {
      lenis.resize();
    });
    const timeout = window.setTimeout(() => {
      lenis.resize();
    }, 250);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}
