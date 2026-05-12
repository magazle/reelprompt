/**
 * fixVideoRotation.ts
 *
 * Two-stage post-processing for MP4 blobs from MediaRecorder on Android:
 *
 * Stage 1 — Binary rotation patch (instant, zero deps):
 *   Scans the ArrayBuffer for tkhd boxes and overwrites the transformation
 *   matrix with the identity matrix. Fixes the rotation:90 metadata that
 *   Android Chromium writes even when canvas pixels are portrait-correct.
 *
 * Stage 2 — FFmpeg.wasm remux (async, ~2-5s, fixes gallery/WhatsApp compat):
 *   MediaRecorder on Android produces fragmented MP4 (fMP4). Players like
 *   Android Gallery and WhatsApp expect a standard MP4 with moov before mdat.
 *   FFmpeg remuxes the container without re-encoding (copy codec), producing
 *   a universally compatible MP4.
 *
 * FFmpeg core is loaded from unpkg CDN on first use and cached by the browser.
 * Single-thread build is used (no SharedArrayBuffer requirement).
 */

// ── Stage 1: binary tkhd patch ────────────────────────────────────────────

const TKHD_MATRIX_OFFSET_V0 = 52;
const TKHD_MATRIX_OFFSET_V1 = 68;

const IDENTITY_MATRIX = new Int32Array([
  0x00010000, 0, 0,
  0, 0x00010000, 0,
  0, 0, 0x40000000,
]);

function findBoxOffsets(view: DataView, fourcc: string): number[] {
  const [a, b, c, d] = [0, 1, 2, 3].map((i) => fourcc.charCodeAt(i));
  const offsets: number[] = [];
  for (let i = 0; i < view.byteLength - 8; i++) {
    if (
      view.getUint8(i + 4) === a &&
      view.getUint8(i + 5) === b &&
      view.getUint8(i + 6) === c &&
      view.getUint8(i + 7) === d
    ) {
      const size = view.getUint32(i, false);
      if (size >= 8 && i + size <= view.byteLength) offsets.push(i);
    }
  }
  return offsets;
}

function patchTkhdRotation(buffer: ArrayBuffer): ArrayBuffer {
  const copy = buffer.slice(0);
  const view = new DataView(copy);
  for (const offset of findBoxOffsets(view, "tkhd")) {
    const version = view.getUint8(offset + 8);
    const matrixOffset = offset + (version === 1 ? TKHD_MATRIX_OFFSET_V1 : TKHD_MATRIX_OFFSET_V0);
    if (matrixOffset + 36 > copy.byteLength) continue;
    for (let i = 0; i < 9; i++) {
      view.setInt32(matrixOffset + i * 4, IDENTITY_MATRIX[i], false);
    }
  }
  return copy;
}

// ── Stage 2: FFmpeg.wasm remux ────────────────────────────────────────────

// Lazy singleton — loaded once, reused across calls
let ffmpegInstance: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
let ffmpegLoading: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFFmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile } = await import("@ffmpeg/util");
    void fetchFile; // imported for side effects / tree-shake safety

    const ff = new FFmpeg();
    // Single-thread core — no SharedArrayBuffer required, works on all origins
    await ff.load({
      coreURL: "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd/ffmpeg-core.js",
      wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd/ffmpeg-core.wasm",
    });
    ffmpegInstance = ff;
    return ff;
  })();

  return ffmpegLoading;
}

async function remuxWithFFmpeg(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ff = await getFFmpeg();

  const inputData = await fetchFile(new Blob([buffer], { type: "video/mp4" }));
  await ff.writeFile("input.mp4", inputData);

  // -c copy: no re-encode, just remux
  // -movflags +faststart: puts moov before mdat (required for streaming/WhatsApp)
  const ret = await ff.exec([
    "-i", "input.mp4",
    "-c", "copy",
    "-movflags", "+faststart",
    "output.mp4",
  ]);

  if (ret !== 0) throw new Error(`FFmpeg exited with code ${ret}`);

  const data = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile("input.mp4");
  await ff.deleteFile("output.mp4");

  return data.buffer as ArrayBuffer;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Fixes rotation metadata and remuxes the MP4 to standard container format.
 * Returns the fixed blob. On any error returns the original blob unchanged.
 */
export async function fixVideoBlob(blob: Blob): Promise<Blob> {
  if (!blob.type.includes("mp4")) return blob;

  try {
    const raw = await blob.arrayBuffer();

    // Stage 1: patch rotation metadata (instant)
    const rotationFixed = patchTkhdRotation(raw);

    // Stage 2: remux via FFmpeg (fixes gallery/WhatsApp compat)
    const remuxed = await remuxWithFFmpeg(rotationFixed);

    return new Blob([remuxed], { type: "video/mp4" });
  } catch (err) {
    console.error("[fixVideoRotation] Failed, returning original:", err);
    // Still try to return at least the rotation-fixed version
    try {
      const raw = await blob.arrayBuffer();
      return new Blob([patchTkhdRotation(raw)], { type: "video/mp4" });
    } catch {
      return blob;
    }
  }
}
