"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "recording" | "paused" | "done";

// Target portrait dimensions
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
 * Draw the camera stream onto a portrait canvas, cropping to 9:16.
 * This is the only reliable way to guarantee portrait output on desktop
 * webcams, which are physically landscape sensors and ignore height/width
 * constraints in getUserMedia.
 */
function startPortraitCanvas(
  videoEl: HTMLVideoElement,
  canvas: HTMLCanvasElement
): () => void {
  const ctx = canvas.getContext("2d")!;
  canvas.width  = TARGET_W;
  canvas.height = TARGET_H;

  let rafId = 0;

  function draw() {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (vw > 0 && vh > 0) {
      // Centre-crop the video to 9:16
      // Source aspect: vw/vh. Target aspect: 9/16 = 0.5625
      const targetAspect = TARGET_W / TARGET_H;
      const srcAspect    = vw / vh;

      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (srcAspect > targetAspect) {
        // Source is wider than target → crop sides
        sw = vh * targetAspect;
        sx = (vw - sw) / 2;
      } else {
        // Source is taller than target → crop top/bottom
        sh = vw / targetAspect;
        sy = (vh - sh) / 2;
      }
      ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
    }
    rafId = requestAnimationFrame(draw);
  }

  draw();
  return () => cancelAnimationFrame(rafId);
}

export function useCamera() {
  const streamRef        = useRef<MediaStream | null>(null);
  const canvasRef        = useRef<HTMLCanvasElement | null>(null);
  const canvasStreamRef  = useRef<MediaStream | null>(null);
  const videoElRef       = useRef<HTMLVideoElement | null>(null);
  const stopCanvasRef    = useRef<(() => void) | null>(null);
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
          facingMode: "user",
          // Request portrait — mobile honours this, desktop ignores it.
          // The canvas re-encoder below ensures portrait output on all devices.
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
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop());
    canvasStreamRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /**
   * Call this after the <video> element mounts and the stream is attached.
   * Sets up the portrait canvas encoder and prepares the canvas stream for
   * MediaRecorder. The raw camera stream is still shown in the preview <video>.
   */
  const initPortraitEncoder = useCallback((videoEl: HTMLVideoElement) => {
    videoElRef.current = videoEl;

    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;

    // Wait until video has dimensions before starting the draw loop
    const tryStart = () => {
      if (videoEl.videoWidth > 0) {
        stopCanvasRef.current = startPortraitCanvas(videoEl, canvas);

        // Capture the canvas as a stream (30fps ceiling — canvas is CPU bound)
        const fps          = 30;
        const canvasStream = canvas.captureStream(fps);

        // Re-attach original audio tracks from camera stream
        streamRef.current?.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
        canvasStreamRef.current = canvasStream;
      } else {
        // Video not ready yet — retry on next frame
        requestAnimationFrame(tryStart);
      }
    };
    requestAnimationFrame(tryStart);
  }, []);

  const startRecording = useCallback(() => {
    // Prefer the portrait canvas stream; fall back to raw stream
    const recordStream = canvasStreamRef.current ?? streamRef.current;
    if (!recordStream) return;
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
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setLastBlob(blob);
      setRecordingState("done");
    };

    recorder.start(100);
    setRecordingState("recording");
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
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

  /**
   * Save the recording.
   * Priority order:
   *   1. Web Share API with File (mobile — lets user pick gallery, Drive, etc.)
   *   2. File System Access API showSaveFilePicker (desktop Chrome/Edge — native save dialog)
   *   3. <a download> fallback (all other browsers)
   */
  const downloadRecording = useCallback(async (filename = "reelprompt-recording") => {
    if (!lastBlob) return;

    const ext      = mimeTypeRef.current.includes("mp4") ? "mp4" : "webm";
    const fullName = `${filename}.${ext}`;

    // 1. Web Share API — mobile: user picks destination (gallery, Drive, AirDrop, etc.)
    if (navigator.canShare) {
      const file = new File([lastBlob], fullName, { type: lastBlob.type });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename });
          return;
        } catch (err) {
          // User cancelled share — don't fall through, that's intentional
          if ((err as Error).name === "AbortError") return;
          // Other error — fall through to next method
        }
      }
    }

    // 2. File System Access API — desktop Chrome/Edge: shows native "Save as" dialog
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await (window as Window & { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: fullName,
          types: [{
            description: "Video file",
            accept: { [lastBlob.type]: [`.${ext}`] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(lastBlob);
        await writable.close();
        return;
      } catch (err) {
        // User cancelled — don't fall through
        if ((err as Error).name === "AbortError") return;
        // API not available or other error — fall through
      }
    }

    // 3. <a download> fallback — browser decides where to save
    const url = URL.createObjectURL(lastBlob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = fullName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [lastBlob]);

  const resetRecording = useCallback(() => {
    chunksRef.current = [];
    setLastBlob(null);
    setRecordingState("idle");
    setRecordingTime(0);
  }, []);

  // Cleanup on unmount
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
