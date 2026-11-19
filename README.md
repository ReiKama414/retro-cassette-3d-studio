# Retro Cassette 3D Studio

**English** · [繁體中文](./README.zh-TW.md)

> An **interactive 3D retro cassette showcase** in the browser: orbit, zoom, recolor, reel playback, auto showcase rotation, glass UI, and a procedural COSMIC-style front sticker.

<p align="center">
  <a href="https://github.com/ReiKama414/retro-cassette-3d-studio">Star</a>
  ·
  <a href="https://reikama414.vercel.app/">Portfolio</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="#license">License</a>
</p>

---

## Why

A cassette should feel like it sits on a desk: turn it to read the label, tweak shell colors, watch the reels spin. No account and no backend.

---

## Highlights

- **3D cassette** — Translucent shell, dual reels, procedural Y2K “COSMIC Playlist” front art.
- **Six color presets** — Round swatches; names live in tooltips.
- **Custom look** — Shell, sticker base, accent, and reel hub color pickers.
- **Interaction** — Drag to rotate or pan, view presets (front, side, back, iso), bottom-left D-pad nudge (hold to repeat).
- **Playback** — Reel spin and auto showcase rotation are separate toggles.
- **UI** — Dark theme, `100dvh` without page scroll, Iansui for Traditional Chinese UI copy, no text selection on controls.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18 · TypeScript · Vite · Tailwind CSS |
| 3D | Three.js · React Three Fiber · Drei |
| Motion | GSAP |
| Icons | Lucide React |

---

## Quick start

From the project root (this folder):

```bash
npm install
npm run dev
```

Open the URL Vite prints. Local dev is often [127.0.0.1:5173](http://127.0.0.1:5173/).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | `tsc --noEmit` |

Static front-end only. No backend or API keys.

---

## Controls (short)

| Area | Behavior |
| --- | --- |
| Stage drag | Rotate or pan the cassette (mode in footer) |
| Bottom-left pad | Fine-tune position (hold for repeat) |
| Bottom-right | Reel play/pause, auto rotation, view presets |
| Header | Presets, color wells, live view readout |
| Footer | Interaction mode, reset, zoom, fullscreen |

---

## Project layout

```
src/
  App.tsx
  components/
    CassetteCanvas.tsx
    CassetteModel.tsx
  data/cassettes.ts
  utils/
    stickerTexture.ts
    cassetteColors.ts
public/
```

---

## Third-party

Dependencies in `package.json` remain under their own licenses. This repository does not relicense them. The Iansui font is bundled via `@fontsource/iansui`.

---

## Links

| | |
| --- | --- |
| Repository | [retro-cassette-3d-studio](https://github.com/ReiKama414/retro-cassette-3d-studio) |
| Author | [ReiKama414](https://github.com/ReiKama414) |
| Portfolio | [Personal site](https://reikama414.vercel.app/) |
| Full license text | [LICENSE](./LICENSE) |

---

## License

> **This project is open source under the [MIT License](./LICENSE)** (Copyright (c) 2026 ReiKama414).

You may use, modify, and distribute the code under the terms in `LICENSE`, provided the copyright notice is included.

- [GitHub](https://github.com/ReiKama414/retro-cassette-3d-studio)
- [Portfolio](https://reikama414.vercel.app/)
- [Full license text](./LICENSE)

---

<sub>Retro Cassette 3D Studio · ReiKama414 · MIT</sub>
