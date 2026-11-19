import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  Rotate3d,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Box,
  PanelLeft,
  FlipHorizontal2,
  Axis3D,
  LocateFixed,
} from 'lucide-react';
import { CASSETTE_CONFIGS } from './data/cassettes';
import {
  CameraAnglePreset,
  CassetteCanvas,
  InteractionMode,
} from './components/CassetteCanvas';
import { CassetteConfig } from './types/cassette';
import {
  readStickerAccent,
  readStickerBase,
  stickerPaletteFromAccent,
  stickerPaletteFromBase,
} from './utils/cassetteColors';

type ColorWellProps = {
  title: string;
  value: string;
  onChange: (hex: string) => void;
};

function ColorWell({ title, value, onChange }: ColorWellProps) {
  return (
    <label
      className="color-well"
      title={title}
      style={{ ['--well-color' as string]: value }}
    >
      <span className="color-well-surface" aria-hidden="true" />
      <input
        type="color"
        className="color-well-input"
        value={value}
        aria-label={title}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function presetLabel(config: CassetteConfig) {
  return (config.title.split('—')[1] ?? config.title).trim();
}

export default function App() {
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customConfig, setCustomConfig] = useState<CassetteConfig>(CASSETTE_CONFIGS[0]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('rotate');
  const [positionOffset, setPositionOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [anglePresetSignal, setAnglePresetSignal] = useState<{
    preset: CameraAnglePreset;
    seq: number;
  }>({ preset: null, seq: 0 });
  const [zoom, setZoom] = useState(1.15);
  const [resetSignal, setResetSignal] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [angleDeg, setAngleDeg] = useState(0);
  const [sideLabel, setSideLabel] = useState('正面');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === stageContainerRef.current);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIdx(index);
    const next = CASSETTE_CONFIGS[index];
    setCustomConfig({ ...next, sticker: { ...next.sticker } });
  };

  const handleShellFrontChange = (hex: string) => {
    setCustomConfig((prev) => ({
      ...prev,
      shellColorFront: hex,
      attenuationColor: hex,
    }));
  };

  const handleStickerBaseChange = (hex: string) => {
    setCustomConfig((prev) => ({
      ...prev,
      sticker: stickerPaletteFromBase(hex, prev.sticker),
    }));
  };

  const handleStickerAccentChange = (hex: string) => {
    setCustomConfig((prev) => ({
      ...prev,
      sticker: stickerPaletteFromAccent(hex, prev.sticker),
    }));
  };

  const handleReelColorChange = (hex: string) => {
    setCustomConfig((prev) => ({
      ...prev,
      reelHubColor: hex,
    }));
  };

  const holdDelayRef = useRef<number | null>(null);
  const holdRepeatRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const clearHold = () => {
    if (holdDelayRef.current !== null) {
      window.clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }
    if (holdRepeatRef.current !== null) {
      window.clearInterval(holdRepeatRef.current);
      holdRepeatRef.current = null;
    }
  };

  useEffect(() => clearHold, []);

  const handleNudgePosition = (dx: number, dy: number) => {
    setPositionOffset((prev) => ({
      x: Math.max(-1.5, Math.min(1.5, Number((prev.x + dx).toFixed(2)))),
      y: Math.max(-1.0, Math.min(1.0, Number((prev.y + dy).toFixed(2)))),
    }));
  };

  const beginHold = (dx: number, dy: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    clearHold();
    suppressClickRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    handleNudgePosition(dx, dy);
    holdDelayRef.current = window.setTimeout(() => {
      holdRepeatRef.current = window.setInterval(() => handleNudgePosition(dx, dy), 70);
    }, 220);
  };

  const endHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clearHold();
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const nudgeOnce = (dx: number, dy: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    handleNudgePosition(dx, dy);
  };

  const handleTriggerAnglePreset = (preset: CameraAnglePreset) => {
    setAutoRotate(false);
    setAnglePresetSignal((prev) => ({ preset, seq: prev.seq + 1 }));
  };

  const handleResetAll = () => {
    setPositionOffset({ x: 0, y: 0 });
    setZoom(1.15);
    setAutoRotate(true);
    setIsPlaying(true);
    setInteractionMode('rotate');
    setResetSignal((s) => s + 1);
  };

  const handleToggleFullscreen = async () => {
    if (!stageContainerRef.current) return;
    try {
      if (document.fullscreenElement === stageContainerRef.current) {
        await document.exitFullscreen();
      } else if (stageContainerRef.current.requestFullscreen) {
        await stageContainerRef.current.requestFullscreen();
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const activePresetName = presetLabel(customConfig);

  return (
    <div
      ref={stageContainerRef}
      className={`studio${isFullscreen ? ' is-fallback-fs' : ''}`}
    >
      <header className="studio-top">
        <div
          className="identity"
          title={`卡帶工作室 · 目前配色：${activePresetName}`}
        >
          <svg className="identity-mark" viewBox="0 0 64 44" aria-hidden="true">
            <rect width="64" height="44" rx="6" fill={customConfig.shellColorFront} />
            <rect x="5" y="6" width="54" height="24" rx="8" fill="#0c0a0c" />
            <circle cx="22.5" cy="18" r="7.5" fill={customConfig.shellColorFront} />
            <circle cx="41.5" cy="18" r="7.5" fill={customConfig.shellColorFront} />
            <circle cx="22.5" cy="18" r="3" fill="#ece6de" />
            <circle cx="41.5" cy="18" r="3" fill="#ece6de" />
            <rect x="12" y="34.5" width="40" height="5.5" rx="1.6" fill="#000" opacity="0.32" />
          </svg>
          <div className="identity-copy">
            <h1 className="identity-name">卡帶工作室</h1>
          </div>
        </div>

        <div className="readout" aria-live="polite" title="目前視角">
          <span className="readout-dot" aria-hidden="true" />
          <span className="readout-side">{sideLabel}</span>
          <span className="readout-deg">{angleDeg}°</span>
        </div>

        <div className="preset-row" role="listbox" aria-label="卡帶配色">
          {CASSETTE_CONFIGS.map((preset, idx) => {
            const name = presetLabel(preset);
            const on = selectedPresetIdx === idx;
            return (
              <button
                key={preset.id}
                type="button"
                role="option"
                aria-label={name}
                aria-selected={on}
                title={name}
                onClick={() => handleSelectPreset(idx)}
                className={`preset${on ? ' is-on' : ''}`}
              >
                <span
                  className="preset-chip"
                  style={{ backgroundColor: preset.shellColorFront }}
                />
              </button>
            );
          })}
        </div>

        <div className="tune-row" aria-label="自訂外觀">
          <ColorWell title="外殼" value={customConfig.shellColorFront} onChange={handleShellFrontChange} />
          <ColorWell
            title="貼紙底色"
            value={readStickerBase(customConfig.sticker)}
            onChange={handleStickerBaseChange}
          />
          <ColorWell
            title="圖案重點色"
            value={readStickerAccent(customConfig.sticker)}
            onChange={handleStickerAccentChange}
          />
          <ColorWell title="轉輪" value={customConfig.reelHubColor} onChange={handleReelColorChange} />
        </div>
      </header>

      <div
        className="stage"
        onDoubleClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('.stage-pad, .stage-angles')) return;
          handleResetAll();
        }}
      >
        <CassetteCanvas
          config={customConfig}
          isPlaying={isPlaying}
          autoRotate={autoRotate}
          interactionMode={interactionMode}
          positionOffset={positionOffset}
          onPositionOffsetChange={setPositionOffset}
          anglePresetSignal={anglePresetSignal}
          zoom={zoom}
          resetSignal={resetSignal}
          reducedMotion={reducedMotion}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onZoomChange={setZoom}
          onRotationTelemetry={(deg, side) => {
            setAngleDeg(deg);
            setSideLabel(side);
          }}
        />

        <div className="stage-pad" aria-label="位置">
          <div className="pad-grid">
            <span />
            <button
              type="button"
              title="向上"
              aria-label="向上"
              onPointerDown={beginHold(0, 0.15)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onClick={() => nudgeOnce(0, 0.15)}
            >
              <ArrowUp className="ui-icon" />
            </button>
            <span />
            <button
              type="button"
              title="向左"
              aria-label="向左"
              onPointerDown={beginHold(-0.18, 0)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onClick={() => nudgeOnce(-0.18, 0)}
            >
              <ArrowLeft className="ui-icon" />
            </button>
            <button
              type="button"
              title="置中"
              aria-label="置中"
              onClick={() => setPositionOffset({ x: 0, y: 0 })}
            >
              <Crosshair className="ui-icon" />
            </button>
            <button
              type="button"
              title="向右"
              aria-label="向右"
              onPointerDown={beginHold(0.18, 0)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onClick={() => nudgeOnce(0.18, 0)}
            >
              <ArrowRight className="ui-icon" />
            </button>
            <span />
            <button
              type="button"
              title="向下"
              aria-label="向下"
              onPointerDown={beginHold(0, -0.15)}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onClick={() => nudgeOnce(0, -0.15)}
            >
              <ArrowDown className="ui-icon" />
            </button>
            <span />
          </div>
          <div className="pad-readout" title="位置座標">
            <div className="pad-readout-head">
              <LocateFixed className="ui-icon ui-icon-muted" aria-hidden="true" />
              <span>位置</span>
            </div>
            <div className="pad-readout-values">
              <span>X {positionOffset.x.toFixed(2)}</span>
              <span>Y {positionOffset.y.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="stage-angles">
          <div className="stage-playback" role="group" aria-label="播放與旋轉">
            <button
              type="button"
              className={`angle-btn${isPlaying ? ' is-on' : ''}`}
              title={isPlaying ? '暫停轉輪' : '播放轉輪'}
              aria-label={isPlaying ? '暫停轉輪' : '播放轉輪'}
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? <Pause className="ui-icon" /> : <Play className="ui-icon" />}
            </button>
            <button
              type="button"
              className={`angle-btn${autoRotate ? ' is-on' : ''}`}
              title="卡帶自動旋轉展示"
              aria-label="卡帶自動旋轉展示"
              onClick={() => setAutoRotate((a) => !a)}
            >
              <RefreshCw className="ui-icon" />
            </button>
          </div>

          <div className="stage-angle-row" role="group" aria-label="視角">
          <button
            type="button"
            className="angle-btn"
            title="正面"
            aria-label="正面"
            onClick={() => handleTriggerAnglePreset('front')}
          >
            <Box className="ui-icon" />
          </button>
          <button
            type="button"
            className="angle-btn"
            title="側面"
            aria-label="側面"
            onClick={() => handleTriggerAnglePreset('side')}
          >
            <PanelLeft className="ui-icon" />
          </button>
          <button
            type="button"
            className="angle-btn"
            title="背面"
            aria-label="背面"
            onClick={() => handleTriggerAnglePreset('back')}
          >
            <FlipHorizontal2 className="ui-icon" />
          </button>
          <button
            type="button"
            className="angle-btn"
            title="斜角"
            aria-label="斜角"
            onClick={() => handleTriggerAnglePreset('iso')}
          >
            <Axis3D className="ui-icon" />
          </button>
          </div>
        </div>
      </div>

      <footer className="studio-deck">
        <div className="deck-group">
          <div className="segment" role="group" aria-label="拖曳模式">
            <button
              type="button"
              title="拖曳旋轉"
              aria-label="旋轉"
              onClick={() => setInteractionMode('rotate')}
              className={`tool-btn${interactionMode === 'rotate' ? ' is-on' : ''}`}
            >
              <Rotate3d className="ui-icon" />
            </button>
            <button
              type="button"
              title="拖曳移動"
              aria-label="移動"
              onClick={() => setInteractionMode('move')}
              className={`tool-btn${interactionMode === 'move' ? ' is-on' : ''}`}
            >
              <Move className="ui-icon" />
            </button>
          </div>

          <button
            type="button"
            title="重設"
            aria-label="重設"
            onClick={handleResetAll}
            className="tool-btn round"
          >
            <RotateCcw className="ui-icon" />
          </button>
        </div>

        <div className="deck-group">
          <div className="zoom" title="縮放">
            <button
              type="button"
              className="icon-btn"
              title="縮小"
              aria-label="縮小"
              onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(2))))}
            >
              <ZoomOut className="ui-icon" />
            </button>
            <input
              type="range"
              min={0.7}
              max={1.75}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              aria-label="縮放"
              className="cassette-zoom-slider"
            />
            <button
              type="button"
              className="icon-btn"
              title="放大"
              aria-label="放大"
              onClick={() => setZoom((z) => Math.min(1.75, Number((z + 0.1).toFixed(2))))}
            >
              <ZoomIn className="ui-icon" />
            </button>
            <span className="zoom-value" title="縮放比例">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <button
            type="button"
            className="icon-btn round"
            title={isFullscreen ? '離開全螢幕' : '全螢幕'}
            aria-label={isFullscreen ? '離開全螢幕' : '全螢幕'}
            onClick={handleToggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="ui-icon" /> : <Maximize2 className="ui-icon" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
