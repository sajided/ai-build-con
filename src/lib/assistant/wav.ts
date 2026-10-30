/**
 * Minimal WAV helpers used to shrink Gemini TTS output (24 kHz 16-bit mono)
 * before sending it to low-end phones on slow mobile data.
 */

export interface Pcm16 {
  samples: Int16Array;
  sampleRate: number;
}

/** Accepts a RIFF/WAV buffer or raw little-endian 16-bit mono PCM. */
export function readPcm16(buf: Buffer, fallbackRate = 24000): Pcm16 {
  if (buf.length >= 44 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE") {
    let offset = 12;
    let sampleRate = fallbackRate;
    while (offset + 8 <= buf.length) {
      const id = buf.toString("ascii", offset, offset + 4);
      const size = buf.readUInt32LE(offset + 4);
      if (id === "fmt ") sampleRate = buf.readUInt32LE(offset + 12);
      if (id === "data") {
        const end = Math.min(offset + 8 + size, buf.length);
        const data = buf.subarray(offset + 8, end - ((end - offset - 8) % 2));
        return { samples: toInt16(data), sampleRate };
      }
      offset += 8 + size + (size % 2);
    }
  }
  return { samples: toInt16(buf.subarray(0, buf.length - (buf.length % 2))), sampleRate: fallbackRate };
}

function toInt16(data: Buffer): Int16Array {
  const out = new Int16Array(data.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = data.readInt16LE(i * 2);
  return out;
}

/** Integer-factor downsample with box averaging (a cheap low-pass to limit aliasing). */
export function downsample(pcm: Pcm16, factor: number): Pcm16 {
  if (factor <= 1) return pcm;
  const out = new Int16Array(Math.floor(pcm.samples.length / factor));
  for (let i = 0; i < out.length; i++) {
    let sum = 0;
    for (let j = 0; j < factor; j++) sum += pcm.samples[i * factor + j];
    out[i] = Math.round(sum / factor);
  }
  return { samples: out, sampleRate: Math.round(pcm.sampleRate / factor) };
}

export function encodeWav({ samples, sampleRate }: Pcm16): Buffer {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16); // fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(samples[i], 44 + i * 2);
  return buf;
}

/** 24 kHz → 12 kHz: halves the payload while keeping speech clear. */
export function shrinkSpeechWav(buf: Buffer, mimeType?: string): Buffer {
  const rateFromMime = Number(mimeType?.match(/rate=(\d+)/)?.[1]) || 24000;
  const pcm = readPcm16(buf, rateFromMime);
  const factor = Math.max(1, Math.floor(pcm.sampleRate / 12000));
  return encodeWav(downsample(pcm, factor));
}
