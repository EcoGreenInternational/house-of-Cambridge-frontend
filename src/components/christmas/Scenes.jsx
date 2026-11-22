import { useMemo } from 'react';
import { rng, PaperSnowflake, Snowman, XmasTree, Gift, PineCorner } from './art.jsx';

const FLAKES = [
  { left: 2.2, len: 70, size: 50, seed: 1, delay: 0, mobile: true },
  { left: 5.6, len: 150, size: 38, seed: 2, delay: 1.1 },
  { left: 8.4, len: 26, size: 30, seed: 3, delay: 0.5 },
  { left: 91.6, len: 26, size: 32, seed: 4, delay: 0.8 },
  { left: 94.4, len: 130, size: 44, seed: 5, delay: 0.2 },
  { left: 97.8, len: 60, size: 56, seed: 6, delay: 1.4, mobile: true },
];

/** Paper snowflakes hanging on threads from the top of a section (place inside a relative parent). */
export function HangingSnowflakes() {
  return (
    <div className="hoc-xmas-hanging" aria-hidden="true">
      {FLAKES.map((f) => (
        <div
          key={f.seed}
          className={`hoc-xmas-hang${f.mobile ? '' : ' hoc-xmas-hide-mobile'}`}
          style={{ left: `${f.left}%`, animationDelay: `${f.delay}s` }}
        >
          <svg width={f.size + 8} height={f.len + f.size + 8} viewBox={`${-(f.size + 8) / 2} 0 ${f.size + 8} ${f.len + f.size + 8}`}>
            <line x1="0" y1="0" x2="0" y2={f.len} stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
            <g transform={`translate(0 ${f.len + f.size / 2})`} filter="drop-shadow(0 1px 2px rgba(40,60,90,0.45))">
              <PaperSnowflake size={f.size} seed={f.seed} />
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}

/** Pine branches with baubles in both top corners (place inside a relative parent). */
export function PineFrame({ compact = false, sides = ['left', 'right'] }) {
  const w = compact ? 210 : 360;
  const h = compact ? 152 : 260;
  return (
    <div className="hoc-xmas-frame" aria-hidden="true">
      {sides.includes('left') && <PineCorner side="left" width={w} height={h} seed={11} />}
      {sides.includes('right') && <PineCorner side="right" width={w} height={h} seed={23} />}
    </div>
  );
}

/** Built-in Christmas background (deep red, bokeh, snow sparkle) — no upload needed. */
export function ChristmasBackdrop() {
  const bokeh = useMemo(() => {
    const rand = rng(99);
    return Array.from({ length: 46 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      r: 2 + rand() * (rand() < 0.2 ? 26 : 9),
      o: 0.08 + rand() * 0.35,
      white: rand() < 0.55,
    }));
  }, []);
  return (
    <div className="hoc-xmas-backdrop" aria-hidden="true">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        {bokeh.map((b, i) => (
          <circle key={i} cx={`${b.x}%`} cy={`${b.y}%`} r={b.r} fill={b.white ? '#ffffff' : '#ff8a8a'} opacity={b.o} />
        ))}
      </svg>
    </div>
  );
}

/** Night-time snowy scene with snowmen, trees and gifts — sits above the footer. */
export function FooterScene() {
  const stars = useMemo(() => {
    const rand = rng(5);
    return Array.from({ length: 70 }, () => ({ x: rand() * 1440, y: rand() * 110, r: rand() * 1.4 + 0.4, d: rand() * 3 }));
  }, []);
  return (
    <div className="hoc-xmas-scene" aria-hidden="true">
      <svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        <defs>
          <linearGradient id="hocSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1830" />
            <stop offset="100%" stopColor="#24406b" />
          </linearGradient>
        </defs>
        <rect width="1440" height="220" fill="url(#hocSky)" />
        {stars.map((s, i) => (
          <circle key={i} className="hoc-xmas-twinkle" style={{ animationDelay: `${s.d}s` }} cx={s.x} cy={s.y} r={s.r} fill="#fff" />
        ))}
        <circle cx="1180" cy="48" r="22" fill="#fff6d6" />
        <circle cx="1191" cy="42" r="20" fill="#13254a" />
        {/* far hills */}
        <path d="M0 170 Q180 120 360 160 T720 150 T1080 158 T1440 140 V220 H0Z" fill="#c9daf0" />
        {/* trees */}
        <XmasTree x={170} y={196} scale={0.8} seed={3} />
        <XmasTree x={455} y={190} scale={0.65} seed={4} />
        <XmasTree x={980} y={194} scale={0.75} seed={5} />
        <XmasTree x={1290} y={198} scale={0.9} seed={6} />
        {/* front snow */}
        <path d="M0 196 Q120 176 260 192 T560 188 T860 194 T1160 186 T1440 192 V220 H0Z" fill="#ffffff" />
        {/* snowman family + gifts (kept near the centre so they show on phones) */}
        <Snowman x={640} y={206} scale={0.92} hat="top" scarf="#c8102e" />
        <Snowman x={718} y={206} scale={0.62} hat="beanie" scarf="#2f7347" />
        <Snowman x={790} y={206} scale={0.84} hat="beanie" scarf="#c8102e" />
        <Gift x={560} y={208} color="#c8102e" />
        <Gift x={590} y={208} w={22} h={18} color="#1f7a3d" ribbon="#ffffff" />
        <Gift x={862} y={208} w={28} h={22} color="#d4a63a" ribbon="#c8102e" />
        <Gift x={890} y={208} w={20} h={30} color="#1d6fd1" ribbon="#ffd34d" />
      </svg>
    </div>
  );
}
