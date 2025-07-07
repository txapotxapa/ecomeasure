// Utilities for working with Web Workers

export function createImageWorker(): Worker {
  return new Worker(
    new URL('../workers/image-processor.worker.ts', import.meta.url),
    { type: 'module' }
  );
}

export function processImageInWorker(
  imageData: ImageData,
  type: 'ANALYZE_CANOPY' | 'ANALYZE_DAUBENMIRE' | 'ANALYZE_VEGETATION',
  options: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = createImageWorker();
    
    worker.onmessage = (event) => {
      const { type: responseType, data, progress, stage, error } = event.data;
      
      switch (responseType) {
        case 'RESULT':
          worker.terminate();
          resolve(data);
          break;
        case 'PROGRESS':
          if (options.onProgress) {
            options.onProgress(progress, stage);
          }
          break;
        case 'ERROR':
          worker.terminate();
          reject(new Error(error));
          break;
      }
    };
    
    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };
    
    worker.postMessage({
      type,
      imageData,
      options
    });
  });
}

// Image optimization utilities
export async function optimizeImage(file: File, maxWidth = 2048, maxHeight = 2048): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert back to file
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Batch processing utilities
export async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  concurrency = 3
): Promise<any[]> {
  const results: any[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}