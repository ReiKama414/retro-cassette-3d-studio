import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, useEnvironment } from '@react-three/drei';
import gsap from 'gsap';
import { CassetteConfig } from '../types/cassette';
import { CassetteModel } from './CassetteModel';

export type InteractionMode = 'rotate' | 'move';
export type CameraAnglePreset = 'front' | 'side' | 'back' | 'iso' | null;

interface SingleCassetteSceneProps {
  config: CassetteConfig;
  isPlaying: boolean;
  autoRotate: boolean;
  interactionMode: InteractionMode;
  positionOffset: { x: number; y: number };
  onPositionOffsetChange: (next: { x: number; y: number }) => void;
  anglePresetSignal: { preset: CameraAnglePreset; seq: number };
  zoom: number;
  resetSignal: number;
  reducedMotion: boolean;
  onTogglePlay: () => void;
  onRotationTelemetry?: (degY: number, sideLabel: string) => void;
  onZoomChange: (newZoom: number) => void;
}

interface InternalDragBridge {
  onDown: (clientX: number, clientY: number, button: number, shiftKey: boolean) => void;
  onMove: (clientX: number, clientY: number) => void;
  onUp: () => void;
}

export function sampleChoreography(progress: number): { x: number; y: number; z: number } {
  const t = ((progress % 1) + 1) % 1;
  const twoPi = Math.PI * 2;

  const y =
    twoPi * t +
    0.16 * Math.sin(twoPi * t * 2) -
    0.08 * Math.sin(twoPi * t);

  const x =
    0.06 * Math.cos(twoPi * t) +
    0.15 * Math.sin(twoPi * t * 2 - 0.4);
  const z =
    -0.04 * Math.sin(twoPi * t) +
    0.07 * Math.cos(twoPi * t * 3);

  return { x, y, z };
}

/** Fires after the scene has painted at least one real frame (avoids flashing the loader off too early). */
function SceneReadyNotifier({ onReady }: { onReady: () => void }) {
  const frameCountRef = useRef(0);
  const notifiedRef = useRef(false);
  useFrame(() => {
    if (notifiedRef.current) return;
    frameCountRef.current += 1;
    if (frameCountRef.current >= 2) {
      notifiedRef.current = true;
      onReady();
    }
  });
  return null;
}

const CassetteSceneContent: React.FC<
  SingleCassetteSceneProps & {
    dragBridgeRef: React.MutableRefObject<InternalDragBridge | null>;
    onFirstFrame?: () => void;
  }
> = ({
  config,
  isPlaying,
  autoRotate,
  interactionMode,
  positionOffset,
  onPositionOffsetChange,
  anglePresetSignal,
  zoom,
  resetSignal,
  reducedMotion,
  onTogglePlay,
  onRotationTelemetry,
  dragBridgeRef,
  onFirstFrame,
}) => {
  const moveGroupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const shadowAnchorRef = useRef<THREE.Group>(null);
  const shadowBoundsRef = useRef(new THREE.Box3());
  const shadowPointRef = useRef(new THREE.Vector3());
  const { camera, size } = useThree();
  const positionOffsetRef = useRef(positionOffset);
  useEffect(() => {
    positionOffsetRef.current = positionOffset;
  }, [positionOffset]);

  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);
  const activeGestureModeRef = useRef<InteractionMode>('rotate');
  const prevPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

  const animStateRef = useRef({
    progress: 0,
    offsetY: 0,
    offsetX: 0,
    offsetZ: 0,
  });
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const state = animStateRef.current;
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(state, {
      progress: 1,
      duration: 18,
      ease: 'none',
    });
    timelineRef.current = tl;
    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    if (autoRotate && !reducedMotion && !isDraggingRef.current) {
      tl.play();
    } else {
      tl.pause();
    }
  }, [isPlaying, autoRotate, reducedMotion]);

  // Smoothly animate XY position offset when changed via UI buttons or dragging
  useEffect(() => {
    if (!moveGroupRef.current) return;
    gsap.to(moveGroupRef.current.position, {
      x: positionOffset.x,
      y: positionOffset.y,
      duration: 0.25,
      ease: 'power2.out',
    });
  }, [positionOffset]);

  // Smoothly animate to a specific camera angle preset (Front, Side, Back, Isometric)
  useEffect(() => {
    if (anglePresetSignal.seq === 0 || !pivotRef.current) return;
    const preset = anglePresetSignal.preset;
    if (!preset) return;

    const state = animStateRef.current;
    const pose = sampleChoreography(state.progress);
    let targetX = 0.04;
    let targetY = 0;
    let targetZ = 0;

    if (preset === 'front') {
      targetX = 0.04;
      targetY = 0;
    } else if (preset === 'side') {
      targetX = 0.12;
      targetY = Math.PI / 2;
    } else if (preset === 'back') {
      targetX = -0.06;
      targetY = Math.PI;
    } else if (preset === 'iso') {
      targetX = 0.28;
      targetY = -0.62;
      targetZ = 0.06;
    }

    state.offsetX = targetX - pose.x;
    state.offsetY = targetY - pose.y;
    state.offsetZ = targetZ - pose.z;

    gsap.to(pivotRef.current.rotation, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 0.65,
      ease: 'power3.out',
    });
  }, [anglePresetSignal]);

  // Smoothly reset orientation and position when resetSignal increments
  useEffect(() => {
    if (resetSignal === 0 || !pivotRef.current) return;
    const state = animStateRef.current;
    gsap.killTweensOf(state);
    gsap.killTweensOf(pivotRef.current.rotation);

    const basePose = sampleChoreography(0);
    gsap.to(state, {
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      progress: 0,
      duration: 0.75,
      ease: 'power3.out',
    });

    gsap.to(pivotRef.current.rotation, {
      x: basePose.x,
      y: basePose.y,
      z: basePose.z,
      duration: 0.75,
      ease: 'power3.out',
    });
  }, [resetSignal]);

  // Keep the whole shell inside the stage. Zoom pulls in from that fitted distance,
  // and a narrow viewport backs the camera up so the wide face is not cropped.
  useEffect(() => {
    if (size.width < 2 || size.height < 2) return;
    const fov = 'fov' in camera ? camera.fov : 35;
    const fovRad = (fov * Math.PI) / 180;
    const aspect = size.width / size.height;
    const zoomFactor = Math.max(0.65, Math.min(1.85, zoom));
    // Extra frame room so the default zoom still clears the corner controls.
    const frame = 1.72;
    const neededH = (2.04 * frame) / zoomFactor;
    const neededW = (3.2 * frame) / zoomFactor;
    const halfTan = Math.tan(fovRad / 2);
    const targetZ = Math.max(neededH / (2 * halfTan), neededW / (2 * halfTan * aspect));
    gsap.to(camera.position, {
      z: targetZ,
      y: -0.18,
      duration: 0.35,
      ease: 'power2.out',
      onUpdate: () => camera.lookAt(0, -0.12, 0),
    });
  }, [zoom, camera, size.width, size.height]);

  // Expose pointer drag callbacks (supports both Rotate and Move/Pan)
  useEffect(() => {
    dragBridgeRef.current = {
      onDown: (clientX: number, clientY: number, button: number, shiftKey: boolean) => {
        isDraggingRef.current = true;
        dragDistanceRef.current = 0;
        prevPointerPosRef.current = { x: clientX, y: clientY };
        // Right-click or Shift+Drag automatically pans/moves, otherwise use selected interactionMode
        activeGestureModeRef.current =
          button === 2 || shiftKey ? 'move' : interactionMode;
        timelineRef.current?.pause();
      },
      onMove: (clientX: number, clientY: number) => {
        if (!isDraggingRef.current || !pivotRef.current) return;
        const dx = clientX - prevPointerPosRef.current.x;
        const dy = clientY - prevPointerPosRef.current.y;
        prevPointerPosRef.current = { x: clientX, y: clientY };
        dragDistanceRef.current += Math.hypot(dx, dy);

        if (activeGestureModeRef.current === 'move') {
          const moveSpeed = 0.0042;
          const prev = positionOffsetRef.current;
          const next = {
            x: Number(THREE.MathUtils.clamp(prev.x + dx * moveSpeed, -1.5, 1.5).toFixed(3)),
            y: Number(THREE.MathUtils.clamp(prev.y - dy * moveSpeed, -1.0, 1.0).toFixed(3)),
          };
          positionOffsetRef.current = next;
          onPositionOffsetChange(next);
        } else {
          const rotSpeed = 0.0085;
          pivotRef.current.rotation.y += dx * rotSpeed;
          pivotRef.current.rotation.x = THREE.MathUtils.clamp(
            pivotRef.current.rotation.x + dy * rotSpeed,
            -Math.PI / 2.2,
            Math.PI / 2.2
          );
        }
      },
      onUp: () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;

        if (dragDistanceRef.current < 6) {
          onTogglePlay();
        } else if (pivotRef.current && activeGestureModeRef.current === 'rotate') {
          const state = animStateRef.current;
          const pose = sampleChoreography(state.progress);

          state.offsetY = pivotRef.current.rotation.y - pose.y;
          state.offsetX = pivotRef.current.rotation.x - pose.x;
          state.offsetZ = pivotRef.current.rotation.z - pose.z;

          gsap.to(state, {
            offsetX: 0,
            offsetZ: 0,
            duration: 2.4,
            ease: 'power2.out',
          });
        }

        if (autoRotate && !reducedMotion) {
          timelineRef.current?.play();
        }
      },
    };
  }, [
    dragBridgeRef,
    interactionMode,
    onPositionOffsetChange,
    isPlaying,
    autoRotate,
    reducedMotion,
    onTogglePlay,
  ]);

  useFrame(() => {
    if (!pivotRef.current) return;

    if (!isDraggingRef.current && autoRotate && !reducedMotion) {
      const state = animStateRef.current;
      const pose = sampleChoreography(state.progress);
      const targetX = pose.x + state.offsetX;
      const targetY = pose.y + state.offsetY;
      const targetZ = pose.z + state.offsetZ;

      pivotRef.current.rotation.x = THREE.MathUtils.lerp(
        pivotRef.current.rotation.x,
        targetX,
        0.16
      );
      pivotRef.current.rotation.y = THREE.MathUtils.lerp(
        pivotRef.current.rotation.y,
        targetY,
        0.16
      );
      pivotRef.current.rotation.z = THREE.MathUtils.lerp(
        pivotRef.current.rotation.z,
        targetZ,
        0.16
      );
    }

    if (onRotationTelemetry && pivotRef.current) {
      const rawDeg = THREE.MathUtils.radToDeg(pivotRef.current.rotation.y);
      const normDeg = ((Math.round(rawDeg) % 360) + 360) % 360;
      const isBack = normDeg > 105 && normDeg < 255;
      const isSide =
        (normDeg >= 65 && normDeg <= 105) || (normDeg >= 255 && normDeg <= 295);
      const label = isSide ? '側面' : isBack ? '背面' : '正面';
      onRotationTelemetry(normDeg, label);
    }

    if (shadowAnchorRef.current && pivotRef.current && moveGroupRef.current) {
      const bounds = shadowBoundsRef.current;
      bounds.setFromObject(pivotRef.current);
      const point = shadowPointRef.current;
      point.set(
        (bounds.min.x + bounds.max.x) * 0.5,
        bounds.min.y - 0.05,
        (bounds.min.z + bounds.max.z) * 0.5
      );
      moveGroupRef.current.worldToLocal(point);
      shadowAnchorRef.current.position.copy(point);
    }
  });

  return (
    <>
      <ambientLight intensity={0.52} />
      <directionalLight
        position={[4.5, 6.0, 5.5]}
        intensity={0.95}
      />
      <directionalLight position={[-4.2, 3.2, -3.4]} intensity={0.38} color="#d7dde6" />
      <directionalLight position={[0.4, 1.4, 4.2]} intensity={0.22} color="#fff4e6" />

      <group ref={moveGroupRef}>
        <group
          ref={pivotRef}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <CassetteModel
            config={config}
            isPlaying={isPlaying}
            isHovered={isHovered}
            reducedMotion={reducedMotion}
          />
        </group>

        <group ref={shadowAnchorRef}>
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.38}
            scale={4.6}
            blur={3.2}
            far={2.1}
            color="#030303"
            frames={Infinity}
            resolution={512}
          />
        </group>
      </group>

      {/* HDR loads in parallel; does not gate the cassette */}
      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={0.32} />
      </Suspense>

      {onFirstFrame ? <SceneReadyNotifier onReady={onFirstFrame} /> : null}
    </>
  );
};

export const CassetteCanvas: React.FC<SingleCassetteSceneProps> = (props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragBridgeRef = useRef<InternalDragBridge | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(props.zoom);
  const [sceneReady, setSceneReady] = useState(false);

  const handleFirstFrame = useCallback(() => {
    setSceneReady(true);
  }, []);

  useEffect(() => {
    useEnvironment.preload({ preset: 'studio' });
  }, []);

  useEffect(() => {
    if (sceneReady) return;
    const failSafe = window.setTimeout(() => setSceneReady(true), 12_000);
    return () => window.clearTimeout(failSafe);
  }, [sceneReady]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // Fiber measures the canvas on window resize. The first ResizeObserver
    // pass can be dropped, which leaves the drawing buffer at 300×150.
    const poke = () => window.dispatchEvent(new Event('resize'));
    poke();
    const observer = new ResizeObserver(() => poke());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0012;
      const next = Math.min(1.75, Math.max(0.7, Number((props.zoom + delta).toFixed(2))));
      props.onZoomChange(next);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [props]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragBridgeRef.current?.onDown(e.clientX, e.clientY, e.button, e.shiftKey);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragBridgeRef.current?.onMove(e.clientX, e.clientY);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if already released
    }
    dragBridgeRef.current?.onUp();
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = props.zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / Math.max(1, pinchStartDistRef.current);
      const next = Math.min(
        1.75,
        Math.max(0.7, Number((pinchStartZoomRef.current * scale).toFixed(2)))
      );
      props.onZoomChange(next);
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  return (
    <div
      ref={wrapperRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full h-full select-none touch-none ${
        props.interactionMode === 'move'
          ? 'cursor-move'
          : 'cursor-grab active:cursor-grabbing'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-busy={!sceneReady}
    >
      <div
        className={`stage-loader${sceneReady ? ' is-done' : ''}`}
        aria-hidden={sceneReady}
        aria-live="polite"
      >
        <span className="stage-loader-ring" aria-hidden="true" />
        <span className="stage-loader-label">載入 3D 場景</span>
      </div>

      <Canvas
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        dpr={[1, typeof window !== 'undefined' && window.innerWidth < 768 ? 1.5 : 2]}
        camera={{ position: [0, 0, 3.25], fov: 35, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
      >
        <CassetteSceneContent
          {...props}
          dragBridgeRef={dragBridgeRef}
          onFirstFrame={handleFirstFrame}
        />
      </Canvas>
    </div>
  );
};
