import React from 'react';
import { OpticalParameters, OpticalPhysicsOutputs, ScenePreset } from '../types';
import { SCENES } from '../physics/scenes';
import { getNearestTool } from '../physics/optics';
import { Sliders, Sparkles, RefreshCw, Layers, Glasses, Sun, CircleDot } from 'lucide-react';

interface OpticsControlsProps {
  params: OpticalParameters;
  outputs: OpticalPhysicsOutputs;
  onUpdateParams: (partial: Partial<OpticalParameters>) => void;
}

export const OpticsControls: React.FC<OpticsControlsProps> = ({
  params,
  outputs,
  onUpdateParams,
}) => {
  const toolInfo = getNearestTool(params.pinholeDiameter);

  // Wavelength to RGB color for the indicator
  const getWavelengthColor = (nm: number) => {
    if (nm < 440) return '#818cf8'; // violet
    if (nm < 490) return '#38bdf8'; // blue
    if (nm < 560) return '#22c55e'; // green
    if (nm < 590) return '#eab308'; // yellow
    if (nm < 635) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="w-full rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl p-5 space-y-6 text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm text-neutral-100">Optical Parameters & Setup</h3>
        </div>
        <button
          id="reset-optics-btn"
          onClick={() =>
            onUpdateParams({
              pinholeDiameter: Number(outputs.optimalDiameter.toFixed(2)),
              boxDepth: 30,
              subjectDistance: 200,
              wavelength: 550,
              hasLens: false,
              ambientLeak: 0,
              exposureBoost: 1.0,
            })
          }
          className="text-xs text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      {/* Scene Preset Buttons */}
      <div>
        <label className="text-xs font-medium text-neutral-400 block mb-2">Outside Subject Scene</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.keys(SCENES) as ScenePreset[]).map((sceneKey) => {
            const sc = SCENES[sceneKey];
            const isSelected = params.selectedScene === sceneKey;
            return (
              <button
                key={sceneKey}
                id={`scene-select-${sceneKey}`}
                onClick={() => onUpdateParams({ selectedScene: sceneKey })}
                className={`p-2 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/5'
                    : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600'
                }`}
              >
                <div className="font-semibold text-xs truncate">{sc.title}</div>
                <div className="text-[10px] text-neutral-400 truncate">{sc.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
        {/* 1. Pinhole Diameter */}
        <div className="space-y-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-amber-400" />
              Pinhole Aperture (d)
            </span>
            <span className="font-mono text-amber-300 font-semibold text-sm">
              {params.pinholeDiameter.toFixed(2)} mm
            </span>
          </div>
          <input
            id="pinhole-diameter-slider"
            type="range"
            min={0.1}
            max={6.0}
            step={0.05}
            value={params.pinholeDiameter}
            onChange={(e) => onUpdateParams({ pinholeDiameter: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-neutral-400 font-mono truncate">
              Tool: <strong className="text-neutral-200">{toolInfo.tool}</strong>
            </span>
            <button
              id="optimum-snap-badge"
              onClick={() => onUpdateParams({ pinholeDiameter: Number(outputs.optimalDiameter.toFixed(2)) })}
              className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 font-mono transition-colors"
            >
              Optimum: {outputs.optimalDiameter.toFixed(2)}mm
            </button>
          </div>
        </div>

        {/* 2. Box Depth (Focal Length f) */}
        <div className="space-y-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center">
            <span className="font-medium text-neutral-300">Box Depth / Focal Length (f)</span>
            <span className="font-mono text-sky-400 font-semibold text-sm">
              {params.boxDepth} cm
            </span>
          </div>
          <input
            id="box-depth-slider"
            type="range"
            min={10}
            max={120}
            step={1}
            value={params.boxDepth}
            onChange={(e) => onUpdateParams({ boxDepth: Number(e.target.value) })}
            className="w-full accent-sky-400 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>10 cm (Pocket / Can)</span>
            <span>120 cm (Long Tube)</span>
          </div>
        </div>

        {/* 3. Subject Distance (do) */}
        <div className="space-y-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center">
            <span className="font-medium text-neutral-300">Subject Distance (d₀)</span>
            <span className="font-mono text-emerald-400 font-semibold text-sm">
              {(params.subjectDistance / 100).toFixed(1)} m ({params.subjectDistance} cm)
            </span>
          </div>
          <input
            id="subject-distance-slider"
            type="range"
            min={50}
            max={600}
            step={10}
            value={params.subjectDistance}
            onChange={(e) => onUpdateParams({ subjectDistance: Number(e.target.value) })}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>0.5 m (Tabletop)</span>
            <span>6.0 m (Distant)</span>
          </div>
        </div>

        {/* 4. Light Wavelength (Wave Optics) */}
        <div className="space-y-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                style={{ backgroundColor: getWavelengthColor(params.wavelength) }}
              />
              Light Wavelength (λ)
            </span>
            <span className="font-mono font-semibold" style={{ color: getWavelengthColor(params.wavelength) }}>
              {params.wavelength} nm
            </span>
          </div>
          <input
            id="wavelength-slider"
            type="range"
            min={400}
            max={700}
            step={5}
            value={params.wavelength}
            onChange={(e) => onUpdateParams({ wavelength: Number(e.target.value) })}
            className="w-full cursor-pointer"
            style={{ accentColor: getWavelengthColor(params.wavelength) }}
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>400nm (Violet)</span>
            <span>550nm (Green/Peak)</span>
            <span>700nm (Red)</span>
          </div>
        </div>

        {/* 5. Lens Upgrade Toggle */}
        <div className="space-y-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <Glasses className="w-4 h-4 text-sky-400" />
              Biconvex Lens Mode
            </span>
            <button
              id="toggle-lens-btn"
              onClick={() => onUpdateParams({ hasLens: !params.hasLens })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                params.hasLens
                  ? 'bg-sky-500 text-neutral-950 shadow-md shadow-sky-500/20'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {params.hasLens ? 'Lens Fitted' : 'Pure Pinhole'}
            </button>
          </div>
          {params.hasLens ? (
            <div className="pt-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-neutral-400">Lens Focal Length (f_lens):</span>
                <span className="font-mono text-sky-300 font-semibold">{params.lensFocalLength} cm</span>
              </div>
              <input
                id="lens-focal-slider"
                type="range"
                min={15}
                max={80}
                step={1}
                value={params.lensFocalLength}
                onChange={(e) => onUpdateParams({ lensFocalLength: Number(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500">
              A pure pinhole has infinite depth of field but passes very little light. Adding a glass lens increases light flux thousands of times.
            </p>
          )}
        </div>

        {/* 6. Ray Density & Exposure Boost */}
        <div className="space-y-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Ray Tracing Density
            </span>
            <span className="font-mono text-amber-300 font-semibold">
              {params.rayDensity} rays/pt
            </span>
          </div>
          <input
            id="ray-density-slider"
            type="range"
            min={3}
            max={15}
            step={1}
            value={params.rayDensity}
            onChange={(e) => onUpdateParams({ rayDensity: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>3 (Sparse/Fast)</span>
            <span>9 (Balanced)</span>
            <span>15 (Dense Optical Fan)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
