"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Script, TeleprompterSettings } from "../lib/types";
import { useCamera } from "../hooks/useCamera";
import { useTeleprompterScroll } from "../hooks/useTeleprompterScroll";
import { useWakeLock } from "../hooks/useWakeLock";
import { saveSettings } from "../lib/storage";
import SettingsPanel from "./SettingsPanel";
import {
  IconBack, IconSettings, IconPlay, IconPause, IconRecord,
  IconStop, IconDownload, IconReset, IconMirror
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
  const wake = useWakeLock();
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-hide controls
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

  // Start camera on mount
  useEffect(() => {
    camera.startCamera().then(() => {
      if (videoRef.current && camera.streamRef.current) {
        videoRef.current.srcObject = camera.streamRef.current;
      }
    });
    wake.acquire();
    return () => {
      camera.stopCamera();
      scroll.stop();
      wake.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync video ref
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && camera.streamRef.current) {
      el.srcObject = camera.streamRef.current;
    }
  }, [camera.streamRef]);

  const handleTap = useCallback(() => {
    resetControlsTimer();
    if (!showControls) {
      setShowControls(true);
      return;
    }
    scroll.toggle();
  }, [showControls, scroll, resetControlsTimer]);

  const handleStartRecording = () => {
    camera.startRecording();
    scroll.start();
    resetControlsTimer();
  };

  const handleStopRecording = () => {
    camera.stopRecording();
    scroll.pause();
    setShowControls(true);
  };

  const handleSettingsChange = (s: TeleprompterSettings) => {
    onSettingsChange(s);
    saveSettings(s);
  };

  // Teleprompter position
  const justifyContent =
    settings.position === "top" ? "flex-start"
    : settings.position === "bottom" ? "flex-end"
    : "center";

  const isRecording = camera.recordingState === "recording";
  const isPaused = camera.recordingState === "paused";
  const isDone = camera.recordingState === "done";
  const isIdle = camera.recordingState === "idle";

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "#000",
        overflow: "hidden", userSelect: "none", WebkitUserSelect: "none"
      }}
      onClick={handleTap}
    >
      {/* ── CAMERA LAYER (raw preview, never recorded onto) ── */}
      {camera.hasPermission !== false && (
        <video
          ref={attachVideo}
          autoPlay
          playsInline
          muted
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            transform: settings.mirrorVideo ? "scaleX(-1)" : "none",
            zIndex: 0
          }}
        />
      )}

      {/* No permission state */}
      {camera.hasPermission === false && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 1, padding: 32
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
          <p style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
            Camera access needed
          </p>
          <p style={{ fontSize: 14, color: "var(--text-2)", textAlign: "center" }}>
            Please allow camera and microphone access to use ReelPrompt.
          </p>
        </div>
      )}

      {/* ── TELEPROMPTER OVERLAY (UI layer only — never in recording) ── */}
      {!isDone && (
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", justifyContent,
            zIndex: 10,
            pointerEvents: "none"
          }}
        >
          {/* Focus indicator line */}
          <div
            className="focus-line"
            style={{
              position: "absolute", left: 0, right: 0,
              top: "35%", height: "30%",
              pointerEvents: "none"
            }}
          />

          {/* Scrolling text */}
          <div
            ref={scroll.containerRef}
            className="prompt-fade"
            style={{
              overflow: "hidden",
              maxHeight: "70vh",
              padding: "80px 0",
              pointerEvents: "none"
            }}
          >
            <div
              style={{
                width: `${settings.textWidth}%`,
                margin: "0 auto",
                fontSize: settings.fontSize,
                lineHeight: settings.lineSpacing,
                color: "white",
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                textShadow: "0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.8)",
                transform: settings.mirrorText ? "scaleX(-1)" : "none",
                paddingBottom: "40vh",
                wordBreak: "break-word"
              }}
            >
              {script.body}
            </div>
          </div>
        </div>
      )}

      {/* ── POST-RECORDING EXPORT SCREEN ── */}
      {isDone && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          background: "rgba(0,0,0,0.92)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 32, gap: 20
        }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(48,209,88,0.15)",
            border: "2px solid var(--green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, marginBottom: 8
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center" }}>
            Recording complete
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-2)", textAlign: "center" }}>
            Your clean video is ready — no text overlay, just you.
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
              onClick={() => {
                camera.resetRecording();
                scroll.reset();
                camera.startCamera();
              }}
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

      {/* ── CONTROLS OVERLAY ── */}
      {!isDone && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 30,
            transition: "opacity 0.3s",
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? "auto" : "none"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)"
          }}>
            <button className="btn btn-icon" onClick={onBack}
              style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}>
              <IconBack />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Recording indicator */}
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="rec-pulse" style={{
                    width: 8, height: 8, borderRadius: "50%", background: "var(--accent)"
                  }} />
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 13,
                    color: "white", letterSpacing: "0.05em"
                  }}>
                    {formatTime(camera.recordingTime)}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-icon"
                style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}
                onClick={() => onSettingsChange({ ...settings, mirrorVideo: !settings.mirrorVideo })}
                title="Mirror video"
              >
                <IconMirror />
              </button>
              <button className="btn btn-icon"
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
            padding: "32px 32px 48px",
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 20
          }}>
            {/* Scroll controls (when not recording or paused) */}
            {(isIdle || scroll.isFinished) && (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                  className="btn btn-icon"
                  style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "white", width: 44, height: 44 }}
                  onClick={scroll.reset}
                >
                  <IconReset />
                </button>
                <button
                  style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)",
                    color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  onClick={scroll.toggle}
                >
                  {scroll.isPlaying ? <IconPause size={22} /> : <IconPlay size={22} />}
                </button>
                <div style={{ width: 44 }} />
              </div>
            )}

            {/* Main record/stop button */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {isIdle && (
                <button
                  onClick={handleStartRecording}
                  style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "transparent",
                    border: "3px solid white",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "var(--accent)"
                  }} />
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
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    {scroll.isPlaying ? <IconPause size={18} /> : <IconPlay size={18} />}
                  </button>

                  <button
                    onClick={handleStopRecording}
                    style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "transparent",
                      border: "3px solid white",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: "var(--accent)"
                    }} />
                  </button>

                  <button
                    onClick={() => {
                      if (isRecording) { camera.pauseRecording(); scroll.pause(); }
                      else { camera.resumeRecording(); scroll.start(); }
                    }}
                    style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)",
                      color: "white", cursor: "pointer", fontSize: 13,
                      fontWeight: 700, fontFamily: "var(--font-mono)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    {isRecording ? "II" : "▶"}
                  </button>
                </>
              )}
            </div>

            {/* Speed control */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(0,0,0,0.4)", borderRadius: 20,
              padding: "10px 20px", backdropFilter: "blur(8px)"
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>SPEED</span>
              <input
                type="range" min={1} max={10} step={0.5} value={settings.speed}
                onChange={(e) => {
                  const s = { ...settings, speed: Number(e.target.value) };
                  onSettingsChange(s);
                  saveSettings(s);
                }}
                style={{ width: 120, accentColor: "var(--accent)", height: 3 }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)", width: 24 }}>
                {settings.speed}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div onClick={(e) => e.stopPropagation()}>
          <SettingsPanel
            settings={settings}
            onChange={handleSettingsChange}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
    </div>
  );
}
