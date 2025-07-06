import { 
  analysisSession, 
  analysisSettings,
  type AnalysisSession, 
  type InsertAnalysisSession,
  type UpdateAnalysisSession,
  type AnalysisSettings,
  type InsertAnalysisSettings 
} from "@shared/schema";

export interface IStorage {
  // Analysis Sessions
  createAnalysisSession(session: InsertAnalysisSession): Promise<AnalysisSession>;
  getAnalysisSession(id: number): Promise<AnalysisSession | undefined>;
  updateAnalysisSession(id: number, updates: UpdateAnalysisSession): Promise<AnalysisSession | undefined>;
  deleteAnalysisSession(id: number): Promise<boolean>;
  getAllAnalysisSessions(): Promise<AnalysisSession[]>;
  getRecentAnalysisSessions(limit: number): Promise<AnalysisSession[]>;
  
  // Settings
  getAnalysisSettings(userId: string): Promise<AnalysisSettings | undefined>;
  createOrUpdateAnalysisSettings(settings: InsertAnalysisSettings): Promise<AnalysisSettings>;
}

export class MemStorage implements IStorage {
  private sessions: Map<number, AnalysisSession>;
  private settings: Map<string, AnalysisSettings>;
  private currentSessionId: number;
  private currentSettingsId: number;

  constructor() {
    this.sessions = new Map();
    this.settings = new Map();
    this.currentSessionId = 1;
    this.currentSettingsId = 1;
  }

  async createAnalysisSession(insertSession: InsertAnalysisSession): Promise<AnalysisSession> {
    const id = this.currentSessionId++;
    const session: AnalysisSession = {
      ...insertSession,
      id,
      timestamp: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async getAnalysisSession(id: number): Promise<AnalysisSession | undefined> {
    return this.sessions.get(id);
  }

  async updateAnalysisSession(id: number, updates: UpdateAnalysisSession): Promise<AnalysisSession | undefined> {
    const existingSession = this.sessions.get(id);
    if (!existingSession) return undefined;

    const updatedSession: AnalysisSession = {
      ...existingSession,
      ...updates,
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteAnalysisSession(id: number): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async getAllAnalysisSessions(): Promise<AnalysisSession[]> {
    return Array.from(this.sessions.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getRecentAnalysisSessions(limit: number): Promise<AnalysisSession[]> {
    const allSessions = await this.getAllAnalysisSessions();
    return allSessions.slice(0, limit);
  }

  async getAnalysisSettings(userId: string): Promise<AnalysisSettings | undefined> {
    return this.settings.get(userId);
  }

  async createOrUpdateAnalysisSettings(insertSettings: InsertAnalysisSettings): Promise<AnalysisSettings> {
    const existing = this.settings.get(insertSettings.userId);
    
    if (existing) {
      const updated: AnalysisSettings = {
        ...existing,
        ...insertSettings,
        updatedAt: new Date(),
      };
      this.settings.set(insertSettings.userId, updated);
      return updated;
    } else {
      const id = this.currentSettingsId++;
      const settings: AnalysisSettings = {
        ...insertSettings,
        id,
        updatedAt: new Date(),
      };
      this.settings.set(insertSettings.userId, settings);
      return settings;
    }
  }
}

export const storage = new MemStorage();
