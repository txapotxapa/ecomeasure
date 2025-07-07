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
        const data = imageData.data;
        
        console.log(`Processing ${data.length / 4} pixels with ${options.method} method`);
        
        let result: CanopyAnalysisResult;
        
        switch (options.method) {
          case 'GLAMA':
            result = await processGLAMA(data, canvas.width, canvas.height, options);
            break;
          case 'Canopeo':
            result = await processCanopeo(data, canvas.width, canvas.height, options);
            break;
          case 'Custom':
            result = await processCustom(data, canvas.width, canvas.height, options);
            break;
          default:
            throw new Error(`Unknown analysis method: ${options.method}`);
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
      img.src = URL.createObjectURL(imageFile);
      console.log('Created object URL for image analysis');
    } catch (error) {
      console.error('Error creating object URL:', error);
      reject(new Error('Failed to process image file'));
    }
  });
}

async function processGLAMA(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AnalysisOptions
): Promise<CanopyAnalysisResult> {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;
  
  let canopyPixels = 0;
  let skyPixels = 0;
  let totalPixels = 0;
  
  // Apply zenith angle constraint
  const zenithRadians = (options.zenithAngle * Math.PI) / 180;
  const effectiveRadius = radius * Math.sin(zenithRadians);
  
  options.onProgress?.(30, 'Analyzing pixels...');
  
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
  
  options.onProgress?.(80, 'Calculating results...');
  
  const canopyCover = (canopyPixels / totalPixels) * 100;
  const lightTransmission = (skyPixels / totalPixels) * 100;
  
  // Calculate Leaf Area Index using Beer's Law approximation
  const leafAreaIndex = canopyCover > 0 ? -Math.log(lightTransmission / 100) : 0;
  
  options.onProgress?.(100, 'Complete');
  
  return {
    canopyCover,
    lightTransmission,
    leafAreaIndex,
    pixelsAnalyzed: totalPixels,
    processingTime: 0, // Will be set by caller
  };
}

async function processCanopeo(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AnalysisOptions
): Promise<CanopyAnalysisResult> {
  let greenPixels = 0;
  let totalPixels = 0;
  
  options.onProgress?.(30, 'Applying Canopeo algorithm...');
  
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
  
  options.onProgress?.(80, 'Calculating results...');
  
  const canopyCover = (greenPixels / totalPixels) * 100;
  const lightTransmission = 100 - canopyCover;
  
  options.onProgress?.(100, 'Complete');
  
  return {
    canopyCover,
    lightTransmission,
    pixelsAnalyzed: totalPixels,
    processingTime: 0,
  };
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
