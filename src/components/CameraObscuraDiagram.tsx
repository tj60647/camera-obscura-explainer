import React, { useState, useMemo } from 'react';
import { calculateOptics } from '../physics/optics';
import { OpticalParameters } from '../types';
import { Sparkles, Check, Info, Hammer, Ruler, ArrowRight, Eye } from 'lucide-react';

type ObjectType = 'tree' | 'candle' | 'arrow';

export const CameraObscuraDiagram: React.FC = () => {
  // Direct, simple state parameters
  const [boxDepth, setBoxDepth] = useState<number>(30); // cm
  const [pinholeDiameter, setPinholeDiameter] = useState<number>(0.56); // mm
  const [subjectDistance, setSubjectDistance] = useState<number>(200); // cm
  const [selectedObject, setSelectedObject] = useState<ObjectType>('tree');
  const [showRayCones, setShowRayCones] = useState<boolean>(true);

  // Compute optical values
  const params: OpticalParameters = useMemo(
    () => ({
      pinholeDiameter,
      boxDepth,
      subjectDistance,
      subjectHeight: 120,
      wavelength: 550,
      hasLens: false,
      lensFocalLength: 30,
      ambientLeak: 0,
      eyeAdaptation: 80,
      exposureBoost: 1.0,
      rayDensity: 5,
      selectedScene: 'tree',
      apertureShape: 'circle',
      showWavefronts: false,
      showNormalRays: true,
      showChiefRays: true,
      animatedPhotons: false,
    }),
    [pinholeDiameter, boxDepth, subjectDistance]
  );

  const outputs = useMemo(() => calculateOptics(params), [params]);

  // Diagram geometry coordinate calculations (SVG viewBox 0 0 960 480)
  const svgWidth = 960;
  const svgHeight = 440;
  const centerY = 220;

  // Aperture (pinhole) x-coordinate is fixed in the center
  const apertureX = 480;

  // Object position on the left
  // Map subjectDistance (50 to 500 cm) to x range [80, 360]
  const minObjDist = 50;
  const maxObjDist = 500;
  const distNorm = (subjectDistance - minObjDist) / (maxObjDist - minObjDist);
  const objectX = 360 - distNorm * 260; // closer = near 360, far = near 100

  // Object height on screen
  const objectHeightPx = 170;
  const objTopY = centerY - objectHeightPx / 2;
  const objBottomY = centerY + objectHeightPx / 2;

  // Box depth mapping: boxDepth (10 to 100 cm) to width in box [140, 380]
  const minBox = 10;
  const maxBox = 100;
  const boxNorm = (boxDepth - minBox) / (maxBox - minBox);
  const boxWidthPx = 150 + boxNorm * 230; // ranges from 150px to 380px
  const screenX = apertureX + boxWidthPx;
  const boxTopY = centerY - 135;
  const boxBottomY = centerY + 135;
  const boxHeight = 270;

  // Image height on screen by geometric magnification
  // M = - boxDepth / subjectDistance
  const mag = boxDepth / subjectDistance;
  const imgHeightPx = Math.min(Math.max(objectHeightPx * mag, 24), boxHeight - 20);
  const imgTopY = centerY - imgHeightPx / 2; // inverted: top on screen corresponds to bottom of object
  const imgBottomY = centerY + imgHeightPx / 2; // bottom on screen corresponds to top of object

  // Aperture opening in pixels (scaled up slightly for visibility)
  const pinholeOpeningPx = Math.max(pinholeDiameter * 4, 3);
  const apTopY = centerY - pinholeOpeningPx / 2;
  const apBottomY = centerY + pinholeOpeningPx / 2;

  // Circle of confusion / blur spot size on screen in pixels
  const blurSpotPx = Math.max(outputs.totalBlurMm * 1.8, 1);
  const blurFilterValue = Math.min(Math.max((blurSpotPx - 1.2) * 1.5, 0), 12);

  // Safe optical parameters with robust fallbacks
  const optimalDiameter = outputs.optimalDiameterMm ?? outputs.optimalDiameter ?? 0.56;
  const fNumber = outputs.fNumber ?? 500;
  const magnification = outputs.magnification ?? -0.15;
  const imageHeightCm = outputs.imageHeightCm ?? 18;

  // Suggested household needle / tool based on optimal diameter
  const toolRecommendation = useMemo(() => {
    const opt = optimalDiameter;
    if (opt < 0.42) {
      return {
        tool: '#12 Beading Needle or #80 Micro Drill',
        desc: 'Very fine needle (0.35 - 0.40 mm diameter).',
      };
    } else if (opt < 0.65) {
      return {
        tool: '#10 Standard Sewing Needle',
        desc: 'Common hand sewing needle (approx. 0.50 - 0.60 mm diameter).',
      };
    } else if (opt < 0.85) {
      return {
        tool: '#7 Embroidery Needle or Fine Pin',
        desc: 'Medium craft pin or dressmaker pin (approx. 0.70 - 0.80 mm).',
      };
    } else {
      return {
        tool: 'Standard Pushpin / Thumbtack tip',
        desc: 'Insert only the tapered tip, do not push all the way in.',
      };
    }
  }, [optimalDiameter]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Direct Optical Diagram
              </span>
              <span className="text-xs text-neutral-400">
                f/{fNumber.toFixed(0)} • Magnification: {Math.abs(magnification).toFixed(2)}×
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 mt-1 tracking-tight">
              Camera Obscura: Ray Inversion & Build Physics
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 max-w-2xl">
              Light propagates in straight lines. As rays pass through a small aperture, rays from the top of the object project to the bottom of the screen, creating an inverted image.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-snap-rayleigh"
              onClick={() => setPinholeDiameter(parseFloat(optimalDiameter.toFixed(2)))}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
              title="Set to Lord Rayleigh's diffraction-limited optimum"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Snap to Optimal ({optimalDiameter.toFixed(2)}mm)</span>
            </button>
          </div>
        </div>
      </div>

      {/* THE PRIMARY SCIENTIFIC DIAGRAM */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl relative">
        {/* Diagram Overlay Controls & Legend */}
        <div className="absolute top-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 text-xs pointer-events-none">
          {/* Object Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 pointer-events-auto">
            <span className="text-[11px] text-neutral-400 px-2 font-medium">Object:</span>
            <button
              id="obj-tree"
              onClick={() => setSelectedObject('tree')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedObject === 'tree'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Outdoor Tree
            </button>
            <button
              id="obj-candle"
              onClick={() => setSelectedObject('candle')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedObject === 'candle'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Candle Flame
            </button>
            <button
              id="obj-arrow"
              onClick={() => setSelectedObject('arrow')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedObject === 'arrow'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Physics Arrow
            </button>
          </div>

          {/* Ray Cone Mode Toggle */}
          <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 pointer-events-auto">
            <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300">
              <input
                type="checkbox"
                checked={showRayCones}
                onChange={(e) => setShowRayCones(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0"
              />
              <span>Show Beam Cones (Blur Spots)</span>
            </label>
          </div>
        </div>

        {/* SVG Diagram Canvas */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[760px] h-[400px] select-none"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            <defs>
              {/* Blur filter for projected image based on circle of confusion */}
              <filter id="projectionBlur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation={blurFilterValue} />
              </filter>

              {/* Marker Arrows */}
              <marker
                id="arrowhead-amber"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
              <marker
                id="arrowhead-teal"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#14b8a6" />
              </marker>
              <marker
                id="dimension-arrow"
                markerWidth="6"
                markerHeight="4"
                refX="5"
                refY="2"
                orient="auto"
              >
                <polygon points="0 0, 6 2, 0 4" fill="#737373" />
              </marker>
              <marker
                id="dimension-arrow-rev"
                markerWidth="6"
                markerHeight="4"
                refX="1"
                refY="2"
                orient="auto"
              >
                <polygon points="6 0, 0 2, 6 4" fill="#737373" />
              </marker>

              {/* Linear Gradients for Beam Cones */}
              <linearGradient id="topConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.25" />
              </linearGradient>

              <linearGradient id="bottomConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#14b8a6" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.25" />
              </linearGradient>

              {/* Chamber Hatching Pattern for Box Walls */}
              <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#333333" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* Background Grid Lines (Subtle) */}
            <g opacity="0.12">
              <line x1="0" y1={centerY} x2={svgWidth} y2={centerY} stroke="#737373" strokeDasharray="4,4" />
            </g>

            {/* 1. CAMERA OBSCURA CHAMBER BOX */}
            <g id="camera-box-structure">
              {/* Outer Wall Outline / Cutaway Interior */}
              <rect
                x={apertureX}
                y={boxTopY}
                width={boxWidthPx}
                height={boxHeight}
                fill="#0c0e12"
                stroke="#2a303c"
                strokeWidth="2"
                rx="4"
              />

              {/* Top & Bottom Box Thick Enclosure (Simulating Box Walls) */}
              <rect x={apertureX - 12} y={boxTopY - 14} width={boxWidthPx + 24} height={14} fill="#1e2430" stroke="#333d4d" strokeWidth="1" />
              <rect x={apertureX - 12} y={boxBottomY} width={boxWidthPx + 24} height={14} fill="#1e2430" stroke="#333d4d" strokeWidth="1" />

              {/* Front Wall (Aperture Plate) with hole */}
              <rect x={apertureX - 12} y={boxTopY} width={12} height={apTopY - boxTopY} fill="#1e2430" stroke="#333d4d" strokeWidth="1" />
              <rect x={apertureX - 12} y={apBottomY} width={12} height={boxBottomY - apBottomY} fill="#1e2430" stroke="#333d4d" strokeWidth="1" />

              {/* Rear Screen / Back Wall (Frosted Paper Screen) */}
              <rect
                x={screenX - 4}
                y={boxTopY + 2}
                width={8}
                height={boxHeight - 4}
                fill="#e5e7eb"
                fillOpacity="0.85"
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <rect
                x={screenX + 4}
                y={boxTopY}
                width={8}
                height={boxHeight}
                fill="#1e2430"
                stroke="#333d4d"
                strokeWidth="1"
              />

              {/* Pinhole Aperture Indicator */}
              <circle cx={apertureX} cy={centerY} r={Math.max(pinholeOpeningPx / 2, 2)} fill="#f59e0b" opacity="0.9" />
              <circle cx={apertureX} cy={centerY} r={Math.max(pinholeOpeningPx / 2 + 4, 6)} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />

              {/* Aperture Label */}
              <text x={apertureX} y={boxTopY - 24} fill="#e5e7eb" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
                Pinhole Aperture
              </text>
              <text x={apertureX} y={boxTopY - 10} fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                d = {pinholeDiameter.toFixed(2)} mm
              </text>

              {/* Screen Label */}
              <text x={screenX} y={boxTopY - 24} fill="#e5e7eb" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
                Viewing Screen
              </text>
              <text x={screenX} y={boxTopY - 10} fill="#9ca3af" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
                (Translucent Paper)
              </text>

              {/* Box Depth Dimension Arrow (f) */}
              <g transform={`translate(0, ${boxBottomY + 28})`}>
                <line
                  x1={apertureX}
                  y1="0"
                  x2={screenX}
                  y2="0"
                  stroke="#737373"
                  strokeWidth="1.5"
                  markerStart="url(#dimension-arrow-rev)"
                  markerEnd="url(#dimension-arrow)"
                />
                <line x1={apertureX} y1="-12" x2={apertureX} y2="6" stroke="#404040" strokeWidth="1" />
                <line x1={screenX} y1="-12" x2={screenX} y2="6" stroke="#404040" strokeWidth="1" />
                <text
                  x={(apertureX + screenX) / 2}
                  y="15"
                  fill="#d4d4d4"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  Box Depth (f) = {boxDepth} cm
                </text>
              </g>
            </g>

            {/* 2. OBJECT ON THE OUTSIDE (LEFT) */}
            <g id="outdoor-object" transform={`translate(${objectX}, 0)`}>
              {/* Vertical Baseline Dimension Line */}
              <line
                x1="-24"
                y1={objTopY}
                x2="-24"
                y2={objBottomY}
                stroke="#737373"
                strokeWidth="1.2"
                markerStart="url(#dimension-arrow-rev)"
                markerEnd="url(#dimension-arrow)"
              />
              <text
                x="-32"
                y={centerY}
                fill="#a3a3a3"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="end"
                dominantBaseline="middle"
              >
                Object Height ({params.subjectHeight} cm)
              </text>

              {/* Object Graphics according to selectedObject */}
              {selectedObject === 'tree' && (
                <g>
                  {/* Tree Trunk */}
                  <rect x="-10" y={centerY} width="20" height={objectHeightPx / 2} fill="#854d0e" rx="3" />
                  {/* Tree Foliage (Green Cloud/Triangle) */}
                  <polygon
                    points={`0,${objTopY} -42,${centerY + 10} 42,${centerY + 10}`}
                    fill="#15803d"
                    stroke="#16a34a"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points={`0,${objTopY + 20} -36,${centerY - 10} 36,${centerY - 10}`}
                    fill="#22c55e"
                    opacity="0.85"
                  />
                </g>
              )}

              {selectedObject === 'candle' && (
                <g>
                  {/* Candle Wax Body */}
                  <rect x="-14" y={objTopY + 36} width="28" height={objectHeightPx - 36} fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" rx="3" />
                  {/* Candle Wick */}
                  <line x1="0" y1={objTopY + 36} x2="0" y2={objTopY + 24} stroke="#44403c" strokeWidth="2.5" />
                  {/* Candle Flame */}
                  <ellipse cx="0" cy={objTopY + 14} rx="10" ry="15" fill="#f59e0b" opacity="0.8" />
                  <ellipse cx="0" cy={objTopY + 16} rx="6" ry="10" fill="#fef08a" />
                </g>
              )}

              {selectedObject === 'arrow' && (
                <g>
                  {/* Physics Arrow */}
                  <line
                    x1="0"
                    y1={objBottomY}
                    x2="0"
                    y2={objTopY}
                    stroke="#38bdf8"
                    strokeWidth="6"
                    markerEnd="url(#arrowhead-amber)"
                  />
                  <polygon points={`0,${objTopY - 2} -12,${objTopY + 24} 12,${objTopY + 24}`} fill="#f59e0b" />
                  <circle cx="0" cy={objBottomY} r="6" fill="#14b8a6" />
                </g>
              )}

              {/* Top Reference Point (Point A - Gold) */}
              <circle cx="0" cy={objTopY} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="12" y={objTopY + 4} fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Top (A)
              </text>

              {/* Bottom Reference Point (Point B - Teal) */}
              <circle cx="0" cy={objBottomY} r="5" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.5" />
              <text x="12" y={objBottomY + 4} fill="#14b8a6" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Base (B)
              </text>

              {/* Distance Arrow (do) */}
              <g transform={`translate(0, ${boxBottomY + 28})`}>
                <line
                  x1="0"
                  y1="0"
                  x2={apertureX - objectX}
                  y2="0"
                  stroke="#737373"
                  strokeWidth="1.5"
                  markerStart="url(#dimension-arrow-rev)"
                  markerEnd="url(#dimension-arrow)"
                />
                <line x1="0" y1="-12" x2="0" y2="6" stroke="#404040" strokeWidth="1" />
                <text
                  x={(apertureX - objectX) / 2}
                  y="15"
                  fill="#d4d4d4"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  Distance (dₒ) = {subjectDistance} cm
                </text>
              </g>
            </g>

            {/* 3. LIGHT RAYS & CONES (CLEAN, NO SILLY CHAOTIC PARTICLES) */}
            <g id="optical-rays">
              {/* TOP POINT RAYS (Gold/Amber) -> Projects to BOTTOM of screen */}
              {/* Target blur spot center is at imgBottomY on screenX */}
              {showRayCones && (
                <polygon
                  points={`
                    ${objectX},${objTopY}
                    ${apertureX},${apTopY}
                    ${screenX},${imgBottomY - blurSpotPx / 2}
                    ${screenX},${imgBottomY + blurSpotPx / 2}
                    ${apertureX},${apBottomY}
                  `}
                  fill="url(#topConeGrad)"
                />
              )}

              {/* Top Boundary Ray 1 */}
              <line
                x1={objectX}
                y1={objTopY}
                x2={screenX}
                y2={imgBottomY - blurSpotPx / 2}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeOpacity="0.85"
              />
              {/* Top Boundary Ray 2 */}
              <line
                x1={objectX}
                y1={objTopY}
                x2={screenX}
                y2={imgBottomY + blurSpotPx / 2}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeOpacity="0.85"
              />
              {/* Top Chief Ray (Centerline, dashed) */}
              <line
                x1={objectX}
                y1={objTopY}
                x2={screenX}
                y2={imgBottomY}
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                opacity="0.9"
              />

              {/* BOTTOM POINT RAYS (Teal/Emerald) -> Projects to TOP of screen */}
              {/* Target blur spot center is at imgTopY on screenX */}
              {showRayCones && (
                <polygon
                  points={`
                    ${objectX},${objBottomY}
                    ${apertureX},${apTopY}
                    ${screenX},${imgTopY - blurSpotPx / 2}
                    ${screenX},${imgTopY + blurSpotPx / 2}
                    ${apertureX},${apBottomY}
                  `}
                  fill="url(#bottomConeGrad)"
                />
              )}

              {/* Bottom Boundary Ray 1 */}
              <line
                x1={objectX}
                y1={objBottomY}
                x2={screenX}
                y2={imgTopY - blurSpotPx / 2}
                stroke="#14b8a6"
                strokeWidth="1.2"
                strokeOpacity="0.85"
              />
              {/* Bottom Boundary Ray 2 */}
              <line
                x1={objectX}
                y1={objBottomY}
                x2={screenX}
                y2={imgTopY + blurSpotPx / 2}
                stroke="#14b8a6"
                strokeWidth="1.2"
                strokeOpacity="0.85"
              />
              {/* Bottom Chief Ray (Centerline, dashed) */}
              <line
                x1={objectX}
                y1={objBottomY}
                x2={screenX}
                y2={imgTopY}
                stroke="#2dd4bf"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                opacity="0.9"
              />
            </g>

            {/* 4. INVERTED PROJECTED IMAGE ON SCREEN */}
            <g id="projected-image" transform={`translate(${screenX}, 0)`}>
              {/* Inverted image graphic rendered directly on the frosted back screen */}
              <g filter="url(#projectionBlur)" opacity={Math.max(0.4, 1 - (outputs.fNumber / 1200))}>
                {selectedObject === 'tree' && (
                  <g transform={`translate(0, ${centerY}) scale(1, -1) scale(${mag * 1.0})`}>
                    {/* Inverted Tree Trunk */}
                    <rect x="-8" y="0" width="16" height={objectHeightPx / 2} fill="#854d0e" rx="2" />
                    {/* Inverted Tree Foliage */}
                    <polygon
                      points={`0,${-objectHeightPx / 2} -38,${10} 38,${10}`}
                      fill="#15803d"
                      stroke="#16a34a"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points={`0,${-objectHeightPx / 2 + 20} -32,${-10} 32,${-10}`}
                      fill="#22c55e"
                      opacity="0.8"
                    />
                  </g>
                )}

                {selectedObject === 'candle' && (
                  <g transform={`translate(0, ${centerY}) scale(1, -1) scale(${mag * 1.0})`}>
                    <rect x="-12" y={-objectHeightPx / 2 + 36} width="24" height={objectHeightPx - 36} fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1" rx="2" />
                    <line x1="0" y1={-objectHeightPx / 2 + 36} x2="0" y2={-objectHeightPx / 2 + 24} stroke="#44403c" strokeWidth="2" />
                    <ellipse cx="0" cy={-objectHeightPx / 2 + 14} rx="8" ry="12" fill="#f59e0b" opacity="0.8" />
                    <ellipse cx="0" cy={-objectHeightPx / 2 + 16} rx="5" ry="8" fill="#fef08a" />
                  </g>
                )}

                {selectedObject === 'arrow' && (
                  <g transform={`translate(0, ${centerY}) scale(1, -1) scale(${mag * 1.0})`}>
                    <line x1="0" y1={objectHeightPx / 2} x2="0" y2={-objectHeightPx / 2} stroke="#38bdf8" strokeWidth="5" />
                    <polygon points={`0,${-objectHeightPx / 2 - 2} -10,${-objectHeightPx / 2 + 20} 10,${-objectHeightPx / 2 + 20}`} fill="#f59e0b" />
                    <circle cx="0" cy={objectHeightPx / 2} r="5" fill="#14b8a6" />
                  </g>
                )}
              </g>

              {/* Arrival point A' (Bottom of screen) - Gold */}
              <circle cx="0" cy={imgBottomY} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="14" y={imgBottomY + 4} fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                A' (Inverted Top)
              </text>

              {/* Arrival point B' (Top of screen) - Teal */}
              <circle cx="0" cy={imgTopY} r="4" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.5" />
              <text x="14" y={imgTopY + 4} fill="#14b8a6" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                B' (Inverted Base)
              </text>

              {/* Projected Height Dimension Line */}
              <line
                x1="64"
                y1={imgTopY}
                x2="64"
                y2={imgBottomY}
                stroke="#9ca3af"
                strokeWidth="1.2"
                markerStart="url(#dimension-arrow-rev)"
                markerEnd="url(#dimension-arrow)"
              />
              <text
                x="72"
                y={centerY}
                fill="#e5e7eb"
                fontSize="10"
                fontFamily="sans-serif"
                dominantBaseline="middle"
              >
                hᵢ ≈ {outputs.imageHeightCm.toFixed(1)} cm
              </text>
            </g>

            {/* Inversion Explanatory Callout inside Box */}
            <g transform={`translate(${apertureX + 25}, ${centerY - 75})`}>
              <rect x="0" y="0" width="135" height="42" rx="6" fill="#111827" stroke="#374151" strokeWidth="1" opacity="0.9" />
              <text x="10" y="16" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                Light Crosses in Center:
              </text>
              <text x="10" y="31" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">
                Upside-down & reversed
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* 3 HIGH-PRECISION INTERACTIVE SLIDERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Slider 1: Pinhole Diameter */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-amber-400" />
              Pinhole Aperture (d)
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {pinholeDiameter.toFixed(2)} mm
            </span>
          </div>

          <input
            type="range"
            id="slider-pinhole"
            min="0.10"
            max="2.50"
            step="0.02"
            value={pinholeDiameter}
            onChange={(e) => setPinholeDiameter(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>0.1 mm (Wave diffraction)</span>
            <span className="text-amber-300 font-medium">Opt: {optimalDiameter.toFixed(2)}mm</span>
            <span>2.5 mm (Ray blur)</span>
          </div>

          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 leading-relaxed">
            {pinholeDiameter > optimalDiameter * 1.5 ? (
              <span className="text-amber-400">
                ⚠ <strong>Hole too large</strong>: Multiple overlapping ray paths cause geometric blur.
              </span>
            ) : pinholeDiameter < optimalDiameter * 0.7 ? (
              <span className="text-sky-400">
                ⚠ <strong>Hole too small</strong>: Light wave diffraction spreads rays into Airy rings; image is dim.
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Sharpest resolution (Lord Rayleigh optimum).
              </span>
            )}
          </div>
        </div>

        {/* Slider 2: Box Depth / Focal Length */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-sky-400" />
              Chamber Depth (f)
            </span>
            <span className="text-xs font-mono font-bold text-sky-400">
              {boxDepth} cm ({(boxDepth / 2.54).toFixed(0)} in)
            </span>
          </div>

          <input
            type="range"
            id="slider-depth"
            min="10"
            max="100"
            step="1"
            value={boxDepth}
            onChange={(e) => setBoxDepth(parseInt(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>10 cm (Pocket / Can)</span>
            <span>30 cm (Shoebox)</span>
            <span>100 cm (Long tube)</span>
          </div>

          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 leading-relaxed">
            Longer chamber depth creates a <strong>larger projected image</strong>, but spreads the light thinner (higher f-stop <span className="font-mono text-neutral-300">f/{fNumber.toFixed(0)}</span>), requiring a darker room.
          </div>
        </div>

        {/* Slider 3: Object Distance */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              Object Distance (dₒ)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {(subjectDistance / 100).toFixed(1)} m ({subjectDistance} cm)
            </span>
          </div>

          <input
            type="range"
            id="slider-distance"
            min="50"
            max="500"
            step="10"
            value={subjectDistance}
            onChange={(e) => setSubjectDistance(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>0.5 m (Close)</span>
            <span>2.0 m</span>
            <span>5.0 m (Distant)</span>
          </div>

          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 leading-relaxed">
            Magnification formula: <span className="font-mono text-neutral-300">M = f / dₒ</span>. As the object moves farther away, its projected image becomes smaller and brighter.
          </div>
        </div>
      </div>

      {/* DIY BUILD CRITERIA & REAL-WORLD RECIPE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Live Calculated Build Recipe */}
        <div className="bg-neutral-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Hammer className="w-4 h-4" />
            <span>Exact Build Recipe for Depth = {boxDepth} cm</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex justify-between items-center">
              <span className="text-neutral-400">Optimal Hole Diameter:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {optimalDiameter.toFixed(2)} mm
              </span>
            </div>

            <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex justify-between items-center">
              <span className="text-neutral-400">Needle / Tool to Use:</span>
              <span className="font-semibold text-neutral-200 text-right">
                {toolRecommendation.tool}
              </span>
            </div>

            <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex justify-between items-center">
              <span className="text-neutral-400">Effective Aperture Speed:</span>
              <span className="font-mono font-semibold text-neutral-300">
                f/{fNumber.toFixed(0)}
              </span>
            </div>

            <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex justify-between items-center">
              <span className="text-neutral-400">Projected Image Height:</span>
              <span className="font-mono font-semibold text-emerald-300">
                ~{imageHeightCm.toFixed(1)} cm
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            Calculated via Rayleigh equation: <span className="font-mono text-neutral-300">d = 1.9√(λf)</span> for green light (550 nm).
          </p>
        </div>

        {/* Card 2: 4 Golden Construction Steps */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-3.5 lg:col-span-2">
          <div className="flex items-center gap-2 text-neutral-200 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>4 Essential Steps to Build a Working Obscura</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/70 space-y-1">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                1. Box & Screen Cutouts
              </span>
              <p className="text-neutral-400 leading-relaxed">
                Take any rigid cardboard shoebox. Cut a 5×5 cm window in the center of one end, and a large viewing window on the opposite end. Tape translucent tracing paper or baking parchment taut over the viewing window.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/70 space-y-1">
              <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                2. Foil Shim (Never punch cardboard directly!)
              </span>
              <p className="text-neutral-400 leading-relaxed">
                Cardboard edges are thick and create an optical "tunnel" that blocks wide-angle light. Instead, tape a smooth square of aluminum foil or soda can metal over the front 5×5 cm cutout.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/70 space-y-1">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                3. Pierce & Deburr the Hole
              </span>
              <p className="text-neutral-400 leading-relaxed">
                Place the foil on scrap cardboard. Gently press {toolRecommendation.tool.toLowerCase()} into the foil while rotating. Lightly smooth both sides with 600-grit sandpaper or a pencil tip to remove metal burrs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/70 space-y-1">
              <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                4. Total Light Proofing & Viewing
              </span>
              <p className="text-neutral-400 leading-relaxed">
                Line or paint the interior matte black to kill internal reflections. Seal all cardboard seams with black tape. Point the pinhole at a bright sunny window, and drape a dark jacket over your head to observe the glowing upside-down image.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
