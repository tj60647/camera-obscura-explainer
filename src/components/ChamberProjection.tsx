import React, { useRef, useEffect, useState } from 'react';
import { OpticalParameters, OpticalPhysicsOutputs } from '../types';
import { SCENES } from '../physics/scenes';
import { Eye, Sun, ShieldAlert, Sparkles, Sliders, Info, Compass } from 'lucide-react';

interface ChamberProjectionProps {
  params: OpticalParameters;
  outputs: OpticalPhysicsOutputs;
  onUpdateParams: (partial: Partial<OpticalParameters>) => void;
}

export const ChamberProjection: React.FC<ChamberProjectionProps> = ({
  params,
  outputs,
  onUpdateParams,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'screen' | 'room'>('room');
  const [isAdapting, setIsAdapting] = useState(false);

  // Auto eye adaptation timer simulation
  useEffect(() => {
    let interval: any;
    if (isAdapting && params.eyeAdaptation < 100) {
      interval = setInterval(() => {
        onUpdateParams({
          eyeAdaptation: Math.min(100, params.eyeAdaptation + 2),
        });
      }, 100);
    } else if (params.eyeAdaptation >= 100) {
      setIsAdapting(false);
    }
    return () => clearInterval(interval);
  }, [isAdapting, params.eyeAdaptation, onUpdateParams]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const sceneDef = SCENES[params.selectedScene];

    // Compute optical exposure / brightness factor:
    // Base irradiance from f-number: (d / f)^2
    // Scaled with eye adaptation and user exposure boost
    const adaptationFactor = 0.05 + (params.eyeAdaptation / 100) * 0.95;
    const apertureIrradiance = Math.min(2.5, Math.max(0.04, (outputs.relativeBrightness * 0.8) * params.exposureBoost));
    const effectiveBrightness = apertureIrradiance * adaptationFactor;

    // Ambient wash / light leak
    const leakFactor = (params.ambientLeak / 100) * 0.45;

    // Blur in pixels on this canvas
    // 0.5mm physical blur translates to ~1.5px, 3mm blur to ~14px
    const blurPixels = Math.max(0.5, outputs.totalBlurMm * 3.8);

    if (viewMode === 'screen') {
      // 1. DIRECT SCREEN VIEW (Frosted glass / tracing paper screen)
      // Screen background
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);

      // Render inverted image onto an offscreen canvas with blur and filters
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        // Draw scene vector inverted (flipped horizontally and vertically)
        offCtx.save();
        offCtx.translate(w * 0.5, h * 0.5);
        offCtx.scale(-1, -1);
        offCtx.translate(-w * 0.5, -h * 0.5);

        // Apply optical blur
        offCtx.filter = `blur(${blurPixels}px)`;
        sceneDef.drawVector(offCtx, w, h);
        offCtx.restore();

        // Transfer with exposure brightness and ambient leak
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, effectiveBrightness);
        ctx.drawImage(offscreen, 0, 0);

        // Ambient leak wash (destroys black levels and contrast)
        if (leakFactor > 0) {
          ctx.fillStyle = `rgba(226, 232, 240, ${leakFactor})`;
          ctx.fillRect(0, 0, w, h);
        }

        // Apply Cosine Fourth Law Vignetting radial falloff
        const vignetteGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.65);
        vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
        vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, w, h);

        // Screen texture grain / frosted surface overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) {
          const rx = (i * 37) % w;
          const ry = (i * 59) % h;
          ctx.strokeRect(rx, ry, 2, 2);
        }

        ctx.restore();
      }
    } else {
      // 2. ROOM PERSPECTIVE VIEW (Standing inside the camera obscura room)
      // Room perspective interior walls
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, w, h);

      // Floor perspective
      const floorGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
      floorGrad.addColorStop(0, '#0a0d14');
      floorGrad.addColorStop(1, '#020305');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      ctx.lineTo(w * 0.18, h * 0.58);
      ctx.lineTo(w * 0.82, h * 0.58);
      ctx.lineTo(w, h * 0.72);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Floorboards
      ctx.strokeStyle = '#141b26';
      ctx.lineWidth = 1;
      for (let f = 0.2; f <= 0.8; f += 0.1) {
        ctx.beginPath();
        ctx.moveTo(w * f, h * 0.58);
        ctx.lineTo(w * (f * 1.6 - 0.3), h);
        ctx.stroke();
      }

      // Back Projection Wall (In the center of the room)
      const wallX = w * 0.22;
      const wallY = h * 0.18;
      const wallW = w * 0.56;
      const wallH = h * 0.40;

      // Draw wall border
      ctx.fillStyle = '#06090e';
      ctx.fillRect(wallX, wallY, wallW, wallH);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(wallX, wallY, wallW, wallH);

      // Projected image on the back wall
      const offscreen = document.createElement('canvas');
      offscreen.width = wallW;
      offscreen.height = wallH;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.save();
        offCtx.translate(wallW * 0.5, wallH * 0.5);
        offCtx.scale(-1, -1);
        offCtx.translate(-wallW * 0.5, -wallH * 0.5);
        offCtx.filter = `blur(${blurPixels * 0.7}px)`;
        sceneDef.drawVector(offCtx, wallW, wallH);
        offCtx.restore();

        ctx.save();
        ctx.globalAlpha = Math.min(1.0, effectiveBrightness);
        ctx.drawImage(offscreen, wallX, wallY);

        // Vignetting on wall
        const vigWall = ctx.createRadialGradient(
          wallX + wallW * 0.5,
          wallY + wallH * 0.5,
          wallW * 0.2,
          wallX + wallW * 0.5,
          wallY + wallH * 0.5,
          wallW * 0.55
        );
        vigWall.addColorStop(0, 'rgba(0,0,0,0)');
        vigWall.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = vigWall;
        ctx.fillRect(wallX, wallY, wallW, wallH);
        ctx.restore();
      }

      // Left window blackout panel with Pinhole beam!
      const winX = w * 0.03;
      const winY = h * 0.28;
      const winW = w * 0.12;
      const winH = h * 0.38;

      // Blackout shutter
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.fillRect(winX, winY, winW, winH);
      ctx.strokeRect(winX, winY, winW, winH);

      // Pinhole in shutter
      const pinX = winX + winW * 0.65;
      const pinY = winY + winH * 0.45;
      ctx.beginPath();
      ctx.arc(pinX, pinY, Math.max(2, params.pinholeDiameter * 1.5), 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Atmospheric light cone passing from pinhole to back wall!
      const coneGrad = ctx.createLinearGradient(pinX, pinY, wallX + wallW * 0.5, wallY + wallH * 0.5);
      coneGrad.addColorStop(0, `rgba(254, 240, 138, ${Math.min(0.6, effectiveBrightness * 0.8)})`);
      coneGrad.addColorStop(1, 'rgba(254, 240, 138, 0.02)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pinX, pinY);
      ctx.lineTo(wallX, wallY);
      ctx.lineTo(wallX, wallY + wallH);
      ctx.closePath();
      ctx.fillStyle = coneGrad;
      ctx.fill();
      ctx.restore();

      // Ambient leak effect on room
      if (leakFactor > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${leakFactor * 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }, [params, outputs, viewMode]);

  return (
    <div className="w-full rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-neutral-200">
            {viewMode === 'room' ? 'Inside the Dark Chamber (Camera Obscura Room)' : 'Back Wall Screen Projection'}
          </span>
          <span className="text-neutral-500 font-mono text-[11px] hidden sm:inline">
            (f/{outputs.fNumber.toFixed(0)} • Inverted Image)
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="inline-flex rounded-lg bg-neutral-800/80 p-0.5 border border-neutral-700">
            <button
              id="view-room-btn"
              onClick={() => setViewMode('room')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'room'
                  ? 'bg-neutral-950 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Room View
            </button>
            <button
              id="view-screen-btn"
              onClick={() => setViewMode('screen')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'screen'
                  ? 'bg-neutral-950 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Direct Screen
            </button>
          </div>
        </div>
      </div>

      {/* Projection Canvas */}
      <div className="relative w-full aspect-video sm:aspect-[16/10] bg-black overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="w-full h-full object-contain block"
        />

        {/* Real-time sharpness and illumination pill overlay */}
        <div className="absolute top-3 left-3 bg-neutral-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-xs flex items-center gap-3">
          <div>
            <span className="text-neutral-500 text-[10px] block uppercase font-mono">Spot Sharpness</span>
            <span className={`font-mono font-medium ${outputs.totalBlurMm < 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {outputs.totalBlurMm < 0.6 ? 'Very Sharp' : outputs.totalBlurMm < 1.2 ? 'Moderate' : 'Blurry'} ({outputs.totalBlurMm.toFixed(2)}mm)
            </span>
          </div>
          <div className="w-[1px] h-6 bg-neutral-800" />
          <div>
            <span className="text-neutral-500 text-[10px] block uppercase font-mono">Light Intensity</span>
            <span className="font-mono text-neutral-200">
              {outputs.relativeBrightness > 1.2 ? 'Bright' : outputs.relativeBrightness > 0.4 ? 'Visible' : 'Dim'} (f/{outputs.fNumber.toFixed(0)})
            </span>
          </div>
        </div>

        {/* Warning if ambient light leak is high */}
        {params.ambientLeak > 30 && (
          <div className="absolute top-3 right-3 bg-rose-950/80 backdrop-blur-md border border-rose-700/50 px-3 py-1.5 rounded-lg text-rose-300 text-xs flex items-center gap-1.5 shadow-lg">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Light Leak Detected: Image washed out!</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar: Eye Adaptation & Ambient Leak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-950/90 border-t border-neutral-800 text-xs">
        {/* Eye Dark Adaptation Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              Human Eye Dark Adaptation (Rhodopsin)
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sky-400">{params.eyeAdaptation}%</span>
              <button
                id="auto-adapt-btn"
                onClick={() => {
                  onUpdateParams({ eyeAdaptation: 10 });
                  setIsAdapting(true);
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 transition-colors"
              >
                Simulate 15min Wait
              </button>
            </div>
          </div>
          <input
            id="eye-adaptation-slider"
            type="range"
            min={5}
            max={100}
            step={1}
            value={params.eyeAdaptation}
            onChange={(e) => onUpdateParams({ eyeAdaptation: Number(e.target.value) })}
            className="w-full accent-sky-400 cursor-pointer"
          />
          <p className="text-[11px] text-neutral-500">
            When entering a dark chamber, pupils dilate and rods regenerate rhodopsin over 10-15 minutes to perceive dim inverted rays.
          </p>
        </div>

        {/* Ambient Room Seal Quality */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Room Light Leak (Seal Quality)
            </label>
            <span className={`font-mono ${params.ambientLeak > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {params.ambientLeak === 0 ? '100% Light-Tight' : `${params.ambientLeak}% Leak`}
            </span>
          </div>
          <input
            id="ambient-leak-slider"
            type="range"
            min={0}
            max={80}
            step={1}
            value={params.ambientLeak}
            onChange={(e) => onUpdateParams({ ambientLeak: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <p className="text-[11px] text-neutral-500">
            Even small gaps under doorways or around windows destroy dark chamber contrast. Blackout gaffer tape is essential!
          </p>
        </div>
      </div>
    </div>
  );
};
