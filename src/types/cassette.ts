export type CassetteVariantId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface StickerPalette {
  gradStart: string;
  gradMid: string;
  gradEnd: string;
  cloudTint: string;
  accentBlue: string;
  accentPink: string;
  stripLeft: string;
  stripRight: string;
  titleFill: string;
  titleStroke: string;
  scriptColor: string;
  badgeBg: string;
}

export interface CassetteConfig {
  id: CassetteVariantId;
  title: string;
  brand: 'gemini' | 'meta' | 'claude' | 'gpt';
  subtitle: string;
  cornerTagLeft: string;
  cornerTagRight: string;
  shellColorFront: string;
  shellColorBack: string;
  edgeAccentColor: string;
  transmission: number;
  opacity: number;
  roughness: number;
  clearcoat: number;
  attenuationColor: string;
  reelHubColor: string;
  reelTeethColor: string;
  tapePackColor: string;
  leftTapeRadius: number;
  rightTapeRadius: number;
  screwColor: string;
  phaseOffset: number;
  sticker: StickerPalette;
}
