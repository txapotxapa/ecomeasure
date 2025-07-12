import { field, date, children } from '@nozbe/watermelondb/decorators'
import { Collection, Relation } from '@nozbe/watermelondb'
import BaseModel from './Base'
import Site from './Site'
import Session from './Session'

export type ProjectStatus = 'active' | 'completed' | 'paused'

export default class Project extends BaseModel {
  static table = 'projects'
  static associations = {
    sites: { type: 'has_many', foreignKey: 'project_id' },
    sessions: { type: 'has_many', foreignKey: 'project_id' },
  }

  @field('name') name!: string
  @field('description') description?: string
  @field('lead_researcher') leadResearcher!: string
  @field('organization') organization?: string
  @date('start_date') startDate!: Date
  @date('end_date') endDate?: Date
  @field('status') status!: ProjectStatus

  @children('sites') sites!: Collection<Site>
  @children('sessions') sessions!: Collection<Session>

  // Computed properties
  get isActive(): boolean {
    return this.status === 'active'
  }

  get isCompleted(): boolean {
    return this.status === 'completed'
  }

  get duration(): number {
    if (!this.endDate) return Date.now() - this.startDate.getTime()
    return this.endDate.getTime() - this.startDate.getTime()
  }

  // Business logic methods
  async addSite(siteData: Partial<Site>): Promise<Site> {
    const site = await this.collections.get<Site>('sites').create(record => {
      record.projectId = this.id
      record.name = siteData.name || 'New Site'
      record.latitude = siteData.latitude || 0
      record.longitude = siteData.longitude || 0
      record.syncStatus = 'pending'
      record.version = 1
    })
    return site
  }

  async startSession(sessionData: Partial<Session>): Promise<Session> {
    const session = await this.collections.get<Session>('sessions').create(record => {
      record.projectId = this.id
      record.siteId = sessionData.siteId || ''
      record.sessionName = sessionData.sessionName || 'New Session'
      record.researcherName = sessionData.researcherName || 'Unknown'
      record.startTime = new Date()
      record.status = 'active'
      record.syncStatus = 'pending'
      record.version = 1
    })
    return session
  }

  async complete(): Promise<void> {
    await this.update(record => {
      record.status = 'completed'
      record.endDate = new Date()
    })
    await this.markAsPending()
  }

  async pause(): Promise<void> {
    await this.update(record => {
      record.status = 'paused'
    })
    await this.markAsPending()
  }

  async resume(): Promise<void> {
    await this.update(record => {
      record.status = 'active'
    })
    await this.markAsPending()
  }
} 