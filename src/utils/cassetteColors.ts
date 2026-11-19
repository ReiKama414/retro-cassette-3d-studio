import { StickerPalette } from '../types/cassette';

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').trim();
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

function mix(hexA: string, hexB: string, weightB: number): string {
  const [ar, ag, ab] = parseHex(hexA);
  const [br, bg, bb] = parseHex(hexB);
  const w = Math.max(0, Math.min(1, weightB));
  return toHex(ar + (br - ar) * w, ag + (bg - ag) * w, ab + (bb - ab) * w);
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, '#ffffff', amount);
}

export function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount);
}

export function stickerPaletteFromBase(base: string, prev: StickerPalette): StickerPalette {
  const [r, g, b] = parseHex(base);
  return {
    ...prev,
    gradStart: lighten(base, 0.22),
    gradMid: base,
    gradEnd: darken(base, 0.18),
    stripLeft: darken(base, 0.08),
    stripRight: lighten(base, 0.12),
    cloudTint: `rgba(${r}, ${g}, ${b}, 0.42)`,
  };
}

export function stickerPaletteFromAccent(accent: string, prev: StickerPalette): StickerPalette {
  return {
    ...prev,
    accentPink: accent,
    accentBlue: lighten(accent, 0.18),
    titleStroke: darken(accent, 0.42),
    gradEnd: mix(prev.gradEnd, accent, 0.35),
  };
}

export function readStickerBase(sticker: StickerPalette): string {
  return sticker.gradMid;
}

export function readStickerAccent(sticker: StickerPalette): string {
  return sticker.accentPink;
}
