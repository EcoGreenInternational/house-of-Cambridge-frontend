import { useEffect, useRef } from 'react';

const drawCrystal = (ctx, x, y, r, rot, alpha) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = Math.max(1, r / 5);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3;
    const cx = Math.cos(a);
    const sy = Math.sin(a);
    ctx.moveTo(0, 0);
    ctx.lineTo(cx * r, sy * r);
    // little side branches
    const bx = cx * r * 0.55;
    const by = sy * r * 0.55;
    const b = r * 0.3;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a + 0.7) * b, by + Math.sin(a + 0.7) * b);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a - 0.7) * b, by + Math.sin(a - 0.7) * b);
  }
  ctx.stroke();
  ctx.restore();
};

/** Canvas snowfall: soft round flakes plus some six-armed crystals. Never blocks clicks. */
export default function Snowfall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let flakes = [];
    let frameId = 0;
    let last = performance.now();

    const makeFlake = (startAtTop = false) => {
      const crystal = Math.random() < 0.28;
      const r = crystal ? 4 + Math.random() * 5 : Math.random() * 2.4 + 1.1;
      return {
        crystal,
        r,
        x: Math.random() * width,
        y: startAtTop ? -12 - Math.random() * 40 : Math.random() * height,
        speed: 20 + r * (crystal ? 5 : 13) + Math.random() * 16,
        drift: Math.random() * 0.8 + 0.3,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.35 + 0.6,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(120, Math.max(30, width / 13)));
      if (flakes.length > target) flakes = flakes.slice(0, target);
      while (flakes.length < target) flakes.push(makeFlake());
    };

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.shadowColor = 'rgba(90,120,160,0.55)';
      ctx.shadowBlur = 4;

      for (const f of flakes) {
        f.phase += dt * f.drift;
        f.y += f.speed * dt;
        f.x += Math.sin(f.phase) * 18 * dt;
        f.rot += f.spin * dt;
        if (f.y - f.r > height) Object.assign(f, makeFlake(true));
        if (f.x < -10) f.x = width + 10;
        if (f.x > width + 10) f.x = -10;

        if (f.crystal) {
          drawCrystal(ctx, f.x, f.y, f.r, f.rot, f.alpha);
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
          ctx.fill();
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    resize();
    frameId = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hoc-xmas-snow" aria-hidden="true" />;
}
