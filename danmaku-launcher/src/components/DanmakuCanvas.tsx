import { useEffect, useRef } from 'react';

export type DanmakuMode = 'sakura' | 'danmaku' | 'minimal' | 'off';

interface DanmakuCanvasProps {
  mode: DanmakuMode;
  speedMultiplier?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  angle: number;
  rotSpeed: number;
  color: string;
  alpha: number;
  type: 'petal' | 'orb' | 'star';
}

export default function DanmakuCanvas({ mode, speedMultiplier = 1 }: DanmakuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const count = mode === 'minimal' ? 25 : mode === 'danmaku' ? 55 : 40;
    const particles: Particle[] = [];

    const colors = {
      sakura: ['rgba(244, 114, 182, 0.4)', 'rgba(251, 113, 133, 0.35)', 'rgba(253, 164, 175, 0.3)'],
      danmaku: ['rgba(239, 68, 68, 0.4)', 'rgba(59, 130, 246, 0.4)', 'rgba(234, 179, 8, 0.4)', 'rgba(168, 85, 247, 0.35)'],
      minimal: ['rgba(255, 255, 255, 0.15)', 'rgba(244, 114, 182, 0.2)'],
    };

    const palette = colors[mode] || colors.sakura;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: mode === 'danmaku' ? Math.random() * 4 + 2 : Math.random() * 7 + 4,
        speedX: (Math.random() - 0.5) * 0.8 * speedMultiplier,
        speedY: (Math.random() * 0.8 + 0.3) * speedMultiplier,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: Math.random() * 0.5 + 0.2,
        type: mode === 'danmaku' ? (Math.random() > 0.4 ? 'orb' : 'star') : 'petal',
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.rotSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        if (p.type === 'petal') {
          // Draw subtle cherry blossom petal
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(p.size / 2, -p.size, p.size, -p.size / 2, 0, p.size);
          ctx.bezierCurveTo(-p.size, -p.size / 2, -p.size / 2, -p.size, 0, 0);
          ctx.fill();
        } else if (p.type === 'star') {
          // Danmaku star bullet
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size);
            ctx.lineTo(Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2));
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Glowing round bullet orb
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, speedMultiplier]);

  if (mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-65"
      aria-hidden="true"
    />
  );
}
