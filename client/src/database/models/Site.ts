import { field, relation, children } from '@nozbe/watermelondb/decorators'
import { Collection, Relation } from '@nozbe/watermelondb'
import BaseModel from './Base'
import Project from './Project'
import Session from './Session'
import Measurement from './Measurement'

export default class Site extends BaseModel {
  static table = 'sites'
  static associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    sessions: { type: 'has_many', foreignKey: 'site_id' },
    measurements: { type: 'has_many', foreignKey: 'site_id' },
  }

  @field('project_id') projectId!: string
  @field('name') name!: string
  @field('description') description?: string
  @field('latitude') latitude!: number
  @field('longitude') longitude!: number
  @field('altitude') altitude?: number
  @field('ecosystem_type') ecosystemType?: string
  @field('vegetation_type') vegetationType?: string
  @field('site_photo_url') sitePhotoUrl?: string
  @field('access_notes') accessNotes?: string

  @relation('projects', 'project_id') project!: Relation<Project>
  @children('sessions') sessions!: Collection<Session>
  @children('measurements') measurements!: Collection<Measurement>

  // Computed properties
  get coordinates(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude
    }
  }

  get hasElevation(): boolean {
    return this.altitude !== undefined && this.altitude !== null
  }

  get locationString(): string {
    return `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`
  }

  // Business logic methods
  async addSession(sessionData: Partial<Session>): Promise<Session> {
    const session = await this.collections.get<Session>('sessions').create(record => {
      record.siteId = this.id
      record.projectId = this.projectId
      record.sessionName = sessionData.sessionName || 'New Session'
      record.researcherName = sessionData.researcherName || 'Unknown'
      record.startTime = new Date()
      record.status = 'active'
      record.syncStatus = 'pending'
      record.version = 1
    })
    return session
  }

  async addMeasurement(measurementData: Partial<Measurement>): Promise<Measurement> {
    const measurement = await this.collections.get<Measurement>('measurements').create(record => {
      record.siteId = this.id
      record.sessionId = measurementData.sessionId || ''
      record.measurementType = measurementData.measurementType || 'canopy'
      record.measurementName = measurementData.measurementName || 'New Measurement'
      record.timestamp = new Date()
      record.latitude = this.latitude
      record.longitude = this.longitude
      record.altitude = this.altitude
      record.syncStatus = 'pending'
      record.version = 1
    })
    return measurement
  }

  // Calculate distance to another site in meters
  distanceTo(otherSite: Site): number {
    const R = 6371000 // Earth's radius in meters
    const φ1 = this.latitude * Math.PI / 180
    const φ2 = otherSite.latitude * Math.PI / 180
    const Δφ = (otherSite.latitude - this.latitude) * Math.PI / 180
    const Δλ = (otherSite.longitude - this.longitude) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  // Calculate bearing to another site in degrees
  bearingTo(otherSite: Site): number {
    const φ1 = this.latitude * Math.PI / 180
    const φ2 = otherSite.latitude * Math.PI / 180
    const Δλ = (otherSite.longitude - this.longitude) * Math.PI / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    const θ = Math.atan2(y, x)
    return (θ * 180 / Math.PI + 360) % 360
  }

  // Check if coordinates are within a certain radius (in meters)
  isWithinRadius(latitude: number, longitude: number, radius: number): boolean {
    const tempSite = { latitude, longitude } as Site
    return this.distanceTo(tempSite) <= radius
  }

  // Update location
  async updateLocation(latitude: number, longitude: number, altitude?: number): Promise<void> {
    await this.update(record => {
      record.latitude = latitude
      record.longitude = longitude
      if (altitude !== undefined) {
        record.altitude = altitude
      }
    })
    await this.markAsPending()
  }
} 