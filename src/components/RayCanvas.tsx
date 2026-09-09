import React, { useRef, useEffect, useState, useCallback } from 'react';
import { OpticalParameters, OpticalPhysicsOutputs } from '../types';
import { SCENES } from '../physics/scenes';
import { Maximize2, Move, Sparkles, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface RayCanvasProps {
  params: OpticalParameters;
  outputs: OpticalPhysicsOutputs;
  onUpdateParams: (partial: Partial<OpticalParameters>) => void;
}

export const RayCanvas: React.FC<RayCanvasProps> = ({
  params,
  outputs,
  onUpdateParams,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [isDraggingSubject, setIsDraggingSubject] = useState(false);
  const [isDraggingScreen, setIsDraggingScreen] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const w = Math.max(clientWidth, 320);
        const h = Math.min(Math.max(Math.round(w * 0.58), 380), 520);
        setDimensions({ width: w, height: h });
      }
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation loop for photons
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setAnimationPhase((prev) => (prev + 0.02) % 1);
      animId = requestAnimationFrame(animate);
    };
    if (params.animatedPhotons) {
      animId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animId);
  }, [params.animatedPhotons]);

  // Main canvas render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Coordinate mapping
    const opticalAxisY = height * 0.5;

    // Chamber Aperture wall X position: fixed at around 48% of canvas width
    const apertureX = width * 0.48;

    // Subject X position: scaled by subjectDistance (50cm to 600cm)
    // Map 50cm -> apertureX - 100px; 600cm -> apertureX - 320px
    const minDo = 50;
    const maxDo = 600;
    const normDo = Math.min(Math.max((params.subjectDistance - minDo) / (maxDo - minDo), 0), 1);
    const subjectX = apertureX - (90 + normDo * (apertureX - 130));

    // Screen X position: scaled by boxDepth (10cm to 100cm)
    // Map 10cm -> apertureX + 70px; 100cm -> width - 50px
    const minF = 10;
    const maxF = 120;
    const normF = Math.min(Math.max((params.boxDepth - minF) / (maxF - minF), 0), 1);
    const screenX = apertureX + 70 + normF * (width - apertureX - 120);

    // Aperture visual height (proportional to pinhole diameter, clamped for visibility)
    // 0.2mm -> 4px; 5mm -> 48px
    const apertureVisualH = Math.max(3, Math.min(params.pinholeDiameter * 7, 56));

    // Subject visual height
    const subjectVisualH = Math.min(Math.max(params.subjectHeight * 1.3, 80), height * 0.75);
    const subjectTopY = opticalAxisY - subjectVisualH * 0.5;
    const subjectBottomY = opticalAxisY + subjectVisualH * 0.5;

    // Clear background
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, width, height);

    // Outside world ambient (soft daylight tint on the left)
    const daylightGrad = ctx.createLinearGradient(0, 0, apertureX, 0);
    daylightGrad.addColorStop(0, 'rgba(30, 41, 59, 0.5)');
    daylightGrad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
    ctx.fillStyle = daylightGrad;
    ctx.fillRect(0, 0, apertureX, height);

    // Inside chamber: dark room (obscura)
    const chamberGrad = ctx.createLinearGradient(apertureX, 0, width, 0);
    chamberGrad.addColorStop(0, '#030712');
    chamberGrad.addColorStop(1, '#020617');
    ctx.fillStyle = chamberGrad;
    ctx.fillRect(apertureX, 0, width - apertureX, height);

    // Ambient light leak inside box if any
    if (params.ambientLeak > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(params.ambientLeak / 100) * 0.12})`;
      ctx.fillRect(apertureX, 0, screenX - apertureX, height);
    }

    // Grid / Measurement lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Optical Axis
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(20, opticalAxisY);
    ctx.lineTo(width - 20, opticalAxisY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 1. Draw Camera Obscura Box Enclosure
    const boxTopY = 35;
    const boxBottomY = height - 35;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    // Box top wall
    ctx.beginPath();
    ctx.moveTo(apertureX, boxTopY);
    ctx.lineTo(screenX + 16, boxTopY);
    ctx.stroke();
    // Box bottom wall
    ctx.beginPath();
    ctx.moveTo(apertureX, boxBottomY);
    ctx.lineTo(screenX + 16, boxBottomY);
    ctx.stroke();

    // 2. Draw Front Wall with Aperture
    const wallHalfGap = apertureVisualH / 2;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;

    // Top section of front wall
    ctx.fillRect(apertureX - 4, boxTopY, 8, opticalAxisY - wallHalfGap - boxTopY);
    ctx.strokeRect(apertureX - 4, boxTopY, 8, opticalAxisY - wallHalfGap - boxTopY);

    // Bottom section of front wall
    ctx.fillRect(apertureX - 4, opticalAxisY + wallHalfGap, 8, boxBottomY - (opticalAxisY + wallHalfGap));
    ctx.strokeRect(apertureX - 4, opticalAxisY + wallHalfGap, 8, boxBottomY - (opticalAxisY + wallHalfGap));

    // Lens or Pinhole visualization
    if (params.hasLens) {
      // Draw biconvex glass lens
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(apertureX, opticalAxisY, 6, wallHalfGap * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Lens glass reflection glint
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(apertureX - 1, opticalAxisY - wallHalfGap * 0.5, 8, -Math.PI * 0.4, 0);
      ctx.stroke();
      ctx.restore();
    } else {
      // Pinhole opening glow
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.fillRect(apertureX - 2, opticalAxisY - wallHalfGap, 4, apertureVisualH);
    }

    // 3. Draw Back Projection Screen
    ctx.save();
    // Screen plate (frosted glass / white wall)
    const screenGrad = ctx.createLinearGradient(screenX, 0, screenX + 12, 0);
    screenGrad.addColorStop(0, '#f8fafc');
    screenGrad.addColorStop(0.5, '#e2e8f0');
    screenGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = screenGrad;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 8;
    ctx.fillRect(screenX, boxTopY + 2, 8, boxBottomY - boxTopY - 4);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(screenX, boxTopY + 2, 8, boxBottomY - boxTopY - 4);
    ctx.restore();

    // 4. Draw Subject / Scene
    const sceneDef = SCENES[params.selectedScene];
    ctx.save();
    // Subject bounding box & preview
    const sceneW = 74;
    const sceneH = subjectVisualH;
    const sceneLeft = subjectX - sceneW * 0.5;
    const sceneTop = subjectTopY;

    // Draw scene artwork
    ctx.save();
    ctx.translate(sceneLeft, sceneTop);
    sceneDef.drawVector(ctx, sceneW, sceneH);
    ctx.restore();

    // Subject border frame & drag hint
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(sceneLeft - 4, sceneTop - 4, sceneW + 8, sceneH + 8);
    ctx.setLineDash([]);
    ctx.restore();

    // 5. RAY TRACING COMPUTATION & RENDERING
    const points = sceneDef.points;
    const activePoints = points.filter((_, idx) => idx % Math.max(1, Math.floor(5 / params.rayDensity)) === 0);

    // Magnification & Screen image bounds
    // Magnification M = -boxDepth / subjectDistance
    const M = outputs.magnification; // negative value
    const screenImageH = Math.abs(M) * subjectVisualH;
    const screenImageTopY = opticalAxisY - (subjectBottomY - opticalAxisY) * Math.abs(M);
    const screenImageBottomY = opticalAxisY + (opticalAxisY - subjectTopY) * Math.abs(M);

    // Geometric Blur & Airy spot size in canvas pixels
    // Scale blur relative to visual dimensions: 1mm physical blur ≈ 3.5 canvas pixels
    const pxPerMm = 3.5;
    const visualBlurPx = Math.max(1.5, outputs.totalBlurMm * pxPerMm);

    // Trace rays from each selected point
    activePoints.forEach((pt, pIdx) => {
      // Calculate emitter point in canvas coordinates
      const emitX = sceneLeft + pt.x * sceneW;
      const emitY = sceneTop + pt.y * sceneH;

      // Inverted target point on the back screen
      // y_screen = opticalAxisY - (emitY - opticalAxisY) * |M|
      const idealScreenY = opticalAxisY - (emitY - opticalAxisY) * Math.abs(M);

      // Determine ray fans across the aperture
      // Number of rays per point
      const raySubCount = Math.max(3, Math.min(params.rayDensity, 15));

      for (let r = 0; r < raySubCount; r++) {
        // Aperture sub-sample Y position: from -wallHalfGap to +wallHalfGap
        const t = raySubCount === 1 ? 0.5 : r / (raySubCount - 1);
        const apY = opticalAxisY - wallHalfGap + t * apertureVisualH;

        // Calculate ray landing on screen
        let hitScreenY = idealScreenY;

        if (params.hasLens) {
          // Snell refraction through thin lens:
          // Incident slope from emitter to lens
          const slopeIn = (apY - emitY) / (apertureX - emitX);
          // Lens deflection: delta_slope = - (apY - opticalAxisY) / f_lens_px
          const fLensPx = (params.lensFocalLength / params.boxDepth) * (screenX - apertureX);
          const slopeOut = slopeIn - (apY - opticalAxisY) / fLensPx;
          hitScreenY = apY + slopeOut * (screenX - apertureX);
        } else {
          // Straight ray propagation: slope is continuous through pinhole
          const slope = (apY - emitY) / (apertureX - emitX);
          hitScreenY = apY + slope * (screenX - apertureX);

          // If pinhole is small, add Fraunhofer diffraction angular spread
          if (outputs.diffractionBlurMm > outputs.geometricBlurMm) {
            // Wave diffraction spreading out proportional to wavelength / diameter
            const diffSpread = (outputs.diffractionBlurMm * pxPerMm * 0.4) * (t - 0.5);
            hitScreenY += diffSpread;
          }
        }

        // Ray color and alpha
        const isChiefRay = r === Math.floor(raySubCount / 2);
        const rayAlpha = isChiefRay ? 0.85 : 0.35;

        // Segment 1: Outside (Emitter -> Aperture)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(emitX, emitY);
        ctx.lineTo(apertureX, apY);
        ctx.strokeStyle = pt.color;
        ctx.globalAlpha = rayAlpha;
        ctx.lineWidth = isChiefRay ? 1.8 : 1.0;
        ctx.stroke();

        // Segment 2: Inside Chamber (Aperture -> Back Screen)
        // Check if hit is within box boundary
        const clampedHitY = Math.max(boxTopY + 2, Math.min(boxBottomY - 2, hitScreenY));
        ctx.beginPath();
        ctx.moveTo(apertureX, apY);
        ctx.lineTo(screenX, clampedHitY);
        ctx.strokeStyle = pt.color;
        ctx.globalAlpha = rayAlpha * 0.9;
        ctx.lineWidth = isChiefRay ? 1.8 : 1.0;
        ctx.stroke();
        ctx.restore();

        // Animated photon particles
        if (params.animatedPhotons) {
          ctx.save();
          // Total path length parameterization
          const totalDist = (apertureX - emitX) + (screenX - apertureX);
          const dist1 = apertureX - emitX;

          // Particle phase offset for each ray
          const pPhase = (animationPhase + (r * 0.17) + (pIdx * 0.23)) % 1;
          const currentDist = pPhase * totalDist;

          let px = 0;
          let py = 0;
          if (currentDist < dist1) {
            const u = currentDist / dist1;
            px = emitX + u * (apertureX - emitX);
            py = emitY + u * (apY - emitY);
          } else {
            const u = (currentDist - dist1) / (screenX - apertureX);
            px = apertureX + u * (screenX - apertureX);
            py = apY + u * (clampedHitY - apY);
          }

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw blur spot (circle of confusion) at the screen for this emitter point
      ctx.save();
      const spotY = Math.max(boxTopY + 4, Math.min(boxBottomY - 4, idealScreenY));
      const spotGrad = ctx.createRadialGradient(screenX + 4, spotY, 1, screenX + 4, spotY, visualBlurPx);
      spotGrad.addColorStop(0, pt.color);
      spotGrad.addColorStop(0.6, pt.color);
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = spotGrad;
      ctx.globalAlpha = Math.min(0.9, 0.4 + (params.pinholeDiameter / 4));
      ctx.beginPath();
      ctx.ellipse(screenX + 4, spotY, 3, visualBlurPx, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Draw Inverted Image Preview directly on the screen
    ctx.save();
    const previewW = 34;
    const previewH = screenImageH;
    const previewTop = screenImageTopY;
    const previewLeft = screenX + 16;

    // Draw inverted vector thumbnail on the screen back
    ctx.save();
    ctx.translate(previewLeft + previewW * 0.5, previewTop + previewH * 0.5);
    // Invert both vertically and horizontally
    ctx.scale(-1, -1);
    ctx.translate(-previewW * 0.5, -previewH * 0.5);

    // Apply blur filter if supported
    if (outputs.totalBlurMm > 0.4) {
      ctx.filter = `blur(${Math.min(outputs.totalBlurMm * 1.5, 12)}px)`;
    }
    sceneDef.drawVector(ctx, previewW, previewH);
    ctx.restore();

    // Label: Inverted Real Image
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('INVERTED SCREEN', screenX - 55, boxTopY - 12);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`M = ${M.toFixed(2)}x`, screenX - 55, boxTopY - 2);

    // 7. Physical Dimensions Labels on Canvas
    // Focal length (f = boxDepth)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    const dimY = boxBottomY + 18;
    ctx.beginPath();
    ctx.moveTo(apertureX, dimY);
    ctx.lineTo(screenX, dimY);
    ctx.stroke();
    // Arrow ticks
    ctx.beginPath();
    ctx.moveTo(apertureX, dimY - 4);
    ctx.lineTo(apertureX, dimY + 4);
    ctx.moveTo(screenX, dimY - 4);
    ctx.lineTo(screenX, dimY + 4);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`f = ${params.boxDepth} cm`, (apertureX + screenX) / 2, dimY + 14);

    // Object distance (do)
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(subjectX, dimY);
    ctx.lineTo(apertureX, dimY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(subjectX, dimY - 4);
    ctx.lineTo(subjectX, dimY + 4);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`do = ${params.subjectDistance} cm`, (subjectX + apertureX) / 2, dimY + 14);

    // Pinhole size indicator
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.font = '11px JetBrains Mono, monospace';
    const pinholeLabel = params.hasLens ? `Lens (f=${params.lensFocalLength}cm)` : `Aperture d = ${params.pinholeDiameter} mm`;
    ctx.fillText(pinholeLabel, apertureX, boxTopY - 12);

    ctx.restore();
  }, [dimensions, params, outputs, animationPhase]);

  // Request render when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  // Drag interaction for Subject and Screen
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const apertureX = dimensions.width * 0.48;
    const minDo = 50;
    const maxDo = 600;
    const normDo = Math.min(Math.max((params.subjectDistance - minDo) / (maxDo - minDo), 0), 1);
    const subjectX = apertureX - (90 + normDo * (apertureX - 130));

    const minF = 10;
    const maxF = 120;
    const normF = Math.min(Math.max((params.boxDepth - minF) / (maxF - minF), 0), 1);
    const screenX = apertureX + 70 + normF * (dimensions.width - apertureX - 120);

    // Check hit on subject
    if (Math.abs(x - subjectX) < 45) {
      setIsDraggingSubject(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else if (Math.abs(x - screenX) < 30) {
      setIsDraggingScreen(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const apertureX = dimensions.width * 0.48;

    if (isDraggingSubject) {
      // Map x back to subjectDistance
      const deltaX = apertureX - x;
      const minDo = 50;
      const maxDo = 600;
      const newDo = Math.round(Math.min(Math.max(deltaX * 2.2, minDo), maxDo));
      onUpdateParams({ subjectDistance: newDo });
    } else if (isDraggingScreen) {
      // Map x back to boxDepth
      const deltaX = x - apertureX;
      const minF = 10;
      const maxF = 120;
      const newF = Math.round(Math.min(Math.max((deltaX - 70) * 0.45 + minF, minF), maxF));
      onUpdateParams({ boxDepth: newF });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingSubject || isDraggingScreen) {
      setIsDraggingSubject(false);
      setIsDraggingScreen(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Banner Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800/80 text-xs text-neutral-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            2D Cross-Section Ray Optics Bench
          </span>
          <span className="hidden sm:inline text-neutral-500">|</span>
          <span className="hidden sm:inline text-neutral-400">
            Drag the <strong className="text-sky-300">Object</strong> or <strong className="text-amber-300">Screen</strong> directly on canvas
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            id="toggle-photons-btn"
            onClick={() => onUpdateParams({ animatedPhotons: !params.animatedPhotons })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              params.animatedPhotons
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700'
            }`}
          >
            {params.animatedPhotons ? 'Photons: On' : 'Photons: Off'}
          </button>

          <button
            id="snap-rayleigh-btn"
            onClick={() => onUpdateParams({ pinholeDiameter: Number(outputs.optimalDiameter.toFixed(2)) })}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition-colors flex items-center gap-1"
            title="Snap pinhole diameter to Lord Rayleigh optimum"
          >
            <RefreshCw className="w-3 h-3" />
            Snap to Optimum ({outputs.optimalDiameter.toFixed(2)} mm)
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full relative cursor-crosshair select-none bg-neutral-950"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block"
          style={{ touchAction: 'none' }}
        />

        {/* Floating Quick Readout Badge */}
        <div className="absolute top-3 left-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-2.5 text-xs shadow-xl space-y-1 max-w-[200px] pointer-events-none">
          <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Live Ray Metrics</div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Total Blur:</span>
            <span className={`font-mono font-medium ${outputs.totalBlurMm < 0.6 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {outputs.totalBlurMm.toFixed(2)} mm
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">f-Number:</span>
            <span className="font-mono text-neutral-200">f/{outputs.fNumber.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Optimum:</span>
            <span className="font-mono text-sky-400">{outputs.optimalDiameter.toFixed(2)} mm</span>
          </div>
        </div>

        {/* Drag Hints Overlay */}
        <div className="absolute bottom-2 right-3 flex items-center gap-2 pointer-events-none text-[11px] text-neutral-500 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
          <Move className="w-3 h-3 text-neutral-400" />
          <span>Drag elements horizontally</span>
        </div>
      </div>
    </div>
  );
};
