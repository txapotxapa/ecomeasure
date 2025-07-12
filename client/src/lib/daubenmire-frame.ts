interface DaubenmireGridCell {
  x: number;
  y: number;
  species: string[];
  coveragePercentage: number;
  dominantSpecies: string;
  bareGround: number;
  litter: number;
  rock: number;
}

interface DaubenmireResult {
  samplingArea: number; // m² (always 1 for standardized sampling)
  totalCoverage: number;
  speciesDiversity: number;
  dominantSpecies: string[];
  bareGroundPercentage: number;
  litterPercentage: number;
  rockPercentage: number;
  shannonIndex: number;
  evennessIndex: number;
  processingTime: number;
}

interface DaubenmireAnalysisOptions {
  method: 'color_analysis' | 'supervised_classification' | 'manual_assisted';
  speciesLibrary?: string[]; // Known species for classification
  onProgress?: (progress: number, stage: string) => void;
}

export async function analyzeDaubenmireFrame(
  imageFile: File,
  options: DaubenmireAnalysisOptions
): Promise<DaubenmireResult> {
  const startTime = Date.now();
  
  // Validate image
  const validation = validateDaubenmireImage(imageFile);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid image');
  }

  options.onProgress?.(10, 'Loading and preprocessing image');

  // Load and process image
  const image = await loadImage(imageFile);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  options.onProgress?.(20, 'Analyzing ground cover with advanced method');

  // Use advanced algorithm for ground cover classification
  const result = await analyzeGroundCoverAdvanced(imageData, options);
  
  options.onProgress?.(100, 'Analysis complete');
  
  return {
    ...result,
    processingTime: Date.now() - startTime
  };
}

// Advanced ground cover analysis using proprietary algorithm
async function analyzeGroundCoverAdvanced(
  imageData: ImageData,
  options: DaubenmireAnalysisOptions
): Promise<Omit<DaubenmireResult, 'processingTime'>> {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  console.log(`Processing image: ${width}x${height} pixels (${totalPixels} total)`);
  
  // Classification counters
  let vegetationPixels = 0;
  let bareGroundPixels = 0;
  let litterPixels = 0;
  let rockPixels = 0;
  let shadowPixels = 0;
  let unclassifiedPixels = 0;
  
  // Species color groups for ground cover analysis
  const speciesColors = new Map<string, number>();
  
  options.onProgress?.(30, 'Classifying pixels using advanced ground cover method');
  
  // Process each pixel using official Canopeo algorithm
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to HSV for additional constraints
    const [h, s, v] = rgbToHsv(r, g, b);
    
    // Classify pixel based on advanced ground cover method
    if (isVegetationAdvanced(r, g, b, h, s, v)) {
      vegetationPixels++;
      // Group vegetation colors for ground cover species estimation
      const colorKey = `${Math.floor(h / 20)}-${Math.floor(s / 0.3)}-${Math.floor(v / 0.3)}`;
      speciesColors.set(colorKey, (speciesColors.get(colorKey) || 0) + 1);
    } else if (isBareGroundAdvanced(r, g, b, h, s, v)) {
      bareGroundPixels++;
    } else if (isLitterAdvanced(r, g, b, h, s, v)) {
      litterPixels++;
    } else if (isRockAdvanced(r, g, b, h, s, v)) {
      rockPixels++;
    } else if (v < 0.25) {
      shadowPixels++; // Count shadows separately
    } else {
      unclassifiedPixels++;
    }
  }
  
  console.log('Pixel classification results:');
  console.log(`Vegetation: ${vegetationPixels} (${(vegetationPixels/totalPixels*100).toFixed(1)}%)`);
  console.log(`Bare Ground: ${bareGroundPixels} (${(bareGroundPixels/totalPixels*100).toFixed(1)}%)`);
  console.log(`Litter: ${litterPixels} (${(litterPixels/totalPixels*100).toFixed(1)}%)`);
  console.log(`Rock: ${rockPixels} (${(rockPixels/totalPixels*100).toFixed(1)}%)`);
  console.log(`Shadow: ${shadowPixels} (${(shadowPixels/totalPixels*100).toFixed(1)}%)`);
  console.log(`Unclassified: ${unclassifiedPixels} (${(unclassifiedPixels/totalPixels*100).toFixed(1)}%)`);
  console.log(`Species colors found: ${speciesColors.size}`);
  
  options.onProgress?.(70, 'Calculating coverage statistics');
  
  // Calculate percentages (excluding shadows from total)
  const classifiedPixels = vegetationPixels + bareGroundPixels + litterPixels + rockPixels;
  console.log(`Classified pixels: ${classifiedPixels} out of ${totalPixels}`);
  
  if (classifiedPixels === 0) {
    console.error('No pixels were classified! Check classification thresholds.');
    throw new Error('Image analysis failed: No recognizable ground cover detected');
  }
  
  const vegetationPercentage = (vegetationPixels / classifiedPixels) * 100;
  const bareGroundPercentage = (bareGroundPixels / classifiedPixels) * 100;
  const litterPercentage = (litterPixels / classifiedPixels) * 100;
  const rockPercentage = (rockPixels / classifiedPixels) * 100;
  
  console.log('Final percentages:');
  console.log(`Vegetation: ${vegetationPercentage.toFixed(1)}%`);
  console.log(`Bare Ground: ${bareGroundPercentage.toFixed(1)}%`);
  console.log(`Litter: ${litterPercentage.toFixed(1)}%`);
  console.log(`Rock: ${rockPercentage.toFixed(1)}%`);
  
  // Identify dominant vegetation types
  const sortedSpecies = Array.from(speciesColors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => {
      const percentage = vegetationPixels > 0 ? (count / vegetationPixels) * 100 : 0;
      return mapColorToSpeciesName(key, percentage);
    })
    .filter(species => species !== null) as string[];
    
  console.log(`Dominant species: ${sortedSpecies.join(', ')}`);
  
  options.onProgress?.(90, 'Calculating biodiversity indices');
  
  // Calculate Shannon diversity index
  const totalCover = vegetationPercentage + bareGroundPercentage + litterPercentage + rockPercentage;
  const proportions = [
    vegetationPercentage / 100,
    bareGroundPercentage / 100,
    litterPercentage / 100,
    rockPercentage / 100
  ].filter(p => p > 0.01); // Remove very small proportions
  
  const shannonIndex = -proportions.reduce((sum, p) => sum + p * Math.log(p), 0);
  const maxDiversity = Math.log(proportions.length);
  const evennessIndex = maxDiversity > 0 ? shannonIndex / maxDiversity : 0;
  
  return {
    samplingArea: 1, // 1m² standardized
    totalCoverage: totalCover,
    speciesDiversity: sortedSpecies.length,
    dominantSpecies: sortedSpecies,
    bareGroundPercentage,
    litterPercentage,
    rockPercentage,
    shannonIndex,
    evennessIndex
  };
}

// Advanced ground cover vegetation detection using proprietary algorithm
function isVegetationAdvanced(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  // Proprietary algorithm for ground cover analysis
  // Uses Excess Green Index: 2G - R - B
  const sum = r + g + b;
  if (sum === 0) return false; // Avoid division by zero
  
  const excessGreen = (2 * g - r - b) / sum;
  
  // Calculate R/G and B/G ratios for vegetation detection
  const rToGRatio = g > 0 ? r / g : 999; // High value if g=0
  const bToGRatio = g > 0 ? b / g : 999; // High value if g=0
  
  // Optimized thresholds for vegetation classification
  // Vegetation has high green excess and low R/G, B/G ratios
  const isVegetation = excessGreen > 0.03 && rToGRatio < 1.0 && bToGRatio < 1.0;
  
  // More lenient HSV constraints for better ground cover detection
  const isGreenish = (h >= 45 && h <= 200) || s > 0.3; // Broader green range or high saturation
  const hasMinValue = v > 0.1; // Minimum brightness to avoid deep shadows
  
  const result = isVegetation && isGreenish && hasMinValue;
  
  // Debug first few pixels
  if (Math.random() < 0.0001) { // Log ~0.01% of pixels for debugging
    console.log(`Pixel RGB(${r},${g},${b}) HSV(${h.toFixed(0)},${s.toFixed(2)},${v.toFixed(2)}) -> vegetation: ${result} (EG: ${excessGreen.toFixed(3)}, R/G: ${rToGRatio.toFixed(2)}, B/G: ${bToGRatio.toFixed(2)})`);
  }
  
  return result;
}

function isBareGroundAdvanced(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  // Brown/tan colors with low saturation - more permissive
  const isBrownish = (h >= 10 && h <= 50) || (h >= 350 && h <= 360);
  const lowSaturation = s < 0.5;
  const mediumBrightness = v > 0.15 && v < 0.85;
  
  // Gray colors (very low saturation) - more permissive
  const isGrayish = s < 0.2 && v > 0.2 && v < 0.8;
  
  // Light sandy colors
  const isSandy = s < 0.3 && v > 0.5 && (h >= 30 && h <= 60);
  
  return (isBrownish && lowSaturation && mediumBrightness) || isGrayish || isSandy;
}

function isLitterAdvanced(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  // Dead vegetation - browns and yellows
  const isDeadVegetation = (h >= 30 && h <= 60) && s > 0.2 && v > 0.15 && v < 0.6;
  
  // Dark organic matter
  const isDarkOrganic = s < 0.3 && v > 0.1 && v < 0.4;
  
  return isDeadVegetation || isDarkOrganic;
}

function isRockAdvanced(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  // Light colored, low saturation (limestone, sandstone)
  const isLightRock = s < 0.2 && v > 0.6;
  
  // Dark rock with very low saturation
  const isDarkRock = s < 0.15 && v > 0.15 && v < 0.5;
  
  return isLightRock || isDarkRock;
}

function mapColorToSpeciesName(colorKey: string, percentage: number): string | null {
  const [hGroup, sGroup, vGroup] = colorKey.split('-').map(Number);
  
  // Simple species mapping based on color characteristics
  if (hGroup >= 4 && hGroup <= 8) { // Green vegetation
    if (percentage > 20) return "Grass/Forb";
    return "Mixed Vegetation";
  } else if (hGroup >= 2 && hGroup <= 4) { // Yellow-green
    return "Senescent Vegetation";
  } else if (hGroup >= 8 && hGroup <= 12) { // Blue-green
    return "Moss/Algae";
  }
  
  return null;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return [h, s, v];
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function validateDaubenmireImage(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }

  // Check file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    return { isValid: false, error: 'Image file too large (max 20MB)' };
  }

  // Check if it's a supported format
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported image format. Use JPEG, PNG, or WebP' };
  }

  return { isValid: true };
}

export type { DaubenmireResult, DaubenmireAnalysisOptions };