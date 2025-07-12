import { field, date, relation, children } from '@nozbe/watermelondb/decorators'
import { Collection, Relation } from '@nozbe/watermelondb'
import BaseModel from './Base'
import { SessionStatus } from '../types'
import Project from './Project'
import Site from './Site'
import Measurement from './Measurement'
import Photo from './Photo'
import WeatherData from './WeatherData'

export default class Session extends BaseModel {
  static table = 'sessions'
  static associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    site: { type: 'belongs_to', key: 'site_id' },
    measurements: { type: 'has_many', foreignKey: 'session_id' },
    photos: { type: 'has_many', foreignKey: 'session_id' },
    weatherData: { type: 'has_many', foreignKey: 'session_id' },
  }

  @field('project_id') projectId!: string
  @field('site_id') siteId!: string
  @field('protocol_id') protocolId?: string
  @field('session_name') sessionName!: string
  @field('researcher_name') researcherName!: string
  @date('start_time') startTime!: Date
  @date('end_time') endTime?: Date
  @field('weather_conditions') weatherConditions?: string
  @field('notes') notes?: string
  @field('status') status!: SessionStatus
  @field('progress_data') progressData?: string

  @relation('projects', 'project_id') project!: Relation<Project>
  @relation('sites', 'site_id') site!: Relation<Site>
  @children('measurements') measurements!: Collection<Measurement>
  @children('photos') photos!: Collection<Photo>
  @children('weather_data') weatherData!: Collection<WeatherData>

  // Get session duration in minutes
  get duration(): number | null {
    if (!this.endTime) return null
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60))
  }

  // Get completion percentage
  get completionPercentage(): number {
    if (!this.progressData) return 0
    try {
      const progress = JSON.parse(this.progressData)
      return Math.floor((progress.completedPoints / progress.totalPoints) * 100)
    } catch {
      return 0
    }
  }

  // Complete session
  async complete(): Promise<void> {
    await this.update(record => {
      record.status = 'completed'
      record.endTime = new Date()
    })
  }

  // Abandon session
  async abandon(): Promise<void> {
    await this.update(record => {
      record.status = 'abandoned'
      record.endTime = new Date()
    })
  }

  // Update progress
  async updateProgress(progress: any): Promise<void> {
    await this.update(record => {
      record.progressData = JSON.stringify(progress)
    })
  }

  // Add measurement
  async addMeasurement(measurementData: any): Promise<Measurement> {
    const measurement = await this.collections.get<Measurement>('measurements').create(record => {
      record.sessionId = this.id
      record.siteId = this.siteId
      Object.assign(record, measurementData)
    })
    return measurement
  }

  // Add photo
  async addPhoto(photoData: any): Promise<Photo> {
    const photo = await this.collections.get<Photo>('photos').create(record => {
      record.sessionId = this.id
      record.siteId = this.siteId
      Object.assign(record, photoData)
    })
    return photo
  }

  // Add weather data
  async addWeatherData(weatherData: any): Promise<WeatherData> {
    const weather = await this.collections.get<WeatherData>('weather_data').create(record => {
      record.sessionId = this.id
      Object.assign(record, weatherData)
    })
    return weather
  }
} 