import { useEffect, useRef } from 'react';
import './ElectricNetworkCanvas.css';

export default function ElectricNetworkCanvas() {
  const canvasRef = useRef(null);
  const myId = useRef(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const peersRef = useRef({});
  const shockwavesRef = useRef([]);
  const inCollisionRef = useRef({});

  useEffect(() => {
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const channel = new BroadcastChannel('electric-balls');

    function resize() {
      const w = Math.floor(window.innerWidth * DPR);
      const h = Math.floor(window.innerHeight * DPR);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    resize();
    window.addEventListener('resize', resize);

    const sampleMetrics = () => ({
      id: myId.current,
      t: Date.now(),
      cx: window.screenX + window.outerWidth / 2,
      cy: window.screenY + window.outerHeight / 2,
    });

    const broadcast = () => {
      channel.postMessage({ type: 'metrics', payload: sampleMetrics() });
    };

    const render = () => {
      resize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(canvas.width, canvas.height) * 0.08;

      drawBall(cx, cy, r);

      const now = Date.now();
      const peers = peersRef.current;
      for (const [id, other] of Object.entries(peers)) {
        if (now - other.t > 3000) {
          delete peers[id];
          continue;
        }

        const ox = other.cx - window.screenX;
        const oy = other.cy - window.screenY;

        drawBall(ox, oy, r);
        drawElectricLine(cx, cy, ox, oy);

        const dist = Math.hypot(ox - cx, oy - cy);
        const inCollision = inCollisionRef.current;

        if (dist < r * 2 && !inCollision[id]) {
          inCollision[id] = true;
          shockwavesRef.current.push({ x: (cx + ox) / 2, y: (cy + oy) / 2, born: performance.now() });
        } else if (dist >= r * 2) {
          inCollision[id] = false;
        }
      }

      renderShockwaves();
      requestAnimationFrame(render);
    };

    const drawBall = (x, y, r) => {
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
      grad.addColorStop(0, 'rgba(180,220,255,0.95)');
      grad.addColorStop(1, 'rgba(70,120,220,0.85)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    };

    const drawElectricLine = (x1, y1, x2, y2) => {
      const segments = 20;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(x2, y2);
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(0,200,255,0.9)');
      grad.addColorStop(1, 'rgba(255,0,200,0.9)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(0,180,255,1)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const renderShockwaves = () => {
      const life = 1000;
      const shockwaves = shockwavesRef.current;
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        const age = performance.now() - sw.born;
        if (age > life) {
          shockwaves.splice(i, 1);
          continue;
        }
        const k = age / life;
        const r = k * Math.max(canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120,220,255,${1 - k})`;
        ctx.lineWidth = 8 * (1 - k);
        ctx.stroke();
      }
    };

    // Handle incoming messages
    channel.onmessage = (e) => {
      const { type, payload } = e.data || {};
      if (type === 'metrics' && payload.id !== myId.current) {
        peersRef.current[payload.id] = payload;
      } else if (type === 'leave') {
        delete peersRef.current[payload.id];
      }
    };

    // Leave message
    window.addEventListener('beforeunload', () => {
      channel.postMessage({ type: 'leave', payload: { id: myId.current } });
    });

    const interval = setInterval(() => {
      broadcast();
      const peers = Object.values(peersRef.current).filter(p => Date.now() - p.t <= 3000);
      const badge = document.getElementById('status');
      if (badge) {
        badge.textContent = peers.length > 0
          ? `${peers.length} Peers connected`
          : 'Waiting for peers…';
      }
    }, 100);

    render();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
      channel.close();
    };
  }, []);

  return (
    <>
      <canvas id="c" ref={canvasRef}></canvas>
      <div className="badge" id="status">Waiting for peers…</div>
    </>
  );
}
