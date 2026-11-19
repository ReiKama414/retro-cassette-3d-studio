import * as THREE from 'three';
import { CassetteConfig } from '../types/cassette';

/**
 * Helper to draw a rounded rectangle path on a 2D canvas context
 */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw a 4-point Y2K sparkle star
 */
function drawY2KStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  fill: string,
  stroke?: string
) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Generates the high-DPI front retro sticker texture ("COSMIC Playlist")
 */
export function createFrontStickerTexture(config: CassetteConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  const { sticker } = config;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Outer sticker rounded rectangle clip
  ctx.save();
  roundedRectPath(ctx, 16, 16, W - 32, H - 32, 48);
  ctx.clip();

  // 1. Main diagonal Y2K cosmic gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0.0, sticker.gradStart);
  bgGrad.addColorStop(0.52, sticker.gradMid);
  bgGrad.addColorStop(1.0, sticker.gradEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Soft dreamy Y2K clouds / airbrush glows
  const cloudGrad1 = ctx.createRadialGradient(W * 0.72, H * 0.32, 30, W * 0.72, H * 0.32, 420);
  cloudGrad1.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  cloudGrad1.addColorStop(0.45, sticker.cloudTint);
  cloudGrad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = cloudGrad1;
  ctx.fillRect(0, 0, W, H);

  const cloudGrad2 = ctx.createRadialGradient(W * 0.22, H * 0.45, 20, W * 0.22, H * 0.45, 360);
  cloudGrad2.addColorStop(0, sticker.cloudTint);
  cloudGrad2.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = cloudGrad2;
  ctx.fillRect(0, 0, W, H);

  // Cloud silhouettes on right side
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(1360, 420, 95, 0, Math.PI * 2);
  ctx.arc(1460, 450, 80, 0, Math.PI * 2);
  ctx.arc(1270, 460, 70, 0, Math.PI * 2);
  ctx.fill();

  // 3. Y2K Ringed Planet (Saturn) on left side
  ctx.save();
  ctx.translate(185, 365);
  ctx.rotate(-0.32);
  // Planet sphere
  const planetGrad = ctx.createLinearGradient(-70, -70, 70, 70);
  planetGrad.addColorStop(0, '#ffffff');
  planetGrad.addColorStop(0.5, sticker.accentBlue);
  planetGrad.addColorStop(1, sticker.accentPink);
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Orbital rings
  ctx.beginPath();
  ctx.ellipse(0, 0, 155, 36, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, 130, 26, 0, 0, Math.PI * 2);
  ctx.strokeStyle = sticker.accentBlue;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  // 4. Sweeping Y2K Chrome / Neon Swooshes across top header
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(140, 220);
  ctx.bezierCurveTo(380, 60, 780, 70, 1120, 200);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // 5. "COSMIC" Bold Retro Italic Y2K Display Type
  ctx.save();
  ctx.translate(290, 175);
  ctx.transform(1, -0.05, -0.24, 1, 0, 0);
  ctx.font = '900 124px "Arial Black", "Impact", sans-serif';
  ctx.letterSpacing = '4px';

  // Deep shadow extrude
  ctx.fillStyle = sticker.titleStroke;
  ctx.fillText('COSMIC', 8, 10);

  // Outer stroke
  ctx.lineWidth = 14;
  ctx.strokeStyle = sticker.titleStroke;
  ctx.strokeText('COSMIC', 0, 0);

  // Metallic/white inner fill
  const textGrad = ctx.createLinearGradient(0, -100, 0, 20);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.55, sticker.titleFill);
  textGrad.addColorStop(1, '#f9a8d4');
  ctx.fillStyle = textGrad;
  ctx.fillText('COSMIC', 0, 0);
  ctx.restore();

  // 6. "Playlist" Script Sub-heading
  ctx.save();
  ctx.translate(540, 255);
  ctx.transform(1, -0.03, -0.18, 1, 0, 0);
  ctx.font = 'italic 700 84px "IBM Plex Sans", "Iansui", sans-serif';
  ctx.lineWidth = 9;
  ctx.strokeStyle = sticker.titleStroke;
  ctx.strokeText('Playlist', 0, 0);
  ctx.fillStyle = sticker.scriptColor;
  ctx.fillText('Playlist', 0, 0);
  ctx.restore();

  // 7. Top-Right Box: "SOUNDS FOR BRIGHTER DAYS"
  ctx.save();
  roundedRectPath(ctx, 1020, 118, 285, 92, 14);
  ctx.fillStyle = sticker.badgeBg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Cascadia Mono", Consolas, monospace';
  ctx.fillText('SOUNDS', 1042, 148);
  ctx.fillText('FOR BRIGHTER', 1042, 173);
  ctx.fillText('DAYS', 1042, 198);
  ctx.restore();

  // 8. Large 4-Point Y2K Sparkle Stars on right & left
  drawY2KStar(ctx, 1365, 255, 86, 20, '#ffffff', sticker.accentPink);
  drawY2KStar(ctx, 1275, 315, 42, 10, sticker.accentBlue, '#ffffff');
  drawY2KStar(ctx, 240, 145, 44, 11, '#ffffff', sticker.accentBlue);
  drawY2KStar(ctx, 960, 165, 28, 7, '#ffffff');
  drawY2KStar(ctx, 1455, 375, 32, 8, '#ffffff');

  // 9. Side "A" Oval Emblem & "120 MIN" on Right Side
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(1405, 535, 68, 36, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px "Bahnschrift", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('• A •', 1405, 537);

  ctx.font = '800 36px "Bahnschrift", "Arial Black", sans-serif';
  ctx.fillText('120', 1405, 685);
  ctx.font = '700 26px "Bahnschrift", "Arial Black", sans-serif';
  ctx.fillText('MIN', 1405, 718);
  ctx.restore();

  // 10. Bottom-Left "STELLAR VIBES ARCHIVE"
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 23px "Cascadia Mono", Consolas, monospace';
  ctx.fillText('STELLAR', 110, 642);
  ctx.fillText('VIBES', 110, 670);
  ctx.fillText('ARCHIVE', 110, 698);
  ctx.restore();

  // 11. Bottom Checkered & Star Accent Strip (matching video's Y2K bar)
  const stripY = 745;
  const stripH = 68;
  const stripGrad = ctx.createLinearGradient(80, stripY, W - 80, stripY);
  stripGrad.addColorStop(0, sticker.stripLeft);
  stripGrad.addColorStop(0.5, sticker.gradMid);
  stripGrad.addColorStop(1, sticker.stripRight);

  ctx.save();
  roundedRectPath(ctx, 85, stripY, W - 170, stripH, 16);
  ctx.fillStyle = stripGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.stroke();

  // Left & Right Checkerboards inside strip
  const cell = 17;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 7; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(280 + col * cell, stripY + 17 + row * cell, cell, cell);
        ctx.fillRect(1160 + col * cell, stripY + 17 + row * cell, cell, cell);
      }
    }
  }

  // Small stars along center of strip
  for (let i = 0; i < 5; i++) {
    drawY2KStar(ctx, 560 + i * 115, stripY + stripH / 2, 14, 4, '#ffffff');
  }

  // Variant badge text on bottom right of strip
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 21px "Cascadia Mono", Consolas, monospace';
  ctx.fillText(`MODEL // ${config.id}`, 115, stripY + 42);
  ctx.restore();

  //Outer white-pink border line inside sticker
  roundedRectPath(ctx, 26, 26, W - 52, H - 52, 40);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.stroke();

  // 12. PUNCH OUT CENTRAL STADIUM / PILL WINDOW CUTOUT
  // Matches the exact central window & reel cutout of the 3D geometry
  const winW = 940;
  const winH = 360;
  const winX = (W - winW) / 2;
  const winY = 310;

  // White/chrome rim around the central window cutout before punching
  roundedRectPath(ctx, winX - 10, winY - 10, winW + 20, winH + 20, winH / 2 + 10);
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.globalCompositeOperation = 'destination-out';
  roundedRectPath(ctx, winX, winY, winW, winH, winH / 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a subtle technical embossing / silkscreen texture for the BACK shell face
 * so the back of the cassette has authentic molded details, oval window border,
 * and "SIDE B · 120 MIN" markings (never a blank back!).
 */
export function createBackShellTexture(config: CassetteConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Subtle etched frame lines on back shell
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 4;
  roundedRectPath(ctx, 60, 50, W - 120, H - 100, 36);
  ctx.stroke();

  // Horizontal technical groove lines
  ctx.beginPath();
  ctx.moveTo(60, 170);
  ctx.lineTo(W - 60, 170);
  ctx.moveTo(60, 760);
  ctx.lineTo(W - 60, 760);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Central stadium window etched outline (matching Meta Muse Wonder back view in video)
  const winW = 940;
  const winH = 360;
  const winX = (W - winW) / 2;
  const winY = 310;
  roundedRectPath(ctx, winX - 14, winY - 14, winW + 28, winH + 28, (winH + 28) / 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Scale tick marks between the reels on back window
  for (let i = 0; i <= 10; i++) {
    const tx = W / 2 - 150 + i * 30;
    const th = i % 5 === 0 ? 22 : 12;
    ctx.beginPath();
    ctx.moveTo(tx, winY + winH / 2 - th / 2);
    ctx.lineTo(tx, winY + winH / 2 + th / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = i % 5 === 0 ? 4 : 2;
    ctx.stroke();
  }

  // Subtle silkscreen technical typography (mirrored/readable on back face)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '700 26px "Cascadia Mono", Consolas, monospace';
  ctx.fillText(`COSMIC AUDIO ARCHIVE // ${config.title.toUpperCase()}`, 105, 125);
  ctx.fillText('SIDE B · 120 MIN · HIGH PRECISION COMPACT CASSETTE', 105, 825);

  ctx.textAlign = 'right';
  ctx.fillText('NR [ON / OFF] · BIAS 120µs', W - 105, 125);
  ctx.fillText('MADE IN WEBGL STUDIO', W - 105, 825);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
