"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Script, TeleprompterSettings } from "../lib/types";
import { useCamera } from "../hooks/useCamera";
import { useTeleprompterScroll } from "../hooks/useTeleprompterScroll";
import { useWakeLock } from "../hooks/useWakeLock";
import SettingsPanel from "./SettingsPanel";
import {
  IconBack, IconSettings, IconPlay, IconPause,
  IconDownload, IconReset, IconMirror,
} from "./Icons";

interface Props {
  script: Script;
  settings: TeleprompterSettings;
  onSettingsChange: (s: TeleprompterSettings) => void;
  onBack: () => void;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function TeleprompterView({ script, settings, onSettingsChange, onBack }: Props) {
  const camera = useCamera();
  const scroll = useTeleprompterScroll(settings.speed);
  const wake   = useWakeLock();

  const [showSettings, setShowSettings]     = useState(false);
  const [showControls, setShowControls]     = useState(true);
  const [countdown, setCountdown]           = useState<number | null>(null);
  const [showHint, setShowHint]             = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Progress tracking ──
  useEffect(() => {
    const el = scroll.containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? el.scrollTop / max : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scroll.containerRef]);

  // ── Hint auto-hide ──
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // ── Auto-hide controls during recording ──
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (camera.recordingState === "recording") {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [camera.recordingState]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [camera.recordingState, resetControlsTimer]);

  // ── Keyboard shortcuts (desktop) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSettings) return;
      if (e.key === " ") { e.preventDefault(); scroll.toggle(); resetControlsTimer(); }
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSettings, scroll, onBack, resetControlsTimer]);

  // ── Start camera on mount ──
  useEffect(() => {
    camera.startCamera();
    wake.acquire();
    return () => { camera.stopCamera(); scroll.stop(); wake.release(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref callback: attaches the camera stream whenever the video element mounts.
  // Covers both the case where the element mounts before the stream is ready
  // (handled here) and after (camera.startCamera sets srcObject on the stream).
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el && camera.streamRef.current) el.srcObject = camera.streamRef.current;
  }, [camera.streamRef]);

  // ── Tap to scroll / reveal controls ──
  const handleTap = useCallback(() => {
    if (countdown !== null) return;
    setShowHint(false);
    resetControlsTimer();
    if (!showControls) { setShowControls(true); return; }
    scroll.toggle();
  }, [countdown, showControls, scroll, resetControlsTimer]);

  // ── 3-2-1 countdown then record ──
  const handleStartWithCountdown = useCallback(() => {
    setShowHint(false);
    let count = 3;
    setCountdown(count);
    const iv = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(iv);
        setCountdown(null);
        camera.startRecording();
        scroll.start();
        resetControlsTimer();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [camera, scroll, resetControlsTimer]);

  const handleStopRecording = () => {
    camera.stopRecording();
    scroll.pause();
    setShowControls(true);
  };

  // Settings persistence is handled centrally in page.tsx handleSettingsChange.
  const handleSettingsChange = (s: TeleprompterSettings) => {
    onSettingsChange(s);
  };

  // ── Derived state ──
  const isRecording = camera.recordingState === "recording";
  const isPaused    = camera.recordingState === "paused";
  const isDone      = camera.recordingState === "done";
  const isIdle      = camera.recordingState === "idle";

  const justifyContent =
    settings.position === "top"    ? "flex-start" :
    settings.position === "bottom" ? "flex-end"   : "center";

  const promptFont = settings.fontStyle === "sans"
    ? "var(--font-display)"
    : "var(--font-serif)";

  const textShadow = settings.textStroke
    ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 24px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.9)"
    : "0 1px 4px rgba(0,0,0,1), 0 2px 24px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.9)";

  const textBgStyle: React.CSSProperties =
    settings.textBackground === "band"
      ? { background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 12, padding: "16px 20px", margin: "0 -8px" }
      : {};

  return (
    /* Outer shell — fills browser window, centres the 9:16 box */
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* 9:16 container */}
      <div
        style={{
          position: "relative",
          width:  "min(100vw, calc(100dvh * 9 / 16))",
          height: "min(100dvh, calc(100vw * 16 / 9))",
          background: "#000",
          overflow: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onClick={handleTap}
      >
        {/* Scroll progress bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, zIndex: 50, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: "100%",
            width: `${scrollProgress * 100}%`,
            background: isRecording ? "var(--accent)" : "rgba(255,255,255,0.5)",
            transition: "width 0.3s linear",
          }} />
        </div>

        {/* Camera preview */}
        {camera.hasPermission !== false && (
          <video ref={attachVideo} autoPlay playsInline muted style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            transform: settings.mirrorVideo ? "scaleX(-1)" : "none",
            zIndex: 0,
          }} />
        )}

        {/* No permission state */}
        {camera.hasPermission === false && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 1, padding: 32,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
            <p style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
              Camera access needed
            </p>
            <p style={{ fontSize: 14, color: "var(--text-2)", textAlign: "center" }}>
              Allow camera and microphone access to use ReelPrompt.
            </p>
          </div>
        )}

        {/* Dark overlay for "full" text background mode */}
        {settings.textBackground === "full" && !isDone && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5,
            background: "rgba(0,0,0,0.45)", pointerEvents: "none",
          }} />
        )}

        {/* 3-2-1 Countdown */}
        {countdown !== null && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 40, pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}>
            <div key={countdown} style={{
              fontSize: 120, fontFamily: "var(--font-display)", fontWeight: 800,
              color: "white", textShadow: "0 0 60px rgba(255,59,48,0.6)",
              animation: "scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}>
              {countdown}
            </div>
          </div>
        )}

        {/* Teleprompter text */}
        {!isDone && countdown === null && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
            display: "flex", flexDirection: "column", justifyContent,
          }}>
            <div className="focus-line" style={{
              position: "absolute", left: 0, right: 0, top: "35%", height: "30%", pointerEvents: "none",
            }} />
            <div
              ref={scroll.containerRef}
              className="prompt-fade"
              style={{ overflow: "hidden", maxHeight: "70%", padding: "80px 0", pointerEvents: "none" }}
            >
              <div style={{
                width: `${settings.textWidth}%`,
                margin: "0 auto",
                transform: settings.mirrorText ? "scaleX(-1)" : "none",
                paddingBottom: "40%",
              }}>
                <div
                  style={{
                    ...textBgStyle,
                    fontSize: settings.fontSize,
                    lineHeight: settings.lineSpacing,
                    color: "white",
                    fontFamily: promptFont,
                    fontStyle: settings.fontStyle === "serif" ? "italic" : "normal",
                    fontWeight: 400,
                    textShadow,
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: script.body }}
                />
              </div>
            </div>
          </div>
        )}

        {/* "Tap to begin" hint */}
        {isIdle && showHint && countdown === null && (
          <div style={{
            position: "absolute", bottom: "32%", left: 0, right: 0, zIndex: 15,
            display: "flex", justifyContent: "center",
            pointerEvents: "none", animation: "fade-in 0.5s ease forwards",
          }}>
            <div style={{
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
              borderRadius: 20, padding: "10px 20px",
              fontSize: 12, color: "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
            }}>
              TAP TO SCROLL · PRESS ● TO RECORD
            </div>
          </div>
        )}

        {/* Done / export screen */}
        {isDone && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 20,
            background: "rgba(0,0,0,0.92)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 32, gap: 20,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(48,209,88,0.15)", border: "2px solid var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, marginBottom: 8,
            }}>✓</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center" }}>Recording complete</h2>
            <p style={{ fontSize: 14, color: "var(--text-2)", textAlign: "center" }}>
              Clean video ready — no text overlay, just you.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
              <button
                className="btn btn-primary"
                style={{ width: "100%", paddingTop: 16, paddingBottom: 16, fontSize: 16, gap: 10 }}
                onClick={() => camera.downloadRecording(script.title || "reelprompt")}
              >
                <IconDownload /> Save Video
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: "100%" }}
                onClick={() => { camera.stopCamera(); camera.resetRecording(); scroll.reset(); camera.startCamera(); }}
              >
                Record Again
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: "100%", borderColor: "transparent" }}
                onClick={onBack}
              >
                Back to Scripts
              </button>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        {!isDone && (
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 30,
              transition: "opacity 0.3s",
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}>
              <button
                className="btn btn-icon"
                title="Back to editor"
                style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}
                onClick={onBack}
              >
                <IconBack />
              </button>

              {/* Recording timer */}
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="rec-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "white", letterSpacing: "0.05em" }}>
                    {formatTime(camera.recordingTime)}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-icon"
                  style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}
                  title="Mirror video"
                  onClick={() => handleSettingsChange({ ...settings, mirrorVideo: !settings.mirrorVideo })}
                >
                  <IconMirror />
                </button>
                <button
                  className="btn btn-icon"
                  title="Settings"
                  style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}
                  onClick={() => setShowSettings(true)}
                >
                  <IconSettings />
                </button>
              </div>
            </div>

            {/* Bottom controls */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "32px 24px 48px",
              background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
            }}>
              {/* Scroll play/pause (idle only) */}
              {(isIdle || scroll.isFinished) && (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button
                    className="btn btn-icon"
                    title="Restart from top"
                    style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "white", width: 44, height: 44 }}
                    onClick={scroll.reset}
                  >
                    <IconReset />
                  </button>
                  <button
                    style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)",
                      color: "white", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onClick={scroll.toggle}
                  >
                    {scroll.isPlaying ? <IconPause size={22} /> : <IconPlay size={22} />}
                  </button>
                  <div style={{ width: 44 }} />
                </div>
              )}

              {/* Record / stop / pause buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {isIdle && countdown === null && (
                  <button
                    onClick={handleStartWithCountdown}
                    style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "transparent", border: "3px solid white",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent)" }} />
                  </button>
                )}

                {(isRecording || isPaused) && (
                  <>
                    <button
                      onClick={scroll.toggle}
                      style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)",
                        color: "white", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {scroll.isPlaying ? <IconPause size={18} /> : <IconPlay size={18} />}
                    </button>

                    <button
                      onClick={handleStopRecording}
                      style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: "transparent", border: "3px solid white",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent)" }} />
                    </button>

                    <button
                      onClick={() => {
                        if (isRecording) { camera.pauseRecording(); scroll.pause(); }
                        else             { camera.resumeRecording(); scroll.start(); }
                      }}
                      style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)",
                        color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isRecording ? "II" : "▶"}
                    </button>
                  </>
                )}
              </div>

              {/* Speed slider */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(0,0,0,0.5)", borderRadius: 20,
                padding: "10px 20px", backdropFilter: "blur(8px)",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>SPEED</span>
                <input
                  type="range" min={1} max={10} step={0.5} value={settings.speed}
                  onChange={(e) => handleSettingsChange({ ...settings, speed: Number(e.target.value) })}
                  style={{ width: 120, accentColor: "var(--accent)", height: 3 }}
                />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)", width: 24 }}>
                  {settings.speed}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div onClick={(e) => e.stopPropagation()}>
            <SettingsPanel
              positionAbsolute
              settings={settings}
              onChange={handleSettingsChange}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
