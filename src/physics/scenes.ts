import { ScenePreset } from '../types';

export interface ScenePoint {
  x: number; // 0 to 1 relative
  y: number; // 0 to 1 relative (0 top, 1 bottom)
  color: string;
  intensity: number;
  label?: string;
}

export interface SceneDefinition {
  id: ScenePreset;
  title: string;
  subtitle: string;
  description: string;
  points: ScenePoint[];
  drawVector: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const SCENES: Record<ScenePreset, SceneDefinition> = {
  candle: {
    id: 'candle',
    title: 'Illuminated Candle',
    subtitle: 'Classic Optics Emitter',
    description: 'Distinct flame tip, radiant wick, and body demonstrate precise inversion geometry.',
    points: [
      { x: 0.5, y: 0.15, color: '#f59e0b', intensity: 1.0, label: 'Flame Tip' },
      { x: 0.5, y: 0.28, color: '#ef4444', intensity: 0.9, label: 'Flame Core' },
      { x: 0.5, y: 0.36, color: '#38bdf8', intensity: 0.8, label: 'Wick Base' },
      { x: 0.5, y: 0.55, color: '#fef08a', intensity: 0.4, label: 'Candle Top' },
      { x: 0.5, y: 0.85, color: '#e2e8f0', intensity: 0.2, label: 'Candle Base' },
    ],
    drawVector: (ctx, w, h) => {
      ctx.save();
      // Background glow
      const radialGlow = ctx.createRadialGradient(w * 0.5, h * 0.28, 5, w * 0.5, h * 0.28, w * 0.45);
      radialGlow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, w, h);

      // Wax body
      const waxGrad = ctx.createLinearGradient(w * 0.35, 0, w * 0.65, 0);
      waxGrad.addColorStop(0, '#e2e8f0');
      waxGrad.addColorStop(0.5, '#f8fafc');
      waxGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = waxGrad;
      ctx.fillRect(w * 0.38, h * 0.45, w * 0.24, h * 0.48);

      // Wax rim top curve
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.45, w * 0.12, h * 0.03, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();

      // Wick
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.45);
      ctx.quadraticCurveTo(w * 0.51, h * 0.40, w * 0.49, h * 0.36);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Flame
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.40);
      ctx.bezierCurveTo(w * 0.62, h * 0.32, w * 0.58, h * 0.20, w * 0.5, h * 0.12);
      ctx.bezierCurveTo(w * 0.42, h * 0.20, w * 0.38, h * 0.32, w * 0.5, h * 0.40);
      ctx.closePath();

      const flameGrad = ctx.createLinearGradient(0, h * 0.40, 0, h * 0.12);
      flameGrad.addColorStop(0, '#2563eb'); // blue base
      flameGrad.addColorStop(0.2, '#ea580c'); // orange
      flameGrad.addColorStop(0.7, '#facc15'); // yellow
      flameGrad.addColorStop(1, '#fffbeb'); // white tip
      ctx.fillStyle = flameGrad;
      ctx.fill();

      ctx.restore();
    },
  },
  tree: {
    id: 'tree',
    title: 'Sunlit Tree & Sky',
    subtitle: 'Natural Landscape',
    description: 'Bright sky, sun disc, green canopy, and trunk showing full outdoor color inversion.',
    points: [
      { x: 0.25, y: 0.15, color: '#fde047', intensity: 1.0, label: 'Sun Disc' },
      { x: 0.65, y: 0.22, color: '#22c55e', intensity: 0.85, label: 'Canopy Crown' },
      { x: 0.55, y: 0.45, color: '#15803d', intensity: 0.7, label: 'Mid Foliage' },
      { x: 0.62, y: 0.72, color: '#854d0e', intensity: 0.5, label: 'Trunk' },
      { x: 0.5, y: 0.90, color: '#3f6212', intensity: 0.4, label: 'Meadow' },
    ],
    drawVector: (ctx, w, h) => {
      ctx.save();
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.6, '#38bdf8');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.75);

      // Sun
      ctx.beginPath();
      ctx.arc(w * 0.22, h * 0.20, w * 0.1, 0, Math.PI * 2);
      const sunGrad = ctx.createRadialGradient(w * 0.22, h * 0.20, 2, w * 0.22, h * 0.20, w * 0.1);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.5, '#fef08a');
      sunGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = sunGrad;
      ctx.fill();

      // Distant rolling hills
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      ctx.bezierCurveTo(w * 0.3, h * 0.64, w * 0.7, h * 0.78, w, h * 0.68);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = '#166534';
      ctx.fill();

      // Grass foreground
      ctx.beginPath();
      ctx.moveTo(0, h * 0.75);
      ctx.bezierCurveTo(w * 0.4, h * 0.79, w * 0.8, h * 0.72, w, h * 0.8);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = '#15803d';
      ctx.fill();

      // Tree trunk
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.48);
      ctx.lineTo(w * 0.66, h * 0.48);
      ctx.lineTo(w * 0.68, h * 0.85);
      ctx.lineTo(w * 0.59, h * 0.85);
      ctx.closePath();
      ctx.fill();

      // Tree canopy foliage clusters
      const foliage = [
        { cx: 0.64, cy: 0.30, r: 0.18, col: '#15803d' },
        { cx: 0.55, cy: 0.38, r: 0.14, col: '#16a34a' },
        { cx: 0.73, cy: 0.36, r: 0.13, col: '#15803d' },
        { cx: 0.64, cy: 0.44, r: 0.16, col: '#22c55e' },
      ];
      for (const f of foliage) {
        ctx.beginPath();
        ctx.arc(w * f.cx, h * f.cy, w * f.r, 0, Math.PI * 2);
        ctx.fillStyle = f.col;
        ctx.fill();
      }

      ctx.restore();
    },
  },
  optics_grid: {
    id: 'optics_grid',
    title: 'Calibrated Optical Arrows',
    subtitle: 'Physics Benchmark Target',
    description: 'High-contrast chromatic arrows (Red top, Green center, Blue base) for measuring inversion and magnification.',
    points: [
      { x: 0.5, y: 0.12, color: '#ef4444', intensity: 1.0, label: 'Red Top Arrow' },
      { x: 0.5, y: 0.32, color: '#f97316', intensity: 0.9, label: 'Upper Segment' },
      { x: 0.5, y: 0.50, color: '#22c55e', intensity: 1.0, label: 'Green Optical Axis' },
      { x: 0.5, y: 0.68, color: '#06b6d4', intensity: 0.9, label: 'Lower Segment' },
      { x: 0.5, y: 0.88, color: '#3b82f6', intensity: 1.0, label: 'Blue Bottom Arrow' },
    ],
    drawVector: (ctx, w, h) => {
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += w / 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += h / 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Central Optical Axis
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Red Arrow (Pointing UP)
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.15);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.10);
      ctx.lineTo(w * 0.44, h * 0.18);
      ctx.lineTo(w * 0.56, h * 0.18);
      ctx.closePath();
      ctx.fill();

      // Center Green Circle
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 10, 0, Math.PI * 2);
      ctx.fill();

      // Bottom Blue Arrow (Pointing DOWN)
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.55);
      ctx.lineTo(w * 0.5, h * 0.85);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.90);
      ctx.lineTo(w * 0.44, h * 0.82);
      ctx.lineTo(w * 0.56, h * 0.82);
      ctx.closePath();
      ctx.fill();

      // Height calibration ticks
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('+ho (Top)', w * 0.60, h * 0.14);
      ctx.fillText('0 (Axis)', w * 0.60, h * 0.51);
      ctx.fillText('-ho (Bottom)', w * 0.60, h * 0.88);

      ctx.restore();
    },
  },
  artist_model: {
    id: 'artist_model',
    title: 'Renaissance Still Life',
    subtitle: 'Johannes Vermeer Style',
    description: 'Pitcher, chalice, and fruit bowl — demonstrating why 17th-century masters used the camera obscura to capture accurate perspective.',
    points: [
      { x: 0.38, y: 0.20, color: '#fef08a', intensity: 0.9, label: 'Pitcher Spout' },
      { x: 0.44, y: 0.45, color: '#cbd5e1', intensity: 0.8, label: 'Silver Ewer' },
      { x: 0.68, y: 0.38, color: '#eab308', intensity: 0.85, label: 'Gold Chalice' },
      { x: 0.52, y: 0.68, color: '#dc2626', intensity: 0.75, label: 'Red Apple' },
      { x: 0.50, y: 0.85, color: '#78350f', intensity: 0.4, label: 'Oak Table' },
    ],
    drawVector: (ctx, w, h) => {
      ctx.save();
      // Warm dark atelier background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#1c1917');
      bg.addColorStop(1, '#0c0a09');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Wooden Tabletop
      ctx.fillStyle = '#442210';
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
      ctx.fillStyle = '#291408';
      ctx.fillRect(0, h * 0.75, w, 4);

      // Pitcher / Ewer (Silver-grey ceramic)
      ctx.beginPath();
      ctx.ellipse(w * 0.42, h * 0.62, w * 0.12, h * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();

      // Pitcher neck
      ctx.fillRect(w * 0.38, h * 0.32, w * 0.08, h * 0.20);
      // Pitcher spout
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.32);
      ctx.lineTo(w * 0.30, h * 0.22);
      ctx.lineTo(w * 0.46, h * 0.32);
      ctx.closePath();
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();

      // Gold Goblet / Chalice
      ctx.beginPath();
      ctx.moveTo(w * 0.65, h * 0.42);
      ctx.lineTo(w * 0.75, h * 0.42);
      ctx.lineTo(w * 0.72, h * 0.58);
      ctx.lineTo(w * 0.68, h * 0.58);
      ctx.closePath();
      ctx.fillStyle = '#ca8a04';
      ctx.fill();
      // Stem
      ctx.fillRect(w * 0.69, h * 0.58, w * 0.02, h * 0.14);
      // Foot
      ctx.beginPath();
      ctx.ellipse(w * 0.70, h * 0.72, w * 0.06, h * 0.02, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();

      // Red Apple on table
      ctx.beginPath();
      ctx.arc(w * 0.52, h * 0.71, w * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      // Apple stem
      ctx.beginPath();
      ctx.moveTo(w * 0.52, h * 0.64);
      ctx.quadraticCurveTo(w * 0.54, h * 0.61, w * 0.56, h * 0.62);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    },
  },
  landscape: {
    id: 'landscape',
    title: 'Countryside & Villa',
    subtitle: 'Architectural Perspective',
    description: 'Roofline, chimney smoke, and green fields demonstrating angular field of view.',
    points: [
      { x: 0.18, y: 0.18, color: '#fbbf24', intensity: 1.0, label: 'Sun' },
      { x: 0.60, y: 0.28, color: '#dc2626', intensity: 0.9, label: 'Roof Peak' },
      { x: 0.75, y: 0.38, color: '#f97316', intensity: 0.7, label: 'Chimney' },
      { x: 0.60, y: 0.62, color: '#fef3c7', intensity: 0.8, label: 'Villa Wall' },
      { x: 0.40, y: 0.88, color: '#16a34a', intensity: 0.5, label: 'Forecourt' },
    ],
    drawVector: (ctx, w, h) => {
      ctx.save();
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.7);

      // Sun
      ctx.beginPath();
      ctx.arc(w * 0.18, h * 0.20, w * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      // Rolling Ground
      ctx.beginPath();
      ctx.moveTo(0, h * 0.68);
      ctx.bezierCurveTo(w * 0.4, h * 0.65, w * 0.8, h * 0.75, w, h * 0.70);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = '#15803d';
      ctx.fill();

      // House Body
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(w * 0.45, h * 0.48, w * 0.35, h * 0.26);

      // Roof
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.48);
      ctx.lineTo(w * 0.62, h * 0.28);
      ctx.lineTo(w * 0.83, h * 0.48);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Chimney
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(w * 0.72, h * 0.26, w * 0.06, h * 0.14);

      // Windows and Door
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.58, h * 0.60, w * 0.08, h * 0.14); // Door
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(w * 0.48, h * 0.53, w * 0.06, h * 0.08); // Window left
      ctx.fillRect(w * 0.70, h * 0.53, w * 0.06, h * 0.08); // Window right

      ctx.restore();
    },
  },
};
