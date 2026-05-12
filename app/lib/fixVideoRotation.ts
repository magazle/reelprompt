/**
 * fixVideoRotation.ts
 *
 * Patches the rotation metadata in an MP4 blob produced by MediaRecorder
 * on Android Chromium, which incorrectly writes rotation:90 in the tkhd
 * matrix even when the canvas pixels are already portrait-correct.
 *
 * Approach: parse the blob with mp4box.js, zero the tkhd matrix on all
 * video tracks, then serialise back to ArrayBuffer. The media data (mdat)
 * and codec config (avcC) are preserved exactly — no remux, no re-encode.
 *
 * Note: this does NOT fix fragmented MP4 (fMP4) gallery compatibility.
 * That requires a full remux which risks codec config loss (as proven).
 * Android Gallery compat is handled separately by keeping WebM on Android.
 */

import * as MP4Box from "mp4box";

/** Identity matrix — no rotation, no scale. */
const IDENTITY_MATRIX = [
  0x00010000, 0, 0,
  0, 0x00010000, 0,
  0, 0, 0x40000000,
];

/**
 * Patches rotation metadata in an MP4 blob.
 * Returns the fixed blob, or the original blob on any error.
 * Non-MP4 blobs are returned as-is.
 */
export async function fixVideoBlob(blob: Blob): Promise<Blob> {
  if (!blob.type.includes("mp4")) return blob;

  try {
    const arrayBuffer = await blob.arrayBuffer();

    // ── Parse ──────────────────────────────────────────────────────────────
    const file = MP4Box.createFile();

    const ready = new Promise<void>((resolve, reject) => {
      file.onReady = () => resolve();
      file.onError = (module: string, message: string) =>
        reject(new Error(`mp4box ${module}: ${message}`));
    });

    const buf = arrayBuffer as ArrayBuffer & { fileStart: number };
    buf.fileStart = 0;
    file.appendBuffer(buf);
    file.flush();

    await ready;

    // ── Patch tkhd matrix on all video tracks ──────────────────────────────
    const moov = (file as unknown as {
      moov?: {
        traks?: Array<{
          tkhd?: { matrix: number[] };
          mdia?: { hdlr?: { handler?: string } };
        }>;
      };
    }).moov;

    if (!moov?.traks) return blob; // no tracks — nothing to patch

    let patched = false;
    for (const trak of moov.traks) {
      if (trak.mdia?.hdlr?.handler === "vide" && trak.tkhd) {
        trak.tkhd.matrix = [...IDENTITY_MATRIX];
        patched = true;
      }
    }

    if (!patched) return blob; // no video track found — return as-is

    // ── Serialise back ──────────────────────────────────────────────────────
    const { DataStream } = MP4Box;
    const stream = new DataStream();
    (stream as unknown as { isofile: unknown }).isofile = file;
    file.write(stream as unknown as Parameters<typeof file.write>[0]);

    const outBuffer: ArrayBuffer = stream.buffer as unknown as ArrayBuffer;
    if (!outBuffer || outBuffer.byteLength < 100) {
      console.warn("[fixVideoRotation] Output too small, returning original");
      return blob;
    }

    return new Blob([outBuffer], { type: "video/mp4" });
  } catch (err) {
    console.error("[fixVideoRotation] Failed, returning original:", err);
    return blob;
  }
}
