import { processImageInWorker, optimizeImage } from './worker-utils';

interface CanopyAnalysisResult {
  canopyCover: number;
  lightTransmission: number;
  leafAreaIndex?: number;
  pixelsAnalyzed: number;
  processingTime: number;
}

interface AnalysisOptions {
  method: 'GLAMA' | 'Canopeo' | 'Custom';
  zenithAngle: number;
  threshold?: number;
  onProgress?: (progress: number, stage: string) => void;
}

export async function analyzeCanopyImage(
  imageFile: File,
  options: AnalysisOptions
): Promise<CanopyAnalysisResult> {
  const startTime = performance.now();
  
  // Validate the image file first
  const validation = validateImage(imageFile);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid image file');
  }
  
  // Optimize large images before processing
  let processFile = imageFile;
  if (imageFile.size > 5 * 1024 * 1024) {
    options.onProgress?.(5, 'Optimizing large image...');
    try {
      processFile = await optimizeImage(imageFile, 2048, 2048);
    } catch (e) {
      console.warn('Image optimization failed, using original:', e);
    }
  }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      try {
        console.log(`Image loaded: ${img.width}x${img.height}`);
        
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) throw new Error('Canvas context not available');
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        options.onProgress?.(10, 'Loading image data...');
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        let result: CanopyAnalysisResult;
        
        // Try to use web worker for better performance
        if (typeof Worker !== 'undefined' && options.method === 'GLAMA') {
          try {
            options.onProgress?.(20, 'Processing with optimized engine...');
            const workerResult = await processImageInWorker(imageData, 'ANALYZE_CANOPY', {
              method: options.method,
              zenithAngle: options.zenithAngle,
              onProgress: options.onProgress
            });
            result = {
              ...workerResult,
              processingTime: performance.now() - startTime
            };
          } catch (error) {
            console.warn('Worker processing failed, using main thread:', error);
            result = await processMainThread(imageData.data, canvas.width, canvas.height, options);
          }
        } else {
          result = await processMainThread(imageData.data, canvas.width, canvas.height, options);
        }
        
        result.processingTime = performance.now() - startTime;
        console.log('Analysis complete:', result);
        
        // Clean up
        URL.revokeObjectURL(img.src);
        
        resolve(result);
        
      } catch (error) {
        console.error('Analysis processing error:', error);
        URL.revokeObjectURL(img.src);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Image loading error:', error);
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for analysis'));
    };
    
    // Create object URL and load image
    try {
      img.src = URL.createObjectURL(processFile);
      console.log('Created object URL for image analysis');
    } catch (error) {
      console.error('Error creating object URL:', error);
      reject(new Error('Failed to process image file'));
    }
  });
}

async function processMainThread(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AnalysisOptions
): Promise<CanopyAnalysisResult> {
  console.log(`Processing ${data.length / 4} pixels with ${options.method} method`);
  
  switch (options.method) {
    case 'GLAMA':
      return await processGLAMA(data, width, height, options);
    case 'Canopeo':
      return await processCanopeo(data, width, height, options);
    case 'Custom':
      return await processCustom(data, width, height, options);
    default:
      throw new Error(`Unknown analysis method: ${options.method}`);
  }
}

async function processGLAMA(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AnalysisOptions
): Promise<CanopyAnalysisResult> {
  console.log('GLAMA processing started for', width, 'x', height, 'image');
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;
  
  let canopyPixels = 0;
  let skyPixels = 0;
  let totalPixels = 0;
  
  // Apply zenith angle constraint
  const zenithRadians = (options.zenithAngle * Math.PI) / 180;
  const effectiveRadius = radius * Math.sin(zenithRadians);
  
  console.log('Effective radius:', effectiveRadius, 'from', radius, 'at', options.zenithAngle, 'degrees');
  
  options.onProgress?.(30, 'Analyzing pixels...');
  
  // Ensure we have valid data
  if (!data || data.length === 0) {
    throw new Error('No image data to process');
  }
  
  const expectedPixels = width * height * 4;
  if (data.length !== expectedPixels) {
    throw new Error(`Image data length mismatch: expected ${expectedPixels}, got ${data.length}`);
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only analyze pixels within the zenith angle
      if (distance <= effectiveRadius) {
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        totalPixels++;
        
        // GLAMA algorithm: classify based on brightness and green content
        const brightness = (r + g + b) / 3;
        const greenness = g / Math.max(r + g + b, 1);
        
        if (brightness < 80 || greenness > 0.4) {
          canopyPixels++;
        } else {
          skyPixels++;
        }
      }
    }
    
    if (y % 50 === 0) {
      options.onProgress?.(30 + (y / height) * 50, 'Analyzing pixels...');
    }
  }
  
  console.log('GLAMA analysis complete:', {
    totalPixels,
    canopyPixels,
    skyPixels,
    canopyPercent: (canopyPixels / totalPixels) * 100
  });
  
  if (totalPixels === 0) {
    throw new Error('No pixels were analyzed - check image data');
  }
  
  options.onProgress?.(80, 'Calculating results...');
  
  const canopyCover = (canopyPixels / totalPixels) * 100;
  const lightTransmission = (skyPixels / totalPixels) * 100;
  
  // Calculate Leaf Area Index using Beer's Law approximation
  const leafAreaIndex = canopyCover > 0 ? -Math.log(lightTransmission / 100) : 0;
  
  options.onProgress?.(100, 'Complete');
  
  const result = {
    canopyCover: Number(canopyCover.toFixed(2)),
    lightTransmission: Number(lightTransmission.toFixed(2)),
    leafAreaIndex: Number(leafAreaIndex.toFixed(3)),
    pixelsAnalyzed: totalPixels,
    processingTime: 0, // Will be set by caller
  };
  
  console.log('GLAMA final result:', result);
  return result;
}

async function processCanopeo(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AnalysisOptions
): Promise<CanopyAnalysisResult> {
  console.log('Canopeo processing started for', width, 'x', height, 'image');
  
  let greenPixels = 0;
  let totalPixels = 0;
  
  options.onProgress?.(30, 'Applying Canopeo algorithm...');
  
  // Ensure we have valid data
  if (!data || data.length === 0) {
    throw new Error('No image data to process');
  }
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalPixels++;
    
    // Canopeo algorithm: R/G and B/G ratios
    const rg = g > 0 ? r / g : 0;
    const bg = g > 0 ? b / g : 0;
    
    // Excess green index
    const excessGreen = 2 * g - r - b;
    
    // Classification thresholds
    if (rg < 0.95 && bg < 0.95 && excessGreen > 20) {
      greenPixels++;
    }
    
    if (totalPixels % 10000 === 0) {
      options.onProgress?.(30 + (totalPixels / (data.length / 4)) * 50, 'Processing...');
    }
  }
  
  console.log('Canopeo analysis complete:', {
    totalPixels,
    greenPixels,
    greenPercent: (greenPixels / totalPixels) * 100
  });
  
  if (totalPixels === 0) {
    throw new Error('No pixels were analyzed - check image data');
  }
  
  options.onProgress?.(80, 'Calculating results...');
  
  const canopyCover = (greenPixels / totalPixels) * 100;
  const lightTransmission = 100 - canopyCover;
  
  options.onProgress?.(100, 'Complete');
  
  const result = {
    canopyCover: Number(canopyCover.toFixed(2)),
    lightTransmission: Number(lightTransmission.toFixed(2)),
    pixelsAnalyzed: totalPixels,
    processingTime: 0,
  };
  
  console.log('Canopeo final result:', result);
  return result;
}

async function processCustom(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AnalysisOptions
): Promise<CanopyAnalysisResult> {
  const threshold = options.threshold || 128;
  let darkPixels = 0;
  let totalPixels = 0;
  
  options.onProgress?.(30, 'Applying custom threshold...');
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalPixels++;
    
    const brightness = (r + g + b) / 3;
    
    if (brightness < threshold) {
      darkPixels++;
    }
    
    if (totalPixels % 10000 === 0) {
      options.onProgress?.(30 + (totalPixels / (data.length / 4)) * 50, 'Processing...');
    }
  }
  
  options.onProgress?.(80, 'Calculating results...');
  
  const canopyCover = (darkPixels / totalPixels) * 100;
  const lightTransmission = 100 - canopyCover;
  
  options.onProgress?.(100, 'Complete');
  
  return {
    canopyCover,
    lightTransmission,
    pixelsAnalyzed: totalPixels,
    processingTime: 0,
  };
}

export function validateImage(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Only JPEG and PNG images are supported.' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' };
  }
  
  return { isValid: true };
}
