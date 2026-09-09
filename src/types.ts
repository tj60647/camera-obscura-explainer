export type ScenePreset = 'landscape' | 'tree' | 'candle' | 'artist_model' | 'optics_grid';

export type ActiveTab = 'simulator' | 'chamber' | 'physics' | 'builder';

export type ApertureShape = 'circle' | 'square' | 'double_pinhole';

export interface OpticalParameters {
  pinholeDiameter: number; // in millimeters (mm)
  boxDepth: number; // in centimeters (cm) [effective focal length f]
  subjectDistance: number; // in centimeters (cm) [object distance do]
  subjectHeight: number; // in centimeters (cm) [object height ho]
  wavelength: number; // in nanometers (nm), e.g. 550nm green light
  hasLens: boolean; // whether a converging glass lens is fitted
  lensFocalLength: number; // in cm
  ambientLeak: number; // percentage 0 - 100% of light leak / non-blackout
  eyeAdaptation: number; // 0 - 100% retinal rhodopsin adaptation
  exposureBoost: number; // 0.2x to 5x virtual exposure
  rayDensity: number; // number of rays emitted per sample point
  selectedScene: ScenePreset;
  apertureShape: ApertureShape;
  showWavefronts: boolean;
  showNormalRays: boolean;
  showChiefRays: boolean;
  animatedPhotons: boolean;
}

export interface OpticalPhysicsOutputs {
  optimalDiameter: number; // Lord Rayleigh / Petzval optimum (mm)
  optimalDiameterMm: number; // Lord Rayleigh / Petzval optimum (mm)
  geometricBlurMm: number; // circle of confusion from aperture size (mm)
  diffractionBlurMm: number; // Airy disc 1st minimum diameter from wave nature (mm)
  totalBlurMm: number; // combined root-sum-square resolution spot size (mm)
  fNumber: number; // N = f / d
  magnification: number; // M = -f / do
  imageHeightCm: number; // hi = |M| * ho (cm)
  fieldOfViewDeg: number; // FOV based on standard screen
  airyDiskRadiusMm: number; // 1.22 * lambda * f / d (mm)
  relativeBrightness: number; // relative irradiance factor ~ (d/f)^2
  vignettingEdgeFalloff: number; // cos^4(theta) intensity at 30 deg off-axis
  depthOfField: string; // descriptive string or value
}

export interface BuilderPreset {
  id: string;
  name: string;
  category: 'portable' | 'room' | 'photographic' | 'artistic';
  boxDepthCm: number;
  screenWidthCm: number;
  screenHeightCm: number;
  subjectDistanceM: number;
  description: string;
  suggestedMaterials: string[];
  recommendedApertureMm: number;
  needleGauge: string;
  estimatedBuildTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}
