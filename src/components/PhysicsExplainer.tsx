import React, { useState } from 'react';
import { OpticalParameters, OpticalPhysicsOutputs } from '../types';
import { generateBlurCurve } from '../physics/optics';
import { Atom, Compass, Lightbulb, Activity, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface PhysicsExplainerProps {
  params: OpticalParameters;
  outputs: OpticalPhysicsOutputs;
  onUpdateParams: (partial: Partial<OpticalParameters>) => void;
}

export const PhysicsExplainer: React.FC<PhysicsExplainerProps> = ({
  params,
  outputs,
  onUpdateParams,
}) => {
  const [activeTopic, setActiveTopic] = useState<'dilemma' | 'inversion' | 'vignetting' | 'lens_vs_pinhole'>('dilemma');

  // Generate live curve points for the graph
  const curvePoints = generateBlurCurve(params.boxDepth, params.wavelength, params.subjectDistance);

  // SVG chart dimensions
  const chartW = 560;
  const chartH = 260;
  const padL = 50;
  const padR = 25;
  const padT = 25;
  const padB = 40;
  const graphW = chartW - padL - padR;
  const graphH = chartH - padT - padB;

  // Maximum scales for graph: d up to 3.0mm, blur up to 4.5mm
  const maxD = 3.0;
  const maxBlur = 4.0;

  const mapX = (d: number) => padL + (d / maxD) * graphW;
  const mapY = (blur: number) => padT + (1 - Math.min(blur, maxBlur) / maxBlur) * graphH;

  // Build SVG path strings
  const geomPath = curvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.diameterMm)} ${mapY(pt.geometricMm)}`)
    .join(' ');

  const diffPath = curvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.diameterMm)} ${mapY(pt.diffractionMm)}`)
    .join(' ');

  const totalPath = curvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.diameterMm)} ${mapY(pt.totalMm)}`)
    .join(' ');

  // Optimum point
  const optX = mapX(outputs.optimalDiameter);
  const optY = mapY(Math.sqrt(Math.pow(outputs.optimalDiameter, 2) + Math.pow(outputs.diffractionBlurMm, 2)));

  // Current slider point
  const currX = mapX(Math.min(params.pinholeDiameter, maxD));
  const currY = mapY(outputs.totalBlurMm);

  return (
    <div className="w-full space-y-6 text-neutral-200">
      {/* Topic Switcher Pills */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-900/90 rounded-2xl border border-neutral-800">
        <button
          id="topic-dilemma-btn"
          onClick={() => setActiveTopic('dilemma')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTopic === 'dilemma'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          The Pinhole Dilemma (Rayleigh Optimum)
        </button>

        <button
          id="topic-inversion-btn"
          onClick={() => setActiveTopic('inversion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTopic === 'inversion'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          Rectilinear Inversion Geometry
        </button>

        <button
          id="topic-vignetting-btn"
          onClick={() => setActiveTopic('vignetting')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTopic === 'vignetting'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
        >
          <Atom className="w-4 h-4" />
          Cosine Fourth Law (Vignetting)
        </button>

        <button
          id="topic-lens-btn"
          onClick={() => setActiveTopic('lens_vs_pinhole')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTopic === 'lens_vs_pinhole'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Pinhole vs. Convex Lens
        </button>
      </div>

      {/* TOPIC 1: THE PINHOLE DILEMMA & RESOLUTION CURVE */}
      {activeTopic === 'dilemma' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Graph Card */}
          <div className="lg:col-span-7 bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Resolution Spot Size vs. Pinhole Diameter
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  The competition between geometric blur and wave diffraction
                </p>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                f = {params.boxDepth}cm, λ = {params.wavelength}nm
              </span>
            </div>

            {/* SVG Plot */}
            <div className="w-full bg-neutral-950 rounded-xl p-2 border border-neutral-800 overflow-x-auto">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[440px]">
                {/* Axes */}
                <line x1={padL} y1={padT} x2={padL} y2={chartH - padB} stroke="#334155" strokeWidth="1.5" />
                <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#334155" strokeWidth="1.5" />

                {/* Grid lines */}
                {[1, 2, 3, 4].map((blur) => (
                  <g key={`y-${blur}`}>
                    <line
                      x1={padL}
                      y1={mapY(blur)}
                      x2={chartW - padR}
                      y2={mapY(blur)}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text x={padL - 8} y={mapY(blur) + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                      {blur}mm
                    </text>
                  </g>
                ))}

                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((d) => (
                  <g key={`x-${d}`}>
                    <line
                      x1={mapX(d)}
                      y1={padT}
                      x2={mapX(d)}
                      y2={chartH - padB}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text x={mapX(d)} y={chartH - padB + 16} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      {d}mm
                    </text>
                  </g>
                ))}

                {/* Axis Labels */}
                <text x={chartW / 2} y={chartH - 10} fill="#94a3b8" fontSize="11" textAnchor="middle">
                  Pinhole Diameter d (mm)
                </text>
                <text
                  x={-chartH / 2}
                  y={16}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                  transform="rotate(-90)"
                >
                  Spot Size / Blur (mm)
                </text>

                {/* Curves */}
                {/* Geometric Blur Line */}
                <path d={geomPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Fraunhofer Diffraction Curve */}
                <path d={diffPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Total Blur Curve */}
                <path d={totalPath} fill="none" stroke="#10b981" strokeWidth="2.5" />

                {/* Optimum minimum point marker */}
                {outputs.optimalDiameter <= maxD && (
                  <g>
                    <circle cx={optX} cy={optY} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <line x1={optX} y1={optY} x2={optX} y2={chartH - padB} stroke="#10b981" strokeDasharray="2 2" />
                    <text x={optX} y={optY - 10} fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
                      Optimum ({outputs.optimalDiameter.toFixed(2)}mm)
                    </text>
                  </g>
                )}

                {/* Current slider value marker */}
                {params.pinholeDiameter <= maxD && (
                  <g>
                    <circle cx={currX} cy={currY} r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <text x={currX + 8} y={currY + 4} fill="#fca5a5" fontSize="10" fontFamily="monospace">
                      Current ({params.pinholeDiameter.toFixed(2)}mm)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs pt-1 justify-center">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400 inline-block" />
                Geometric Blur: C_g = d (1 + f/d₀)
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-400 inline-block" />
                Diffraction: D_diff = 2.44 λf / d
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-3 h-1 bg-emerald-400 inline-block rounded" />
                Total Spot Size W_total = √(C_g² + D_diff²)
              </span>
            </div>
          </div>

          {/* Physics Explanation Card */}
          <div className="lg:col-span-5 bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-xl space-y-4">
            <h4 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Why can't you make the pinhole infinitely small?
            </h4>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <p>
                A common intuition is that a tinier hole isolates a narrower beam of light, resulting in a razor-sharp image.
                In <strong>classical geometric optics</strong> (yellow dashed line), this holds true: spot size shrinks linearly with aperture diameter <span className="font-mono text-amber-300">d</span>.
              </p>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-mono text-sky-300 text-[11px] font-semibold">
                  Fraunhofer Diffraction (Wave Nature of Light):
                </div>
                <p className="text-neutral-400">
                  Because light is an electromagnetic wave (<span className="font-mono">λ ≈ 550 nm</span>), squeezing it through an ultra-small aperture causes the wavefronts to bend and spread out into an <strong>Airy disc</strong>:
                </p>
                <div className="text-center font-mono text-xs bg-neutral-900 py-1.5 rounded border border-neutral-800 text-sky-400">
                  θ_Airy = 1.22 · (λ / d)
                </div>
                <p className="text-neutral-400">
                  As <span className="font-mono text-sky-300">d → 0</span>, the diffraction angle <span className="font-mono text-sky-300">θ → ∞</span>, smearing the image into wide interference rings!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
                <div className="font-mono text-emerald-300 text-[11px] font-semibold">
                  Lord Rayleigh Optimum Equation:
                </div>
                <p className="text-neutral-300">
                  Equating geometric circle of confusion with the wave diffraction spot produces the global minimum:
                </p>
                <div className="text-center font-mono text-sm bg-neutral-950 py-1.5 rounded border border-emerald-700/50 text-emerald-300 font-bold">
                  d_opt ≈ 1.9 · √(λ · f)
                </div>
                <p className="text-[11px] text-neutral-400">
                  For your current box depth (<span className="font-mono text-emerald-400">{params.boxDepth} cm</span>) and wavelength (<span className="font-mono text-emerald-400">{params.wavelength} nm</span>), the sharpest possible aperture is <strong className="text-emerald-300">{outputs.optimalDiameter.toFixed(2)} mm</strong>.
                </p>
              </div>

              <button
                id="apply-optimal-pinhole-btn"
                onClick={() => onUpdateParams({ pinholeDiameter: Number(outputs.optimalDiameter.toFixed(2)) })}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply Optimum ({outputs.optimalDiameter.toFixed(2)} mm) to Ray Tracer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 2: INVERSION GEOMETRY */}
      {activeTopic === 'inversion' && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-5">
          <div className="max-w-3xl space-y-2">
            <h4 className="font-semibold text-base text-neutral-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              Rectilinear Propagation & The Inversion Principle
            </h4>
            <p className="text-xs text-neutral-400">
              Why every camera obscura image is inverted upside-down and flipped horizontally left-to-right.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="font-semibold text-sky-300 text-sm">1. Straight-Line Ray Paths</div>
              <p className="text-neutral-400 leading-relaxed">
                In a homogeneous medium (air), light photons travel in straight lines. A single point at the top of a tree radiates light in every direction, but <strong>only one narrow bundle</strong> passes through the pinhole.
              </p>
              <div className="p-2.5 rounded bg-neutral-900 font-mono text-[11px] text-amber-300 border border-neutral-800">
                Top of Object → Downward Angle → Bottom of Screen
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="font-semibold text-emerald-300 text-sm">2. Similar Triangles & Magnification</div>
              <p className="text-neutral-400 leading-relaxed">
                The ray paths form two similar triangles joined at the pinhole vertex. By Euclidean geometry:
              </p>
              <div className="text-center font-mono text-xs bg-neutral-900 py-2 rounded border border-neutral-800 text-emerald-300">
                hᵢ / h₀ = f / d₀ ⟹ M = - (f / d₀)
              </div>
              <p className="text-neutral-400 text-[11px]">
                Current magnification: <strong className="text-emerald-400 font-mono">{outputs.magnification.toFixed(3)}x</strong>.
                If <span className="font-mono">f &lt; d₀</span>, the image is reduced. If <span className="font-mono">f &gt; d₀</span>, the image is magnified!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="font-semibold text-purple-300 text-sm">3. Complete 180° Inversion</div>
              <p className="text-neutral-400 leading-relaxed">
                Because this geometry acts symmetrically in both the vertical and horizontal planes, the image is rotated 180° on the projection screen.
              </p>
              <p className="text-neutral-400 text-[11px]">
                Renaissance artists like Vermeer and Canaletto used an internal 45° mirror to bounce the light upward onto a ground-glass table, restoring the image upright for tracing!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 3: VIGNETTING / COSINE FOURTH LAW */}
      {activeTopic === 'vignetting' && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-5">
          <div className="max-w-3xl space-y-2">
            <h4 className="font-semibold text-base text-neutral-100 flex items-center gap-2">
              <Atom className="w-5 h-5 text-sky-400" />
              The Cosine Fourth Law of Illumination: I(θ) = I₀ · cos⁴(θ)
            </h4>
            <p className="text-xs text-neutral-400">
              Why the center of a camera obscura projection is brilliantly illuminated while the corners fade into dim shadows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="font-mono text-amber-400 font-bold text-sm block">1st Cosine: cos(θ)</span>
              <div className="font-semibold text-neutral-200">Aperture Foreshortening</div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Viewed from an off-axis angle θ, the circular pinhole opening projects as an ellipse with major axis <span className="font-mono">d</span> and minor axis <span className="font-mono">d·cos(θ)</span>, reducing effective light intake area.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="font-mono text-sky-400 font-bold text-sm block">2nd & 3rd: cos²(θ)</span>
              <div className="font-semibold text-neutral-200">Inverse Square Falloff</div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                The distance from the pinhole to the flat screen increases off-axis: <span className="font-mono">r(θ) = f / cos(θ)</span>. By the inverse square law (<span className="font-mono">1/r²</span>), irradiance drops by <span className="font-mono">cos²(θ) / f²</span>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="font-mono text-emerald-400 font-bold text-sm block">4th Cosine: cos(θ)</span>
              <div className="font-semibold text-neutral-200">Lambertian Surface Tilt</div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Rays strike the flat projection wall at an oblique angle θ, distributing their light flux across a surface area expanded by <span className="font-mono">1 / cos(θ)</span>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-800/40 space-y-2">
              <span className="font-mono text-sky-300 font-bold text-sm block">Total Vignetting</span>
              <div className="font-semibold text-neutral-100">Combined Formula</div>
              <div className="font-mono text-xs text-sky-300 bg-neutral-950 p-2 rounded border border-sky-900/60 text-center">
                I(θ) = I₀ · cos⁴(θ)
              </div>
              <p className="text-neutral-400 text-[11px]">
                At θ = 30° off-axis, irradiance is already down to <strong>56.2%</strong> (a 44% light reduction).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 4: PINHOLE VS LENS */}
      {activeTopic === 'lens_vs_pinhole' && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-5">
          <div className="max-w-3xl space-y-2">
            <h4 className="font-semibold text-base text-neutral-100 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Pinhole vs. Convex Lens: The Optical Trade-offs
            </h4>
            <p className="text-xs text-neutral-400">
              Why 16th-century scholars Giambattista della Porta and Daniel Barbaro fitted a biconvex glass lens into the camera obscura aperture.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Optical Property</th>
                  <th className="py-3 px-4 text-amber-400">Pure Pinhole Aperture</th>
                  <th className="py-3 px-4 text-sky-400 rounded-r-lg">Converging Biconvex Lens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-normal">
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">Aperture Size</td>
                  <td className="py-3 px-4 font-mono text-amber-300">0.2 mm - 1.0 mm (Tiny)</td>
                  <td className="py-3 px-4 font-mono text-sky-300">20 mm - 100 mm (Huge)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">Light Gathering & Exposure</td>
                  <td className="py-3 px-4 text-neutral-400">Dim (f/150 - f/2000). Needs dark adaptation or long exposure.</td>
                  <td className="py-3 px-4 text-neutral-200 font-semibold">10,000× more light! (f/2 - f/5.6). Instantly bright.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">Depth of Field</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">Infinite (1cm to ∞). Everything is in focus simultaneously!</td>
                  <td className="py-3 px-4 text-neutral-400">Shallow. Must focus via thin lens formula 1/f = 1/d₀ + 1/dᵢ.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">Chromatic Aberration</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">Zero chromatic dispersion! Light travels in vacuum/air without color fringing.</td>
                  <td className="py-3 px-4 text-neutral-400">Present (glass disperses blue light more than red light).</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">Linear Distortion</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">Perfect rectilinear projection. Straight lines stay perfectly straight.</td>
                  <td className="py-3 px-4 text-neutral-400">Barrel or pincushion distortion near field edges.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
