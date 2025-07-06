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
  gridSize: number; // e.g., 5 for 5x5 grid
  quadratSize: number; // cm
  cells: DaubenmireGridCell[];
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
  gridSize: number; // 5x5, 10x10, etc.
  quadratSize: number; // cm
  method: 'color_analysis' | 'supervised_classification' | 'manual_assisted';
  speciesLibrary?: string[]; // Known species for classification
  onProgress?: (progress: number, stage: string) => void;
  onCellAnalysis?: (cell: DaubenmireGridCell, cellIndex: number) => void;
}

export async function analyzeDaubenmireFrame(
  imageFile: File,
  options: DaubenmireAnalysisOptions
): Promise<DaubenmireResult> {
  const startTime = Date.now();
  
  options.onProgress?.(10, 'Loading and preprocessing image');
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const img = await loadImage(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  options.onProgress?.(30, 'Dividing image into grid cells');
  
  const gridCells = divideIntoGrid(imageData, options.gridSize);
  const analyzedCells: DaubenmireGridCell[] = [];
  
  for (let i = 0; i < gridCells.length; i++) {
    const cell = gridCells[i];
    
    options.onProgress?.(
      30 + (i / gridCells.length) * 60,
      `Analyzing cell ${i + 1}/${gridCells.length}`
    );
    
    const analyzedCell = await analyzeGridCell(cell, options);
    analyzedCells.push(analyzedCell);
    
    options.onCellAnalysis?.(analyzedCell, i);
  }
  
  options.onProgress?.(95, 'Calculating summary statistics');
  
  const result = calculateDaubenmireStatistics(analyzedCells, options);
  result.processingTime = Date.now() - startTime;
  
  options.onProgress?.(100, 'Analysis complete');
  
  return result;
}

interface GridCellData {
  x: number;
  y: number;
  imageData: ImageData;
  pixelData: Uint8ClampedArray;
  width: number;
  height: number;
}

function divideIntoGrid(imageData: ImageData, gridSize: number): GridCellData[] {
  const cells: GridCellData[] = [];
  const cellWidth = Math.floor(imageData.width / gridSize);
  const cellHeight = Math.floor(imageData.height / gridSize);
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const startX = col * cellWidth;
      const startY = row * cellHeight;
      
      // Extract cell data
      const cellCanvas = document.createElement('canvas');
      const cellCtx = cellCanvas.getContext('2d')!;
      cellCanvas.width = cellWidth;
      cellCanvas.height = cellHeight;
      
      // Create ImageData for the cell
      const cellImageData = cellCtx.createImageData(cellWidth, cellHeight);
      
      // Copy pixel data for this cell
      for (let y = 0; y < cellHeight; y++) {
        for (let x = 0; x < cellWidth; x++) {
          const sourceIndex = ((startY + y) * imageData.width + (startX + x)) * 4;
          const targetIndex = (y * cellWidth + x) * 4;
          
          cellImageData.data[targetIndex] = imageData.data[sourceIndex];
          cellImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
          cellImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
          cellImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
        }
      }
      
      cells.push({
        x: col,
        y: row,
        imageData: cellImageData,
        pixelData: cellImageData.data,
        width: cellWidth,
        height: cellHeight,
      });
    }
  }
  
  return cells;
}

async function analyzeGridCell(
  cell: GridCellData,
  options: DaubenmireAnalysisOptions
): Promise<DaubenmireGridCell> {
  const totalPixels = cell.width * cell.height;
  
  // Classify different ground cover types
  const classification = classifyGroundCover(cell.pixelData, totalPixels);
  
  // Identify potential species based on color patterns
  const species = identifySpecies(cell.pixelData, options.speciesLibrary);
  
  // Calculate coverage percentages
  const vegetationCoverage = classification.vegetation / totalPixels * 100;
  const bareGround = classification.bareGround / totalPixels * 100;
  const litter = classification.litter / totalPixels * 100;
  const rock = classification.rock / totalPixels * 100;
  
  return {
    x: cell.x,
    y: cell.y,
    species,
    coveragePercentage: vegetationCoverage,
    dominantSpecies: species.length > 0 ? species[0] : 'Unknown',
    bareGround,
    litter,
    rock,
  };
}

interface GroundCoverClassification {
  vegetation: number;
  bareGround: number;
  litter: number;
  rock: number;
  other: number;
}

function classifyGroundCover(pixelData: Uint8ClampedArray, totalPixels: number): GroundCoverClassification {
  const classification: GroundCoverClassification = {
    vegetation: 0,
    bareGround: 0,
    litter: 0,
    rock: 0,
    other: 0,
  };
  
  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];
    
    // Convert to HSV for better classification
    const hsv = rgbToHsv(r, g, b);
    
    // Classify based on color characteristics
    if (isVegetation(r, g, b, hsv)) {
      classification.vegetation++;
    } else if (isBareGround(r, g, b, hsv)) {
      classification.bareGround++;
    } else if (isLitter(r, g, b, hsv)) {
      classification.litter++;
    } else if (isRock(r, g, b, hsv)) {
      classification.rock++;
    } else {
      classification.other++;
    }
  }
  
  return classification;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  
  return [h, s, v];
}

function isVegetation(r: number, g: number, b: number, hsv: [number, number, number]): boolean {
  const [h, s, v] = hsv;
  
  // Green vegetation: hue 60-180, high saturation, moderate brightness
  const isGreen = h >= 60 && h <= 180 && s > 0.3 && v > 0.2;
  
  // Additional check for green dominance
  const greenDominant = g > r && g > b && (g - Math.max(r, b)) > 20;
  
  return isGreen || greenDominant;
}

function isBareGround(r: number, g: number, b: number, hsv: [number, number, number]): boolean {
  const [h, s, v] = hsv;
  
  // Bare ground: brown/tan colors, low saturation, moderate brightness
  const isBrown = (h >= 10 && h <= 40) || (h >= 350 && h <= 360);
  const lowSaturation = s < 0.4;
  const moderateBrightness = v > 0.2 && v < 0.8;
  
  return isBrown && lowSaturation && moderateBrightness;
}

function isLitter(r: number, g: number, b: number, hsv: [number, number, number]): boolean {
  const [h, s, v] = hsv;
  
  // Litter: yellow/orange/brown tones, moderate saturation
  const isLitterColor = (h >= 25 && h <= 65) || (h >= 200 && h <= 300);
  const moderateSaturation = s > 0.2 && s < 0.7;
  
  return isLitterColor && moderateSaturation;
}

function isRock(r: number, g: number, b: number, hsv: [number, number, number]): boolean {
  const [h, s, v] = hsv;
  
  // Rock: gray tones, very low saturation, various brightness
  const isGray = s < 0.2;
  const moderateToHighBrightness = v > 0.3;
  
  return isGray && moderateToHighBrightness;
}

function identifySpecies(pixelData: Uint8ClampedArray, speciesLibrary?: string[]): string[] {
  // Simplified species identification based on color patterns
  const species: string[] = [];
  
  // Calculate dominant colors
  const colorClusters = findColorClusters(pixelData);
  
  // Map color clusters to potential species
  for (const cluster of colorClusters) {
    const speciesName = mapColorToSpecies(cluster, speciesLibrary);
    if (speciesName && !species.includes(speciesName)) {
      species.push(speciesName);
    }
  }
  
  return species.slice(0, 3); // Limit to top 3 species
}

interface ColorCluster {
  r: number;
  g: number;
  b: number;
  count: number;
  percentage: number;
}

function findColorClusters(pixelData: Uint8ClampedArray): ColorCluster[] {
  const colorMap = new Map<string, number>();
  const totalPixels = pixelData.length / 4;
  
  // Group similar colors (reduce precision for clustering)
  for (let i = 0; i < pixelData.length; i += 4) {
    const r = Math.floor(pixelData[i] / 16) * 16;
    const g = Math.floor(pixelData[i + 1] / 16) * 16;
    const b = Math.floor(pixelData[i + 2] / 16) * 16;
    
    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }
  
  // Convert to clusters and sort by frequency
  const clusters: ColorCluster[] = [];
  const colorEntries = Array.from(colorMap.entries());
  for (const [key, count] of colorEntries) {
    const [r, g, b] = key.split(',').map(Number);
    clusters.push({
      r,
      g,
      b,
      count,
      percentage: (count / totalPixels) * 100,
    });
  }
  
  return clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 color clusters
}

function mapColorToSpecies(cluster: ColorCluster, speciesLibrary?: string[]): string | null {
  // Simple color-to-species mapping (in real implementation, this would be more sophisticated)
  const { r, g, b } = cluster;
  
  // Only consider clusters with vegetation colors
  if (g <= r || g <= b) return null;
  
  // Basic species identification based on green tones
  if (g > 150 && r < 100 && b < 100) {
    return 'Grass species';
  } else if (g > 120 && r < 80 && b < 80) {
    return 'Forb species';
  } else if (g > 100 && r < 120 && b < 80) {
    return 'Shrub species';
  }
  
  // If species library is provided, try to match
  if (speciesLibrary && speciesLibrary.length > 0) {
    // Return first species as placeholder for now
    return speciesLibrary[0];
  }
  
  return null;
}

function calculateDaubenmireStatistics(
  cells: DaubenmireGridCell[],
  options: DaubenmireAnalysisOptions
): DaubenmireResult {
  const totalCells = cells.length;
  
  // Calculate total coverage
  const totalCoverage = cells.reduce((sum, cell) => sum + cell.coveragePercentage, 0) / totalCells;
  
  // Calculate other percentages
  const bareGroundPercentage = cells.reduce((sum, cell) => sum + cell.bareGround, 0) / totalCells;
  const litterPercentage = cells.reduce((sum, cell) => sum + cell.litter, 0) / totalCells;
  const rockPercentage = cells.reduce((sum, cell) => sum + cell.rock, 0) / totalCells;
  
  // Collect all species
  const allSpecies = new Set<string>();
  for (const cell of cells) {
    for (const species of cell.species) {
      allSpecies.add(species);
    }
  }
  
  // Calculate species diversity (Shannon index)
  const speciesCount = new Map<string, number>();
  for (const cell of cells) {
    for (const species of cell.species) {
      speciesCount.set(species, (speciesCount.get(species) || 0) + 1);
    }
  }
  
  const shannonIndex = calculateShannonIndex(speciesCount, totalCells);
  const evennessIndex = calculateEvennessIndex(shannonIndex, allSpecies.size);
  
  // Find dominant species
  const speciesEntries = Array.from(speciesCount.entries());
  const dominantSpecies = speciesEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([species]) => species);
  
  return {
    gridSize: options.gridSize,
    quadratSize: options.quadratSize,
    cells,
    totalCoverage,
    speciesDiversity: allSpecies.size,
    dominantSpecies,
    bareGroundPercentage,
    litterPercentage,
    rockPercentage,
    shannonIndex,
    evennessIndex,
    processingTime: 0, // Will be set by caller
  };
}

function calculateShannonIndex(speciesCount: Map<string, number>, totalCells: number): number {
  let index = 0;
  const countValues = Array.from(speciesCount.values());
  for (const count of countValues) {
    const proportion = count / totalCells;
    if (proportion > 0) {
      index -= proportion * Math.log(proportion);
    }
  }
  return index;
}

function calculateEvennessIndex(shannonIndex: number, speciesCount: number): number {
  if (speciesCount <= 1) return 0;
  return shannonIndex / Math.log(speciesCount);
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
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }
  
  if (file.size > 15 * 1024 * 1024) {
    return { isValid: false, error: 'Image must be less than 15MB' };
  }
  
  return { isValid: true };
}

// Export types for use in other modules
export type {
  DaubenmireResult,
  DaubenmireGridCell,
  DaubenmireAnalysisOptions,
  GroundCoverClassification,
};