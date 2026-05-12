/**
 * fixVideoRotation.ts
 *
 * Post-processes a MediaRecorder blob to fix two Android Chromium bugs:
 *
 * 1. ROTATION BUG — Chromium muxes a `rotation:90` flag into the MP4
 *    tkhd matrix even when the canvas pixels are already portrait-correct.
 *    All Android players honour this flag and display the video rotated.
 *
 * 2. FRAGMENTED MP4 BUG — MediaRecorder produces fragmented MP4 (fMP4)
 *    where each ondataavailable chunk is a self-contained fragment.
 *    Concatenating chunks yields a file without a complete `moov` atom at
 *    the start, which Android Gallery (and some other players) reject as
 *    "damaged". Desktop players (VLC, QuickTime) tolerate fMP4 fine.
 *
 * Both are fixed here using mp4box.js:
 *  - We parse the fMP4 blob, extract all samples, and remux into a
 *    standard MP4 with `moov` before `mdat` (aka "fast start").
 *  - Before writing the output we zero the tkhd rotation matrix on every
 *    video track so no player applies an unwanted rotation.
 *
 * WebM blobs are returned as-is (WebM rotation metadata requires ts-ebml
 * and is a separate concern; on Android we now force MP4).
 */

// mp4box.js is loaded lazily to avoid adding weight to the initial bundle.
// It is only needed after a recording stops.
let mp4boxModule: typeof import("mp4box") | null = null;

async function getMp4box() {
  if (!mp4boxModule) {
    mp4boxModule = await import("mp4box");
  }
  return mp4boxModule;
}

/** Identity matrix for tkhd — means "no transform, no rotation". */
const IDENTITY_MATRIX = [
  0x00010000, 0, 0,
  0, 0x00010000, 0,
  0, 0, 0x40000000,
] as const;

/**
 * Takes a raw MediaRecorder blob and returns a fixed MP4 blob.
 * On non-MP4 blobs (webm) the original blob is returned unchanged.
 * On any error the original blob is returned so the user still gets a file.
 */
export async function fixVideoBlob(blob: Blob): Promise<Blob> {
  // Only attempt repair on MP4 blobs
  if (!blob.type.includes("mp4")) return blob;

  try {
    const { createFile } = await getMp4box();
    const arrayBuffer = await blob.arrayBuffer();

    // ── Step 1: Parse the fragmented MP4 ──────────────────────────────────
    const inputFile = createFile();

    // mp4box.js requires ArrayBuffer chunks tagged with a `fileStart` offset
    const buf = arrayBuffer as ArrayBuffer & { fileStart: number };
    buf.fileStart = 0;

    let movieInfo: import("mp4box").Movie | null = null;

    const parseReady = new Promise<import("mp4box").Movie>((resolve, reject) => {
      inputFile.onReady = (info) => resolve(info);
      inputFile.onError = (module: string, message: string) => reject(new Error(`${module}: ${message}`));
    });

    inputFile.appendBuffer(buf);
    inputFile.flush();

    movieInfo = await parseReady;

    // ── Step 2: Set up extraction for every track ─────────────────────────
    const trackCount = movieInfo.tracks.length;
    if (trackCount === 0) return blob; // nothing to do

    for (const track of movieInfo.tracks) {
      inputFile.setExtractionOptions(track.id, null, { nbSamples: Infinity });
    }

    // Collect all extracted samples per track
    const allSamples = new Map<number, import("mp4box").Sample[]>();
    for (const track of movieInfo.tracks) {
      allSamples.set(track.id, []);
    }

    const extractDone = new Promise<void>((resolve) => {
      inputFile.onSamples = (
        trackId: number,
        _user: unknown,
        samples: import("mp4box").Sample[]
      ) => {
        const bucket = allSamples.get(trackId);
        if (bucket) bucket.push(...samples);
      };

      // mp4box fires onSamples synchronously during start() for in-memory buffers
      inputFile.start();
      // Give the event loop one tick then resolve
      setTimeout(resolve, 0);
    });

    await extractDone;
    inputFile.stop();

    // ── Step 3: Build output file ─────────────────────────────────────────
    const outputFile = createFile();

    // Add tracks and collect their output IDs
    const trackIdMap = new Map<number, number>(); // inputId → outputId

    for (const track of movieInfo.tracks) {
      const isVideo = track.type === "video";
      const isAudio = track.type === "audio";

      let outId: number;

      if (isVideo && track.video) {
        // Find the sample description (codec config) from the input track.
        // We cast through unknown to access the internal box tree that mp4box
        // exposes at runtime but doesn't fully type.
        const sd = (inputFile as unknown as {
          getTrackById: (id: number) => { mdia: { minf: { stbl: { stsd: { entries: import("mp4box").Box[] } } } } }
        }).getTrackById(track.id);

        outId = outputFile.addTrack({
          // IsoFileOptions.type expects a SampleEntryFourCC like "avc1", not "video".
          // Derive it from the codec string or fall back to "avc1" for H.264.
          type: (track.codec?.split(".")[0] ?? "avc1") as import("mp4box").IsoFileOptions["type"],
          width:     track.video.width,
          height:    track.video.height,
          timescale: track.timescale,
          ...(sd ? { description: sd.mdia.minf.stbl.stsd.entries[0] } : {}),
        });
      } else if (isAudio && track.audio) {
        outId = outputFile.addTrack({
          type:          "mp4a" as import("mp4box").IsoFileOptions["type"],
          samplerate:    track.audio.sample_rate,
          channel_count: track.audio.channel_count,
          timescale:     track.timescale,
        });
      } else {
        // Skip non-AV tracks (metadata, text, etc.)
        continue;
      }

      trackIdMap.set(track.id, outId);
    }

    // ── Step 4: Zero rotation matrix on all video tracks ─────────────────
    // mp4box exposes the moov box after addTrack; we patch tkhd.matrix directly.
    try {
      const moov = (outputFile as unknown as { moov: { traks: Array<{ tkhd: { matrix: number[] }; mdia: { hdlr: { handler: string } } }> } }).moov;
      if (moov?.traks) {
        for (const trak of moov.traks) {
          if (trak.mdia?.hdlr?.handler === "vide" && trak.tkhd) {
            trak.tkhd.matrix = [...IDENTITY_MATRIX];
          }
        }
      }
    } catch {
      // Non-fatal — rotation fix fails silently, remux still improves gallery compat
      console.warn("[fixVideoRotation] Could not patch tkhd matrix:", );
    }

    // ── Step 5: Write all samples into output ─────────────────────────────
    for (const [inputTrackId, outTrackId] of trackIdMap) {
      const samples = allSamples.get(inputTrackId) ?? [];
      for (const sample of samples) {
        if (!sample.data) continue; // skip incomplete samples
        // addSample does not accept timescale — durations are already in track timescale units
        outputFile.addSample(outTrackId, sample.data, {
          duration: sample.duration,
          cts:      sample.cts,
          dts:      sample.dts,
          is_sync:  sample.is_sync,
        });
      }
    }

    // ── Step 6: Serialise to ArrayBuffer ──────────────────────────────────
    const outputBuffer = outputFile.getBuffer();
    if (!outputBuffer || outputBuffer.byteLength < 100) {
      // Something went wrong with serialisation — fall back to original
      console.warn("[fixVideoRotation] Output buffer empty, returning original blob");
      return blob;
    }

    return new Blob([outputBuffer], { type: "video/mp4" });
  } catch (err) {
    // Never block the user from saving — always fall back to the raw blob
    console.error("[fixVideoRotation] Repair failed, returning original blob:", err);
    return blob;
  }
}
