// Web Worker for off-thread image processing
// Handles heavy computation without blocking the UI

interface WorkerMessage {
  type: 'ANALYZE_CANOPY' | 'ANALYZE_DAUBENMIRE' | 'ANALYZE_VEGETATION';
  imageData: ImageData;
  options: any;
}

interface WorkerResponse {
  type: 'RESULT' | 'PROGRESS' | 'ERROR';
  data?: any;
  progress?: number;
  stage?: string;
  error?: string;
}

// Import analysis functions
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, imageData, options } = event.data;

  try {
    switch (type) {
      case 'ANALYZE_CANOPY':
        await analyzeCanopyInWorker(imageData, options);
        break;
      case 'ANALYZE_DAUBENMIRE':
        await analyzeDaubenmireInWorker(imageData, options);
        break;
      case 'ANALYZE_VEGETATION':
        await analyzeVegetationInWorker(imageData, options);
        break;
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse);
  }
};

async function analyzeCanopyInWorker(imageData: ImageData, options: any) {
  const { data, width, height } = imageData;
  let canopyPixels = 0;
  let totalPixels = width * height;
  
  // Report initial progress
  self.postMessage({
    type: 'PROGRESS',
    progress: 10,
    stage: 'Analyzing pixels...'
  } as WorkerResponse);

  // Process in chunks to report progress
  const chunkSize = Math.floor(data.length / 20);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // GLAMA method threshold
    const brightness = (r + g + b) / 3;
    if (brightness < 127) {
      canopyPixels++;
    }
    
    // Report progress every chunk
    if (i % chunkSize === 0) {
      const progress = 10 + (i / data.length) * 80;
      self.postMessage({
        type: 'PROGRESS',
        progress,
        stage: `Processing pixels: ${Math.round(progress)}%`
      } as WorkerResponse);
    }
  }
  
  // Calculate results
  const canopyCover = (canopyPixels / totalPixels) * 100;
  const gapLight = 100 - canopyCover;
  const lightTransmission = gapLight;
  const leafAreaIndex = -Math.log(gapLight / 100) * 2;
  
  self.postMessage({
    type: 'RESULT',
    data: {
      canopyCover,
      gapLight,
      lightTransmission,
      leafAreaIndex,
      pixelsAnalyzed: totalPixels,
      method: options.method
    }
  } as WorkerResponse);
}

async function analyzeDaubenmireInWorker(imageData: ImageData, options: any) {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  // Classification counters
  let vegetationPixels = 0;
  let bareGroundPixels = 0;
  let litterPixels = 0;
  let rockPixels = 0;
  
  self.postMessage({
    type: 'PROGRESS',
    progress: 20,
    stage: 'Classifying ground cover...'
  } as WorkerResponse);
  
  // Process pixels with progress reporting
  const chunkSize = Math.floor(data.length / 10);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to HSV
    const [h, s, v] = rgbToHsv(r, g, b);
    
    // Classify pixel
    if (isVegetation(r, g, b, h, s, v)) {
      vegetationPixels++;
    } else if (isBareGround(r, g, b, h, s, v)) {
      bareGroundPixels++;
    } else if (isLitter(r, g, b, h, s, v)) {
      litterPixels++;
    } else if (isRock(r, g, b, h, s, v)) {
      rockPixels++;
    }
    
    // Report progress
    if (i % chunkSize === 0) {
      const progress = 20 + (i / data.length) * 60;
      self.postMessage({
        type: 'PROGRESS',
        progress,
        stage: `Analyzing coverage: ${Math.round(progress)}%`
      } as WorkerResponse);
    }
  }
  
  // Calculate percentages
  const classifiedPixels = vegetationPixels + bareGroundPixels + litterPixels + rockPixels;
  const vegetationPercentage = (vegetationPixels / classifiedPixels) * 100;
  const bareGroundPercentage = (bareGroundPixels / classifiedPixels) * 100;
  const litterPercentage = (litterPixels / classifiedPixels) * 100;
  const rockPercentage = (rockPixels / classifiedPixels) * 100;
  
  // Calculate diversity indices
  const totalCover = vegetationPercentage + bareGroundPercentage + litterPercentage + rockPercentage;
  const shannonIndex = calculateShannonIndex([vegetationPercentage, bareGroundPercentage, litterPercentage, rockPercentage]);
  
  self.postMessage({
    type: 'RESULT',
    data: {
      samplingArea: 1,
      totalCoverage: totalCover,
      speciesDiversity: vegetationPercentage > 0 ? 1 : 0,
      dominantSpecies: vegetationPercentage > 0 ? ['Mixed Vegetation'] : [],
      bareGroundPercentage,
      litterPercentage,
      rockPercentage,
      shannonIndex,
      evennessIndex: shannonIndex / Math.log(4)
    }
  } as WorkerResponse);
}

async function analyzeVegetationInWorker(imageData: ImageData, options: any) {
  // Simplified horizontal vegetation analysis
  const { data, width, height } = imageData;
  let obstructedPixels = 0;
  const totalPixels = width * height;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check if pixel is vegetation (not sky/pole)
    if (isVegetation(r, g, b)) {
      obstructedPixels++;
    }
  }
  
  const obstructionPercentage = (obstructedPixels / totalPixels) * 100;
  const obstructionHeight = options.poleHeight * (obstructionPercentage / 100);
  
  self.postMessage({
    type: 'RESULT',
    data: {
      direction: options.direction,
      obstructionHeight,
      vegetationDensity: obstructionPercentage
    }
  } as WorkerResponse);
}

// Helper functions
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

function isVegetation(r: number, g: number, b: number, h?: number, s?: number, v?: number): boolean {
  if (h === undefined || s === undefined || v === undefined) {
    [h, s, v] = rgbToHsv(r, g, b);
  }
  
  const greenExcess = (2 * g - r - b) / (r + g + b + 1);
  const normalizedGreen = g / (r + g + b + 1);
  
  const isGreenHue = (h >= 60 && h <= 180);
  const hasSaturation = s > 0.15;
  const hasValue = v > 0.2;
  
  const rgbVegetation = greenExcess > 0.1 && normalizedGreen > 0.4;
  
  return (isGreenHue && hasSaturation && hasValue) || rgbVegetation;
}

function isBareGround(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  const isBrownish = (h >= 15 && h <= 45) || (h >= 0 && h <= 15);
  const lowSaturation = s < 0.4;
  const mediumBrightness = v > 0.2 && v < 0.8;
  const isGrayish = s < 0.15 && v > 0.3 && v < 0.7;
  
  return (isBrownish && lowSaturation && mediumBrightness) || isGrayish;
}

function isLitter(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  const isDeadVegetation = (h >= 30 && h <= 60) && s > 0.2 && v > 0.15 && v < 0.6;
  const isDarkOrganic = s < 0.3 && v > 0.1 && v < 0.4;
  
  return isDeadVegetation || isDarkOrganic;
}

function isRock(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  const isLightRock = s < 0.2 && v > 0.6;
  const isDarkRock = s < 0.15 && v > 0.15 && v < 0.5;
  
  return isLightRock || isDarkRock;
}

function calculateShannonIndex(proportions: number[]): number {
  const validProps = proportions.filter(p => p > 0).map(p => p / 100);
  return -validProps.reduce((sum, p) => sum + p * Math.log(p), 0);
}

export {};