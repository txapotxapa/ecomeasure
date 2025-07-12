// Base interfaces
export interface BaseRecord {
  id: string
  createdAt: Date
  updatedAt: Date
  syncStatus: 'synced' | 'pending' | 'conflict' | 'failed'
  lastSyncAt?: Date
  serverId?: string
  version: number
}

export type ProjectStatus = 'active' | 'completed' | 'paused'
export type SessionStatus = 'active' | 'completed' | 'abandoned'
export type MeasurementType = 'canopy' | 'horizontal' | 'ground'
export type PhotoType = 'measurement' | 'site' | 'documentation'
export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down'
export type CloudCover = 'clear' | 'partly_cloudy' | 'overcast'
export type Precipitation = 'none' | 'light' | 'moderate' | 'heavy'
export type DataSource = 'manual' | 'sensor' | 'api'
export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed'
export type ProtocolCategory = 'preset' | 'custom' | 'shared'
export type EcosystemType = 'forest' | 'grassland' | 'riparian' | 'wetland' | 'urban' | 'agricultural' | 'coastal'
export type SamplingPattern = 'grid' | 'transect' | 'random' | 'systematic' | 'point_intercept' | 'line_intercept'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

// Project interfaces
export interface ProjectRecord extends BaseRecord {
  name: string
  description?: string
  leadResearcher: string
  organization?: string
  startDate: Date
  endDate?: Date
  status: ProjectStatus
}

export interface CreateProjectData {
  name: string
  description?: string
  leadResearcher: string
  organization?: string
  startDate: Date
  endDate?: Date
  status?: ProjectStatus
}

// Site interfaces
export interface SiteRecord extends BaseRecord {
  projectId: string
  name: string
  description?: string
  latitude: number
  longitude: number
  altitude?: number
  ecosystemType?: string
  vegetationType?: string
  sitePhotoUrl?: string
  accessNotes?: string
}

export interface CreateSiteData {
  projectId: string
  name: string
  description?: string
  latitude: number
  longitude: number
  altitude?: number
  ecosystemType?: string
  vegetationType?: string
  sitePhotoUrl?: string
  accessNotes?: string
}

// Session interfaces
export interface SessionRecord extends BaseRecord {
  siteId: string
  projectId: string
  protocolId?: string
  sessionName: string
  researcherName: string
  startTime: Date
  endTime?: Date
  weatherConditions?: string
  notes?: string
  status: SessionStatus
  progressData?: string // JSON tracking protocol completion
}

export interface CreateSessionData {
  siteId: string
  projectId: string
  protocolId?: string
  sessionName: string
  researcherName: string
  startTime?: Date
  weatherConditions?: string
  notes?: string
  status?: SessionStatus
}

// Protocol template interfaces
export interface ProtocolTemplateRecord extends BaseRecord {
  name: string
  description?: string
  category: ProtocolCategory
  ecosystemType?: EcosystemType
  createdBy: string
  isPublic: boolean
  isPreset: boolean
  
  // Sampling design
  samplingPattern: SamplingPattern
  numberOfPoints: number
  pointSpacing?: number // meters
  transectLength?: number // meters
  transectCount?: number
  plotSize?: number // square meters
  
  // Tool configuration
  toolsEnabled: string // JSON array
  canopyConfig?: string // JSON config
  horizontalConfig?: string // JSON config
  groundConfig?: string // JSON config
  
  // Data collection requirements
  requiredPhotos?: string // JSON array
  requiredMeasurements?: string // JSON array
  weatherRecording: boolean
  gpsRequired: boolean
  notesTemplate?: string
  
  // Quality control
  minGpsAccuracy?: number // meters
  photoRequirements?: string // JSON config
  validationRules?: string // JSON config
  
  // Metadata
  tags?: string // JSON array
  instructions?: string
  estimatedTime?: number // minutes
  difficultyLevel?: DifficultyLevel
}

export interface CreateProtocolTemplateData {
  name: string
  description?: string
  category?: ProtocolCategory
  ecosystemType?: EcosystemType
  createdBy: string
  isPublic?: boolean
  isPreset?: boolean
  samplingPattern: SamplingPattern
  numberOfPoints: number
  pointSpacing?: number
  transectLength?: number
  transectCount?: number
  plotSize?: number
  toolsEnabled: string[]
  canopyConfig?: CanopyProtocolConfig
  horizontalConfig?: HorizontalProtocolConfig
  groundConfig?: GroundProtocolConfig
  requiredPhotos?: string[]
  requiredMeasurements?: string[]
  weatherRecording?: boolean
  gpsRequired?: boolean
  notesTemplate?: string
  minGpsAccuracy?: number
  photoRequirements?: PhotoRequirements
  validationRules?: ValidationRules
  tags?: string[]
  instructions?: string
  estimatedTime?: number
  difficultyLevel?: DifficultyLevel
}

// Protocol configuration interfaces
export interface CanopyProtocolConfig {
  analysisMethod: 'GLAMA' | 'Canopeo' | 'Custom'
  zenithAngle: number
  requiredImages: number
  heightMeasurement: boolean
  multipleAngles: boolean
  skyConditions: string[] // ['clear', 'partly_cloudy', 'overcast']
}

export interface HorizontalProtocolConfig {
  directions: Direction[]
  heightPoints: number[]
  cameraHeight: number
  photoDistance: number
  layerAnalysis: boolean
  densityMeasurement: boolean
}

export interface GroundProtocolConfig {
  method: 'daubenmire' | 'point_intercept' | 'line_intercept'
  quadratSize: number
  speciesIdentification: boolean
  coverageClasses: string[]
  diversityIndices: boolean
  soilAnalysis: boolean
}

export interface PhotoRequirements {
  minResolution: { width: number; height: number }
  maxFileSize: number // MB
  requiredDirections: Direction[]
  geotagging: boolean
  timeStamping: boolean
}

export interface ValidationRules {
  minGpsAccuracy: number
  requiredFields: string[]
  valueRanges: Record<string, { min: number; max: number }>
  crossValidation: string[] // field relationships to validate
}

// Protocol progress tracking
export interface ProtocolProgress {
  protocolId: string
  sessionId: string
  totalPoints: number
  completedPoints: number
  currentPoint: number
  completedTools: string[]
  requiredTools: string[]
  startTime: Date
  estimatedCompletion?: Date
  issues: ProtocolIssue[]
}

export interface ProtocolIssue {
  pointIndex: number
  toolType: string
  issueType: 'gps_accuracy' | 'photo_quality' | 'missing_data' | 'validation_failed'
  description: string
  severity: 'warning' | 'error'
  resolved: boolean
  timestamp: Date
}

// Measurement interfaces
export interface MeasurementRecord extends BaseRecord {
  sessionId: string
  siteId: string
  measurementType: MeasurementType
  measurementName: string
  timestamp: Date
  latitude?: number
  longitude?: number
  altitude?: number
  gpsAccuracy?: number
  
  // Common fields
  imageUrl?: string
  analysisMethod?: string
  processingTime?: number
  pixelsAnalyzed?: number
  
  // Canopy-specific fields
  canopyCover?: number
  lightTransmission?: number
  leafAreaIndex?: number
  zenithAngle?: number
  canopyHeight?: number
  
  // Ground cover fields
  totalCoverage?: number
  speciesDiversity?: number
  bareGroundPercentage?: number
  litterPercentage?: number
  rockPercentage?: number
  shannonIndex?: number
  evennessIndex?: number
  dominantSpecies?: string // JSON string array
  quadratSize?: number
  
  // Horizontal vegetation fields
  vegetationDensity?: number
  averageHeight?: number
  maxHeight?: number
  minHeight?: number
  vegetationLayers?: string // JSON string
  obstructionPercentage?: number
  
  // Analysis data
  rawData?: string // JSON string
  metadata?: string // JSON string
  notes?: string
}

export interface CreateMeasurementData {
  sessionId: string
  siteId: string
  measurementType: MeasurementType
  measurementName: string
  timestamp?: Date
  latitude?: number
  longitude?: number
  altitude?: number
  gpsAccuracy?: number
  imageUrl?: string
  analysisMethod?: string
  notes?: string
}

// Canopy measurement data
export interface CanopyMeasurementData extends CreateMeasurementData {
  measurementType: 'canopy'
  canopyCover?: number
  lightTransmission?: number
  leafAreaIndex?: number
  zenithAngle?: number
  canopyHeight?: number
  processingTime?: number
  pixelsAnalyzed?: number
  rawData?: any
  metadata?: any
}

// Ground cover measurement data
export interface GroundMeasurementData extends CreateMeasurementData {
  measurementType: 'ground'
  totalCoverage?: number
  speciesDiversity?: number
  bareGroundPercentage?: number
  litterPercentage?: number
  rockPercentage?: number
  shannonIndex?: number
  evennessIndex?: number
  dominantSpecies?: string[]
  quadratSize?: number
  rawData?: any
  metadata?: any
}

// Horizontal vegetation measurement data
export interface HorizontalMeasurementData extends CreateMeasurementData {
  measurementType: 'horizontal'
  vegetationDensity?: number
  averageHeight?: number
  maxHeight?: number
  minHeight?: number
  vegetationLayers?: any
  obstructionPercentage?: number
  rawData?: any
  metadata?: any
}

// Photo interfaces
export interface PhotoRecord extends BaseRecord {
  measurementId: string
  sessionId: string
  siteId: string
  photoType: PhotoType
  direction?: Direction
  filePath: string
  originalFilename: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  timestamp: Date
  latitude?: number
  longitude?: number
  altitude?: number
  compassBearing?: number
  cameraHeight?: number
  notes?: string
  uploadStatus: UploadStatus
}

export interface CreatePhotoData {
  measurementId: string
  sessionId: string
  siteId: string
  photoType: PhotoType
  direction?: Direction
  filePath: string
  originalFilename: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  timestamp?: Date
  latitude?: number
  longitude?: number
  altitude?: number
  compassBearing?: number
  cameraHeight?: number
  notes?: string
}

// Weather data interfaces
export interface WeatherDataRecord extends BaseRecord {
  sessionId: string
  measurementId?: string
  timestamp: Date
  temperature?: number
  humidity?: number
  windSpeed?: number
  windDirection?: number
  pressure?: number
  cloudCover?: CloudCover
  precipitation?: Precipitation
  visibility?: number
  uvIndex?: number
  lightIntensity?: number
  dataSource: DataSource
  notes?: string
}

export interface CreateWeatherData {
  sessionId: string
  measurementId?: string
  timestamp?: Date
  temperature?: number
  humidity?: number
  windSpeed?: number
  windDirection?: number
  pressure?: number
  cloudCover?: CloudCover
  precipitation?: Precipitation
  visibility?: number
  uvIndex?: number
  lightIntensity?: number
  dataSource: DataSource
  notes?: string
}

// Sync interfaces
export interface SyncLogRecord extends BaseRecord {
  tableName: string
  recordId: string
  operation: 'create' | 'update' | 'delete'
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  errorMessage?: string
  retryCount: number
  lastAttemptAt?: Date
}

export interface SyncOperation {
  id: string
  tableName: string
  recordId: string
  operation: 'create' | 'update' | 'delete'
  data?: any
  timestamp: Date
  retryCount: number
}

export interface SyncConflict {
  id: string
  tableName: string
  recordId: string
  localData: any
  serverData: any
  conflictedFields: string[]
  timestamp: Date
}

// API Response interfaces
export interface SyncStatus {
  isOnline: boolean
  lastSyncAt?: Date
  pendingOperations: number
  conflicts: number
  errors: number
  inProgress: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface SyncResponse {
  success: boolean
  syncedRecords: number
  conflicts: SyncConflict[]
  errors: string[]
  timestamp: Date
}

// Database query interfaces
export interface QueryOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface DatabaseStats {
  projects: number
  sites: number
  sessions: number
  measurements: number
  photos: number
  weatherData: number
  pendingSync: number
  conflicts: number
  lastSync?: Date
}

// Utility types
export type PartialRecord<T> = Partial<T> & { id?: string }
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'lastSyncAt' | 'serverId' | 'version'> 