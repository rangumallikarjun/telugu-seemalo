import * as THREE from "three";

// ── Procedural bump-map textures (created once, reused) ───────────────────────
const _texCache = {};
function _makeTex(type) {
  if (_texCache[type]) return _texCache[type];
  const s = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d");

  if (type === "wood") {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 36; i++) {
      const y = (i / 36) * s;
      const v = 90 + Math.floor(Math.random() * 50);
      ctx.strokeStyle = `rgb(${v},${v},${v})`;
      ctx.lineWidth = 0.5 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 5 - 2.5);
      ctx.bezierCurveTo(s * 0.33, y + Math.random() * 14 - 7, s * 0.67, y + Math.random() * 14 - 7, s, y + Math.random() * 5 - 2.5);
      ctx.stroke();
    }
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = "rgba(50,50,50,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(s * (0.2 + Math.random() * 0.6), s * (0.2 + Math.random() * 0.6), s * 0.04, s * 0.055, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === "fabric") {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, s, s);
    const c = 9;
    for (let x = 0; x < s; x += c) {
      for (let y = 0; y < s; y += c) {
        const v = ((Math.floor(x / c) + Math.floor(y / c)) % 2 === 0) ? 148 : 108;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x + 0.5, y + 0.5, c - 1, c - 1);
      }
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(type === "fabric" ? 5 : 3, type === "fabric" ? 5 : 3);
  _texCache[type] = tex;
  return tex;
}

// ── Material presets ──────────────────────────────────────────────────────────
const M = {
  wood:    { roughness: 0.72, metalness: 0.02 },
  fabric:  { roughness: 0.96, metalness: 0.00 },
  metal:   { roughness: 0.35, metalness: 0.75 },
  gold:    { roughness: 0.22, metalness: 0.88 },
  lacquer: { roughness: 0.38, metalness: 0.04 },
  ceramic: { roughness: 0.55, metalness: 0.08 },
  stone:   { roughness: 0.80, metalness: 0.02 },
  glass:   { roughness: 0.05, metalness: 0.15 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function Box({ pos = [0, 0, 0], size = [1, 1, 1], color = "#888", rot = [0, 0, 0], roughness = 0.72, metalness = 0.02, bumpType, bumpScale = 0.018, ...rest }) {
  const bMap = bumpType ? _makeTex(bumpType) : undefined;
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow {...rest}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} bumpMap={bMap} bumpScale={bumpScale} />
    </mesh>
  );
}

function Cyl({ pos = [0, 0, 0], r = 0.1, h = 1, color = "#888", rot = [0, 0, 0], roughness = 0.72, metalness = 0.02, bumpType, bumpScale = 0.018 }) {
  const bMap = bumpType ? _makeTex(bumpType) : undefined;
  return (
    <mesh position={pos} rotation={rot} castShadow>
      <cylinderGeometry args={[r, r, h, 12]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} bumpMap={bMap} bumpScale={bumpScale} />
    </mesh>
  );
}

// ── Sofa ──────────────────────────────────────────────────────────────────────
export function SofaModel({ w = 2.1, d = 0.85, h = 0.78, color = "#8B7355" }) {
  const seat  = h * 0.45;
  const back  = h - seat;
  const arm   = d * 0.12;
  const cushW = (w - arm * 4) / 3 - 0.04;
  return (
    <group>
      <Box pos={[0, seat / 2, 0]} size={[w, seat, d]} color={color} bumpType="fabric" bumpScale={0.022} />
      <Box pos={[0, seat + back / 2, -d / 2 + 0.1]} size={[w, back, 0.18]} color={color} bumpType="fabric" bumpScale={0.022} />
      <Box pos={[-w / 2 + arm / 2, seat + back * 0.3, 0]} size={[arm, back * 0.7, d]} color={color} bumpType="fabric" bumpScale={0.022} />
      <Box pos={[w / 2 - arm / 2, seat + back * 0.3, 0]} size={[arm, back * 0.7, d]} color={color} bumpType="fabric" bumpScale={0.022} />
      {/* seat cushions */}
      {[-w / 3, 0, w / 3].map((x, i) => (
        <Box key={i} pos={[x, seat + 0.055, -0.04]} size={[cushW, 0.1, d * 0.55]} color="#A09070" {...M.fabric} />
      ))}
      {/* decorative throw pillows — orange accent, propped against backrest */}
      <Box
        pos={[-w / 2 + arm + 0.14, seat + 0.16, -d / 2 + 0.20]}
        size={[0.27, 0.27, 0.09]}
        rot={[-Math.PI * 0.10, 0, Math.PI * 0.06]}
        color="#D4540A"
        bumpType="fabric"
        bumpScale={0.018}
      />
      <Box
        pos={[w / 2 - arm - 0.14, seat + 0.16, -d / 2 + 0.20]}
        size={[0.27, 0.27, 0.09]}
        rot={[-Math.PI * 0.10, 0, -Math.PI * 0.06]}
        color="#D4540A"
        bumpType="fabric"
        bumpScale={0.018}
      />
      {/* legs */}
      {[[-w / 2 + 0.1, 0], [w / 2 - 0.1, 0], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.06, z - d / 4]} size={[0.07, 0.12, 0.07]} color="#3D2B1A" />
      ))}
    </group>
  );
}

// ── Armchair ──────────────────────────────────────────────────────────────────
export function ArmchairModel({ w = 0.85, d = 0.85, h = 0.9, color = "#9B7D5C" }) {
  const seat = h * 0.48;
  const back = h - seat;
  return (
    <group>
      <Box pos={[0, seat / 2, 0]} size={[w, seat, d]} color={color} bumpType="fabric" bumpScale={0.022} />
      <Box pos={[0, seat + back / 2, -d / 2 + 0.08]} size={[w, back, 0.16]} color={color} bumpType="fabric" bumpScale={0.022} />
      <Box pos={[-w / 2 + 0.07, seat + back * 0.3, 0]} size={[0.13, back * 0.65, d]} color={color} bumpType="fabric" bumpScale={0.022} />
      <Box pos={[w / 2 - 0.07, seat + back * 0.3, 0]} size={[0.13, back * 0.65, d]} color={color} bumpType="fabric" bumpScale={0.022} />
      <Box pos={[0, seat + 0.05, -0.02]} size={[w - 0.3, 0.1, d * 0.55]} color="#B09070" {...M.fabric} />
      {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.06, z]} size={[0.06, 0.12, 0.06]} color="#3D2B1A" />
      ))}
    </group>
  );
}

// ── Chair ─────────────────────────────────────────────────────────────────────
export function ChairModel({ w = 0.48, d = 0.5, h = 0.9, color = "#6B4C2A" }) {
  const seatH = 0.45;
  const legH  = seatH - 0.02;
  return (
    <group>
      <Box pos={[0, seatH, 0]} size={[w, 0.05, d]} color={color} bumpType="fabric" bumpScale={0.018} />
      <Box pos={[0, seatH + (h - seatH) / 2, -d / 2 + 0.03]} size={[w, h - seatH, 0.06]} color={color} bumpType="fabric" bumpScale={0.018} />
      {[[-w / 2 + 0.05, -d / 2 + 0.05], [w / 2 - 0.05, -d / 2 + 0.05],
        [-w / 2 + 0.05, d / 2 - 0.05], [w / 2 - 0.05, d / 2 - 0.05]].map(([x, z], i) => (
        <Box key={i} pos={[x, legH / 2, z]} size={[0.05, legH, 0.05]} color={color} />
      ))}
    </group>
  );
}

// ── Stool ─────────────────────────────────────────────────────────────────────
export function StoolModel({ w = 0.38, d = 0.38, h = 0.75, color = "#5C3D1E" }) {
  return (
    <group>
      <Box pos={[0, h, 0]} size={[w, 0.05, d]} color={color} />
      <Cyl pos={[0, h / 2, 0]} r={0.04} h={h} color={color} />
      <Cyl pos={[0, 0.05, 0]} r={w * 0.45} h={0.04} color={color} />
    </group>
  );
}

// ── Bed ───────────────────────────────────────────────────────────────────────
export function BedModel({ w = 1.6, d = 2.05, h = 0.55, color = "#8B7355" }) {
  const frameH = h;
  const mattH = 0.18;
  const headH = 0.7;
  return (
    <group>
      {/* frame */}
      <Box pos={[0, frameH / 2, 0]} size={[w, frameH, d]} color={color} bumpType="wood" />
      {/* mattress */}
      <Box pos={[0, frameH + mattH / 2, 0.05]} size={[w - 0.1, mattH, d - 0.22]} color="#F0EDE8" {...M.fabric} />
      {/* headboard */}
      <Box pos={[0, frameH + headH / 2, -d / 2 + 0.06]} size={[w, headH, 0.1]} color={color} {...M.lacquer} />
      {/* pillow l */}
      <Box pos={[-w / 4, frameH + mattH + 0.06, -d / 2 + 0.45]} size={[w / 2 - 0.1, 0.12, 0.45]} color="#FFFFFF" {...M.fabric} />
      {/* pillow r */}
      <Box pos={[w / 4, frameH + mattH + 0.06, -d / 2 + 0.45]} size={[w / 2 - 0.1, 0.12, 0.45]} color="#F5F0EB" {...M.fabric} />
      {/* blanket */}
      <Box pos={[0, frameH + mattH + 0.04, d / 2 - 0.55]} size={[w - 0.1, 0.08, d * 0.55]} color="#C4A882" {...M.fabric} />
      {/* legs */}
      {[[-w / 2 + 0.08, d / 2 - 0.1], [w / 2 - 0.08, d / 2 - 0.1],
        [-w / 2 + 0.08, -d / 2 + 0.1], [w / 2 - 0.08, -d / 2 + 0.1]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.07, z]} size={[0.08, 0.14, 0.08]} color="#2A1A0A" />
      ))}
    </group>
  );
}

// ── Low Table ─────────────────────────────────────────────────────────────────
export function LowTableModel({ w = 1.1, d = 0.6, h = 0.42, color = "#8B6914" }) {
  return (
    <group>
      <Box pos={[0, h, 0]} size={[w, 0.06, d]} color={color} bumpType="wood" />
      {/* shelf */}
      <Box pos={[0, h * 0.38, 0]} size={[w - 0.1, 0.04, d - 0.1]} color={color} />
      {[[-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06],
        [-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06]].map(([x, z], i) => (
        <Box key={i} pos={[x, h / 2, z]} size={[0.06, h, 0.06]} color="#6B4C10" />
      ))}
    </group>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function TableModel({ w = 1.4, d = 0.85, h = 0.76, color = "#7A5C1E" }) {
  return (
    <group>
      <Box pos={[0, h, 0]} size={[w, 0.06, d]} color={color} bumpType="wood" />
      {[[-w / 2 + 0.07, -d / 2 + 0.07], [w / 2 - 0.07, -d / 2 + 0.07],
        [-w / 2 + 0.07, d / 2 - 0.07], [w / 2 - 0.07, d / 2 - 0.07]].map(([x, z], i) => (
        <Box key={i} pos={[x, h / 2, z]} size={[0.07, h, 0.07]} color="#5C3D10" bumpType="wood" />
      ))}
    </group>
  );
}

// ── Round Table ───────────────────────────────────────────────────────────────
export function RoundTableModel({ w = 0.8, d = 0.8, h = 0.72, color = "#556B2F" }) {
  return (
    <group>
      <mesh position={[0, h, 0]} castShadow>
        <cylinderGeometry args={[w / 2, w / 2, 0.05, 20]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Cyl pos={[0, h / 2, 0]} r={0.06} h={h} color={color} />
    </group>
  );
}

// ── Desk ─────────────────────────────────────────────────────────────────────
export function DeskModel({ w = 1.3, d = 0.6, h = 0.76, color = "#8B6E3C" }) {
  return (
    <group>
      <Box pos={[0, h, 0]} size={[w, 0.04, d]} color={color} bumpType="wood" />
      <Box pos={[-w / 2 + 0.05, h / 2, 0]} size={[0.05, h, d]} color={color} bumpType="wood" />
      <Box pos={[w / 2 - 0.05, h / 2, 0]} size={[0.05, h, d]} color={color} bumpType="wood" />
      <Box pos={[0, 0.03, 0]} size={[w - 0.12, 0.04, d]} color={color} bumpType="wood" />
    </group>
  );
}

// ── Wardrobe ─────────────────────────────────────────────────────────────────
export function WardrobeModel({ w = 1.2, d = 0.55, h = 2.1, color = "#6B5232" }) {
  return (
    <group>
      <Box pos={[0, h / 2, 0]} size={[w, h, d]} color={color} bumpType="wood" />
      {/* door lines */}
      <Box pos={[-0.01, h / 2, d / 2 + 0.001]} size={[0.015, h - 0.1, 0.01]} color="#3D2B1A" />
      {/* handles */}
      <Box pos={[-0.08, h / 2, d / 2 + 0.02]} size={[0.03, 0.12, 0.04]} color="#C9901A" {...M.gold} />
      <Box pos={[0.08, h / 2, d / 2 + 0.02]} size={[0.03, 0.12, 0.04]} color="#C9901A" {...M.gold} />
    </group>
  );
}

// ── Shelf ────────────────────────────────────────────────────────────────────
export function ShelfModel({ w = 1.0, d = 0.3, h = 1.8, color = "#8B6E3C" }) {
  const shelves = 4;
  return (
    <group>
      {/* sides */}
      <Box pos={[-w / 2 + 0.02, h / 2, 0]} size={[0.03, h, d]} color={color} bumpType="wood" />
      <Box pos={[w / 2 - 0.02, h / 2, 0]} size={[0.03, h, d]} color={color} bumpType="wood" />
      {/* back */}
      <Box pos={[0, h / 2, -d / 2 + 0.01]} size={[w, h, 0.02]} color="#6B5228" bumpType="wood" />
      {/* shelves */}
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <Box key={i} pos={[0, (i * h) / shelves, 0]} size={[w, 0.03, d]} color={color} bumpType="wood" />
      ))}
    </group>
  );
}

// ── Sideboard ────────────────────────────────────────────────────────────────
export function SideboardModel({ w = 1.4, d = 0.42, h = 0.85, color = "#7A5C2A" }) {
  return (
    <group>
      <Box pos={[0, h / 2, 0]} size={[w, h, d]} color={color} bumpType="wood" />
      <Box pos={[0, h / 2, d / 2 + 0.001]} size={[0.015, h - 0.08, 0.01]} color="#3D2B1A" />
      {[-0.22, 0.22].map((x, i) => (
        <Box key={i} pos={[x, h / 2, d / 2 + 0.02]} size={[0.06, 0.04, 0.04]} color="#C9901A" {...M.gold} />
      ))}
      {[[-w / 2 + 0.08, d / 2 - 0.05], [w / 2 - 0.08, d / 2 - 0.05],
        [-w / 2 + 0.08, -d / 2 + 0.05], [w / 2 - 0.08, -d / 2 + 0.05]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.05, z]} size={[0.06, 0.08, 0.06]} color="#2A1A0A" />
      ))}
    </group>
  );
}

// ── Dresser ───────────────────────────────────────────────────────────────────
export function DresserModel({ w = 1.1, d = 0.46, h = 1.3, color = "#8B7355" }) {
  return (
    <group>
      <Box pos={[0, h / 2, 0]} size={[w, h, d]} color={color} bumpType="wood" />
      {[0.2, 0.5, 0.8, 1.1].map((y, i) => (
        <Box key={i} pos={[0, y, d / 2 + 0.001]} size={[w - 0.08, 0.28, 0.01]} color="#6B5232" />
      ))}
      {[0.2, 0.5, 0.8, 1.1].map((y, i) => (
        <Box key={i} pos={[0, y, d / 2 + 0.02]} size={[0.06, 0.04, 0.04]} color="#C9901A" {...M.gold} />
      ))}
      {/* mirror */}
      <Box pos={[0, h + 0.38, -0.02]} size={[w - 0.1, 0.6, 0.04]} color="#C8C8C8" {...M.glass} />
      <Box pos={[0, h + 0.38, 0.0]} size={[w - 0.06, 0.64, 0.02]} color="#6B5232" />
    </group>
  );
}

// ── TV Unit ───────────────────────────────────────────────────────────────────
export function TvUnitModel({ w = 1.8, d = 0.45, h = 0.5, color = "#3D2B1A" }) {
  return (
    <group>
      {/* cabinet */}
      <Box pos={[0, h / 2, 0]} size={[w, h, d]} color={color} bumpType="wood" />
      {[-w / 3, w / 3].map((x, i) => (
        <Box key={i} pos={[x, h / 2, d / 2 + 0.001]} size={[0.015, h - 0.06, 0.01]} color="#2A1A0A" />
      ))}
      {/* TV screen */}
      <Box pos={[0, h + 0.47, -0.02]} size={[w * 0.9, 0.52, 0.05]} color="#111111" roughness={0.1} metalness={0.4} />
      <Box pos={[0, h + 0.47, 0.0]} size={[w * 0.86, 0.48, 0.01]} color="#1A2A3A" {...M.glass} />
      {/* stand */}
      <Box pos={[0, h + 0.2, 0.02]} size={[0.08, 0.16, 0.04]} color="#2A2A2A" {...M.metal} />
    </group>
  );
}

// ── Counter ───────────────────────────────────────────────────────────────────
export function CounterModel({ w = 1.8, d = 0.6, h = 0.9, color = "#E8E0D0" }) {
  return (
    <group>
      <Box pos={[0, h / 2, 0]} size={[w, h, d]} color="#8B6E3C" />
      {/* countertop */}
      <Box pos={[0, h + 0.02, 0]} size={[w, 0.04, d + 0.04]} color={color} />
      {/* doors */}
      {[-w / 3, 0, w / 3].map((x, i) => (
        <Box key={i} pos={[x, h / 2, d / 2 + 0.001]} size={[0.01, h - 0.06, 0.01]} color="#6B5232" />
      ))}
      {[-w / 3, 0, w / 3].map((x, i) => (
        <Box key={i} pos={[x, h / 2, d / 2 + 0.015]} size={[0.05, 0.03, 0.03]} color="#C9901A" {...M.gold} />
      ))}
      {/* sink area */}
      <Box pos={[w / 3, h + 0.015, 0]} size={[w / 4, 0.01, d * 0.5]} color="#C0C8C8" />
    </group>
  );
}

// ── Floor Lamp ───────────────────────────────────────────────────────────────
export function LampModel({ w = 0.35, d = 0.35, h = 1.6, color = "#C9901A" }) {
  return (
    <group>
      <Cyl pos={[0, h * 0.4, 0]} r={0.025} h={h * 0.8} color="#8B8B8B" {...M.metal} />
      <Cyl pos={[0, 0.03, 0]} r={0.1} h={0.04} color="#6B6B6B" {...M.metal} />
      {/* shade */}
      <mesh position={[0, h, 0]} castShadow>
        <coneGeometry args={[0.22, 0.32, 12, 1, true]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* bulb glow */}
      <pointLight position={[0, h - 0.1, 0]} intensity={0.6} distance={2.5} color="#FFF0D0" />
    </group>
  );
}

// ── Small Lamp ────────────────────────────────────────────────────────────────
export function SmallLampModel({ w = 0.25, d = 0.25, h = 0.5, color = "#E8A83A" }) {
  return (
    <group>
      <Cyl pos={[0, h * 0.3, 0]} r={0.04} h={h * 0.6} color="#8B8B8B" {...M.metal} />
      <Cyl pos={[0, 0.03, 0]} r={0.08} h={0.04} color="#6B6B6B" {...M.metal} />
      <mesh position={[0, h * 0.75, 0]} castShadow>
        <coneGeometry args={[0.14, 0.22, 10, 1, true]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, h * 0.65, 0]} intensity={0.3} distance={1.5} color="#FFF0D0" />
    </group>
  );
}

// ── Plant ─────────────────────────────────────────────────────────────────────
export function PlantModel({ w = 0.5, d = 0.5, h = 1.4, color = "#2D6A4F" }) {
  const isLarge  = h > 0.95;
  const isSmall  = h <= 0.55;
  const potH     = h * 0.22;
  const potR     = w * 0.29;
  const trunkH   = h * 0.44;
  const lc2 = "#40916C";
  const lc3 = "#52B788";

  // flat radiating leaves for tall tropical
  const LEAVES = [
    { ang: 0,            ht: 0.82, lw: w * 0.19, spread: w * 0.82, col: color },
    { ang: Math.PI * 0.40, ht: 0.70, lw: w * 0.17, spread: w * 0.74, col: lc2 },
    { ang: Math.PI * 0.80, ht: 0.90, lw: w * 0.21, spread: w * 0.88, col: color },
    { ang: Math.PI * 1.20, ht: 0.74, lw: w * 0.18, spread: w * 0.76, col: lc2 },
    { ang: Math.PI * 1.60, ht: 0.86, lw: w * 0.20, spread: w * 0.82, col: lc3 },
    { ang: Math.PI * 0.20, ht: 0.63, lw: w * 0.16, spread: w * 0.68, col: color },
    { ang: Math.PI * 1.00, ht: 0.95, lw: w * 0.19, spread: w * 0.78, col: lc2 },
  ];

  return (
    <group>
      {/* tapered pot */}
      <mesh position={[0, potH / 2, 0]} castShadow>
        <cylinderGeometry args={[potR, potR * 0.70, potH, 12]} />
        <meshStandardMaterial color="#C0392B" roughness={0.65} metalness={0.08} />
      </mesh>
      {/* pot rim */}
      <mesh position={[0, potH, 0]}>
        <cylinderGeometry args={[potR + 0.012, potR, 0.024, 12]} />
        <meshStandardMaterial color="#A02820" roughness={0.60} />
      </mesh>
      {/* soil */}
      <mesh position={[0, potH + 0.008, 0]}>
        <cylinderGeometry args={[potR - 0.008, potR - 0.008, 0.012, 12]} />
        <meshStandardMaterial color="#3D2208" roughness={0.95} />
      </mesh>

      {isSmall ? (
        /* succulent rosette — 3 rings of pointed cone leaves */
        <>
          {Array.from({ length: 10 }, (_, i) => {
            const ang = (i / 10) * Math.PI * 2;
            const row = i % 3;
            const rad = w * (0.08 + row * 0.07);
            const lh  = h * (0.42 - row * 0.08);
            return (
              <mesh
                key={i}
                position={[
                  Math.sin(ang) * rad * 0.55,
                  potH + h * 0.15 + row * h * 0.06,
                  Math.cos(ang) * rad * 0.55,
                ]}
                rotation={[Math.PI * (0.28 - row * 0.08), ang, 0]}
                castShadow
              >
                <coneGeometry args={[w * 0.075, lh, 5]} />
                <meshStandardMaterial color={[color, lc2, lc3][row]} roughness={0.90} />
              </mesh>
            );
          })}
          <mesh position={[0, potH + h * 0.36, 0]}>
            <sphereGeometry args={[w * 0.075, 7, 7]} />
            <meshStandardMaterial color="#74C69D" roughness={0.85} />
          </mesh>
        </>
      ) : isLarge ? (
        /* tall tropical — flat boxGeometry leaves radiating from trunk */
        <>
          <Cyl pos={[0, potH + trunkH / 2, 0]} r={0.042} h={trunkH} color="#5C3418" />
          {LEAVES.map(({ ang, ht, lw, spread, col }, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(ang) * spread * 0.5,
                potH + trunkH * ht,
                Math.cos(ang) * spread * 0.5,
              ]}
              rotation={[-Math.PI * 0.18, ang, 0]}
              castShadow
            >
              <boxGeometry args={[lw, 0.014, spread]} />
              <meshStandardMaterial color={col} roughness={0.88} side={THREE.DoubleSide} />
            </mesh>
          ))}
          <mesh position={[0, potH + trunkH * 1.01, 0]}>
            <sphereGeometry args={[w * 0.15, 7, 7]} />
            <meshStandardMaterial color={color} roughness={0.88} />
          </mesh>
        </>
      ) : (
        /* medium bushy — structured sphere clusters on branching trunk */
        <>
          <Cyl pos={[0, potH + trunkH / 2, 0]} r={0.032} h={trunkH} color="#6B4226" />
          {[
            [0,          h * 1.00, 0,          w * 0.22],
            [-w * 0.24,  h * 0.80, w * 0.10,   w * 0.20],
            [ w * 0.24,  h * 0.84, -w * 0.10,  w * 0.20],
            [ 0,         h * 0.88, -w * 0.22,  w * 0.19],
            [ w * 0.16,  h * 0.92, w * 0.16,   w * 0.18],
            [-w * 0.18,  h * 0.90, -w * 0.14,  w * 0.18],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <sphereGeometry args={[r, 9, 9]} />
              <meshStandardMaterial color={i % 2 === 0 ? color : lc2} roughness={0.88} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

// ── Vase ─────────────────────────────────────────────────────────────────────
export function VaseModel({ w = 0.25, d = 0.25, h = 0.45, color = "#C0392B" }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[w * 0.32, w * 0.4, h, 10]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.12} />
      </mesh>
      {/* neck */}
      <mesh position={[0, h, 0]} castShadow>
        <cylinderGeometry args={[w * 0.2, w * 0.3, h * 0.15, 10]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.12} />
      </mesh>
    </group>
  );
}

// ── Painting ──────────────────────────────────────────────────────────────────
export function PaintingModel({ w = 0.8, d = 0.05, h = 0.6, color = "#8B6914" }) {
  return (
    <group>
      {/* frame */}
      <Box pos={[0, 0, 0]} size={[w, h, 0.04]} color={color} />
      {/* canvas */}
      <Box pos={[0, 0, 0.025]} size={[w - 0.06, h - 0.06, 0.01]} color="#F5E6C8" />
      {/* art strokes */}
      <Box pos={[-w * 0.1, h * 0.08, 0.032]} size={[w * 0.3, h * 0.3, 0.005]} color="#C0392B" />
      <Box pos={[w * 0.15, -h * 0.05, 0.032]} size={[w * 0.25, h * 0.25, 0.005]} color="#2471A3" />
      <Box pos={[0, h * 0.15, 0.032]} size={[w * 0.2, h * 0.2, 0.005]} color="#E8620A" />
    </group>
  );
}

// ── Rug ───────────────────────────────────────────────────────────────────────
export function RugModel({ w = 2.0, d = 1.4, h = 0.02, color = "#C09040" }) {
  return (
    <group>
      <Box pos={[0, 0.01, 0]} size={[w, 0.02, d]} color={color} />
      {/* border */}
      <Box pos={[0, 0.015, 0]} size={[w - 0.1, 0.022, d - 0.1]} color="#8B6914" />
      <Box pos={[0, 0.02, 0]} size={[w - 0.22, 0.022, d - 0.22]} color={color} />
    </group>
  );
}

// ── Mirror ────────────────────────────────────────────────────────────────────
export function MirrorModel({ w = 0.55, d = 0.1, h = 1.7, color = "#C8C8C8" }) {
  return (
    <group>
      {/* base */}
      <Box pos={[0, 0.04, 0]} size={[w * 0.6, 0.06, d * 1.5]} color="#8B7355" />
      {/* stem */}
      <Box pos={[0, h * 0.35, 0]} size={[0.04, h * 0.55, 0.04]} color="#8B7355" />
      {/* frame */}
      <Box pos={[0, h * 0.65, 0.01]} size={[w, h * 0.65, 0.05]} color="#8B7355" />
      {/* glass */}
      <Box pos={[0, h * 0.65, 0.035]} size={[w - 0.06, h * 0.61, 0.02]} color={color} {...M.glass} />
    </group>
  );
}

// ── Lounger ───────────────────────────────────────────────────────────────────
export function LoungerModel({ w = 0.7, d = 1.9, h = 0.5, color = "#8FBC8F" }) {
  return (
    <group>
      <Box pos={[0, h * 0.45, 0]} size={[w, h * 0.18, d]} color={color} bumpType="fabric" bumpScale={0.018} />
      <Box pos={[0, h * 0.28, 0]} size={[w, h * 0.56, d]} color={color} bumpType="fabric" bumpScale={0.018} />
      <Box pos={[0, h * 0.38, -d / 2 + 0.08]} size={[w, h * 0.72, 0.1]} color={color} bumpType="fabric" bumpScale={0.018} />
      {[[-w / 2 + 0.06, -d / 2 + 0.08], [w / 2 - 0.06, -d / 2 + 0.08],
        [-w / 2 + 0.06, d / 2 - 0.08], [w / 2 - 0.06, d / 2 - 0.08]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.06, z]} size={[0.06, 0.12, 0.06]} color="#4A6B3A" />
      ))}
    </group>
  );
}

// ── Bunk Bed ─────────────────────────────────────────────────────────────────
export function BunkBedModel({ w = 1.0, d = 2.0, h = 1.7, color = "#7A6048" }) {
  return (
    <group>
      {/* posts */}
      {[[-w / 2 + 0.05, -d / 2 + 0.05], [w / 2 - 0.05, -d / 2 + 0.05],
        [-w / 2 + 0.05, d / 2 - 0.05], [w / 2 - 0.05, d / 2 - 0.05]].map(([x, z], i) => (
        <Box key={i} pos={[x, h / 2, z]} size={[0.08, h, 0.08]} color={color} />
      ))}
      {/* lower bed */}
      <Box pos={[0, 0.45, 0]} size={[w - 0.12, 0.12, d - 0.12]} color={color} />
      <Box pos={[0, 0.57, 0]} size={[w - 0.16, 0.15, d - 0.18]} color="#F0EDE8" />
      {/* upper bed */}
      <Box pos={[0, h * 0.58, 0]} size={[w - 0.12, 0.12, d - 0.12]} color={color} />
      <Box pos={[0, h * 0.58 + 0.12, 0]} size={[w - 0.16, 0.15, d - 0.18]} color="#F0EDE8" />
      {/* ladder */}
      <Box pos={[w / 2 - 0.04, h / 2, d / 2 - 0.15]} size={[0.04, h, 0.04]} color={color} />
      {[0.3, 0.55, 0.8].map((y, i) => (
        <Box key={i} pos={[w / 2 - 0.04, y, d / 2 - 0.15]} size={[0.12, 0.03, 0.04]} color={color} />
      ))}
    </group>
  );
}

// ── Stone Clock ───────────────────────────────────────────────────────────────
export function StoneClockModel({ w = 0.42, d = 0.06, h = 0.40, color = "#B09048" }) {
  const slabR = Math.min(w, h) * 0.49;
  const cy    = h / 2;
  const cz    = d / 2;

  return (
    <group>
      {/* Rough stone disc body */}
      <mesh position={[0, cy, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[slabR, slabR, d, 16]} />
        <meshStandardMaterial color={color} roughness={0.92} metalness={0.1} />
      </mesh>

      {/* Translucent marble face — cream white, slightly smaller than disc */}
      <mesh position={[0, cy, cz + 0.001]}>
        <circleGeometry args={[slabR * 0.90, 22]} />
        <meshStandardMaterial color="#E0D8C6" roughness={0.3} metalness={0.02} />
      </mesh>

      {/* Very thin edge accent */}
      <mesh position={[0, cy, 0]}>
        <torusGeometry args={[slabR, 0.010, 6, 16]} />
        <meshStandardMaterial color={color} roughness={0.94} metalness={0.08} />
      </mesh>

      {/* ── Bull-cart art scene (lower ~38% of face) ── */}
      {/* Green landscape */}
      <mesh position={[0, cy - slabR * 0.60, cz + 0.005]}>
        <boxGeometry args={[slabR * 1.20, slabR * 0.66, 0.005]} />
        <meshStandardMaterial color="#3A6B20" roughness={0.55} />
      </mesh>
      {/* Sky strip */}
      <mesh position={[0, cy - slabR * 0.27, cz + 0.006]}>
        <boxGeometry args={[slabR * 1.40, slabR * 0.30, 0.004]} />
        <meshStandardMaterial color="#72B0DC" roughness={0.4} />
      </mesh>
      {/* Left palm trunk */}
      <mesh position={[-slabR * 0.48, cy - slabR * 0.46, cz + 0.009]}>
        <boxGeometry args={[0.011, slabR * 0.42, 0.006]} />
        <meshStandardMaterial color="#7A5028" roughness={0.65} />
      </mesh>
      {/* Left palm fronds */}
      <mesh position={[-slabR * 0.48, cy - slabR * 0.26, cz + 0.011]}>
        <boxGeometry args={[slabR * 0.22, slabR * 0.11, 0.006]} />
        <meshStandardMaterial color="#2D8020" roughness={0.5} />
      </mesh>
      {/* Right palm trunk */}
      <mesh position={[slabR * 0.54, cy - slabR * 0.42, cz + 0.009]}>
        <boxGeometry args={[0.011, slabR * 0.40, 0.006]} />
        <meshStandardMaterial color="#7A5028" roughness={0.65} />
      </mesh>
      {/* Right palm fronds */}
      <mesh position={[slabR * 0.54, cy - slabR * 0.23, cz + 0.011]}>
        <boxGeometry args={[slabR * 0.20, slabR * 0.10, 0.006]} />
        <meshStandardMaterial color="#2D8020" roughness={0.5} />
      </mesh>
      {/* White bulls */}
      <mesh position={[-slabR * 0.10, cy - slabR * 0.58, cz + 0.010]}>
        <boxGeometry args={[slabR * 0.44, slabR * 0.25, 0.008]} />
        <meshStandardMaterial color="#F2EEE4" roughness={0.5} />
      </mesh>
      {/* Bull red harness strip */}
      <mesh position={[-slabR * 0.10, cy - slabR * 0.58, cz + 0.015]}>
        <boxGeometry args={[slabR * 0.45, slabR * 0.05, 0.004]} />
        <meshStandardMaterial color="#C82818" roughness={0.4} />
      </mesh>
      {/* Red chariot body */}
      <mesh position={[slabR * 0.30, cy - slabR * 0.52, cz + 0.010]}>
        <boxGeometry args={[slabR * 0.34, slabR * 0.27, 0.008]} />
        <meshStandardMaterial color="#C82818" roughness={0.45} />
      </mesh>
      {/* Gold chariot wheel */}
      <mesh position={[slabR * 0.42, cy - slabR * 0.65, cz + 0.014]}>
        <torusGeometry args={[slabR * 0.095, 0.006, 6, 10]} />
        <meshStandardMaterial color="#C9901A" metalness={0.72} roughness={0.22} />
      </mesh>
      {/* Driver — yellow turban */}
      <mesh position={[slabR * 0.16, cy - slabR * 0.42, cz + 0.013]}>
        <boxGeometry args={[slabR * 0.12, slabR * 0.22, 0.007]} />
        <meshStandardMaterial color="#E8C830" roughness={0.45} />
      </mesh>
      {/* Passenger — red sari */}
      <mesh position={[slabR * 0.30, cy - slabR * 0.42, cz + 0.013]}>
        <boxGeometry args={[slabR * 0.11, slabR * 0.20, 0.007]} />
        <meshStandardMaterial color="#CC2010" roughness={0.45} />
      </mesh>
      {/* Gold bottom border strip */}
      <mesh position={[0, cy - slabR * 0.86, cz + 0.010]}>
        <boxGeometry args={[slabR * 1.0, slabR * 0.07, 0.007]} />
        <meshStandardMaterial color="#C9A020" metalness={0.58} roughness={0.38} />
      </mesh>
      {/* Dark pattern dots on border */}
      {[-0.36, -0.18, 0, 0.18, 0.36].map((x, i) => (
        <mesh key={i} position={[slabR * x, cy - slabR * 0.86, cz + 0.014]}>
          <sphereGeometry args={[0.006, 5, 5]} />
          <meshStandardMaterial color="#1E1004" roughness={0.8} />
        </mesh>
      ))}

      {/* ── 12 gold hour stud markers ── */}
      {Array.from({ length: 12 }, (_, i) => {
        const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <mesh key={i}
            position={[Math.cos(ang) * slabR * 0.79, cy + Math.sin(ang) * slabR * 0.79, cz + 0.007]}
          >
            <sphereGeometry args={[0.009, 7, 7]} />
            <meshStandardMaterial color="#C9A030" metalness={0.88} roughness={0.12} />
          </mesh>
        );
      })}

      {/* ── Thin gold needle hands ── */}
      <mesh position={[0, cy, cz + 0.016]} rotation={[0, 0, -Math.PI * 0.20]}>
        <boxGeometry args={[0.005, slabR * 0.70, 0.005]} />
        <meshStandardMaterial color="#C9A030" metalness={0.88} roughness={0.12} />
      </mesh>
      <mesh position={[0, cy, cz + 0.017]} rotation={[0, 0, Math.PI * 0.62]}>
        <boxGeometry args={[0.006, slabR * 0.50, 0.005]} />
        <meshStandardMaterial color="#C9A030" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* Center hub */}
      <mesh position={[0, cy, cz + 0.022]}>
        <sphereGeometry args={[0.018, 10, 10]} />
        <meshStandardMaterial color="#C9A030" metalness={0.92} roughness={0.08} />
      </mesh>

      {/* Slim base stand */}
      <mesh position={[0, 0.013, 0]}>
        <boxGeometry args={[w * 0.25, 0.022, d * 1.35]} />
        <meshStandardMaterial color={color} roughness={0.72} metalness={0.12} />
      </mesh>
    </group>
  );
}

// ── Shape dispatcher ──────────────────────────────────────────────────────────
export function FurnitureShape({ shape, w, d, h, color }) {
  const props = { w, d, h, color };
  switch (shape) {
    case "sofa":
    case "sofa_l":    return <SofaModel {...props} />;
    case "armchair":  return <ArmchairModel {...props} />;
    case "chair":     return <ChairModel {...props} />;
    case "stool":     return <StoolModel {...props} />;
    case "bed":       return <BedModel {...props} />;
    case "bunk":      return <BunkBedModel {...props} />;
    case "table_low": return <LowTableModel {...props} />;
    case "table":     return <TableModel {...props} />;
    case "table_round": return <RoundTableModel {...props} />;
    case "desk":      return <DeskModel {...props} />;
    case "wardrobe":  return <WardrobeModel {...props} />;
    case "shelf":     return <ShelfModel {...props} />;
    case "sideboard": return <SideboardModel {...props} />;
    case "dresser":   return <DresserModel {...props} />;
    case "tv_unit":   return <TvUnitModel {...props} />;
    case "counter":   return <CounterModel {...props} />;
    case "lamp":      return <LampModel {...props} />;
    case "lamp_s":    return <SmallLampModel {...props} />;
    case "plant":     return <PlantModel {...props} />;
    case "vase":      return <VaseModel {...props} />;
    case "painting":  return <PaintingModel {...props} />;
    case "rug":       return <RugModel {...props} />;
    case "mirror":    return <MirrorModel {...props} />;
    case "lounger":      return <LoungerModel {...props} />;
    case "stone_clock":  return <StoneClockModel {...props} />;
    default:
      return (
        <mesh castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color || "#8B7355"} />
        </mesh>
      );
  }
}
