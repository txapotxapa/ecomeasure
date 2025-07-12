import { field, children } from '@nozbe/watermelondb/decorators'
import { Collection } from '@nozbe/watermelondb'
import BaseModel from './Base'
import Session from './Session'
import { 
  ProtocolCategory, 
  EcosystemType, 
  SamplingPattern, 
  DifficultyLevel,
  CanopyProtocolConfig,
  HorizontalProtocolConfig,
  GroundProtocolConfig,
  PhotoRequirements,
  ValidationRules
} from '../types'

export default class ProtocolTemplate extends BaseModel {
  static table = 'protocol_templates'
  static associations = {
    sessions: { type: 'has_many', foreignKey: 'protocol_id' },
  }

  @field('name') name!: string
  @field('description') description?: string
  @field('category') category!: ProtocolCategory
  @field('ecosystem_type') ecosystemType?: EcosystemType
  @field('created_by') createdBy!: string
  @field('is_public') isPublic!: boolean
  @field('is_preset') isPreset!: boolean

  // Sampling design
  @field('sampling_pattern') samplingPattern!: SamplingPattern
  @field('number_of_points') numberOfPoints!: number
  @field('point_spacing') pointSpacing?: number
  @field('transect_length') transectLength?: number
  @field('transect_count') transectCount?: number
  @field('plot_size') plotSize?: number

  // Tool configuration
  @field('tools_enabled') toolsEnabled!: string // JSON array
  @field('canopy_config') canopyConfig?: string // JSON config
  @field('horizontal_config') horizontalConfig?: string // JSON config
  @field('ground_config') groundConfig?: string // JSON config

  // Data collection requirements
  @field('required_photos') requiredPhotos?: string // JSON array
  @field('required_measurements') requiredMeasurements?: string // JSON array
  @field('weather_recording') weatherRecording!: boolean
  @field('gps_required') gpsRequired!: boolean
  @field('notes_template') notesTemplate?: string

  // Quality control
  @field('min_gps_accuracy') minGpsAccuracy?: number
  @field('photo_requirements') photoRequirements?: string // JSON config
  @field('validation_rules') validationRules?: string // JSON config

  // Metadata
  @field('tags') tags?: string // JSON array
  @field('instructions') instructions?: string
  @field('estimated_time') estimatedTime?: number
  @field('difficulty_level') difficultyLevel?: DifficultyLevel

  @children('sessions') sessions!: Collection<Session>

  // Computed properties with JSON parsing
  get parsedToolsEnabled(): string[] {
    try {
      return JSON.parse(this.toolsEnabled)
    } catch {
      return []
    }
  }

  get parsedCanopyConfig(): CanopyProtocolConfig | null {
    if (!this.canopyConfig) return null
    try {
      return JSON.parse(this.canopyConfig)
    } catch {
      return null
    }
  }

  get parsedHorizontalConfig(): HorizontalProtocolConfig | null {
    if (!this.horizontalConfig) return null
    try {
      return JSON.parse(this.horizontalConfig)
    } catch {
      return null
    }
  }

  get parsedGroundConfig(): GroundProtocolConfig | null {
    if (!this.groundConfig) return null
    try {
      return JSON.parse(this.groundConfig)
    } catch {
      return null
    }
  }

  get parsedRequiredPhotos(): string[] {
    if (!this.requiredPhotos) return []
    try {
      return JSON.parse(this.requiredPhotos)
    } catch {
      return []
    }
  }

  get parsedRequiredMeasurements(): string[] {
    if (!this.requiredMeasurements) return []
    try {
      return JSON.parse(this.requiredMeasurements)
    } catch {
      return []
    }
  }

  get parsedPhotoRequirements(): PhotoRequirements | null {
    if (!this.photoRequirements) return null
    try {
      return JSON.parse(this.photoRequirements)
    } catch {
      return null
    }
  }

  get parsedValidationRules(): ValidationRules | null {
    if (!this.validationRules) return null
    try {
      return JSON.parse(this.validationRules)
    } catch {
      return null
    }
  }

  get parsedTags(): string[] {
    if (!this.tags) return []
    try {
      return JSON.parse(this.tags)
    } catch {
      return []
    }
  }

  // Computed properties
  get isCanopyEnabled(): boolean {
    return this.parsedToolsEnabled.includes('canopy')
  }

  get isHorizontalEnabled(): boolean {
    return this.parsedToolsEnabled.includes('horizontal')
  }

  get isGroundEnabled(): boolean {
    return this.parsedToolsEnabled.includes('ground')
  }

  get toolCount(): number {
    return this.parsedToolsEnabled.length
  }

  get estimatedTimeHours(): number {
    return this.estimatedTime ? this.estimatedTime / 60 : 0
  }

  get isQuickSurvey(): boolean {
    return (this.estimatedTime || 0) <= 30 && this.numberOfPoints <= 5
  }

  get complexityScore(): number {
    let score = 0
    
    // Points and area
    if (this.numberOfPoints > 20) score += 2
    else if (this.numberOfPoints > 10) score += 1
    
    // Tools
    score += this.toolCount
    
    // Sampling pattern complexity
    if (this.samplingPattern === 'systematic' || this.samplingPattern === 'grid') score += 1
    else if (this.samplingPattern === 'random') score += 2
    
    // Quality requirements
    if (this.minGpsAccuracy && this.minGpsAccuracy < 5) score += 1
    if (this.parsedPhotoRequirements?.minResolution) score += 1
    
    return score
  }

  // Business logic methods
  async updateToolConfiguration(
    toolType: 'canopy' | 'horizontal' | 'ground',
    config: CanopyProtocolConfig | HorizontalProtocolConfig | GroundProtocolConfig
  ): Promise<void> {
    await this.update(record => {
      if (toolType === 'canopy') {
        record.canopyConfig = JSON.stringify(config)
      } else if (toolType === 'horizontal') {
        record.horizontalConfig = JSON.stringify(config)
      } else if (toolType === 'ground') {
        record.groundConfig = JSON.stringify(config)
      }
    })
    await this.markAsPending()
  }

  async enableTool(toolType: string): Promise<void> {
    const tools = this.parsedToolsEnabled
    if (!tools.includes(toolType)) {
      tools.push(toolType)
      await this.update(record => {
        record.toolsEnabled = JSON.stringify(tools)
      })
      await this.markAsPending()
    }
  }

  async disableTool(toolType: string): Promise<void> {
    const tools = this.parsedToolsEnabled.filter(t => t !== toolType)
    await this.update(record => {
      record.toolsEnabled = JSON.stringify(tools)
    })
    await this.markAsPending()
  }

  async addTag(tag: string): Promise<void> {
    const tags = this.parsedTags
    if (!tags.includes(tag)) {
      tags.push(tag)
      await this.update(record => {
        record.tags = JSON.stringify(tags)
      })
      await this.markAsPending()
    }
  }

  async removeTag(tag: string): Promise<void> {
    const tags = this.parsedTags.filter(t => t !== tag)
    await this.update(record => {
      record.tags = JSON.stringify(tags)
    })
    await this.markAsPending()
  }

  async updateSamplingDesign(design: {
    samplingPattern?: SamplingPattern
    numberOfPoints?: number
    pointSpacing?: number
    transectLength?: number
    transectCount?: number
    plotSize?: number
  }): Promise<void> {
    await this.update(record => {
      if (design.samplingPattern) record.samplingPattern = design.samplingPattern
      if (design.numberOfPoints) record.numberOfPoints = design.numberOfPoints
      if (design.pointSpacing !== undefined) record.pointSpacing = design.pointSpacing
      if (design.transectLength !== undefined) record.transectLength = design.transectLength
      if (design.transectCount !== undefined) record.transectCount = design.transectCount
      if (design.plotSize !== undefined) record.plotSize = design.plotSize
    })
    await this.markAsPending()
  }

  async updateQualityControl(qc: {
    minGpsAccuracy?: number
    photoRequirements?: PhotoRequirements
    validationRules?: ValidationRules
  }): Promise<void> {
    await this.update(record => {
      if (qc.minGpsAccuracy !== undefined) record.minGpsAccuracy = qc.minGpsAccuracy
      if (qc.photoRequirements) record.photoRequirements = JSON.stringify(qc.photoRequirements)
      if (qc.validationRules) record.validationRules = JSON.stringify(qc.validationRules)
    })
    await this.markAsPending()
  }

  async duplicate(newName: string, createdBy: string): Promise<ProtocolTemplate> {
    const duplicate = await this.collections.get<ProtocolTemplate>('protocol_templates').create(record => {
      record.name = newName
      record.description = `Copy of ${this.name}`
      record.category = 'custom'
      record.ecosystemType = this.ecosystemType
      record.createdBy = createdBy
      record.isPublic = false
      record.isPreset = false
      
      // Copy sampling design
      record.samplingPattern = this.samplingPattern
      record.numberOfPoints = this.numberOfPoints
      record.pointSpacing = this.pointSpacing
      record.transectLength = this.transectLength
      record.transectCount = this.transectCount
      record.plotSize = this.plotSize
      
      // Copy tool configuration
      record.toolsEnabled = this.toolsEnabled
      record.canopyConfig = this.canopyConfig
      record.horizontalConfig = this.horizontalConfig
      record.groundConfig = this.groundConfig
      
      // Copy requirements
      record.requiredPhotos = this.requiredPhotos
      record.requiredMeasurements = this.requiredMeasurements
      record.weatherRecording = this.weatherRecording
      record.gpsRequired = this.gpsRequired
      record.notesTemplate = this.notesTemplate
      
      // Copy quality control
      record.minGpsAccuracy = this.minGpsAccuracy
      record.photoRequirements = this.photoRequirements
      record.validationRules = this.validationRules
      
      // Copy metadata
      record.tags = this.tags
      record.instructions = this.instructions
      record.estimatedTime = this.estimatedTime
      record.difficultyLevel = this.difficultyLevel
      
      record.syncStatus = 'pending'
      record.version = 1
    })
    
    return duplicate
  }

  // Validation methods
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Protocol name is required')
    }

    if (this.numberOfPoints <= 0) {
      errors.push('Number of points must be greater than 0')
    }

    if (this.parsedToolsEnabled.length === 0) {
      errors.push('At least one measurement tool must be enabled')
    }

    if (this.samplingPattern === 'grid' && !this.pointSpacing) {
      errors.push('Point spacing is required for grid sampling pattern')
    }

    if (this.samplingPattern === 'transect' && (!this.transectLength || !this.transectCount)) {
      errors.push('Transect length and count are required for transect sampling')
    }

    if (this.estimatedTime && this.estimatedTime < 5) {
      errors.push('Estimated time should be at least 5 minutes')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Static methods for creating preset templates
  static async createForestInventoryPreset(database: any): Promise<ProtocolTemplate> {
    return await database.get('protocol_templates').create((record: any) => {
      record.name = 'Forest Inventory'
      record.description = 'Comprehensive forest structure and composition assessment'
      record.category = 'preset'
      record.ecosystemType = 'forest'
      record.createdBy = 'system'
      record.isPublic = true
      record.isPreset = true
      
      record.samplingPattern = 'systematic'
      record.numberOfPoints = 25
      record.pointSpacing = 20
      record.plotSize = 400 // 20m x 20m plots
      
      record.toolsEnabled = JSON.stringify(['canopy', 'horizontal', 'ground'])
      record.canopyConfig = JSON.stringify({
        analysisMethod: 'GLAMA',
        zenithAngle: 90,
        requiredImages: 1,
        heightMeasurement: true,
        multipleAngles: false,
        skyConditions: ['clear', 'partly_cloudy']
      })
      record.horizontalConfig = JSON.stringify({
        directions: ['north', 'south', 'east', 'west'],
        heightPoints: [50, 100, 150, 200],
        cameraHeight: 150,
        photoDistance: 10,
        layerAnalysis: true,
        densityMeasurement: true
      })
      record.groundConfig = JSON.stringify({
        method: 'daubenmire',
        quadratSize: 20,
        speciesIdentification: true,
        coverageClasses: ['<1%', '1-5%', '5-25%', '25-50%', '50-75%', '75-95%', '>95%'],
        diversityIndices: true,
        soilAnalysis: false
      })
      
      record.requiredPhotos = JSON.stringify(['up', 'north', 'south', 'east', 'west', 'down'])
      record.requiredMeasurements = JSON.stringify(['canopy_cover', 'species_diversity', 'vegetation_layers'])
      record.weatherRecording = true
      record.gpsRequired = true
      record.notesTemplate = 'Forest conditions:\nDominant species:\nDisturbance indicators:\nSoil notes:'
      
      record.minGpsAccuracy = 3
      record.photoRequirements = JSON.stringify({
        minResolution: { width: 1920, height: 1080 },
        maxFileSize: 5,
        requiredDirections: ['up', 'north', 'south', 'east', 'west'],
        geotagging: true,
        timeStamping: true
      })
      record.validationRules = JSON.stringify({
        minGpsAccuracy: 3,
        requiredFields: ['canopy_cover', 'species_diversity'],
        valueRanges: {
          canopy_cover: { min: 0, max: 100 },
          vegetation_density: { min: 0, max: 100 }
        },
        crossValidation: ['canopy_cover_light_transmission']
      })
      
      record.tags = JSON.stringify(['forest', 'comprehensive', 'biodiversity', 'structure'])
      record.instructions = 'Complete forest inventory protocol for detailed ecosystem assessment. Measure canopy structure, ground vegetation, and horizontal density at each plot center.'
      record.estimatedTime = 45
      record.difficultyLevel = 'intermediate'
      
      record.syncStatus = 'synced'
      record.version = 1
    })
  }

  static async createGrasslandAssessmentPreset(database: any): Promise<ProtocolTemplate> {
    return await database.get('protocol_templates').create((record: any) => {
      record.name = 'Grassland Assessment'
      record.description = 'Grassland and prairie ecosystem monitoring protocol'
      record.category = 'preset'
      record.ecosystemType = 'grassland'
      record.createdBy = 'system'
      record.isPublic = true
      record.isPreset = true
      
      record.samplingPattern = 'point_intercept'
      record.numberOfPoints = 50
      record.pointSpacing = 5
      record.plotSize = 25 // 5m x 5m plots
      
      record.toolsEnabled = JSON.stringify(['ground', 'horizontal'])
      record.horizontalConfig = JSON.stringify({
        directions: ['north', 'south'],
        heightPoints: [25, 50, 75, 100],
        cameraHeight: 100,
        photoDistance: 5,
        layerAnalysis: false,
        densityMeasurement: true
      })
      record.groundConfig = JSON.stringify({
        method: 'point_intercept',
        quadratSize: 5,
        speciesIdentification: true,
        coverageClasses: ['0%', '1-25%', '25-50%', '50-75%', '75-100%'],
        diversityIndices: true,
        soilAnalysis: true
      })
      
      record.requiredPhotos = JSON.stringify(['down', 'north', 'south'])
      record.requiredMeasurements = JSON.stringify(['ground_cover', 'species_diversity', 'grass_height'])
      record.weatherRecording = true
      record.gpsRequired = true
      record.notesTemplate = 'Grassland conditions:\nDominant grasses:\nForb species:\nDisturbance signs:\nSoil type:'
      
      record.minGpsAccuracy = 2
      record.photoRequirements = JSON.stringify({
        minResolution: { width: 1280, height: 720 },
        maxFileSize: 3,
        requiredDirections: ['down', 'north', 'south'],
        geotagging: true,
        timeStamping: true
      })
      record.validationRules = JSON.stringify({
        minGpsAccuracy: 2,
        requiredFields: ['ground_cover', 'species_diversity'],
        valueRanges: {
          ground_cover: { min: 0, max: 100 }
        },
        crossValidation: []
      })
      
      record.tags = JSON.stringify(['grassland', 'prairie', 'ground_cover', 'biodiversity'])
      record.instructions = 'Systematic grassland assessment focusing on species composition and coverage. Use point-intercept method for accurate ground cover measurements.'
      record.estimatedTime = 25
      record.difficultyLevel = 'beginner'
      
      record.syncStatus = 'synced'
      record.version = 1
    })
  }

  static async createRiparianSurveyPreset(database: any): Promise<ProtocolTemplate> {
    return await database.get('protocol_templates').create((record: any) => {
      record.name = 'Riparian Survey'
      record.description = 'Riparian zone vegetation and habitat assessment'
      record.category = 'preset'
      record.ecosystemType = 'riparian'
      record.createdBy = 'system'
      record.isPublic = true
      record.isPreset = true
      
      record.samplingPattern = 'transect'
      record.numberOfPoints = 15
      record.transectLength = 100
      record.transectCount = 3
      record.pointSpacing = 10
      
      record.toolsEnabled = JSON.stringify(['canopy', 'horizontal', 'ground'])
      record.canopyConfig = JSON.stringify({
        analysisMethod: 'GLAMA',
        zenithAngle: 90,
        requiredImages: 1,
        heightMeasurement: true,
        multipleAngles: false,
        skyConditions: ['clear', 'partly_cloudy', 'overcast']
      })
      record.horizontalConfig = JSON.stringify({
        directions: ['toward_water', 'away_water', 'upstream', 'downstream'],
        heightPoints: [50, 100, 200, 300],
        cameraHeight: 150,
        photoDistance: 10,
        layerAnalysis: true,
        densityMeasurement: true
      })
      record.groundConfig = JSON.stringify({
        method: 'line_intercept',
        quadratSize: 10,
        speciesIdentification: true,
        coverageClasses: ['<5%', '5-25%', '25-50%', '50-75%', '>75%'],
        diversityIndices: true,
        soilAnalysis: true
      })
      
      record.requiredPhotos = JSON.stringify(['up', 'toward_water', 'away_water', 'upstream', 'downstream'])
      record.requiredMeasurements = JSON.stringify(['canopy_cover', 'species_diversity', 'water_proximity'])
      record.weatherRecording = true
      record.gpsRequired = true
      record.notesTemplate = 'Riparian conditions:\nDistance to water:\nWater level:\nBank stability:\nInvasive species:\nWildlife signs:'
      
      record.minGpsAccuracy = 2
      record.photoRequirements = JSON.stringify({
        minResolution: { width: 1920, height: 1080 },
        maxFileSize: 5,
        requiredDirections: ['toward_water', 'away_water'],
        geotagging: true,
        timeStamping: true
      })
      record.validationRules = JSON.stringify({
        minGpsAccuracy: 2,
        requiredFields: ['canopy_cover', 'species_diversity', 'water_proximity'],
        valueRanges: {
          canopy_cover: { min: 0, max: 100 },
          water_proximity: { min: 0, max: 100 }
        },
        crossValidation: ['water_proximity_vegetation_type']
      })
      
      record.tags = JSON.stringify(['riparian', 'water', 'transect', 'habitat'])
      record.instructions = 'Riparian zone assessment using transect method. Focus on vegetation gradients from water edge to upland transition. Document water proximity effects.'
      record.estimatedTime = 60
      record.difficultyLevel = 'advanced'
      
      record.syncStatus = 'synced'
      record.version = 1
    })
  }
} 