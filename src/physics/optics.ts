import { OpticalParameters, OpticalPhysicsOutputs, BuilderPreset } from '../types';

/**
 * Calculates optical physics outputs for camera obscura
 */
export function calculateOptics(params: OpticalParameters): OpticalPhysicsOutputs {
  const {
    pinholeDiameter, // mm
    boxDepth, // cm
    subjectDistance, // cm
    subjectHeight, // cm
    wavelength, // nm
    hasLens,
    lensFocalLength,
  } = params;

  // Convert to consistent SI units (meters)
  const f_m = boxDepth / 100;
  const d_m = pinholeDiameter / 1000;
  const do_m = Math.max(subjectDistance / 100, 0.05);
  const lambda_m = wavelength * 1e-9;

  // Lord Rayleigh / Petzval constant k ≈ 1.9 for visible light
  // d_opt = 1.9 * sqrt(lambda * f)
  const optimalDiameter_m = 1.9 * Math.sqrt(lambda_m * f_m);
  const optimalDiameterMm = optimalDiameter_m * 1000;

  // Geometric circle of confusion on screen (mm)
  // For distant object, C_geom = d * (1 + f/do)
  const geometricBlurMm = pinholeDiameter * (1 + (boxDepth / subjectDistance));

  // Fraunhofer Diffraction 1st minimum diameter (Airy disk diameter) on screen
  // theta = 1.22 * lambda / d => D_Airy = 2.44 * lambda * f / d
  const diffractionBlur_m = (2.44 * lambda_m * f_m) / Math.max(d_m, 1e-6);
  const diffractionBlurMm = diffractionBlur_m * 1000;

  // Total blur spot diameter using root-sum-square
  let totalBlurMm = Math.sqrt(
    Math.pow(geometricBlurMm, 2) + Math.pow(diffractionBlurMm, 2)
  );

  // If thin lens is active, geometric blur depends on defocus from thin lens formula
  if (hasLens) {
    // 1/f_lens = 1/do + 1/di => ideal focus distance di = (f_lens * do) / (do - f_lens)
    const fLens_cm = lensFocalLength;
    if (subjectDistance > fLens_cm) {
      const idealDi_cm = (fLens_cm * subjectDistance) / (subjectDistance - fLens_cm);
      const defocusDist_cm = Math.abs(boxDepth - idealDi_cm);
      // Lens circle of confusion: C_lens = diameter * |di - f_box| / di
      const lensCoC_mm = pinholeDiameter * (defocusDist_cm / idealDi_cm);
      // Lens diffraction is tiny because aperture is larger
      totalBlurMm = Math.sqrt(Math.pow(lensCoC_mm, 2) + Math.pow(diffractionBlurMm, 2));
    }
  }

  // f-number: N = f / d
  const fNumber = (boxDepth * 10) / pinholeDiameter;

  // Magnification: M = -f / do (negative indicates inverted)
  const magnification = -boxDepth / subjectDistance;
  const imageHeightCm = Math.abs(magnification) * subjectHeight;

  // Field of view (degrees) assuming standard viewing screen of width = 0.8 * boxDepth
  const standardScreenWidthCm = boxDepth * 0.8;
  const fieldOfViewDeg = 2 * Math.atan(standardScreenWidthCm / (2 * boxDepth)) * (180 / Math.PI);

  // Airy disk radius (1st zero)
  const airyDiskRadiusMm = (1.22 * lambda_m * f_m / Math.max(d_m, 1e-6)) * 1000;

  // Relative irradiance / brightness compared to reference aperture (f/100 = 1.0)
  // Irradiance is proportional to (d / f)^2 = 1 / N^2
  const referenceN = 100;
  const relativeBrightness = Math.pow(referenceN / Math.max(fNumber, 1), 2);

  // Vignetting edge falloff at theta = 30° off-axis: cos^4(30°) = (sqrt(3)/2)^4 = 9/16 = 0.5625 (44% light drop)
  const thetaRad = (30 * Math.PI) / 180;
  const vignettingEdgeFalloff = Math.pow(Math.cos(thetaRad), 4);

  // Depth of field description
  const depthOfField = hasLens
    ? `${(Math.max(1, Math.round(subjectDistance * 0.2)))} cm to ${(Math.round(subjectDistance * 1.8))} cm`
    : 'Virtually Infinite (from ~1 cm to ∞)';

  return {
    optimalDiameter: optimalDiameterMm,
    optimalDiameterMm,
    geometricBlurMm,
    diffractionBlurMm,
    totalBlurMm,
    fNumber,
    magnification,
    imageHeightCm,
    fieldOfViewDeg,
    airyDiskRadiusMm,
    relativeBrightness,
    vignettingEdgeFalloff,
    depthOfField,
  };
}

/**
 * Returns blur spot size for varying pinhole diameters to generate the resolution curve
 */
export function generateBlurCurve(boxDepthCm: number, wavelengthNm: number, subjectDistCm: number) {
  const f_m = boxDepthCm / 100;
  const lambda_m = wavelengthNm * 1e-9;
  const do_m = subjectDistCm / 100;

  const points: { diameterMm: number; geometricMm: number; diffractionMm: number; totalMm: number }[] = [];

  // Generate 50 points from 0.05 mm to 3.0 mm
  for (let d = 0.05; d <= 3.0; d += 0.05) {
    const d_m = d / 1000;
    const geom = d * (1 + (boxDepthCm / subjectDistCm));
    const diff = ((2.44 * lambda_m * f_m) / d_m) * 1000;
    const total = Math.sqrt(Math.pow(geom, 2) + Math.pow(diff, 2));

    points.push({
      diameterMm: Number(d.toFixed(2)),
      geometricMm: Number(geom.toFixed(3)),
      diffractionMm: Number(Math.min(diff, 5).toFixed(3)),
      totalMm: Number(Math.min(total, 6).toFixed(3)),
    });
  }

  return points;
}

/**
 * Maps calculated pinhole diameter to nearest real-world needle / drill tool
 */
export function getNearestTool(diameterMm: number): { tool: string; differenceMm: number; tips: string } {
  const tools = [
    { name: '#12 Beading Needle', size: 0.35, desc: 'Ultra-fine bead needle, ideal for small focal boxes (<20cm).' },
    { name: '#10 Sewing Needle', size: 0.46, desc: 'Standard sharp hand-sewing needle, common household item.' },
    { name: '#9 Embroidery Needle', size: 0.53, desc: 'Sharp point embroidery needle, great for 25-35cm shoeboxes.' },
    { name: '#7 Hand-Sewing Needle', size: 0.69, desc: 'Medium needle, good for 50-70cm camera lengths.' },
    { name: '#80 Micro Drill Bit (0.34 mm)', size: 0.34, desc: 'Jewelers twist drill for precise circular holes in brass shim.' },
    { name: '#75 Micro Drill Bit (0.53 mm)', size: 0.53, desc: 'Clean machined aperture for DIY photographic cameras.' },
    { name: '#70 Micro Drill Bit (0.71 mm)', size: 0.71, desc: 'High precision hole for longer focal distances (60-90cm).' },
    { name: 'Standard Push-Pin / Thumb-Tack', size: 0.95, desc: 'Widely available, produces brighter but softer images.' },
    { name: '1.5mm Precision Drill / Hole Punch', size: 1.50, desc: 'For large room obscuras or high-contrast sunny projections.' },
    { name: '3.0mm Room Obscura Aperture (Curtain Hole)', size: 3.00, desc: 'Recommended for 2.5m - 4m bedroom / window blackout.' },
    { name: '6.0mm Large Room Aperture', size: 6.00, desc: 'For large halls or dim cloudy outdoor conditions.' },
  ];

  let closest = tools[0];
  let minDiff = Math.abs(diameterMm - tools[0].size);

  for (const t of tools) {
    const diff = Math.abs(diameterMm - t.size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = t;
    }
  }

  return {
    tool: closest.name,
    differenceMm: minDiff,
    tips: closest.desc,
  };
}

/**
 * Preset builder configurations
 */
export const BUILDER_PRESETS: BuilderPreset[] = [
  {
    id: 'shoebox',
    name: 'Classic Shoebox Obscura',
    category: 'portable',
    boxDepthCm: 25,
    screenWidthCm: 18,
    screenHeightCm: 14,
    subjectDistanceM: 3.0,
    description: 'The quintessential DIY project using a sturdy cardboard shoebox, aluminum foil aperture shim, and baking parchment screen.',
    suggestedMaterials: [
      'Cardboard shoe box with snug lid',
      'Matte black spray paint or black craft paper',
      'Heavy-duty kitchen aluminum foil or soda can piece',
      'Translucent baking parchment or drafting vellum',
      '#10 Sewing needle (approx 0.46 mm)',
      'Black electrical tape or gaffer tape (light-seal)',
    ],
    recommendedApertureMm: 0.52,
    needleGauge: '#10 Sewing Needle (~0.46 mm)',
    estimatedBuildTime: '30 - 45 mins',
    difficulty: 'Beginner',
  },
  {
    id: 'room',
    name: 'Full Room Obscura (Camera Lucida/Obscura)',
    category: 'room',
    boxDepthCm: 300,
    screenWidthCm: 250,
    screenHeightCm: 200,
    subjectDistanceM: 20.0,
    description: 'Transform an entire bedroom or shed into a giant camera obscura. Project upside-down moving clouds, trees, and street traffic onto your white bedroom wall.',
    suggestedMaterials: [
      'Blackout window film or 6-mil black contractor bags',
      'Quality foil masking tape or heavy gaffer tape',
      'Cardboard window insert panel',
      'Circular aperture cutter or punch (2.5mm - 6mm)',
      'Smooth white projection wall or hung white bedsheet',
      '15 minutes of dark adaptation for human eye rods',
    ],
    recommendedApertureMm: 3.2,
    needleGauge: '3mm hole punch or drill',
    estimatedBuildTime: '1 - 2 hours',
    difficulty: 'Intermediate',
  },
  {
    id: 'artist_box',
    name: 'Renaissance Drawing Box (Vermeer Style)',
    category: 'artistic',
    boxDepthCm: 35,
    screenWidthCm: 25,
    screenHeightCm: 20,
    subjectDistanceM: 2.5,
    description: 'Portable wooden box equipped with a 45° internal mirror and top-mounted frosted glass plate to reinvert the image upright for direct tracing onto paper.',
    suggestedMaterials: [
      'Plywood or rigid foam-core box structure',
      'First-surface mirror or flat acrylic mirror (45° angle)',
      'Frosted / ground glass plate or acrylic diffusion panel',
      'Biconvex glass lens (30-40cm focal length) or precision pinhole',
      'Black velvet flocking on interior walls',
      'Tracing paper and graphite pencils',
    ],
    recommendedApertureMm: 0.62,
    needleGauge: '#9 Embroidery needle (~0.53 mm) or 35cm lens',
    estimatedBuildTime: '2 - 4 hours',
    difficulty: 'Intermediate',
  },
  {
    id: 'photo_can',
    name: 'Pinhole Photographic Camera',
    category: 'photographic',
    boxDepthCm: 7.5,
    screenWidthCm: 6,
    screenHeightCm: 6,
    subjectDistanceM: 1.5,
    description: 'Ultra-sharp wide-angle camera using a beverage can or tin box, loaded with 4x5 photo paper or film sheet for real physical long-exposure captures.',
    suggestedMaterials: [
      'Light-tight metal tin or cylindrical coffee can',
      'Brass shim plate (0.001 - 0.002 inch thick)',
      '#80 micro-drill bit or fine #12 beading needle',
      '600-grit sandpaper (to deburr pinhole edges)',
      'Rotating shutter flap made of black cardstock',
      'Black photographic tape',
    ],
    recommendedApertureMm: 0.29,
    needleGauge: '#80 micro-drill or #12 beading needle (~0.3 mm)',
    estimatedBuildTime: '1 hour',
    difficulty: 'Advanced',
  },
];
