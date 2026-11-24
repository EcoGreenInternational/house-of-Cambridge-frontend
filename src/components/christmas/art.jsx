/**
 * Original Christmas SVG artwork (no stock images): pine branches, baubles,
 * berries, paper snowflakes, snowmen, trees and gift boxes.
 * All pieces are deterministic (seeded) so they render the same every time.
 */
import { useId, useMemo } from 'react';

export const rng = (seed = 1) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const NEEDLE_GREENS = ['#163d26', '#1d4d30', '#24603b', '#2f7347', '#1a4529'];
const deg = (d) => (d * Math.PI) / 180;

/** Needle lines along one stem (local coords, stem points along +x). */
const needlesForStem = (rand, len, sag, needleLen, out, frost) => {
  const n = Math.max(6, Math.floor(len / 2.4));
  for (let i = 1; i <= n; i += 1) {
    const t = i / n;
    const x = t * len;
    const y = Math.sin(Math.PI * t) * sag;
    const taper = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.15));
    for (const side of [-1, 1]) {
      const a = deg(side * (38 + rand() * 30));
      const l = needleLen * taper * (0.75 + rand() * 0.5);
      const x2 = x + Math.cos(a) * l;
      const y2 = y + Math.sin(a) * l;
      out.push({ x1: x, y1: y, x2, y2, c: NEEDLE_GREENS[Math.floor(rand() * NEEDLE_GREENS.length)], w: 1.3 + rand() * 0.7 });
      if (frost && rand() < 0.32) {
        const f = 0.55 + rand() * 0.2;
        out.push({ x1: x + (x2 - x) * f, y1: y + (y2 - y) * f, x2, y2, c: 'rgba(255,255,255,0.85)', w: 1.1 });
      }
    }
  }
};

/** A pine branch with side twigs, optional frosty tips. Origin at the branch base. */
export function PineBranch({ x = 0, y = 0, length = 200, angle = 0, seed = 1, needle = 13, frost = true }) {
  const lines = useMemo(() => {
    const rand = rng(seed);
    const out = [];
    needlesForStem(rand, length, length * 0.03, needle, out, frost);
    // side twigs
    for (const [t, side] of [[0.28, -1], [0.42, 1], [0.58, -1], [0.7, 1]]) {
      const bx = t * length;
      const by = Math.sin(Math.PI * t) * length * 0.03;
      const a = side * (28 + rand() * 14);
      const tl = length * (0.42 - t * 0.25);
      const twig = [];
      needlesForStem(rand, tl, 0, needle * 0.85, twig, frost);
      const ca = Math.cos(deg(a));
      const sa = Math.sin(deg(a));
      for (const l of twig) {
        out.push({
          ...l,
          x1: bx + l.x1 * ca - l.y1 * sa,
          y1: by + l.x1 * sa + l.y1 * ca,
          x2: bx + l.x2 * ca - l.y2 * sa,
          y2: by + l.x2 * sa + l.y2 * ca,
        });
      }
    }
    return out;
  }, [length, seed, needle, frost]);

  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={`M0 0 Q${length / 2} ${length * 0.06} ${length} 0`} stroke="#4a3322" strokeWidth="2.2" fill="none" />
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.c} strokeWidth={l.w} strokeLinecap="round" />
      ))}
    </g>
  );
}

const BAUBLE_COLORS = {
  red: ['#ff5a5a', '#c9141c', '#6e0409'],
  gold: ['#fff1b0', '#e0a21a', '#7a4d00'],
  silver: ['#ffffff', '#c7ced8', '#6b7480'],
  green: ['#7fd99a', '#1f7a3d', '#0b3a1b'],
  blue: ['#9fd2ff', '#1d6fd1', '#0a2f63'],
};

/** Shiny bauble hanging from a string. (x, y) = bauble centre. */
export function Bauble({ x, y, r = 16, color = 'red', string = 0, glitter = true, seed = 3 }) {
  const id = useId().replace(/:/g, '');
  const [hi, mid, lo] = BAUBLE_COLORS[color] || BAUBLE_COLORS.red;
  const dots = useMemo(() => {
    if (!glitter) return [];
    const rand = rng(seed);
    return Array.from({ length: 10 }, () => {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r * 0.85;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: 0.5 + rand() * 0.9, o: 0.35 + rand() * 0.5 };
    });
  }, [glitter, r, seed]);

  return (
    <g>
      <defs>
        <radialGradient id={`b${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={hi} />
          <stop offset="45%" stopColor={mid} />
          <stop offset="100%" stopColor={lo} />
        </radialGradient>
      </defs>
      {string > 0 && <line x1={x} y1={y - r - string} x2={x} y2={y - r - 2} stroke="#c9a54a" strokeWidth="1" />}
      <circle cx={x} cy={y} r={r} fill={`url(#b${id})`} />
      <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.28} ry={r * 0.16} fill="rgba(255,255,255,0.55)" transform={`rotate(-30 ${x - r * 0.35} ${y - r * 0.4})`} />
      {dots.map((d, i) => (
        <circle key={i} cx={x + d.x} cy={y + d.y} r={d.s} fill="#fff" opacity={d.o} />
      ))}
      <rect x={x - r * 0.28} y={y - r - r * 0.22} width={r * 0.56} height={r * 0.3} rx="1.5" fill="#d4a63a" stroke="#8a6512" strokeWidth="0.6" />
      <circle cx={x} cy={y - r - r * 0.3} r={r * 0.12} fill="none" stroke="#d4a63a" strokeWidth="1" />
    </g>
  );
}

export function Berries({ x, y, scale = 1, seed = 5 }) {
  const items = useMemo(() => {
    const rand = rng(seed);
    return Array.from({ length: 7 }, () => ({ dx: (rand() - 0.5) * 22, dy: (rand() - 0.5) * 16, r: 3 + rand() * 2.2 }));
  }, [seed]);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {items.map((b, i) => (
        <g key={i}>
          <circle cx={b.dx} cy={b.dy} r={b.r} fill="#b3121b" />
          <circle cx={b.dx - b.r * 0.35} cy={b.dy - b.r * 0.35} r={b.r * 0.35} fill="rgba(255,255,255,0.6)" />
        </g>
      ))}
    </g>
  );
}

/** Holly leaves + berries, used as a small accent. */
export function Holly({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 22 C12 10 4 14 2 8 C8 9 9 4 13 6 C14 2 18 4 18 8 C20 12 21 18 20 22Z" fill="#1f7a3d" />
      <path d="M20 22 C28 10 36 14 38 8 C32 9 31 4 27 6 C26 2 22 4 22 8 C20 12 19 18 20 22Z" fill="#2f8f4a" />
      <circle cx="17" cy="25" r="4" fill="#d11f2a" />
      <circle cx="23.5" cy="25.5" r="4" fill="#b3121b" />
      <circle cx="20" cy="30.5" r="4" fill="#d11f2a" />
    </svg>
  );
}

/** Six-fold paper-cut style snowflake, centred on (0,0). */
export function PaperSnowflake({ size = 60, seed = 1, stroke = '#ffffff' }) {
  const arm = useMemo(() => {
    const rand = rng(seed);
    const R = size / 2;
    const parts = [`M0 0 L0 ${-R}`];
    const spots = [0.32 + rand() * 0.08, 0.55 + rand() * 0.08, 0.78];
    spots.forEach((t, i) => {
      const len = R * (0.34 - i * 0.08) * (0.8 + rand() * 0.4);
      const yy = -R * t;
      parts.push(`M0 ${yy} L${len * 0.7} ${yy - len * 0.7}`, `M0 ${yy} L${-len * 0.7} ${yy - len * 0.7}`);
    });
    return { d: parts.join(' '), R, tip: rand() > 0.5 };
  }, [size, seed]);
  const w = Math.max(1.6, size * 0.055);
  return (
    <g>
      {[0, 60, 120, 180, 240, 300].map((r) => (
        <g key={r} transform={`rotate(${r})`}>
          <path d={arm.d} stroke={stroke} strokeWidth={w} strokeLinecap="round" fill="none" />
          {arm.tip && <circle cx="0" cy={-arm.R} r={w * 0.9} fill={stroke} />}
        </g>
      ))}
      <polygon
        points={[0, 60, 120, 180, 240, 300].map((a) => `${Math.sin(deg(a)) * w * 2.2},${-Math.cos(deg(a)) * w * 2.2}`).join(' ')}
        fill={stroke}
      />
    </g>
  );
}

/** Snowman standing on y=0 (feet), centred on x. */
export function Snowman({ x = 0, y = 0, scale = 1, hat = 'top', scarf = '#c8102e', lights = true }) {
  const id = useId().replace(/:/g, '');
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={`s${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#eef4fb" />
          <stop offset="100%" stopColor="#c9d8ea" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="-2" rx="40" ry="6" fill="rgba(0,0,0,0.12)" />
      <circle cx="0" cy="-34" r="34" fill={`url(#s${id})`} />
      <circle cx="0" cy="-86" r="25" fill={`url(#s${id})`} />
      <circle cx="0" cy="-126" r="19" fill={`url(#s${id})`} />
      {/* arms */}
      <path d="M-22 -92 L-50 -112 M-42 -106 L-48 -120 M22 -92 L50 -110 M42 -104 L52 -100" stroke="#5a3b22" strokeWidth="3" strokeLinecap="round" />
      {/* face */}
      <circle cx="-7" cy="-131" r="2.4" fill="#1b1b1b" />
      <circle cx="7" cy="-131" r="2.4" fill="#1b1b1b" />
      <path d="M0 -125 L16 -122 L0 -120 Z" fill="#f07b1d" />
      {[-9, -5, 0, 5, 9].map((dx, i) => (
        <circle key={i} cx={dx} cy={-116 + Math.abs(dx) * -0.25} r="1.3" fill="#1b1b1b" />
      ))}
      {/* buttons */}
      {[-96, -84, -72].map((cy) => <circle key={cy} cx="0" cy={cy} r="2.6" fill="#1b1b1b" />)}
      {/* scarf */}
      <path d="M-19 -110 Q0 -102 19 -110 L19 -104 Q0 -96 -19 -104 Z" fill={scarf} />
      <path d="M8 -104 L14 -80 L5 -80 L2 -103 Z" fill={scarf} />
      <path d="M6 -84 L14 -84 M6 -88 L14 -88" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
      {/* hat */}
      {hat === 'top' ? (
        <g>
          <rect x="-22" y="-146" width="44" height="5" rx="2" fill="#1d1d1d" />
          <rect x="-14" y="-172" width="28" height="27" rx="2" fill="#262626" />
          <rect x="-14" y="-152" width="28" height="5" fill={scarf} />
        </g>
      ) : (
        <g>
          <path d="M-19 -136 Q0 -170 19 -136 Z" fill={scarf} />
          <rect x="-20" y="-140" width="40" height="7" rx="3.5" fill="#f4f4f4" />
          <circle cx="0" cy="-160" r="5.5" fill="#f4f4f4" />
        </g>
      )}
      {lights &&
        [[-14, -40], [12, -24], [-4, -56], [16, -48], [-18, -20], [8, -88], [-12, -80]].map(([cx, cy], i) => (
          <circle key={i} className="hoc-xmas-twinkle" style={{ animationDelay: `${i * 0.4}s` }} cx={cx} cy={cy} r="2.2" fill="#ffe08a" />
        ))}
    </g>
  );
}

export function XmasTree({ x = 0, y = 0, scale = 1, seed = 2 }) {
  const lights = useMemo(() => {
    const rand = rng(seed);
    const cols = ['#ff4d4d', '#ffd34d', '#5ad1ff', '#7dff8a', '#ffffff'];
    return Array.from({ length: 16 }, (_, i) => {
      const t = rand();
      const yy = -20 - t * 110;
      const half = (1 - (-yy - 10) / 140) * 44;
      return { x: (rand() * 2 - 1) * half * 0.8, y: yy, c: cols[i % cols.length] };
    });
  }, [seed]);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-6" y="-14" width="12" height="14" fill="#5a3b22" />
      <path d="M0 -150 L30 -100 L18 -100 L42 -60 L26 -60 L52 -16 L-52 -16 L-26 -60 L-42 -60 L-18 -100 L-30 -100 Z" fill="#1d5a34" />
      <path d="M-30 -100 L-18 -100 L-12 -104 L0 -98 L12 -104 L18 -100 L30 -100 M-42 -60 L-26 -60 L-16 -65 L0 -58 L16 -65 L26 -60 L42 -60 M-52 -16 L52 -16" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />
      {lights.map((l, i) => (
        <circle key={i} className="hoc-xmas-twinkle" style={{ animationDelay: `${(i % 6) * 0.3}s` }} cx={l.x} cy={l.y} r="2.6" fill={l.c} />
      ))}
      <path d="M0 -164 L4 -154 L14 -154 L6 -148 L9 -138 L0 -144 L-9 -138 L-6 -148 L-14 -154 L-4 -154 Z" fill="#ffd34d" />
    </g>
  );
}

export function Gift({ x = 0, y = 0, w = 34, h = 26, color = '#c8102e', ribbon = '#ffd34d' }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx="2" fill={color} />
      <rect x={-w / 2 - 2} y={-h - 6} width={w + 4} height="7" rx="1.5" fill={color} stroke="rgba(0,0,0,0.15)" />
      <rect x="-3" y={-h - 6} width="6" height={h + 6} fill={ribbon} />
      <path d={`M0 ${-h - 6} C-12 ${-h - 18} -16 ${-h - 4} 0 ${-h - 6} C16 ${-h - 4} 12 ${-h - 18} 0 ${-h - 6}`} fill="none" stroke={ribbon} strokeWidth="3" />
    </g>
  );
}

/**
 * Corner cluster of pine branches with baubles and berries.
 * side='left' grows from the top-left corner, 'right' mirrors it.
 */
export function PineCorner({ side = 'left', width = 360, height = 260, seed = 11 }) {
  const flip = side === 'right';
  return (
    <svg
      className={`hoc-xmas-corner hoc-xmas-corner-${side}`}
      viewBox="0 0 360 260"
      width={width}
      height={height}
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <PineBranch x={-30} y={-10} length={300} angle={14} seed={seed} />
      <PineBranch x={-20} y={30} length={250} angle={38} seed={seed + 1} />
      <PineBranch x={-10} y={-20} length={210} angle={62} seed={seed + 2} />
      <PineBranch x={60} y={-20} length={230} angle={4} seed={seed + 3} needle={12} />
      <Berries x={150} y={70} seed={seed + 4} />
      <Berries x={70} y={130} scale={0.9} seed={seed + 5} />
      <Bauble x={120} y={130} r={30} color="red" string={40} seed={seed + 6} />
      <Bauble x={215} y={92} r={22} color="gold" string={30} seed={seed + 7} />
      <Bauble x={48} y={196} r={20} color="red" string={26} seed={seed + 8} />
      <Bauble x={285} y={66} r={14} color="silver" string={18} seed={seed + 9} />
    </svg>
  );
}
