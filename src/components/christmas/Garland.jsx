import { useEffect, useMemo, useRef, useState } from 'react';
import { rng, Bauble, Berries } from './art.jsx';

const GREENS = ['#163d26', '#1d4d30', '#24603b', '#2f7347', '#1a4529', '#3a8452'];
const LIGHTS = ['#ffd34d', '#ff5a5a', '#ffffff', '#7fd0ff', '#ffd34d'];
const BAUBLES = ['red', 'gold', 'red', 'silver', 'red', 'green'];
const HEIGHT = 78;
const TOP = 6;
const SAG = 20;

const pointOn = (x0, x1, t) => {
  // quadratic curve from (x0,TOP) to (x1,TOP) with control (mid, TOP + 2*SAG)
  const mx = (x0 + x1) / 2;
  const cy = TOP + 2 * SAG;
  const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
  const y = (1 - t) * (1 - t) * TOP + 2 * (1 - t) * t * cy + t * t * TOP;
  return [x, y];
};

function Bow({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 C-16 -12 -22 6 0 2 C22 6 16 -12 0 0Z" fill="#c8102e" stroke="#7a0a1a" strokeWidth="0.8" />
      <path d="M-2 2 L-9 22 L-4 19 L-1 24 Z M2 2 L9 22 L4 19 L1 24 Z" fill="#b00d26" />
      <circle cx="0" cy="1" r="3.4" fill="#e01e3c" />
    </g>
  );
}

/** Pine garland with baubles, bows and twinkling lights, draped across the page top. */
export default function Garland() {
  const ref = useRef(null);
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.max(320, Math.round(el.getBoundingClientRect().width / 40) * 40));
    update();
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const art = useMemo(() => {
    const rand = rng(7);
    const swags = Math.max(2, Math.round(width / (width < 700 ? 150 : 210)));
    const step = width / swags;
    const needles = [];
    const lights = [];
    const hanging = [];
    const anchors = [];

    for (let s = 0; s < swags; s += 1) {
      const x0 = s * step;
      const x1 = (s + 1) * step;
      const samples = Math.round(step / 2.6);
      for (let i = 0; i <= samples; i += 1) {
        const [x, y] = pointOn(x0, x1, i / samples);
        for (let k = 0; k < 4; k += 1) {
          const a = rand() * Math.PI * 2;
          const l = 7 + rand() * 8;
          const x2 = x + Math.cos(a) * l;
          const y2 = y + Math.sin(a) * l * 0.8;
          needles.push([x, y, x2, y2, GREENS[Math.floor(rand() * GREENS.length)]]);
          if (rand() < 0.12) needles.push([x + (x2 - x) * 0.6, y + (y2 - y) * 0.6, x2, y2, 'rgba(255,255,255,0.8)']);
        }
      }
      for (let i = 1; i < 5; i += 1) {
        const [x, y] = pointOn(x0, x1, i / 5);
        lights.push({ x, y: y + 6, c: LIGHTS[(s * 4 + i) % LIGHTS.length], d: ((s * 4 + i) % 7) * 0.3 });
      }
      const [mx, my] = pointOn(x0, x1, 0.5);
      hanging.push({ x: mx, y: my + 26, color: BAUBLES[s % BAUBLES.length], r: width < 700 ? 9 : 11, seed: s + 20 });
      anchors.push(x0);
    }
    anchors.push(width);
    return { needles, lights, hanging, anchors };
  }, [width]);

  return (
    <div ref={ref} className="hoc-xmas-garland" aria-hidden="true">
      <svg width="100%" height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} preserveAspectRatio="none">
        {art.hanging.map((b, i) => (
          <Bauble key={`b${i}`} x={b.x} y={b.y} r={b.r} color={b.color} string={12} seed={b.seed} />
        ))}
        {art.needles.map(([x1, y1, x2, y2, c], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {art.lights.map((l, i) => (
          <circle key={`l${i}`} className="hoc-xmas-twinkle hoc-xmas-glow" style={{ animationDelay: `${l.d}s`, color: l.c }} cx={l.x} cy={l.y} r="2.8" fill={l.c} />
        ))}
        {art.anchors.map((x, i) => (
          <g key={`a${i}`}>
            {i % 2 === 0 ? <Bow x={x} y={TOP + 2} /> : <Berries x={x} y={TOP + 6} scale={0.7} seed={i + 40} />}
          </g>
        ))}
      </svg>
    </div>
  );
}
