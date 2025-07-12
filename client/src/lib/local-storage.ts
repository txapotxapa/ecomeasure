import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export class LocalStorageService {
  private static instance: LocalStorageService;

  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  // Store data in preferences (for settings and small data)
  async setPreference(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  }

  async getPreference<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Error getting preference:', error);
      return defaultValue;
    }
  }

  async removePreference(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  // Store files in filesystem (for images and larger data)
  async saveFile(path: string, data: string, encoding: Encoding = Encoding.UTF8): Promise<string> {
    try {
      const result = await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Data,
        encoding,
      });
      return result.uri;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  async readFile(path: string, encoding: Encoding = Encoding.UTF8): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path,
        directory: Directory.Data,
        encoding,
      });
      return result.data as string;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path,
        directory: Directory.Data,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async checkFile(path: string): Promise<boolean> {
    try {
      await Filesystem.stat({
        path,
        directory: Directory.Data,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Create directory if it doesn't exist
  async ensureDirectory(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (error) {
      // Directory might already exist, ignore error
      console.debug('Directory creation skipped:', error);
    }
  }

  // Store analysis results
  async saveAnalysisResult(sessionId: string, measurementId: string, result: any): Promise<void> {
    const path = `analysis/${sessionId}/${measurementId}.json`;
    await this.ensureDirectory(`analysis/${sessionId}`);
    await this.saveFile(path, JSON.stringify(result));
  }

  async getAnalysisResult(sessionId: string, measurementId: string): Promise<any | null> {
    try {
      const path = `analysis/${sessionId}/${measurementId}.json`;
      const data = await this.readFile(path);
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Store session data
  async saveSessionData(sessionId: string, data: any): Promise<void> {
    const path = `sessions/${sessionId}.json`;
    await this.ensureDirectory('sessions');
    await this.saveFile(path, JSON.stringify(data));
  }

  async getSessionData(sessionId: string): Promise<any | null> {
    try {
      const path = `sessions/${sessionId}.json`;
      const data = await this.readFile(path);
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Store measurement data
  async saveMeasurementData(measurementId: string, data: any): Promise<void> {
    const path = `measurements/${measurementId}.json`;
    await this.ensureDirectory('measurements');
    await this.saveFile(path, JSON.stringify(data));
  }

  async getMeasurementData(measurementId: string): Promise<any | null> {
    try {
      const path = `measurements/${measurementId}.json`;
      const data = await this.readFile(path);
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Export all data for backup/sync
  async exportAllData(): Promise<any> {
    try {
      const sessions = await this.getPreference('sessions', []);
      const measurements = await this.getPreference('measurements', []);
      const projects = await this.getPreference('projects', []);
      const sites = await this.getPreference('sites', []);

      return {
        sessions,
        measurements,
        projects,
        sites,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data from backup
  async importData(data: any): Promise<void> {
    try {
      if (data.sessions) await this.setPreference('sessions', data.sessions);
      if (data.measurements) await this.setPreference('measurements', data.measurements);
      if (data.projects) await this.setPreference('projects', data.projects);
      if (data.sites) await this.setPreference('sites', data.sites);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Clear all local data
  async clearAllData(): Promise<void> {
    try {
      await Preferences.clear();
      // Note: Filesystem.rmdir with recursive is not available in all versions
      // Files will remain but preferences are cleared
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export default LocalStorageService.getInstance();