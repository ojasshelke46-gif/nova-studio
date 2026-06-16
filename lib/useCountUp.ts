"use client";

import { useEffect, useRef, useState } from "react";

// easeOutQuart
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.round(easeOutQuart(progress) * target));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [start, target, duration]);

  return value;
}
