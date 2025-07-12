import { field, date, relation, children, json } from '@nozbe/watermelondb/decorators'
import { Collection, Relation } from '@nozbe/watermelondb'
import BaseModel from './Base'
import Site from './Site'
import Session from './Session'
import Photo from './Photo'

export type MeasurementType = 'canopy' | 'horizontal' | 'ground'

export default class Measurement extends BaseModel {
  static table = 'measurements'
  static associations = {
    site: { type: 'belongs_to', key: 'site_id' },
    session: { type: 'belongs_to', key: 'session_id' },
    photos: { type: 'has_many', foreignKey: 'measurement_id' },
  }

  @field('session_id') sessionId!: string
  @field('site_id') siteId!: string
  @field('measurement_type') measurementType!: MeasurementType
  @field('measurement_name') measurementName!: string
  @date('timestamp') timestamp!: Date
  @field('latitude') latitude?: number
  @field('longitude') longitude?: number
  @field('altitude') altitude?: number
  @field('gps_accuracy') gpsAccuracy?: number

  // Common fields
  @field('image_url') imageUrl?: string
  @field('analysis_method') analysisMethod?: string
  @field('processing_time') processingTime?: number
  @field('pixels_analyzed') pixelsAnalyzed?: number

  // Canopy-specific fields
  @field('canopy_cover') canopyCover?: number
  @field('light_transmission') lightTransmission?: number
  @field('leaf_area_index') leafAreaIndex?: number
  @field('zenith_angle') zenithAngle?: number
  @field('canopy_height') canopyHeight?: number

  // Ground cover fields
  @field('total_coverage') totalCoverage?: number
  @field('species_diversity') speciesDiversity?: number
  @field('bare_ground_percentage') bareGroundPercentage?: number
  @field('litter_percentage') litterPercentage?: number
  @field('rock_percentage') rockPercentage?: number
  @field('shannon_index') shannonIndex?: number
  @field('evenness_index') evennessIndex?: number
  @field('dominant_species') dominantSpecies?: string // JSON string
  @field('quadrat_size') quadratSize?: number

  // Horizontal vegetation fields
  @field('vegetation_density') vegetationDensity?: number
  @field('average_height') averageHeight?: number
  @field('max_height') maxHeight?: number
  @field('min_height') minHeight?: number
  @field('vegetation_layers') vegetationLayers?: string // JSON string
  @field('obstruction_percentage') obstructionPercentage?: number

  // Analysis data
  @field('raw_data') rawData?: string // JSON string
  @field('metadata') metadata?: string // JSON string
  @field('notes') notes?: string

  @relation('sites', 'site_id') site!: Relation<Site>
  @relation('sessions', 'session_id') session!: Relation<Session>
  @children('photos') photos!: Collection<Photo>

  // Computed properties
  get isCanopyMeasurement(): boolean {
    return this.measurementType === 'canopy'
  }

  get isGroundMeasurement(): boolean {
    return this.measurementType === 'ground'
  }

  get isHorizontalMeasurement(): boolean {
    return this.measurementType === 'horizontal'
  }

  get hasGpsData(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined
  }

  get hasImage(): boolean {
    return this.imageUrl !== undefined && this.imageUrl !== ''
  }

  get parsedDominantSpecies(): string[] {
    if (!this.dominantSpecies) return []
    try {
      return JSON.parse(this.dominantSpecies)
    } catch {
      return []
    }
  }

  get parsedVegetationLayers(): any {
    if (!this.vegetationLayers) return null
    try {
      return JSON.parse(this.vegetationLayers)
    } catch {
      return null
    }
  }

  get parsedRawData(): any {
    if (!this.rawData) return null
    try {
      return JSON.parse(this.rawData)
    } catch {
      return null
    }
  }

  get parsedMetadata(): any {
    if (!this.metadata) return null
    try {
      return JSON.parse(this.metadata)
    } catch {
      return null
    }
  }

  // Business logic methods
  async updateCanopyData(data: {
    canopyCover: number
    lightTransmission: number
    leafAreaIndex?: number
    zenithAngle?: number
    canopyHeight?: number
    processingTime?: number
    pixelsAnalyzed?: number
    rawData?: any
    metadata?: any
  }): Promise<void> {
    await this.update(record => {
      record.canopyCover = data.canopyCover
      record.lightTransmission = data.lightTransmission
      record.leafAreaIndex = data.leafAreaIndex
      record.zenithAngle = data.zenithAngle
      record.canopyHeight = data.canopyHeight
      record.processingTime = data.processingTime
      record.pixelsAnalyzed = data.pixelsAnalyzed
      if (data.rawData) {
        record.rawData = JSON.stringify(data.rawData)
      }
      if (data.metadata) {
        record.metadata = JSON.stringify(data.metadata)
      }
    })
    await this.markAsPending()
  }

  async updateGroundData(data: {
    totalCoverage: number
    speciesDiversity: number
    bareGroundPercentage?: number
    litterPercentage?: number
    rockPercentage?: number
    shannonIndex?: number
    evennessIndex?: number
    dominantSpecies?: string[]
    quadratSize?: number
    rawData?: any
    metadata?: any
  }): Promise<void> {
    await this.update(record => {
      record.totalCoverage = data.totalCoverage
      record.speciesDiversity = data.speciesDiversity
      record.bareGroundPercentage = data.bareGroundPercentage
      record.litterPercentage = data.litterPercentage
      record.rockPercentage = data.rockPercentage
      record.shannonIndex = data.shannonIndex
      record.evennessIndex = data.evennessIndex
      record.quadratSize = data.quadratSize
      if (data.dominantSpecies) {
        record.dominantSpecies = JSON.stringify(data.dominantSpecies)
      }
      if (data.rawData) {
        record.rawData = JSON.stringify(data.rawData)
      }
      if (data.metadata) {
        record.metadata = JSON.stringify(data.metadata)
      }
    })
    await this.markAsPending()
  }

  async updateHorizontalData(data: {
    vegetationDensity: number
    averageHeight: number
    maxHeight?: number
    minHeight?: number
    vegetationLayers?: any
    obstructionPercentage?: number
    rawData?: any
    metadata?: any
  }): Promise<void> {
    await this.update(record => {
      record.vegetationDensity = data.vegetationDensity
      record.averageHeight = data.averageHeight
      record.maxHeight = data.maxHeight
      record.minHeight = data.minHeight
      record.obstructionPercentage = data.obstructionPercentage
      if (data.vegetationLayers) {
        record.vegetationLayers = JSON.stringify(data.vegetationLayers)
      }
      if (data.rawData) {
        record.rawData = JSON.stringify(data.rawData)
      }
      if (data.metadata) {
        record.metadata = JSON.stringify(data.metadata)
      }
    })
    await this.markAsPending()
  }

  async addPhoto(photoData: {
    filePath: string
    originalFilename: string
    fileSize: number
    mimeType: string
    width?: number
    height?: number
    direction?: string
    notes?: string
  }): Promise<Photo> {
    const photo = await this.collections.get<Photo>('photos').create(record => {
      record.measurementId = this.id
      record.sessionId = this.sessionId
      record.siteId = this.siteId
      record.photoType = 'measurement'
      record.filePath = photoData.filePath
      record.originalFilename = photoData.originalFilename
      record.fileSize = photoData.fileSize
      record.mimeType = photoData.mimeType
      record.width = photoData.width
      record.height = photoData.height
      record.timestamp = new Date()
      record.latitude = this.latitude
      record.longitude = this.longitude
      record.altitude = this.altitude
      record.direction = photoData.direction
      record.notes = photoData.notes || ''
      record.uploadStatus = 'pending'
      record.syncStatus = 'pending'
      record.version = 1
    })
    return photo
  }

  async updateLocation(latitude: number, longitude: number, altitude?: number, gpsAccuracy?: number): Promise<void> {
    await this.update(record => {
      record.latitude = latitude
      record.longitude = longitude
      record.altitude = altitude
      record.gpsAccuracy = gpsAccuracy
    })
    await this.markAsPending()
  }

  async addNotes(notes: string): Promise<void> {
    await this.update(record => {
      record.notes = notes
    })
    await this.markAsPending()
  }

  // Calculate measurement quality score (0-100)
  get qualityScore(): number {
    let score = 0
    let maxScore = 0

    // GPS accuracy
    if (this.hasGpsData) {
      score += 20
      if (this.gpsAccuracy && this.gpsAccuracy < 5) {
        score += 10
      }
    }
    maxScore += 30

    // Image quality
    if (this.hasImage) {
      score += 15
      if (this.pixelsAnalyzed && this.pixelsAnalyzed > 100000) {
        score += 10
      }
    }
    maxScore += 25

    // Analysis completeness
    if (this.isCanopyMeasurement) {
      if (this.canopyCover !== undefined) score += 15
      if (this.lightTransmission !== undefined) score += 15
      if (this.leafAreaIndex !== undefined) score += 10
      maxScore += 40
    } else if (this.isGroundMeasurement) {
      if (this.totalCoverage !== undefined) score += 15
      if (this.speciesDiversity !== undefined) score += 15
      if (this.shannonIndex !== undefined) score += 10
      maxScore += 40
    } else if (this.isHorizontalMeasurement) {
      if (this.vegetationDensity !== undefined) score += 15
      if (this.averageHeight !== undefined) score += 15
      if (this.obstructionPercentage !== undefined) score += 10
      maxScore += 40
    }

    // Notes and metadata
    if (this.notes && this.notes.length > 10) score += 5
    maxScore += 5

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  }
} 