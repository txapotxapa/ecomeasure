import { loadImage } from './worker-utils';
import { validateImage as validateDaubenmireImage } from './image-processing';

export interface DaubenmireResult {
  samplingArea: number;
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

export interface DaubenmireAnalysisOptions {
  onProgress?: (progress: number, stage: string) => void;
}

// The primary function to analyze a Daubenmire frame image.
// It now uses the powerful Canopeo-based algorithm for ground cover.
export async function analyzeDaubenmireFrame(
  imageFile: File,
  options: DaubenmireAnalysisOptions
): Promise<DaubenmireResult> {
  const startTime = Date.now();

  const validation = validateDaubenmireImage(imageFile);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid image for Daubenmire analysis');
  }

  options.onProgress?.(10, 'Loading image...');
  const image = await loadImage(imageFile);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  options.onProgress?.(20, 'Classifying ground cover...');
  
  const analysisResults = await analyzeGroundCoverWithCanopeo(imageData, options);

  return {
    ...analysisResults,
    processingTime: Date.now() - startTime
  };
}


// This is the Canopeo-style algorithm, now correctly applied to ground cover.
async function analyzeGroundCoverWithCanopeo(
  imageData: ImageData,
  options: DaubenmireAnalysisOptions
): Promise<Omit<DaubenmireResult, 'processingTime'>> {
    
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  let vegetationPixels = 0;
  let otherPixels = 0; // Represents non-vegetation (bare ground, litter, rock)

  const onProgress = options.onProgress;

  onProgress?.(30, 'Applying Canopeo algorithm...');
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Canopeo algorithm: R/G and B/G ratios + Excess Green Index
    const rgRatio = g > 0 ? r / g : 0;
    const bgRatio = g > 0 ? b / g : 0;
    const excessGreen = 2 * g - r - b;
    
    // Classification thresholds from original Canopeo paper
    if (rgRatio < 0.95 && bgRatio < 0.95 && excessGreen > 20) {
      vegetationPixels++;
    } else {
      otherPixels++;
    }
    
    if (i % (Math.floor(data.length / 50)) === 0) {
        onProgress?.(30 + (i / data.length) * 60, 'Processing pixels...');
    }
  }

  onProgress?.(90, 'Calculating results...');
  
  if (totalPixels === 0) {
    throw new Error('No pixels were analyzed - check image data');
  }
  
  const vegetationCoverage = (vegetationPixels / totalPixels) * 100;
  const otherCoverage = 100 - vegetationCoverage;

  // Since Canopeo is primarily for green vs. non-green, we simplify the output.
  // We can't differentiate between bare ground, litter, and rock with this algorithm alone.
  // We will attribute all non-vegetation to a "Mixed Ground Cover" category.
  const proportions = [vegetationCoverage, otherCoverage].filter(p => p > 0).map(p => p / 100);
  const shannonIndex = -proportions.reduce((sum, p) => sum + p * Math.log(p), 0);
  const evennessIndex = proportions.length > 1 ? shannonIndex / Math.log(proportions.length) : 1;

  return {
    samplingArea: 1,
    totalCoverage: 100,
    speciesDiversity: proportions.length,
    dominantSpecies: ['Vegetation', 'Mixed Ground Cover'],
    bareGroundPercentage: otherCoverage, // Attributing all non-green to bare ground for simplicity
    litterPercentage: 0,
    rockPercentage: 0,
    shannonIndex: Number(shannonIndex.toFixed(3)),
    evennessIndex: Number(evennessIndex.toFixed(3)),
  };
}