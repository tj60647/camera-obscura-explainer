import React, { useState } from 'react';
import { OpticalParameters, OpticalPhysicsOutputs, BuilderPreset } from '../types';
import { BUILDER_PRESETS, getNearestTool } from '../physics/optics';
import {
  Wrench,
  CheckCircle,
  AlertTriangle,
  Scissors,
  Layers,
  Sparkles,
  Compass,
  FileText,
  Clock,
  Printer,
  Copy,
  Check,
} from 'lucide-react';

interface BuilderCalculatorProps {
  params: OpticalParameters;
  outputs: OpticalPhysicsOutputs;
  onUpdateParams: (partial: Partial<OpticalParameters>) => void;
}

export const BuilderCalculator: React.FC<BuilderCalculatorProps> = ({
  params,
  outputs,
  onUpdateParams,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('shoebox');
  const [copied, setCopied] = useState(false);

  // Active preset
  const activePreset = BUILDER_PRESETS.find((p) => p.id === selectedPresetId) || BUILDER_PRESETS[0];

  // Tool recommendation for current parameters
  const toolInfo = getNearestTool(outputs.optimalDiameter);

  // Load preset into current optical state
  const handleApplyPreset = (preset: BuilderPreset) => {
    setSelectedPresetId(preset.id);
    const optimalD = 1.9 * Math.sqrt((params.wavelength * 1e-9) * (preset.boxDepthCm / 100)) * 1000;
    onUpdateParams({
      boxDepth: preset.boxDepthCm,
      subjectDistance: preset.subjectDistanceM * 100,
      pinholeDiameter: Number(optimalD.toFixed(2)),
      hasLens: preset.id === 'artist_box',
      lensFocalLength: preset.boxDepthCm,
      ambientLeak: 0,
      eyeAdaptation: preset.category === 'room' ? 85 : 40,
    });
  };

  const handleCopySpecs = () => {
    const text = `CAMERA OBSCURA BUILD SPECIFICATION
Project: ${activePreset.name}
Focal Depth (f): ${params.boxDepth} cm (${(params.boxDepth / 2.54).toFixed(1)} inches)
Ideal Pinhole Diameter: ${outputs.optimalDiameter.toFixed(2)} mm (${(outputs.optimalDiameter / 25.4).toFixed(3)} in)
Recommended Tool: ${toolInfo.tool}
f-Number: f/${outputs.fNumber.toFixed(0)}
Field of View: ${outputs.fieldOfViewDeg.toFixed(1)}°
Estimated Spot Sharpness: ${outputs.totalBlurMm.toFixed(2)} mm
Materials:
${activePreset.suggestedMaterials.map((m) => `- ${m}`).join('\n')}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full space-y-6 text-neutral-200">
      {/* Top Presets Selector */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-base text-neutral-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Camera Obscura Builder Blueprints
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select a project archetype or customize dimensions to calculate exact DIY construction criteria.
            </p>
          </div>

          <button
            id="copy-specs-btn"
            onClick={handleCopySpecs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{copied ? 'Specs Copied!' : 'Copy Cut Sheet'}</span>
          </button>
        </div>

        {/* Blueprint Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BUILDER_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : 'bg-neutral-950/70 border-neutral-800 hover:bg-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {preset.difficulty}
                    </span>
                    <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {preset.estimatedBuildTime}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-neutral-100">{preset.name}</h4>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{preset.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">f = {preset.boxDepthCm}cm</span>
                  <span className="text-amber-400 font-semibold">{preset.recommendedApertureMm} mm</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Builder Grid: Cut Sheet & Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cut Sheet Specifications (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h4 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Physical Machining & Cut Sheet
            </h4>
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Lord Rayleigh Spec</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* 1. Optimal Aperture */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex justify-between items-center text-neutral-400">
                <span>Calculated Optimal Diameter (d_opt):</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  {outputs.optimalDiameter.toFixed(2)} mm
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 font-mono">
                Formula: d = 1.9 · √(550nm · {params.boxDepth}cm) = {(outputs.optimalDiameter / 25.4).toFixed(3)} inches
              </div>
            </div>

            {/* 2. Nearest Needle / Drill Bit */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Scissors className="w-3.5 h-3.5" />
                <span>Recommended Fabrication Tool:</span>
              </div>
              <div className="text-base font-bold text-amber-200">{toolInfo.tool}</div>
              <p className="text-[11px] text-neutral-400">{toolInfo.tips}</p>
            </div>

            {/* 3. Optical Rating Details */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px] uppercase">Aperture Speed</span>
                <span className="text-neutral-200 font-semibold text-sm">f/{outputs.fNumber.toFixed(0)}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px] uppercase">Field of View</span>
                <span className="text-neutral-200 font-semibold text-sm">{outputs.fieldOfViewDeg.toFixed(1)}°</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px] uppercase">Depth of Field</span>
                <span className="text-emerald-400 font-semibold text-xs">Infinite (1cm - ∞)</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[10px] uppercase">Minimum Spot Size</span>
                <span className="text-sky-400 font-semibold text-sm">{outputs.totalBlurMm.toFixed(2)} mm</span>
              </div>
            </div>

            {/* 4. Materials List */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="font-semibold text-neutral-200 text-xs block">Required Materials & Hardware:</span>
              <ul className="space-y-1 text-[11px] text-neutral-400">
                {activePreset.suggestedMaterials.map((mat, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{mat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Golden Builder Criteria & Step-by-Step (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h4 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              The 4 Golden Engineering Criteria
            </h4>
            <span className="text-xs text-emerald-400 font-mono">Mastery Guide</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Rule 1: Pinhole Edge Geometry */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span className="font-semibold text-neutral-100 text-sm">
                  The Aluminum Shim Secret: Zero Tunnel Vignetting
                </span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Never punch a needle directly through thick cardboard! Cardboard creates a cylindrical tunnel (depth &gt; diameter) that clips off-axis rays, causing severe mechanical vignetting.
              </p>
              <div className="p-2.5 rounded-lg bg-neutral-900 text-neutral-300 text-[11px] space-y-1 border border-neutral-800">
                <strong className="text-amber-300">Pro Crafting Technique:</strong>
                <p>
                  Cut a 1-inch square from a soda can or kitchen aluminum foil. Place it on scrap cardboard. Slowly rotate a sewing needle point until it just barely penetrates the surface. Flip the metal over and rub the raised metal burr flat with <strong>600-grit sandpaper</strong>. Re-insert the needle to clean the hole. Hold it to light: it should be a razor-clean circle!
                </p>
              </div>
            </div>

            {/* Rule 2: Blackout & Anti-Reflection */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span className="font-semibold text-neutral-100 text-sm">
                  100% Light-Tight Enclosure & Internal Matte Flocking
                </span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Because a pinhole operates at <span className="font-mono text-sky-300">f/{outputs.fNumber.toFixed(0)}</span>, the light entering the camera is whisper-dim compared to ambient daylight.
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px]">
                <li>Paint all internal walls with <strong>ultra-matte black chalkboard spray paint</strong> or line them with black velvet craft felt.</li>
                <li>Seal every box seam and joint with opaque <strong>black gaffer tape</strong> (electrical tape can shrink or allow IR leakage).</li>
              </ul>
            </div>

            {/* Rule 3: Screen Material Selection */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <span className="font-semibold text-neutral-100 text-sm">
                  Screen Diffusion: Frosted Glass vs. Drafting Vellum
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <span className="font-semibold text-emerald-300 block mb-0.5">Rear Projection (Viewer outside):</span>
                  <span className="text-neutral-400">
                    Use translucent <strong>architectural drafting vellum</strong>, silicone baking parchment, or <strong>frosted ground glass</strong>. You view the image from behind the box!
                  </span>
                </div>
                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <span className="font-semibold text-sky-300 block mb-0.5">Front Projection (Room Obscura):</span>
                  <span className="text-neutral-400">
                    Use smooth matte white foam board or an unwrinkled white bedsheet hung on the opposite wall.
                  </span>
                </div>
              </div>
            </div>

            {/* Rule 4: Human Visual Dark Adaptation */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
                  4
                </span>
                <span className="font-semibold text-neutral-100 text-sm">
                  The Biological Factor: 15-Minute Rhodopsin Synthesis
                </span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                90% of beginners believe their room camera obscura is broken because they look at the wall immediately after sealing the room.
                Human cone photoreceptors cannot perceive the dim flux of an <span className="font-mono">f/1000</span> aperture.
                <strong>Sit silently in the dark room for 10 to 15 minutes.</strong> As your retinal rod photoreceptors regenerate rhodopsin, the projected trees, sky, and clouds will magically emerge with startling vividness and motion!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
