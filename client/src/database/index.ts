import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { schema, migrations } from './schema'
import { SyncManager } from './sync'

// Import all models
import Project from './models/Project'
import Site from './models/Site'
import Session from './models/Session'
import Measurement from './models/Measurement'
import Photo from './models/Photo'
import WeatherData from './models/WeatherData'
import SyncLog from './models/SyncLog'

// Database configuration
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'ForestCanopyAnalyzer',
  // Enable experimental JSI for better performance
  jsi: true,
  // Enable WAL mode for better concurrent access
  synchronous: 'normal',
  // Experimental features
  experimentalUseJSI: true,
  // Enable foreign key constraints
  onSetUpDatabase: database => {
    database.execute('PRAGMA foreign_keys = ON')
  },
})

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    Project,
    Site,
    Session,
    Measurement,
    Photo,
    WeatherData,
    SyncLog,
  ],
})

// Initialize sync manager
export const syncManager = new SyncManager(
  database,
  process.env.REACT_APP_SYNC_URL || 'http://localhost:5001/api'
)

// Database service class
export class DatabaseService {
  private static instance: DatabaseService
  private database: Database
  private syncManager: SyncManager

  constructor() {
    this.database = database
    this.syncManager = syncManager
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Initialize database
  async initialize(): Promise<void> {
    try {
      // Test database connection
      await this.database.write(async () => {
        // Create a test record to verify database is working
        const projects = this.database.get('projects')
        const testProject = await projects.create(project => {
          project.name = 'Test Project'
          project.leadResearcher = 'System'
          project.startDate = new Date()
          project.status = 'active'
          project.syncStatus = 'synced'
          project.version = 1
        })
        
        // Delete test record immediately
        await testProject.markAsDeleted()
      })

      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw error
    }
  }

  // Get database instance
  getDatabase(): Database {
    return this.database
  }

  // Get sync manager
  getSyncManager(): SyncManager {
    return this.syncManager
  }

  // Collection getters
  get projects() {
    return this.database.get<Project>('projects')
  }

  get sites() {
    return this.database.get<Site>('sites')
  }

  get sessions() {
    return this.database.get<Session>('sessions')
  }

  get measurements() {
    return this.database.get<Measurement>('measurements')
  }

  get photos() {
    return this.database.get<Photo>('photos')
  }

  get weatherData() {
    return this.database.get<WeatherData>('weather_data')
  }

  get syncLog() {
    return this.database.get<SyncLog>('sync_log')
  }

  // High-level business operations
  async createProject(data: {
    name: string
    description?: string
    leadResearcher: string
    organization?: string
    startDate?: Date
    status?: 'active' | 'completed' | 'paused'
  }): Promise<Project> {
    return await this.database.write(async () => {
      return await this.projects.create(project => {
        project.name = data.name
        project.description = data.description || ''
        project.leadResearcher = data.leadResearcher
        project.organization = data.organization || ''
        project.startDate = data.startDate || new Date()
        project.status = data.status || 'active'
        project.syncStatus = 'pending'
        project.version = 1
      })
    })
  }

  async createSite(data: {
    projectId: string
    name: string
    description?: string
    latitude: number
    longitude: number
    altitude?: number
    ecosystemType?: string
    vegetationType?: string
    accessNotes?: string
  }): Promise<Site> {
    return await this.database.write(async () => {
      return await this.sites.create(site => {
        site.projectId = data.projectId
        site.name = data.name
        site.description = data.description || ''
        site.latitude = data.latitude
        site.longitude = data.longitude
        site.altitude = data.altitude
        site.ecosystemType = data.ecosystemType || ''
        site.vegetationType = data.vegetationType || ''
        site.accessNotes = data.accessNotes || ''
        site.syncStatus = 'pending'
        site.version = 1
      })
    })
  }

  async createSession(data: {
    siteId: string
    projectId: string
    sessionName: string
    researcherName: string
    weatherConditions?: string
    notes?: string
  }): Promise<Session> {
    return await this.database.write(async () => {
      return await this.sessions.create(session => {
        session.siteId = data.siteId
        session.projectId = data.projectId
        session.sessionName = data.sessionName
        session.researcherName = data.researcherName
        session.startTime = new Date()
        session.weatherConditions = data.weatherConditions || ''
        session.notes = data.notes || ''
        session.status = 'active'
        session.syncStatus = 'pending'
        session.version = 1
      })
    })
  }

  async createMeasurement(data: {
    sessionId: string
    siteId: string
    measurementType: 'canopy' | 'horizontal' | 'ground'
    measurementName: string
    latitude?: number
    longitude?: number
    altitude?: number
    imageUrl?: string
    analysisMethod?: string
    notes?: string
  }): Promise<Measurement> {
    return await this.database.write(async () => {
      return await this.measurements.create(measurement => {
        measurement.sessionId = data.sessionId
        measurement.siteId = data.siteId
        measurement.measurementType = data.measurementType
        measurement.measurementName = data.measurementName
        measurement.timestamp = new Date()
        measurement.latitude = data.latitude
        measurement.longitude = data.longitude
        measurement.altitude = data.altitude
        measurement.imageUrl = data.imageUrl || ''
        measurement.analysisMethod = data.analysisMethod || ''
        measurement.notes = data.notes || ''
        measurement.syncStatus = 'pending'
        measurement.version = 1
      })
    })
  }

  async createPhoto(data: {
    measurementId: string
    sessionId: string
    siteId: string
    photoType: 'measurement' | 'site' | 'documentation'
    filePath: string
    originalFilename: string
    fileSize: number
    mimeType: string
    width?: number
    height?: number
    latitude?: number
    longitude?: number
    altitude?: number
    notes?: string
  }): Promise<Photo> {
    return await this.database.write(async () => {
      return await this.photos.create(photo => {
        photo.measurementId = data.measurementId
        photo.sessionId = data.sessionId
        photo.siteId = data.siteId
        photo.photoType = data.photoType
        photo.filePath = data.filePath
        photo.originalFilename = data.originalFilename
        photo.fileSize = data.fileSize
        photo.mimeType = data.mimeType
        photo.width = data.width
        photo.height = data.height
        photo.timestamp = new Date()
        photo.latitude = data.latitude
        photo.longitude = data.longitude
        photo.altitude = data.altitude
        photo.notes = data.notes || ''
        photo.uploadStatus = 'pending'
        photo.syncStatus = 'pending'
        photo.version = 1
      })
    })
  }

  // Query helpers
  async getActiveProjects(): Promise<Project[]> {
    return await this.projects.query().where('status', 'active').fetch()
  }

  async getProjectSites(projectId: string): Promise<Site[]> {
    return await this.sites.query().where('project_id', projectId).fetch()
  }

  async getActiveSessions(siteId?: string): Promise<Session[]> {
    const query = this.sessions.query().where('status', 'active')
    if (siteId) {
      query.where('site_id', siteId)
    }
    return await query.fetch()
  }

  async getSessionMeasurements(sessionId: string): Promise<Measurement[]> {
    return await this.measurements.query().where('session_id', sessionId).fetch()
  }

  async getMeasurementPhotos(measurementId: string): Promise<Photo[]> {
    return await this.photos.query().where('measurement_id', measurementId).fetch()
  }

  // Sync operations
  async syncData(): Promise<void> {
    await this.syncManager.sync()
  }

  async getSyncStatus() {
    return await this.syncManager.getSyncStatus()
  }

  async resolveConflict(
    tableName: string,
    recordId: string,
    resolution: 'local' | 'server' | 'custom',
    customData?: any
  ): Promise<void> {
    await this.syncManager.resolveConflict(tableName, recordId, resolution, customData)
  }

  // Cleanup operations
  async cleanupOldData(olderThanDays: number = 365): Promise<void> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
    
    await this.database.write(async () => {
      // Clean up old completed sessions
      const oldSessions = await this.sessions.query()
        .where('status', 'completed')
        .where('end_time', Q.lt(cutoffTime))
        .fetch()

      for (const session of oldSessions) {
        await session.markAsDeleted()
      }
    })
  }

  // Database statistics
  async getStats() {
    const [projects, sites, sessions, measurements, photos, weatherData] = await Promise.all([
      this.projects.query().fetchCount(),
      this.sites.query().fetchCount(),
      this.sessions.query().fetchCount(),
      this.measurements.query().fetchCount(),
      this.photos.query().fetchCount(),
      this.weatherData.query().fetchCount(),
    ])

    const syncStats = await this.syncManager.getSyncStats()

    return {
      projects,
      sites,
      sessions,
      measurements,
      photos,
      weatherData,
      ...syncStats,
    }
  }
}

// Export default instance
export default DatabaseService.getInstance()

// Export types for convenience
export * from './types'
export { SyncManager } from './sync' 