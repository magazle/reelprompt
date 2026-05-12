/**
 * fixVideoRotation.ts
 *
 * Patches the rotation metadata in an MP4 blob produced by MediaRecorder
 * on Android Chromium, which incorrectly writes rotation:90 in the tkhd
 * matrix even when the canvas pixels are already portrait-correct.
 *
 * Approach: binary patch directly on the ArrayBuffer.
 * - Scan for 'tkhd' box signatures
 * - Overwrite the 9-element transformation matrix with the identity matrix
 * - Return the patched blob
 *
 * The media data (mdat, avcC, audio) is never touched — the file size stays
 * identical and the output is always a valid MP4.
 */

// tkhd box layout (version 0):
//   4 bytes  size
//   4 bytes  'tkhd'
//   1 byte   version
//   3 bytes  flags
//   4 bytes  creation_time
//   4 bytes  modification_time
//   4 bytes  track_id
//   4 bytes  reserved
//   4 bytes  duration
//   8 bytes  reserved
//   2 bytes  layer
//   2 bytes  alternate_group
//   2 bytes  volume
//   2 bytes  reserved
//  36 bytes  matrix  ← offset 52 from box start
//   4 bytes  width
//   4 bytes  height
//
// Version 1 uses 8-byte time fields, so matrix is at offset 68.

const TKHD_MATRIX_OFFSET_V0 = 52;
const TKHD_MATRIX_OFFSET_V1 = 68;

/** Identity matrix in 16.16 fixed-point big-endian (ISO 14496-12). */
const IDENTITY_MATRIX = new Int32Array([
  0x00010000, 0, 0,
  0, 0x00010000, 0,
  0, 0, 0x40000000,
]);

/**
 * Finds all occurrences of a 4-byte FourCC in an ArrayBuffer.
 * Returns array of box-start offsets (the 4-byte size field precedes the FourCC).
 */
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
      // Sanity check: size must be plausible
      if (size >= 8 && i + size <= view.byteLength) {
        offsets.push(i);
      }
    }
  }
  return offsets;
}

/**
 * Patches all tkhd boxes in the buffer, zeroing the rotation matrix.
 * Mutates the buffer in place. Returns the number of boxes patched.
 */
function patchTkhdBoxes(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  const offsets = findBoxOffsets(view, "tkhd");
  let patched = 0;

  for (const offset of offsets) {
    const version = view.getUint8(offset + 8);
    const matrixOffset = offset + (version === 1 ? TKHD_MATRIX_OFFSET_V1 : TKHD_MATRIX_OFFSET_V0);

    if (matrixOffset + 36 > buffer.byteLength) continue; // safety

    for (let i = 0; i < 9; i++) {
      view.setInt32(matrixOffset + i * 4, IDENTITY_MATRIX[i], false);
    }
    patched++;
  }
  return patched;
}

/**
 * Returns a new Blob with the rotation metadata corrected.
 * On non-MP4 blobs or any error, returns the original blob unchanged.
 */
export async function fixVideoBlob(blob: Blob): Promise<Blob> {
  if (!blob.type.includes("mp4")) return blob;

  try {
    const buffer = await blob.arrayBuffer();
    // Copy so we don't mutate the original
    const copy = buffer.slice(0);
    const patched = patchTkhdBoxes(copy);

    if (patched === 0) {
      // No tkhd found — file might be WebM or already clean
      return blob;
    }

    return new Blob([copy], { type: blob.type });
  } catch (err) {
    console.error("[fixVideoRotation] Failed, returning original:", err);
    return blob;
  }
}
