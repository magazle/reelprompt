"use client";
import { useRef, useCallback, useState, useEffect } from "react";

export function useTeleprompterScroll(speed: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Speed: 1-10 → pixels per second: 20-200
  const pxPerSecond = speed * 20;

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (!containerRef.current) return;
    setIsPlaying(true);
    setIsFinished(false);

    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (!containerRef.current) return;
      if (lastTime === null) lastTime = now;
      const delta = (now - lastTime) / 1000; // seconds
      lastTime = now;

      const el = containerRef.current;
      const newScrollTop = el.scrollTop + pxPerSecond * delta;
      const maxScroll = el.scrollHeight - el.clientHeight;

      if (newScrollTop >= maxScroll) {
        el.scrollTop = maxScroll;
        stop();
        setIsFinished(true);
        return;
      }

      el.scrollTop = newScrollTop;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [pxPerSecond, stop]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      start();
    }
  }, [isPlaying, pause, start]);

  const reset = useCallback(() => {
    stop();
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setIsFinished(false);
  }, [stop]);

  // Restart when speed changes while playing
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    if (isPlayingRef.current) {
      stop();
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { containerRef, isPlaying, isFinished, start, pause, stop, toggle, reset };
}
