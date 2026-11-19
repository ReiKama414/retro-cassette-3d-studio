# 卡帶工作室 · Retro Cassette 3D Studio

[English](./README.md) · **繁體中文**

> **瀏覽器裡的 3D 復古卡帶展示台**：旋轉、縮放、改色、轉輪播放與自動展示旋轉、毛玻璃介面、程式生成的 COSMIC 風格正面貼紙

<p align="center">
  <a href="https://github.com/ReiKama414/retro-cassette-3d-studio">Star</a>
  ·
  <a href="https://reikama414.vercel.app/">個人網站</a>
  ·
  <a href="#快速開始">快速開始</a>
  ·
  <a href="#授權">授權</a>
</p>

---

## 為什麼做

一張卡帶應該像放在檯面上：可以轉過來看貼紙、調外殼色、看轉輪轉——不必登入、不必後端

---

## 亮點

- **3D 卡帶** — 透明外殼、雙轉輪、程式生成的 Y2K「COSMIC Playlist」正面貼紙
- **六組配色** — 圓形色塊 preset，名稱在 tooltip
- **自訂外觀** — 外殼、貼紙底色、圖案重點色、轉輪（取色器）
- **互動** — 拖曳旋轉／移動、視角 preset（正面／側面／背面／斜角）、左下方向鍵微調位置（按住連續）
- **播放** — 轉輪旋轉與卡帶自動展示旋轉可分開開關
- **介面** — 深色、`100dvh` 不捲動、Iansui 繁中 UI、控制區文字不可選取

---

## 技術棧

| 層級 | 選用 |
| --- | --- |
| UI | React 18 · TypeScript · Vite · Tailwind CSS |
| 3D | Three.js · React Three Fiber · Drei |
| 動畫 | GSAP |
| 圖示 | Lucide React |

---

## 快速開始

在專案根目錄（本 README 所在資料夾）執行：

```bash
npm install
npm run dev
```

開啟 Vite 印出的網址。本機開發常用 [127.0.0.1:5173](http://127.0.0.1:5173/)

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開發伺服器 |
| `npm run build` | 型別檢查 + 建置至 `dist/` |
| `npm run preview` | 預覽建置結果 |
| `npm run lint` | `tsc --noEmit` |

純前端靜態站，無後端與 API key

---

## 操作（精簡）

| 區塊 | 行為 |
| --- | --- |
| 舞台拖曳 | 依底部模式旋轉或平移卡帶 |
| 左下方向鍵 | 微調卡帶位置（按住連續） |
| 右下 | 轉輪播放／暫停、自動旋轉、視角 preset |
| 頂部 | 配色 preset、取色、目前視角讀數 |
| 底部 | 互動模式、重設、縮放、全螢幕 |

---

## 專案結構

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

## 第三方

`package.json` 內依賴各適用其授權。本 repo 不替換那些授權。繁中 UI 字體經 `@fontsource/iansui` 自架 bundle

---

## 連結

| 項目 |  |
| --- | --- |
| 倉庫 | [retro-cassette-3d-studio](https://github.com/ReiKama414/retro-cassette-3d-studio) |
| 作者 | [ReiKama414](https://github.com/ReiKama414) |
| 個人網站 | [作品集](https://reikama414.vercel.app/) |
| 授權全文 | [LICENSE](./LICENSE) |

---

## 授權

> **本專案以 [MIT License](./LICENSE) 開源釋出**（Copyright (c) 2026 ReiKama414）

可依 `LICENSE` 條款使用、修改與散布，須保留版權聲明

- [GitHub](https://github.com/ReiKama414/retro-cassette-3d-studio)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<sub>卡帶工作室 · ReiKama414 · MIT</sub>
