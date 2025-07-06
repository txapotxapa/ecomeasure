interface HorizontalVegetationResult {
  direction: 'North' | 'East' | 'South' | 'West';
  obstructionHeight: number; // cm - height where vegetation 100% obscures pole
  vegetationDensity: number; // percentage based on obstruction height
  notes?: string;
}

interface HorizontalVegetationAnalysis {
  siteName: string;
  measurements: HorizontalVegetationResult[];
  averageObstructionHeight: number; // cm
  vegetationDensityIndex: number; // 0-100%
  vegetationProfile: 'sparse' | 'moderate' | 'dense';
  uniformityIndex: number; // measure of consistency across directions
  timestamp: Date;
  gpsCoordinates?: { latitude: number; longitude: number };
}

interface RobelPoleOptions {
  siteName: string;
  poleHeight: number; // cm, typically 200cm
  viewingDistance: number; // cm, typically 400cm (4m)
  eyeHeight: number; // cm, typically 100cm (1m)
  gpsCoordinates?: { latitude: number; longitude: number };
  notes?: string;
}

export async function analyzeHorizontalVegetation(
  obstructionData: { direction: 'North' | 'East' | 'South' | 'West'; height: number }[],
  options: RobelPoleOptions
): Promise<HorizontalVegetationAnalysis> {
  
  if (obstructionData.length !== 4) {
    throw new Error('Must provide obstruction height readings for all 4 cardinal directions');
  }
  
  const measurements: HorizontalVegetationResult[] = obstructionData.map(data => ({
    direction: data.direction,
    obstructionHeight: data.height,
    vegetationDensity: calculateVegetationDensity(data.height, options.poleHeight)
  }));
  
  const averageObstructionHeight = measurements.reduce((sum, m) => sum + m.obstructionHeight, 0) / measurements.length;
  const vegetationDensityIndex = measurements.reduce((sum, m) => sum + m.vegetationDensity, 0) / measurements.length;
  
  const vegetationProfile = getVegetationProfile(vegetationDensityIndex);
  const uniformityIndex = calculateUniformityIndex(measurements);
  
  return {
    siteName: options.siteName,
    measurements,
    averageObstructionHeight,
    vegetationDensityIndex,
    vegetationProfile,
    uniformityIndex,
    timestamp: new Date(),
    gpsCoordinates: options.gpsCoordinates,
  };
}

function calculateVegetationDensity(obstructionHeight: number, poleHeight: number): number {
  // Convert obstruction height to percentage of pole height
  const densityPercentage = (obstructionHeight / poleHeight) * 100;
  
  // Cap at 100% for cases where vegetation exceeds pole height
  return Math.min(densityPercentage, 100);
}

function getVegetationProfile(densityIndex: number): 'sparse' | 'moderate' | 'dense' {
  if (densityIndex < 30) return 'sparse';
  if (densityIndex < 70) return 'moderate';
  return 'dense';
}

function calculateUniformityIndex(measurements: HorizontalVegetationResult[]): number {
  // Calculate coefficient of variation for vegetation density across directions
  const densities = measurements.map(m => m.vegetationDensity);
  const mean = densities.reduce((sum, d) => sum + d, 0) / densities.length;
  
  if (mean === 0) return 100; // Perfect uniformity if all readings are 0
  
  const variance = densities.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / densities.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = (standardDeviation / mean) * 100;
  
  // Convert to uniformity index (100 = perfect uniformity, 0 = high variability)
  return Math.max(0, 100 - coefficientOfVariation);
}

export function validateRobelPoleData(
  obstructionData: { direction: string; height: number }[],
  options: RobelPoleOptions
): { isValid: boolean; error?: string } {
  if (obstructionData.length !== 4) {
    return { isValid: false, error: 'Must provide readings for all 4 cardinal directions' };
  }
  
  const requiredDirections = ['North', 'East', 'South', 'West'];
  const providedDirections = obstructionData.map(d => d.direction);
  
  for (const direction of requiredDirections) {
    if (!providedDirections.includes(direction)) {
      return { isValid: false, error: `Missing reading for ${direction} direction` };
    }
  }
  
  for (const data of obstructionData) {
    if (data.height < 0 || data.height > options.poleHeight + 50) {
      return { isValid: false, error: `Invalid obstruction height: ${data.height}cm` };
    }
  }
  
  return { isValid: true };
}

// Export types for use in components
export type { HorizontalVegetationResult, HorizontalVegetationAnalysis, RobelPoleOptions };