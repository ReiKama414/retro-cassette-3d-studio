import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CassetteConfig } from '../types/cassette';
import { createBackShellTexture, createFrontStickerTexture } from '../utils/stickerTexture';

interface CassetteModelProps {
  config: CassetteConfig;
  isPlaying: boolean;
  isHovered: boolean;
  reducedMotion: boolean;
}

/**
 * Creates a 2D rounded rectangle THREE.Shape centered at (0, 0)
 */
function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/**
 * Creates a stadium / pill path centered at (cx, cy) for the central cassette window hole
 */
function createStadiumPath(cx: number, cy: number, width: number, height: number): THREE.Path {
  const path = new THREE.Path();
  const r = height / 2;
  const halfStraight = Math.max(0, (width - height) / 2);
  path.absarc(cx - halfStraight, cy, r, -Math.PI / 2, Math.PI / 2, true);
  path.absarc(cx + halfStraight, cy, r, Math.PI / 2, -Math.PI / 2, true);
  path.closePath();
  return path;
}

export const CassetteModel: React.FC<CassetteModelProps> = ({
  config,
  isPlaying,
  isHovered,
  reducedMotion,
}) => {
  const leftReelRef = useRef<THREE.Group>(null);
  const rightReelRef = useRef<THREE.Group>(null);
  const hoverGroupRef = useRef<THREE.Group>(null);

  // Dimensions of the Compact Cassette in 3D units (10:6.35 aspect ratio with realistic thickness)
  const W = 3.2;
  const H = 2.04;
  const halfDepth = 0.165; // Front half & Back half each ~0.165 + bevel => total shell thickness ~0.38

  // 1. Procedural Geometries (memoized & properly disposed on unmount)
  const geometries = useMemo(() => {
    // Outer shell half with central stadium window hole
    const shellShape = createRoundedRectShape(W, H, 0.12);
    const windowHole = createStadiumPath(0, 0.12, 1.84, 0.72);
    shellShape.holes.push(windowHole);

    const shellHalfGeo = new THREE.ExtrudeGeometry(shellShape, {
      depth: halfDepth,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 4,
      curveSegments: 28,
    });

    // Bottom trapezoidal raised head-housing block (characteristic cassette step)
    const trapShape = new THREE.Shape();
    const twBottom = 2.26;
    const twTop = 2.08;
    const th = 0.42;
    trapShape.moveTo(-twBottom / 2, -th / 2);
    trapShape.lineTo(twBottom / 2, -th / 2);
    trapShape.lineTo(twTop / 2, th / 2);
    trapShape.lineTo(-twTop / 2, th / 2);
    trapShape.closePath();

    const trapezoidGeo = new THREE.ExtrudeGeometry(trapShape, {
      depth: 0.43,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 3,
    });
    trapezoidGeo.center();

    // Central transparent window lens geometry (stadium shape)
    const lensShape = new THREE.Shape();
    const lr = 0.355;
    const lHalf = (1.84 - 0.71) / 2;
    lensShape.absarc(-lHalf, 0, lr, -Math.PI / 2, Math.PI / 2, false);
    lensShape.absarc(lHalf, 0, lr, Math.PI / 2, -Math.PI / 2, false);
    lensShape.closePath();
    // Cut out two reel holes in the clear window or keep clear acrylic over middle and open over reel hubs
    const leftHole = new THREE.Path();
    leftHole.absarc(-0.56, 0, 0.21, 0, Math.PI * 2, true);
    const rightHole = new THREE.Path();
    rightHole.absarc(0.56, 0, 0.21, 0, Math.PI * 2, true);
    lensShape.holes.push(leftHole, rightHole);

    const windowLensGeo = new THREE.ExtrudeGeometry(lensShape, {
      depth: 0.022,
      bevelEnabled: false,
      curveSegments: 32,
    });
    windowLensGeo.center();

    // Sticker plane geometry
    const stickerGeo = new THREE.PlaneGeometry(2.96, 1.56);

    // Reel hub ring (outer hub + inner hole)
    const reelHubShape = new THREE.Shape();
    reelHubShape.absarc(0, 0, 0.235, 0, Math.PI * 2, false);
    const reelInnerHole = new THREE.Path();
    reelInnerHole.absarc(0, 0, 0.145, 0, Math.PI * 2, true);
    reelHubShape.holes.push(reelInnerHole);

    const reelHubGeo = new THREE.ExtrudeGeometry(reelHubShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 32,
    });
    reelHubGeo.center();

    // White inner toothed ring
    const teethRingShape = new THREE.Shape();
    teethRingShape.absarc(0, 0, 0.16, 0, Math.PI * 2, false);
    const teethHole = new THREE.Path();
    teethHole.absarc(0, 0, 0.115, 0, Math.PI * 2, true);
    teethRingShape.holes.push(teethHole);
    const teethRingGeo = new THREE.ExtrudeGeometry(teethRingShape, {
      depth: 0.27,
      bevelEnabled: false,
      curveSegments: 28,
    });
    teethRingGeo.center();

    // Single tooth box for reel sprocket (6 teeth per reel)
    const toothGeo = new THREE.BoxGeometry(0.036, 0.055, 0.27);

    // Left & Right Magnetic Tape Pancake Rolls
    const createTapeRollGeo = (outerRadius: number) => {
      const s = new THREE.Shape();
      s.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
      const h = new THREE.Path();
      h.absarc(0, 0, 0.24, 0, Math.PI * 2, true);
      s.holes.push(h);
      const geo = new THREE.ExtrudeGeometry(s, {
        depth: 0.22,
        bevelEnabled: false,
        curveSegments: 48,
      });
      geo.center();
      return geo;
    };

    const leftTapeGeo = createTapeRollGeo(config.leftTapeRadius);
    const rightTapeGeo = createTapeRollGeo(config.rightTapeRadius);

    // Corner guide roller geometry
    const rollerGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.25, 24);
    rollerGeo.rotateX(Math.PI / 2);

    const rollerPinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.34, 16);
    rollerPinGeo.rotateX(Math.PI / 2);

    // Screw boss & metallic screw head
    const screwBossGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.36, 20);
    screwBossGeo.rotateX(Math.PI / 2);

    const screwHeadGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.39, 16);
    screwHeadGeo.rotateX(Math.PI / 2);

    return {
      shellHalfGeo,
      trapezoidGeo,
      windowLensGeo,
      stickerGeo,
      reelHubGeo,
      teethRingGeo,
      toothGeo,
      leftTapeGeo,
      rightTapeGeo,
      rollerGeo,
      rollerPinGeo,
      screwBossGeo,
      screwHeadGeo,
    };
  }, [config.leftTapeRadius, config.rightTapeRadius]);

  // 2. Procedural Textures (Front sticker + Back silkscreen)
  const textures = useMemo(() => {
    const frontSticker = createFrontStickerTexture(config);
    const backShell = createBackShellTexture(config);
    return { frontSticker, backShell };
  }, [config]);

  // 3. Clean up geometries & textures on unmount to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geo) => geo.dispose());
      textures.frontSticker.dispose();
      textures.backShell.dispose();
    };
  }, [geometries, textures]);

  // 4. Spin the two tape spools & subtle hover scale response on each frame
  useFrame((_, delta) => {
    if (isPlaying && !reducedMotion) {
      const spinSpeed = 1.35;
      if (leftReelRef.current) {
        leftReelRef.current.rotation.z -= delta * spinSpeed;
      }
      if (rightReelRef.current) {
        rightReelRef.current.rotation.z -= delta * spinSpeed * 1.25;
      }
    }

    if (hoverGroupRef.current) {
      const targetScale = isHovered ? 1.035 : 1.0;
      hoverGroupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        Math.min(1, delta * 10)
      );
    }
  });

  // 5 screw positions matching authentic Compact Cassette layout (4 corners + 1 bottom center)
  const screwPositions: [number, number][] = [
    [-1.46, 0.88],
    [1.46, 0.88],
    [-1.46, -0.86],
    [1.46, -0.86],
    [0.0, -0.89],
  ];

  return (
    <group ref={hoverGroupRef}>
      {/* =====================================================================
          1. FRONT TRANSLUCENT POLYCARBONATE SHELL HALF (Z: +0.008 to +0.173)
         ===================================================================== */}
      <mesh
        geometry={geometries.shellHalfGeo}
        position={[0, 0, 0.008]}
      >
        <meshPhysicalMaterial
          color={config.shellColorFront}
          attenuationColor={config.attenuationColor}
          attenuationDistance={0.85}
          transmission={config.transmission}
          transparent
          opacity={config.opacity}
          roughness={Math.max(config.roughness, 0.24)}
          metalness={0.04}
          ior={1.49}
          thickness={0.35}
          clearcoat={Math.min(config.clearcoat, 0.62)}
          clearcoatRoughness={0.34}
          envMapIntensity={0.38}
        />
      </mesh>

      {/* =====================================================================
          2. BACK TRANSLUCENT POLYCARBONATE SHELL HALF (Z: -0.173 to -0.008)
         ===================================================================== */}
      <mesh
        geometry={geometries.shellHalfGeo}
        position={[0, 0, -0.173]}
      >
        <meshPhysicalMaterial
          color={config.shellColorBack}
          attenuationColor={config.attenuationColor}
          attenuationDistance={0.85}
          transmission={config.transmission}
          transparent
          opacity={config.opacity}
          roughness={Math.max(config.roughness, 0.24)}
          metalness={0.05}
          ior={1.49}
          thickness={0.35}
          clearcoat={Math.min(config.clearcoat, 0.62)}
          clearcoatRoughness={0.34}
          envMapIntensity={0.38}
        />
      </mesh>

      {/* Perimeter Seam Rim between Front & Back Shell Halves (Gives crisp side profile detail) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[W - 0.02, H - 0.02, 0.014]} />
        <meshStandardMaterial
          color={config.edgeAccentColor}
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* =====================================================================
          3. BOTTOM TRAPEZOIDAL HEAD-ACCESS STEP & MAGNETIC HEAD CAVITIES
         ===================================================================== */}
      <group position={[0, -0.78, 0]}>
        {/* Outer translucent trapezoid step */}
        <mesh geometry={geometries.trapezoidGeo}>
          <meshPhysicalMaterial
            color={config.shellColorFront}
            transmission={config.transmission * 0.9}
            transparent
            opacity={config.opacity + 0.04}
            roughness={config.roughness}
            metalness={0.05}
            ior={1.49}
            thickness={0.42}
            clearcoat={0.45}
            clearcoatRoughness={0.28}
            envMapIntensity={0.32}
          />
        </mesh>

        {/* Bottom 3 Rectangular Tape Head / Pinch Roller Openings */}
        {[-0.68, 0, 0.68].map((ox, idx) => (
          <mesh key={idx} position={[ox, -0.15, 0]}>
            <boxGeometry args={[idx === 1 ? 0.52 : 0.42, 0.14, 0.34]} />
            <meshStandardMaterial color="#140c12" roughness={0.8} metalness={0.2} />
          </mesh>
        ))}

        {/* Center Metallic Mu-Metal Head Shield & Felt Pressure Pad */}
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[0.38, 0.16, 0.26]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <boxGeometry args={[0.18, 0.06, 0.22]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.9} />
        </mesh>

        {/* Capstan & Alignment Guide Holes in Trapezoid */}
        {[-0.88, -0.42, 0.42, 0.88].map((hx, i) => (
          <mesh key={i} position={[hx, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.45, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
      </group>

      {/* =====================================================================
          4. CLEAR ACRYLIC CENTRAL WINDOW LENSES (Front & Back)
         ===================================================================== */}
      <mesh geometry={geometries.windowLensGeo} position={[0, 0.12, 0.185]}>
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.88}
          transparent
          opacity={0.34}
          roughness={0.16}
          metalness={0.0}
          ior={1.5}
          clearcoat={0.32}
          clearcoatRoughness={0.35}
          envMapIntensity={0.2}
        />
      </mesh>
      <mesh geometry={geometries.windowLensGeo} position={[0, 0.12, -0.185]}>
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.88}
          transparent
          opacity={0.34}
          roughness={0.16}
          metalness={0.0}
          ior={1.5}
          clearcoat={0.32}
          clearcoatRoughness={0.35}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* =====================================================================
          5. FRONT RETRO STICKER ("COSMIC Playlist") & BACK EMBOSSED SHELL PLATE
         ===================================================================== */}
      {/* Front Sticker Mesh */}
      <mesh geometry={geometries.stickerGeo} position={[0, 0.12, 0.201]}>
        <meshPhysicalMaterial
          map={textures.frontSticker}
          transparent
          alphaTest={0.05}
          roughness={0.22}
          metalness={0.08}
          clearcoat={0.65}
          clearcoatRoughness={0.18}
        />
      </mesh>

      {/* Back side of the front sticker (visible through the translucent back shell!) */}
      <mesh
        geometry={geometries.stickerGeo}
        position={[0, 0.12, 0.197]}
        rotation={[0, Math.PI, 0]}
      >
        <meshStandardMaterial
          map={textures.frontSticker}
          transparent
          alphaTest={0.05}
          color="#fbcfe8"
          roughness={0.6}
        />
      </mesh>

      {/* Back Shell Technical Imprint / Embossed Details (Visible when rotated to Back) */}
      <mesh
        geometry={geometries.stickerGeo}
        position={[0, 0.12, -0.201]}
        rotation={[0, Math.PI, 0]}
      >
        <meshPhysicalMaterial
          map={textures.backShell}
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.8}
        />
      </mesh>

      {/* =====================================================================
          6. DUAL ROTATING MAGNETIC TAPE REELS / SPOOLS (LEFT & RIGHT)
         ===================================================================== */}
      {/* Left Spool + Magnetic Tape Pancake */}
      <group position={[-0.56, 0.12, 0]} ref={leftReelRef}>
        {/* Magnetic Tape Pack (Dark Oxide Ribbon Roll) */}
        <mesh geometry={geometries.leftTapeGeo}>
          <meshStandardMaterial
            color={config.tapePackColor}
            roughness={0.32}
            metalness={0.25}
          />
        </mesh>
        {/* Outer Black Spool Hub */}
        <mesh geometry={geometries.reelHubGeo}>
          <meshStandardMaterial
            color={config.reelHubColor}
            roughness={0.28}
            metalness={0.18}
          />
        </mesh>
        {/* Inner White/Light Sprocket Ring */}
        <mesh geometry={geometries.teethRingGeo}>
          <meshStandardMaterial
            color={config.reelTeethColor}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
        {/* 6 Radial Sprocket Teeth */}
        {[0, 1, 2, 3, 4, 5].map((t) => {
          const angle = (t * Math.PI) / 3;
          const r = 0.102;
          return (
            <mesh
              key={t}
              geometry={geometries.toothGeo}
              position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}
              rotation={[0, 0, angle]}
            >
              <meshStandardMaterial
                color={config.reelTeethColor}
                roughness={0.25}
                metalness={0.1}
              />
            </mesh>
          );
        })}
      </group>

      {/* Right Spool + Magnetic Tape Pancake */}
      <group position={[0.56, 0.12, 0]} ref={rightReelRef}>
        {/* Magnetic Tape Pack */}
        <mesh geometry={geometries.rightTapeGeo}>
          <meshStandardMaterial
            color={config.tapePackColor}
            roughness={0.32}
            metalness={0.25}
          />
        </mesh>
        {/* Outer Black Spool Hub */}
        <mesh geometry={geometries.reelHubGeo}>
          <meshStandardMaterial
            color={config.reelHubColor}
            roughness={0.28}
            metalness={0.18}
          />
        </mesh>
        {/* Inner White/Light Sprocket Ring */}
        <mesh geometry={geometries.teethRingGeo}>
          <meshStandardMaterial
            color={config.reelTeethColor}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
        {/* 6 Radial Sprocket Teeth */}
        {[0, 1, 2, 3, 4, 5].map((t) => {
          const angle = (t * Math.PI) / 3;
          const r = 0.102;
          return (
            <mesh
              key={t}
              geometry={geometries.toothGeo}
              position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}
              rotation={[0, 0, angle]}
            >
              <meshStandardMaterial
                color={config.reelTeethColor}
                roughness={0.25}
                metalness={0.1}
              />
            </mesh>
          );
        })}
      </group>

      {/* =====================================================================
          7. INTERNAL MOLDED RIBS, GUIDE ROLLERS & MAGNETIC TAPE RIBBON PATH
         ===================================================================== */}
      {/* Bottom-Left & Bottom-Right Guide Rollers */}
      {[-1.24, 1.24].map((rx, idx) => (
        <group key={idx} position={[rx, -0.68, 0]}>
          <mesh geometry={geometries.rollerGeo}>
            <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh geometry={geometries.rollerPinGeo}>
            <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Visible Magnetic Tape Ribbon Threading from Reels to Bottom Guide Rollers */}
      {/* Left tape segment */}
      <mesh position={[-1.08, -0.28, 0]} rotation={[0, 0, -0.34]}>
        <boxGeometry args={[0.018, 0.88, 0.21]} />
        <meshStandardMaterial color={config.tapePackColor} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Right tape segment */}
      <mesh position={[0.98, -0.28, 0]} rotation={[0, 0, 0.44]}>
        <boxGeometry args={[0.018, 0.88, 0.21]} />
        <meshStandardMaterial color={config.tapePackColor} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Bottom horizontal tape ribbon running across the head opening */}
      <mesh position={[0, -0.78, 0]}>
        <boxGeometry args={[2.48, 0.018, 0.21]} />
        <meshStandardMaterial color={config.tapePackColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Internal Structural Plastic Ribs (Refracting light inside the translucent shell) */}
      <mesh position={[0, 0.94, 0]}>
        <boxGeometry args={[2.75, 0.03, 0.28]} />
        <meshPhysicalMaterial
          color={config.edgeAccentColor}
          transmission={0.5}
          transparent
          opacity={0.65}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-0.95, -0.45, 0]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.75, 0.028, 0.26]} />
        <meshPhysicalMaterial
          color={config.edgeAccentColor}
          transmission={0.5}
          transparent
          opacity={0.6}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0.95, -0.45, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.75, 0.028, 0.26]} />
        <meshPhysicalMaterial
          color={config.edgeAccentColor}
          transmission={0.5}
          transparent
          opacity={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Top Edge Write-Protect Tabs (Authentic Cassette Top Edge Detail) */}
      {[-1.12, 1.12].map((tx, idx) => (
        <mesh key={idx} position={[tx, 0.99, 0]}>
          <boxGeometry args={[0.24, 0.06, 0.26]} />
          <meshStandardMaterial color={config.edgeAccentColor} roughness={0.3} metalness={0.1} />
        </mesh>
      ))}

      {/* =====================================================================
          8. FIVE RECESSED SCREW BOSSES & METALLIC SCREWS
         ===================================================================== */}
      {screwPositions.map(([sx, sy], idx) => (
        <group key={idx} position={[sx, sy, 0]}>
          <mesh geometry={geometries.screwBossGeo}>
            <meshPhysicalMaterial
              color={config.shellColorBack}
              transmission={0.4}
              transparent
              opacity={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh geometry={geometries.screwHeadGeo}>
            <meshStandardMaterial
              color={config.screwColor}
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
