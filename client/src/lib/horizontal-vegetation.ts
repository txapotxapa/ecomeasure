interface HorizontalVegetationResult {
  height: number; // cm
  vegetationCover: number; // percentage
  pixelsAnalyzed: number;
  greenPixels: number;
  dominantSpecies?: string[];
  densityIndex: number;
  processingTime: number;
}

interface HorizontalVegetationAnalysis {
  plotName: string;
  measurements: HorizontalVegetationResult[];
  averageCover: number;
  coverByHeight: Record<number, number>;
  vegetationProfile: 'sparse' | 'moderate' | 'dense';
  heightDiversity: number;
}

interface AnalysisOptions {
  heights: number[]; // Heights in cm where photos were taken
  method: 'color_threshold' | 'edge_detection' | 'machine_learning';
  threshold?: number;
  onProgress?: (progress: number, stage: string) => void;
}

export async function analyzeHorizontalVegetation(
  imageFiles: File[],
  options: AnalysisOptions
): Promise<HorizontalVegetationAnalysis> {
  const startTime = Date.now();
  
  if (imageFiles.length !== options.heights.length) {
    throw new Error('Number of images must match number of heights');
  }

  const measurements: HorizontalVegetationResult[] = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const height = options.heights[i];
    
    options.onProgress?.(
      (i / imageFiles.length) * 100,
      `Analyzing image at ${height}cm height`
    );
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const img = await loadImage(file);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = await processHorizontalVegetationImage(
      imageData.data,
      canvas.width,
      canvas.height,
      height,
      options
    );
    
    measurements.push(result);
  }
  
  const averageCover = measurements.reduce((sum, m) => sum + m.vegetationCover, 0) / measurements.length;
  const coverByHeight = measurements.reduce((acc, m) => {
    acc[m.height] = m.vegetationCover;
    return acc;
  }, {} as Record<number, number>);
  
  const vegetationProfile = getVegetationProfile(averageCover);
  const heightDiversity = calculateHeightDiversity(measurements);
  
  return {
    plotName: 'Horizontal Vegetation Analysis',
    measurements,
    averageCover,
    coverByHeight,
    vegetationProfile,
    heightDiversity,
  };
}

async function processHorizontalVegetationImage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  photoHeight: number,
  options: AnalysisOptions
): Promise<HorizontalVegetationResult> {
  const startTime = Date.now();
  
  let greenPixels = 0;
  const totalPixels = width * height;
  
  // Process based on selected method
  switch (options.method) {
    case 'color_threshold':
      greenPixels = countGreenPixelsThreshold(data, options.threshold || 0.3);
      break;
    case 'edge_detection':
      greenPixels = countGreenPixelsEdgeDetection(data, width, height);
      break;
    case 'machine_learning':
      greenPixels = await countGreenPixelsML(data, width, height);
      break;
  }
  
  const vegetationCover = (greenPixels / totalPixels) * 100;
  const densityIndex = calculateDensityIndex(vegetationCover, photoHeight);
  
  return {
    height: photoHeight,
    vegetationCover,
    pixelsAnalyzed: totalPixels,
    greenPixels,
    densityIndex,
    processingTime: Date.now() - startTime,
  };
}

function countGreenPixelsThreshold(data: Uint8ClampedArray, threshold: number): number {
  let count = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Enhanced green detection for vegetation
    const greenRatio = g / (r + g + b);
    const isGreen = greenRatio > threshold && g > r && g > b;
    
    // Additional vegetation indicators
    const vegetation = isGreen && (g - r) > 30 && (g - b) > 20;
    
    if (vegetation) {
      count++;
    }
  }
  
  return count;
}

function countGreenPixelsEdgeDetection(data: Uint8ClampedArray, width: number, height: number): number {
  // Apply edge detection to identify vegetation boundaries
  const gray = new Uint8ClampedArray(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  
  // Apply Sobel edge detection
  let greenPixels = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Sobel X kernel
      const gx = (-1 * gray[idx - width - 1]) + (1 * gray[idx - width + 1]) +
                 (-2 * gray[idx - 1]) + (2 * gray[idx + 1]) +
                 (-1 * gray[idx + width - 1]) + (1 * gray[idx + width + 1]);
      
      // Sobel Y kernel
      const gy = (-1 * gray[idx - width - 1]) + (-2 * gray[idx - width]) + (-1 * gray[idx - width + 1]) +
                 (1 * gray[idx + width - 1]) + (2 * gray[idx + width]) + (1 * gray[idx + width + 1]);
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      // Check if this edge corresponds to vegetation
      const pixelIdx = idx * 4;
      const g = data[pixelIdx + 1];
      const isVegetationEdge = magnitude > 50 && g > 100;
      
      if (isVegetationEdge) {
        greenPixels++;
      }
    }
  }
  
  return greenPixels;
}

async function countGreenPixelsML(data: Uint8ClampedArray, width: number, height: number): Promise<number> {
  // Simplified ML approach using color clustering
  const features: number[][] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Extract color features
    const hue = rgbToHue(r, g, b);
    const saturation = rgbToSaturation(r, g, b);
    const value = Math.max(r, g, b);
    
    features.push([hue, saturation, value]);
  }
  
  // Simple clustering to identify vegetation
  return classifyVegetationPixels(features);
}

function rgbToHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  if (delta === 0) return 0;
  
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  
  return hue * 60;
}

function rgbToSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  return max === 0 ? 0 : delta / max;
}

function classifyVegetationPixels(features: number[][]): number {
  // Simple heuristic classification for vegetation
  let vegetationCount = 0;
  
  for (const [hue, saturation, value] of features) {
    // Vegetation typically has:
    // - Green hue (60-180 degrees)
    // - High saturation (>0.3)
    // - Moderate to high value (>50)
    const isVegetation = hue >= 60 && hue <= 180 && saturation > 0.3 && value > 50;
    
    if (isVegetation) {
      vegetationCount++;
    }
  }
  
  return vegetationCount;
}

function calculateDensityIndex(vegetationCover: number, height: number): number {
  // Density index considers both coverage and height
  // Higher vegetation at lower heights indicates denser growth
  const heightFactor = Math.max(0.1, 250 - height) / 250; // Inverse relationship with height
  return vegetationCover * heightFactor;
}

function getVegetationProfile(averageCover: number): 'sparse' | 'moderate' | 'dense' {
  if (averageCover < 30) return 'sparse';
  if (averageCover < 70) return 'moderate';
  return 'dense';
}

function calculateHeightDiversity(measurements: HorizontalVegetationResult[]): number {
  // Shannon diversity index based on vegetation cover at different heights
  const total = measurements.reduce((sum, m) => sum + m.vegetationCover, 0);
  
  if (total === 0) return 0;
  
  let diversity = 0;
  for (const measurement of measurements) {
    const proportion = measurement.vegetationCover / total;
    if (proportion > 0) {
      diversity -= proportion * Math.log(proportion);
    }
  }
  
  return diversity;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function validateHorizontalVegetationImages(files: File[], heights: number[]): { isValid: boolean; error?: string } {
  if (files.length === 0) {
    return { isValid: false, error: 'No images provided' };
  }
  
  if (files.length !== heights.length) {
    return { isValid: false, error: 'Number of images must match number of heights' };
  }
  
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'All files must be images' };
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'Image files must be less than 10MB' };
    }
  }
  
  return { isValid: true };
}