"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { fixVideoBlob } from "../lib/fixVideoRotation";

export type RecordingState = "idle" | "recording" | "paused" | "done" | "fixing";

const TARGET_W = 1080;
const TARGET_H = 1920;

function pickMimeType(): string {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

/**
 * Draw the camera stream onto a 1080×1920 canvas, centre-cropped to 9:16.
 *
 * Mobile quirk: some Android browsers (Chrome, Samsung Internet) report
 * videoWidth/videoHeight as the physical sensor dimensions even when the
 * stream is displayed portrait — because rotation is encoded as metadata,
 * not as pixel layout. We detect this case by checking whether the stream
 * track's getSettings() reports width > height, and if the rendered video
 * preview appears portrait (el.clientHeight > el.clientWidth), we swap the
 * draw coordinates to compensate.
 *
 * Returns a cleanup function that cancels the animation loop.
 */
function startPortraitCanvas(
  videoEl: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  stream: MediaStream,
  getZoom: () => number
): () => void {
  const ctx = canvas.getContext("2d")!;
  canvas.width  = TARGET_W;
  canvas.height = TARGET_H;

  const track            = stream.getVideoTracks()[0];
  const settings         = track?.getSettings() ?? {};
  const trackW           = settings.width  ?? videoEl.videoWidth;
  const trackH           = settings.height ?? videoEl.videoHeight;
  const trackIsLandscape = trackW > trackH;
  const previewIsPortrait = videoEl.clientHeight > videoEl.clientWidth;
  const needsSwap        = trackIsLandscape && previewIsPortrait;

  let rafId = 0;

  function draw() {
    let vw = videoEl.videoWidth;
    let vh = videoEl.videoHeight;

    if (vw > 0 && vh > 0) {
      if (needsSwap) { [vw, vh] = [vh, vw]; }

      const targetAspect = TARGET_W / TARGET_H; // 0.5625 — portrait 9:16
      const srcAspect    = vw / vh;

      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (srcAspect > targetAspect) {
        // Source wider than 9:16 → crop sides
        sw = vh * targetAspect;
        sx = (vw - sw) / 2;
      } else {
        // Source taller than 9:16 → crop top/bottom
        sh = vw / targetAspect;
        sy = (vh - sh) / 2;
      }

      // Apply zoom: > 1.0 zooms in (smaller crop), < 1.0 zooms out (larger crop).
      // Clamp so we never exceed the actual source dimensions.
      const zoom = Math.min(Math.max(0.1, getZoom()), 4.0);
      const zoomedSw = Math.min(sw / zoom, vw);
      const zoomedSh = Math.min(sh / zoom, vh);
      sx += (sw - zoomedSw) / 2;
      sy += (sh - zoomedSh) / 2;
      sx = Math.max(0, sx);
      sy = Math.max(0, sy);
      sw = zoomedSw;
      sh = zoomedSh;

      if (needsSwap) {
        ctx.save();
        ctx.translate(TARGET_W / 2, TARGET_H / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(
          videoEl,
          sy, sx, sh, sw,
          -TARGET_H / 2, -TARGET_W / 2, TARGET_H, TARGET_W
        );
        ctx.restore();
      } else {
        ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
      }
    }
    rafId = requestAnimationFrame(draw);
  }

  draw();
  return () => cancelAnimationFrame(rafId);
}

export function useCamera() {
  const streamRef        = useRef<MediaStream | null>(null);
  const zoomRef          = useRef<number>(1);
  // canvasRef is now exported so TeleprompterView can use it as the preview element.
  // The user sees exactly what gets recorded — no crop discrepancy possible.
  const canvasRef        = useRef<HTMLCanvasElement | null>(null);
  const canvasStreamRef  = useRef<MediaStream | null>(null);
  const videoElRef       = useRef<HTMLVideoElement | null>(null);
  const stopCanvasRef    = useRef<(() => void) | null>(null);
  const encoderReadyRef  = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const mimeTypeRef      = useRef<string>("");
  const timerRef         = useRef<NodeJS.Timeout | null>(null);

  const [hasPermission, setHasPermission]   = useState<boolean | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime]   = useState(0);
  const [lastBlob, setLastBlob]             = useState<Blob | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode:  "user",
          width:       { ideal: TARGET_W },
          height:      { ideal: TARGET_H },
          aspectRatio: { ideal: 9 / 16 },
          frameRate:   { ideal: 60, min: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: { ideal: 48000 },
        },
      });
      streamRef.current = stream;
      setHasPermission(true);
      return stream;
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopCanvasRef.current?.();
    stopCanvasRef.current = null;
    encoderReadyRef.current = false;
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop());
    canvasStreamRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    canvasRef.current = null;
  }, []);

  /**
   * Initialise the portrait canvas encoder.
   * Called from TeleprompterView once the <video> element is playing.
   *
   * The canvas is created here (off-DOM) and exposed via canvasRef so that
   * TeleprompterView can attach it to the DOM as the visible preview.
   * This guarantees that what the user sees is pixel-identical to what
   * the MediaRecorder encodes — no CSS-vs-canvas crop discrepancy.
   */
  const initPortraitEncoder = useCallback((videoEl: HTMLVideoElement) => {
    videoElRef.current = videoEl;
    encoderReadyRef.current = false;

    const setup = () => {
      if (!streamRef.current) return;

      const poll = () => {
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          const canvas = document.createElement("canvas");
          canvasRef.current = canvas;

          stopCanvasRef.current = startPortraitCanvas(videoEl, canvas, streamRef.current!, () => zoomRef.current);

          const canvasStream = canvas.captureStream(30);
          streamRef.current!.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
          canvasStreamRef.current = canvasStream;
          encoderReadyRef.current = true;
        } else {
          requestAnimationFrame(poll);
        }
      };
      requestAnimationFrame(poll);
    };

    if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
      setup();
    } else {
      videoEl.onplay = () => { setup(); videoEl.onplay = null; };
    }
  }, []);

  /**
   * Start recording. If the canvas encoder isn't ready yet (can happen on
   * very slow devices within the 3s countdown) we wait up to 2s then fall
   * back to the raw stream.
   */
  const startRecording = useCallback(() => {
    const begin = (recordStream: MediaStream) => {
      chunksRef.current = [];
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(recordStream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
        audioBitsPerSecond: 128_000,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const rawBlob = new Blob(chunksRef.current, { type: mimeType });

        // Show "fixing" state so the UI can display a spinner while mp4box
        // remuxes the file. On fast devices this takes < 500 ms.
        setRecordingState("fixing");

        try {
          const fixedBlob = await fixVideoBlob(rawBlob);
          setLastBlob(fixedBlob);
        } catch {
          // Repair failed — hand the user the raw blob anyway
          setLastBlob(rawBlob);
        }

        setRecordingState("done");
      };

      recorder.start(100);
      setRecordingState("recording");
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    };

    if (encoderReadyRef.current && canvasStreamRef.current) {
      begin(canvasStreamRef.current);
      return;
    }

    const deadline = Date.now() + 2000;
    const wait = () => {
      if (encoderReadyRef.current && canvasStreamRef.current) {
        begin(canvasStreamRef.current);
      } else if (Date.now() < deadline) {
        setTimeout(wait, 50);
      } else {
        if (streamRef.current) begin(streamRef.current);
      }
    };
    wait();
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const downloadRecording = useCallback(async (filename = "reelprompt-recording") => {
    if (!lastBlob) return;

    const ext      = mimeTypeRef.current.includes("mp4") ? "mp4" : "webm";
    const fullName = `${filename}.${ext}`;

    // Direct download via <a> — works on both desktop and mobile.
    // No Share API, no FilePicker — user always gets the file in Downloads.
    const url = URL.createObjectURL(lastBlob);
    const a   = document.createElement("a");
    a.href = url; a.download = fullName; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [lastBlob]);

  const resetRecording = useCallback(() => {
    chunksRef.current = [];
    setLastBlob(null);
    setRecordingState("idle");
    setRecordingTime(0);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopCamera();
  }, [stopCamera]);

  return {
    hasPermission,
    recordingState,
    recordingTime,
    lastBlob,
    streamRef,
    // Exposed so TeleprompterView can render the canvas as the preview.
    // What the user sees == what gets recorded. No crop discrepancy.
    canvasRef,
    zoomRef,
    startCamera,
    stopCamera,
    initPortraitEncoder,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadRecording,
    resetRecording,
  };
}
