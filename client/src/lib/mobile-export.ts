import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';

interface AnalysisResult {
  canopyCover: number;
  lightTransmission: number;
  leafAreaIndex?: number;
  pixelsAnalyzed: number;
  processingTime: number;
  analysisMethod: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface ExportOptions {
  includeTimestamp?: boolean;
  includeLocation?: boolean;
  format?: 'csv' | 'json';
  organizationName?: string;
  projectName?: string;
}

export class MobileExportService {
  private static instance: MobileExportService;

  static getInstance(): MobileExportService {
    if (!MobileExportService.instance) {
      MobileExportService.instance = new MobileExportService();
    }
    return MobileExportService.instance;
  }

  // Create stamped photo with analysis overlay
  async createStampedPhoto(
    originalImageData: string,
    analysisResult: AnalysisResult,
    sessionName: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;

          if (!ctx) throw new Error('Canvas context not available');

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Add semi-transparent overlay for text
          const overlayHeight = Math.min(150, img.height * 0.2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(0, img.height - overlayHeight, img.width, overlayHeight);

          // Configure text style
          const fontSize = Math.max(16, img.width * 0.025);
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = 'white';
          ctx.textAlign = 'left';

          const padding = 20;
          const lineHeight = fontSize * 1.4;
          let yPos = img.height - overlayHeight + padding + fontSize;

          // Add analysis results
          const texts = [
            `📊 ${sessionName}`,
            `🌿 Canopy Cover: ${analysisResult.canopyCover.toFixed(1)}%`,
            `☀️ Light Transmission: ${analysisResult.lightTransmission.toFixed(1)}%`,
            analysisResult.leafAreaIndex 
              ? `🍃 LAI: ${analysisResult.leafAreaIndex.toFixed(2)}`
              : null,
            `📐 Method: ${analysisResult.analysisMethod}`,
            `⏱️ ${new Date(analysisResult.timestamp).toLocaleString()}`,
            analysisResult.location 
              ? `📍 ${analysisResult.location.latitude.toFixed(6)}, ${analysisResult.location.longitude.toFixed(6)}`
              : null,
          ].filter(Boolean) as string[];

          texts.forEach((text, index) => {
            if (yPos < img.height - 10) { // Don't overflow
              ctx.fillText(text, padding, yPos);
              yPos += lineHeight;
            }
          });

          // Add watermark/logo
          ctx.font = `${fontSize * 0.8}px Arial`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.textAlign = 'right';
          ctx.fillText('EcoMeasure App', img.width - padding, img.height - 10);

          // Convert to data URL
          const stampedImageData = canvas.toDataURL('image/jpeg', 0.95);
          resolve(stampedImageData);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = originalImageData;
    });
  }

  // Save stamped photo to Pictures directory
  async saveStampedPhoto(
    stampedImageData: string,
    filename: string
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Data = stampedImageData.includes(',') 
        ? stampedImageData.split(',')[1] 
        : stampedImageData;
      
      const result = await Filesystem.writeFile({
        path: `EcoMeasure/${filename}`,
        data: base64Data,
        directory: Directory.Documents, // Use Documents for broader compatibility
      });

      return result.uri;
    } catch (error) {
      console.error('Error saving stamped photo:', error);
      throw new Error('Failed to save photo to device storage');
    }
  }

  // Export analysis data to Downloads
  async exportAnalysisData(
    data: any[],
    filename: string,
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      let content: string;
      let finalFilename: string;

      if (options.format === 'json') {
        content = JSON.stringify(data, null, 2);
        finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
      } else {
        // Default to CSV
        content = this.convertToCSV(data);
        finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      }

      // Add timestamp if requested
      if (options.includeTimestamp) {
        const timestamp = new Date().toISOString().split('T')[0];
        const nameParts = finalFilename.split('.');
        const extension = nameParts.pop();
        finalFilename = `${nameParts.join('.')}_${timestamp}.${extension}`;
      }

      const result = await Filesystem.writeFile({
        path: `EcoMeasure/Exports/${finalFilename}`,
        data: content,
        directory: Directory.Documents, // Downloads equivalent
        encoding: Encoding.UTF8,
      });

      return result.uri;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data to Downloads folder');
    }
  }

  // Share stamped photo
  async shareStampedPhoto(photoUri: string, title: string): Promise<void> {
    try {
      if (typeof Share !== 'undefined') {
        await Share.share({
          title: `${title} - EcoMeasure Analysis`,
          text: 'Vegetation analysis results from EcoMeasure',
          url: photoUri,
        });
      } else {
        console.log('Share plugin not available, photo saved to:', photoUri);
      }
    } catch (error) {
      console.error('Error sharing photo:', error);
      // Don't throw error, just log it
      console.log('Photo saved but sharing failed');
    }
  }

  // Share data export
  async shareDataExport(fileUri: string, title: string): Promise<void> {
    try {
      if (typeof Share !== 'undefined') {
        await Share.share({
          title: `${title} - Data Export`,
          text: 'Analysis data export from EcoMeasure',
          url: fileUri,
        });
      } else {
        console.log('Share plugin not available, export saved to:', fileUri);
      }
    } catch (error) {
      console.error('Error sharing export:', error);
      // Don't throw error, just log it
      console.log('Export saved but sharing failed');
    }
  }

  // Batch export multiple sessions
  async batchExportSessions(
    sessions: any[],
    options: ExportOptions = {}
  ): Promise<{ exportPath: string; photoCount: number }> {
    let photoCount = 0;
    const timestamp = new Date().toISOString().split('T')[0];
    const batchName = `batch_export_${timestamp}`;

    // Create batch folder
    await this.ensureDirectory(`EcoMeasure/Exports/${batchName}`);

    // Export each session
    for (const session of sessions) {
      const sessionFilename = `session_${session.id}_${session.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'unnamed'}`;
      
      // Export session data
      await this.exportAnalysisData(
        [session],
        `${batchName}/${sessionFilename}`,
        options
      );

      // Export stamped photos if available
      if (session.measurements) {
        for (const measurement of session.measurements) {
          if (measurement.imageData && measurement.analysisResult) {
            const stampedPhoto = await this.createStampedPhoto(
              measurement.imageData,
              measurement.analysisResult,
              session.name || 'Analysis'
            );

            await this.saveStampedPhoto(
              stampedPhoto,
              `${batchName}/${sessionFilename}_measurement_${measurement.id}.jpg`
            );
            photoCount++;
          }
        }
      }
    }

    return {
      exportPath: `EcoMeasure/Exports/${batchName}`,
      photoCount,
    };
  }

  // Get device info for export metadata
  async getDeviceInfo(): Promise<any> {
    try {
      const info = await Device.getInfo();
      return {
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        appVersion: '1.0.0', // You can get this from your app config
      };
    } catch (error) {
      return { platform: 'unknown' };
    }
  }

  // Ensure directory exists
  private async ensureDirectory(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (error) {
      // Directory might already exist
      console.debug('Directory creation skipped:', error);
    }
  }

  // Convert data to CSV format
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  // Get export statistics
  async getExportStats(): Promise<{
    totalExports: number;
    totalPhotos: number;
    lastExportDate?: string;
  }> {
    try {
      // This would require tracking exports in preferences
      // For now, return basic stats
      return {
        totalExports: 0,
        totalPhotos: 0,
      };
    } catch (error) {
      return {
        totalExports: 0,
        totalPhotos: 0,
      };
    }
  }
}

export default MobileExportService.getInstance();