"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "recording" | "paused" | "done";

const TARGET_W = 1080;
const TARGET_H = 1920;

function pickMimeType(): string {
  const isAndroid = /android/i.test(navigator.userAgent);

  const androidCandidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  const desktopCandidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  const candidates = isAndroid ? androidCandidates : desktopCandidates;
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

/**
 * Draw the camera stream onto a canvas, centre-cropped to 9:16.
 *
 * Android/WebM: WebM does not add rotation metadata, so we draw portrait
 * directly (1080x1920) — no pre-rotation needed.
 *
 * Desktop/MP4: draw portrait (1080x1920) directly with avc1.
 *
 * Non-Android browsers that report landscape dimensions for a portrait stream
 * (metadata-rotation quirk): detect via track settings vs clientHeight.
 */
function startPortraitCanvas(
  videoEl: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  stream: MediaStream
): () => void {
  const ctx = canvas.getContext("2d")!;

  // Always draw portrait canvas — WebM on Android doesn't add rotation metadata
  canvas.width  = TARGET_W; // 1080
  canvas.height = TARGET_H; // 1920

  const track            = stream.getVideoTracks()[0];
  const settings         = track?.getSettings() ?? {};
  const trackW           = settings.width  ?? videoEl.videoWidth;
  const trackH           = settings.height ?? videoEl.videoHeight;
  const trackIsLandscape = trackW > trackH;
  const previewIsPortrait = videoEl.clientHeight > videoEl.clientWidth;
  const needsSwap = trackIsLandscape && previewIsPortrait;

  let rafId = 0;

  function draw() {
    let vw = videoEl.videoWidth;
    let vh = videoEl.videoHeight;

    if (vw > 0 && vh > 0) {
      if (needsSwap) { [vw, vh] = [vh, vw]; }

      const targetAspect = TARGET_W / TARGET_H;
      const srcAspect    = vw / vh;

      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (srcAspect > targetAspect) {
        sw = vh * targetAspect;
        sx = (vw - sw) / 2;
      } else {
        sh = vw / targetAspect;
        sy = (vh - sh) / 2;
      }

      if (needsSwap) {
        ctx.save();
        ctx.translate(TARGET_W / 2, TARGET_H / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(videoEl, sy, sx, sh, sw, -TARGET_H / 2, -TARGET_W / 2, TARGET_H, TARGET_W);
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
  const streamRef           = useRef<MediaStream | null>(null);
  const canvasRef           = useRef<HTMLCanvasElement | null>(null);
  const canvasStreamRef     = useRef<MediaStream | null>(null);
  const videoElRef          = useRef<HTMLVideoElement | null>(null);
  const stopCanvasRef       = useRef<(() => void) | null>(null);
  const encoderReadyRef     = useRef(false);
  const mediaRecorderRef    = useRef<MediaRecorder | null>(null);
  const chunksRef           = useRef<Blob[]>([]);
  const mimeTypeRef         = useRef<string>("");
  const timerRef            = useRef<NodeJS.Timeout | null>(null);

  const [hasPermission, setHasPermission]   = useState<boolean | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime]   = useState(0);
  const [lastBlob, setLastBlob]             = useState<Blob | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
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
  }, []);

  const initPortraitEncoder = useCallback((videoEl: HTMLVideoElement) => {
    videoElRef.current = videoEl;
    encoderReadyRef.current = false;

    const setup = () => {
      if (!streamRef.current) return;

      const poll = () => {
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          const canvas = document.createElement("canvas");
          canvasRef.current = canvas;

          stopCanvasRef.current = startPortraitCanvas(videoEl, canvas, streamRef.current!);

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
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setLastBlob(blob);
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

    if (navigator.canShare) {
      const file = new File([lastBlob], fullName, { type: lastBlob.type });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename });
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      }
    }

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await (window as Window & {
          showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>
        }).showSaveFilePicker({
          suggestedName: fullName,
          types: [{ description: "Video file", accept: { [lastBlob.type]: [`.${ext}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(lastBlob);
        await writable.close();
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

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
