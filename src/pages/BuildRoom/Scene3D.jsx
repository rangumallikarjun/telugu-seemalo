import { useRef, useEffect, useMemo, useCallback, Suspense, forwardRef, useImperativeHandle } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Html, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { FurnitureShape } from "./furniture/models";
import useRoomBuilderStore from "../../store/roomBuilderStore";

// ── Procedural floor textures ─────────────────────────────────────────────────
function makeFloorTexture(type) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (type === "wood") {
    // Rich dark walnut — wide horizontal planks with grain
    ctx.fillStyle = "#5C3418";
    ctx.fillRect(0, 0, size, size);
    const pH = Math.floor(size / 6);
    const pW = Math.floor(size / 3);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 8; row++) {
        const off = col % 2 === 0 ? 0 : Math.floor(pH * 0.5);
        const x = col * pW;
        const y = row * pH - pH + off;
        const vr = Math.floor(Math.random() * 24 - 12);
        ctx.fillStyle = `rgb(${Math.min(120,Math.max(55,88+vr))},${Math.min(68,Math.max(28,46+Math.floor(vr*0.45)))},22)`;
        ctx.fillRect(x+1, y+1, pW-2, pH-2);
        for (let g = 0; g < 7; g++) {
          const gy = y + (g/7)*pH;
          ctx.strokeStyle = `rgba(0,0,0,${0.03+Math.random()*0.12})`;
          ctx.lineWidth = 0.4 + Math.random()*1.4;
          ctx.beginPath();
          ctx.moveTo(x, gy+Math.random()*4-2);
          ctx.bezierCurveTo(x+pW*0.33, gy+Math.random()*9-4.5, x+pW*0.67, gy+Math.random()*9-4.5, x+pW, gy+Math.random()*4-2);
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(0,0,0,0.42)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x+0.5, y+0.5, pW-1, pH-1);
      }
    }
  } else if (type === "marble") {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#F8F6F0");
    grad.addColorStop(0.4, "#EEEAE2");
    grad.addColorStop(0.7, "#F4F0E8");
    grad.addColorStop(1, "#F0EDE4");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(180,180,170,0.5)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.bezierCurveTo(
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size
      );
      ctx.stroke();
    }
  } else if (type === "tile") {
    ctx.fillStyle = "#E8E4DC";
    ctx.fillRect(0, 0, size, size);
    const tile = size / 8;
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= size; x += tile) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke(); }
    for (let y = 0; y <= size; y += tile) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
  } else if (type === "granite") {
    ctx.fillStyle = "#888880";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = `rgba(${100 + Math.random() * 80},${100 + Math.random() * 80},${80 + Math.random() * 60},0.4)`;
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (type === "grass") {
    ctx.fillStyle = "#4A8A3A";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = `rgba(${30 + Math.random() * 60},${100 + Math.random() * 80},${20 + Math.random() * 40},0.5)`;
      ctx.fillRect(x, y, 2, 3);
    }
  } else {
    ctx.fillStyle = "#C0C0B0";
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

// ── Wall sconce ───────────────────────────────────────────────────────────────
function WallSconce({ position, rotY = 0, intensityMul = 1.0 }) {
  const li = 1.1 * intensityMul;
  const ei = Math.max(0.6, 2.5 * intensityMul);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.17, 0.22, 0.09]} />
        <meshStandardMaterial color="#28201A" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.02, 0.047]}>
        <boxGeometry args={[0.13, 0.16, 0.008]} />
        <meshStandardMaterial color="#FFD070" emissive="#E07010" emissiveIntensity={ei} roughness={0.4} />
      </mesh>
      <pointLight position={[0, -0.05, 0.22]} intensity={li} distance={4.2} color="#FF8820" decay={2} castShadow={false} />
    </group>
  );
}

// ── Window on left wall ───────────────────────────────────────────────────────
function WindowUnit({ position, width = 1.4, height = 1.4, windowStyle = "large" }) {
  if (windowStyle === "none") return null;
  const fc = "#181C24";
  const isSmall  = windowStyle === "small";
  const isArched = windowStyle === "arched";

  const winW   = isSmall ? width  * 0.56 : width;
  const archR  = isArched ? Math.min(winW / 2, height * 0.32) : 0;
  const rectH  = height - archR;
  const rectOY = isArched ? -archR / 2 : 0;       // rect center offset in group
  const archY  = isArched ? rectOY + rectH / 2 : 0; // arch base Y in group

  return (
    <group position={position}>
      {/* outer frame (rectangle part) */}
      <mesh position={[0, rectOY, 0]}>
        <boxGeometry args={[0.10, rectH + 0.10, winW + 0.10]} />
        <meshStandardMaterial color={fc} roughness={0.4} metalness={0.55} />
      </mesh>
      {/* sky panel */}
      <mesh position={[-0.02, rectOY, 0]}>
        <boxGeometry args={[0.015, rectH - 0.06, winW - 0.06]} />
        <meshStandardMaterial color="#1A2A3E" roughness={0.1} />
      </mesh>
      {/* glass */}
      <mesh position={[0.025, rectOY, 0]}>
        <boxGeometry args={[0.015, rectH - 0.06, winW - 0.06]} />
        <meshStandardMaterial color="#4A7090" roughness={0.05} transparent opacity={0.55} />
      </mesh>
      {/* horizontal mid-divider (only large) */}
      {!isSmall && (
        <mesh position={[0.04, rectOY, 0]}>
          <boxGeometry args={[0.06, 0.05, winW + 0.02]} />
          <meshStandardMaterial color={fc} roughness={0.4} metalness={0.55} />
        </mesh>
      )}
      {/* vertical dividers (only large / arched) */}
      {!isSmall && [-winW / 3, winW / 3].map((z, i) => (
        <mesh key={i} position={[0.04, rectOY, z]}>
          <boxGeometry args={[0.06, rectH + 0.02, 0.05]} />
          <meshStandardMaterial color={fc} roughness={0.4} metalness={0.55} />
        </mesh>
      ))}

      {/* ── Arched top ── */}
      {isArched && (
        <>
          {/* arch sky fill */}
          <mesh position={[-0.01, archY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[archR - 0.04, 18, 0, Math.PI]} />
            <meshStandardMaterial color="#1A2A3E" roughness={0.1} />
          </mesh>
          {/* arch glass */}
          <mesh position={[0.025, archY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[archR - 0.04, 18, 0, Math.PI]} />
            <meshStandardMaterial color="#4A7090" roughness={0.05} transparent opacity={0.55} />
          </mesh>
          {/* arch frame ring */}
          <mesh position={[0.04, archY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[archR - 0.06, archR + 0.05, 18, 1, 0, Math.PI]} />
            <meshStandardMaterial color={fc} roughness={0.4} metalness={0.55} />
          </mesh>
        </>
      )}

      {/* cool sky point light into room */}
      <pointLight position={[1.2, 0, 0]} intensity={0.6} distance={5.5} color="#7AAED0" decay={2} castShadow={false} />
    </group>
  );
}

// ── Curtain panel ─────────────────────────────────────────────────────────────
function CurtainPanel({ position, height = 2.4, width = 0.75, curtainStyle = "panel", curtainColor = "#E8E0D0" }) {
  if (curtainStyle === "none") return null;

  const rod = (
    <mesh position={[0, height / 2 + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.013, 0.013, width + 0.16, 8]} />
      <meshStandardMaterial color="#4A3828" roughness={0.38} metalness={0.52} />
    </mesh>
  );

  if (curtainStyle === "roman") {
    const folds = 5;
    return (
      <group position={position}>
        <mesh castShadow>
          <boxGeometry args={[0.04, height, width - 0.02]} />
          <meshStandardMaterial color={curtainColor} roughness={0.90} />
        </mesh>
        {Array.from({ length: folds }, (_, i) => {
          const y = height / 2 - (i + 1) * (height / (folds + 1));
          return (
            <mesh key={i} position={[0.022, y, 0]}>
              <boxGeometry args={[0.016, 0.028, width - 0.06]} />
              <meshStandardMaterial color="#505050" roughness={0.95} />
            </mesh>
          );
        })}
        {/* top rail */}
        <mesh position={[0, height / 2 + 0.022, 0]}>
          <boxGeometry args={[0.07, 0.04, width + 0.10]} />
          <meshStandardMaterial color="#4A3828" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
    );
  }

  const isSheer = curtainStyle === "sheer";
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.05, height, width]} />
        <meshStandardMaterial
          color={curtainColor}
          roughness={0.92}
          transparent={isSheer}
          opacity={isSheer ? 0.42 : 1.0}
        />
      </mesh>
      {[-width * 0.28, 0, width * 0.28].map((z, i) => (
        <mesh key={i} position={[0.028, 0, z]}>
          <boxGeometry args={[0.006, height * 0.96, 0.03]} />
          <meshStandardMaterial
            color="#505050"
            roughness={0.95}
            transparent={isSheer}
            opacity={isSheer ? 0.25 : 1.0}
          />
        </mesh>
      ))}
      {rod}
    </group>
  );
}

// ── Room shell ────────────────────────────────────────────────────────────────
function RoomShell({ roomCfg, settings }) {
  const { w, d, h } = roomCfg;
  const t = 0.1;
  const floorTex = useMemo(() => makeFloorTexture(settings.floorType), [settings.floorType]);
  const wallColor = settings.wallColor;
  const isOpen = h === 0;

  // Back-wall sconces (face +z into room, rotY=0)
  const sconcesBack = w > 4
    ? [[-w * 0.28, h * 0.62, -d / 2 + 0.06], [0, h * 0.62, -d / 2 + 0.06], [w * 0.28, h * 0.62, -d / 2 + 0.06]]
    : [[-w * 0.22, h * 0.62, -d / 2 + 0.06], [w * 0.22, h * 0.62, -d / 2 + 0.06]];

  // Sconce intensity — bright/day modes don't need full sconce output
  const sconceIMul = { bright: 0.25, day: 0.55, evening: 1.0, night: 1.3 }[settings.lightMode || "day"] ?? 1.0;

  // Window on left wall
  const winW = Math.min(w * 0.44, 1.6);
  const winH = Math.min(h * 0.50, 1.52);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floorTex} roughness={0.52} metalness={0.06} />
      </mesh>

      {!isOpen && (
        <>
          {/* ceiling — dark for moody interior */}
          <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial
              color={settings.ceilingType === "wood" ? "#5C3820" : "#1C1C26"}
              roughness={0.85}
            />
          </mesh>

          {/* back wall */}
          <mesh position={[0, h / 2, -d / 2]} receiveShadow castShadow>
            <boxGeometry args={[w, h, t]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>
          {/* front wall (transparent) */}
          <mesh position={[0, h / 2, d / 2]}>
            <boxGeometry args={[w, h, t]} />
            <meshStandardMaterial color={wallColor} transparent opacity={0.15} roughness={0.88} />
          </mesh>
          {/* left wall */}
          <mesh position={[-w / 2, h / 2, 0]} receiveShadow castShadow>
            <boxGeometry args={[t, h, d]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>
          {/* right wall */}
          <mesh position={[w / 2, h / 2, 0]} receiveShadow castShadow>
            <boxGeometry args={[t, h, d]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>

          {/* ── Wall sconces — back wall ── */}
          {sconcesBack.map(([x, y, z], i) => (
            <WallSconce key={i} position={[x, y, z]} rotY={0} intensityMul={sconceIMul} />
          ))}

          {/* ── Sconce — right wall, faces -x into room ── */}
          <WallSconce position={[w / 2 - 0.06, h * 0.62, d * 0.05]} rotY={-Math.PI / 2} intensityMul={sconceIMul} />

          {/* ── Window — left wall ── */}
          <WindowUnit
            position={[-w / 2 + 0.07, h * 0.55, -d * 0.15]}
            width={winW}
            height={winH}
            windowStyle={settings.windowStyle || "large"}
          />

          {/* ── Curtain — beside window, toward front ── */}
          <CurtainPanel
            position={[-w / 2 + 0.07, h / 2, -d * 0.15 + winW / 2 + 0.42]}
            height={h * 0.90}
            width={0.70}
            curtainStyle={settings.curtainStyle || "panel"}
            curtainColor={settings.curtainColor || "#E8E0D0"}
          />

          {/* LED cove */}
          {settings.ceilingType === "led" && (
            <rectAreaLight
              position={[0, h - 0.05, 0]}
              width={w - 0.4}
              height={d - 0.4}
              intensity={2}
              color="#FFF5E0"
            />
          )}
        </>
      )}
    </group>
  );
}

// ── Snap helper ───────────────────────────────────────────────────────────────
function snapPos(x, z, gridSize) {
  return [
    Math.round(x / gridSize) * gridSize,
    Math.round(z / gridSize) * gridSize,
  ];
}

// ── Ghost item (follows cursor while placing) ─────────────────────────────────
function GhostItem({ item, roomCfg, snapToGrid, gridSize }) {
  const meshRef = useRef();
  const { raycaster, camera } = useThree();
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  useFrame(({ pointer }) => {
    if (!meshRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, hit);
    if (!hit) return;
    let x = hit.x, z = hit.z;
    if (snapToGrid) [x, z] = snapPos(x, z, gridSize);
    const halfH = (item.h || 0.5) / 2;
    meshRef.current.position.set(x, halfH, z);
  });

  return (
    <group ref={meshRef}>
      <FurnitureShape
        shape={item.shape}
        w={item.w || 1}
        d={item.d || 1}
        h={item.h || 0.5}
        color={item.color || "#8B7355"}
      />
      {/* ghost overlay */}
      <mesh>
        <boxGeometry args={[item.w || 1, item.h || 0.5, item.d || 1]} />
        <meshStandardMaterial color="#4A90D9" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

// ── Single placed item ────────────────────────────────────────────────────────
function PlacedItem({ item, isSelected, onSelect, transformMode }) {
  const groupRef = useRef();
  const store = useRoomBuilderStore();

  const halfH = (item.h || 0.5) / 2;

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect(item.id);
  }, [item.id, onSelect]);

  // sync position/rotation back to store when TransformControls moves the item
  useEffect(() => {
    if (!isSelected || !groupRef.current) return;
    const mesh = groupRef.current;
    const onDragEnd = () => {
      store.updatePlacedItem(store.activeRoom.id, item.id, {
        x: mesh.position.x,
        z: mesh.position.z,
        ry: mesh.rotation.y,
      });
    };
    mesh.addEventListener && mesh.addEventListener("mouseup", onDragEnd);
    return () => mesh.removeEventListener && mesh.removeEventListener("mouseup", onDragEnd);
  }, [isSelected, item.id, store]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <group
        ref={groupRef}
        position={[item.x || 0, halfH, item.z || 0]}
        rotation={[0, item.ry || 0, 0]}
        onClick={handleClick}
        userData={{ itemId: item.id }}
      >
        <FurnitureShape
          shape={item.shape}
          w={item.w || 1}
          d={item.d || 1}
          h={item.h || 0.5}
          color={item.color || "#8B7355"}
        />

        {/* selection wireframe */}
        {isSelected && (
          <mesh>
            <boxGeometry args={[(item.w || 1) + 0.05, (item.h || 0.5) + 0.05, (item.d || 1) + 0.05]} />
            <meshStandardMaterial color="#4A90D9" wireframe />
          </mesh>
        )}

        {/* product label */}
        {item.productId && (
          <Html
            position={[0, (item.h || 0.5) / 2 + 0.25, 0]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div style={{
              background: "rgba(201,144,26,0.9)", color: "#fff",
              borderRadius: 4, padding: "2px 7px",
              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
            }}>
              {item.productName || "Product"}
            </div>
          </Html>
        )}
      </group>

      {/* TransformControls for selected item */}
      {isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          size={0.7}
          onObjectChange={() => {
            if (!groupRef.current) return;
            const p = groupRef.current.position;
            const r = groupRef.current.rotation;
            store.updatePlacedItem(store.activeRoom.id, item.id, {
              x: p.x,
              z: p.z,
              ry: r.y,
            });
          }}
        />
      )}
    </>
  );
}

// ── Floor click handler (place item) ─────────────────────────────────────────
function FloorPlane({ onPlace, snapToGrid, gridSize, roomCfg }) {
  const { w, d } = roomCfg;
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    let x = e.point.x, z = e.point.z;
    if (snapToGrid) [x, z] = snapPos(x, z, gridSize);
    onPlace(x, z);
  }, [onPlace, snapToGrid, gridSize]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onClick={handleClick}
      visible={false}
    >
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial />
    </mesh>
  );
}

// ── Camera presets ────────────────────────────────────────────────────────────
const CAM_PRESETS = {
  perspective: { pos: [4, 5, 7], target: [0, 0, 0] },
  top:         { pos: [0, 12, 0], target: [0, 0, 0] },
  front:       { pos: [0, 2.5, 9], target: [0, 1.2, 0] },
};

function CameraRig({ preset }) {
  const { camera, controls } = useThree();
  const cfg = CAM_PRESETS[preset] || CAM_PRESETS.perspective;

  useEffect(() => {
    camera.position.set(...cfg.pos);
    if (controls) {
      controls.target.set(...cfg.target);
      controls.update();
    }
  }, [preset, camera, cfg.pos, cfg.target, controls]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── Scene internals ───────────────────────────────────────────────────────────
function SceneContent({ roomCfg, settings, onScreenshot }) {
  const store = useRoomBuilderStore();
  const { gl, scene, camera } = useThree();
  const orbitRef = useRef();

  const items = store.getPlacedItems(roomCfg.id);
  const { selectedItemId, setSelectedItemId, placingItem, addPlacedItem,
          snapToGrid, gridSize, transformMode, cameraPreset } = store;

  const handlePlace = useCallback((x, z) => {
    if (!placingItem) return;
    addPlacedItem(roomCfg.id, {
      ...placingItem,
      x, z,
      ry: 0,
    });
    store.setPlacingItem(null);
  }, [placingItem, roomCfg.id, addPlacedItem, store]);

  // expose screenshot function
  useEffect(() => {
    if (!onScreenshot) return;
    const capture = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    };
    onScreenshot.current = capture;
  }, [gl, scene, camera, onScreenshot]);

  return (
    <>
      <CameraRig preset={cameraPreset} />
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={20}
      />

      {/* ── Lighting rig ── */}
      {roomCfg.h === 0 ? (
        /* outdoor / penthouse — always bright daylight */
        <>
          <hemisphereLight args={["#87CEEB", "#4A6B3A", 1.3]} />
          <directionalLight position={[4, 8, 3]} intensity={1.8} color="#FFF8E8" castShadow
            shadow-mapSize={[2048, 2048]} shadow-camera-near={0.5} shadow-camera-far={30}
            shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8}
            shadow-bias={-0.0004} />
          <directionalLight position={[-3, 4, -4]} intensity={0.4} color="#C0D8F0" />
        </>
      ) : (() => {
        /* indoor — driven by lightMode setting */
        const lm = settings.lightMode || "day";
        const cfg = {
          bright:  { hemiSky: "#FFF8F0", hemiGnd: "#C0A880", hemiI: 1.30, dirI: 1.60, dirCol: "#FFF8E8", fillI: 0.30 },
          day:     { hemiSky: "#FFF0D8", hemiGnd: "#8B6040", hemiI: 0.85, dirI: 1.00, dirCol: "#FFF8E0", fillI: 0.18 },
          evening: { hemiSky: "#506090", hemiGnd: "#1C1208", hemiI: 0.42, dirI: 0.50, dirCol: "#88A8D0", fillI: 0.08 },
          night:   { hemiSky: "#1A1A28", hemiGnd: "#100808", hemiI: 0.12, dirI: 0.15, dirCol: "#4060A0", fillI: 0.02 },
        }[lm];
        return (
          <>
            <hemisphereLight args={[cfg.hemiSky, cfg.hemiGnd, cfg.hemiI]} />
            <directionalLight
              position={[-6, 5, 0]}
              intensity={cfg.dirI}
              color={cfg.dirCol}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-near={0.5}
              shadow-camera-far={30}
              shadow-camera-left={-8}
              shadow-camera-right={8}
              shadow-camera-top={8}
              shadow-camera-bottom={-8}
              shadow-bias={-0.0004}
            />
            <directionalLight position={[2, 1.5, 4]} intensity={cfg.fillI} color="#C07838" />
          </>
        );
      })()}

      {/* room */}
      <RoomShell roomCfg={roomCfg} settings={settings} />

      {/* grid */}
      {snapToGrid && (
        <Grid
          position={[0, 0.002, 0]}
          args={[roomCfg.w, roomCfg.d]}
          cellSize={gridSize}
          cellThickness={0.5}
          cellColor="#aaaaaa"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#888888"
          fadeDistance={20}
          infiniteGrid={false}
        />
      )}

      {/* floor click plane (only when placing) */}
      {placingItem && (
        <FloorPlane
          onPlace={handlePlace}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          roomCfg={roomCfg}
        />
      )}

      {/* ghost */}
      {placingItem && (
        <GhostItem
          item={placingItem}
          roomCfg={roomCfg}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
        />
      )}

      {/* placed items */}
      <Suspense fallback={null}>
        {items.map((item) => (
          <PlacedItem
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            onSelect={setSelectedItemId}
            transformMode={transformMode}
          />
        ))}
      </Suspense>

      {/* deselect on background click */}
      <mesh
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => setSelectedItemId(null)}
        visible={false}
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial />
      </mesh>
    </>
  );
}

// ── Exported Scene3D ──────────────────────────────────────────────────────────
const Scene3D = forwardRef(function Scene3D({ roomCfg, settings }, ref) {
  const screenshotRef = useRef(null);

  useImperativeHandle(ref, () => ({
    capture: () => screenshotRef.current?.(),
  }));

  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [4, 5, 7] }}
      style={{ width: "100%", height: "100%", background: "#1A1A2E" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", e => e.preventDefault(), false);
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          roomCfg={roomCfg}
          settings={settings}
          onScreenshot={screenshotRef}
        />
      </Suspense>
    </Canvas>
  );
});

export default Scene3D;
