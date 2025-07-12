import { field, date } from '@nozbe/watermelondb/decorators'
import BaseModel from './Base'

export default class SyncLog extends BaseModel {
  static table = 'sync_log'
  static associations = {}

  @field('table_name') tableName!: string
  @field('record_id') recordId!: string
  @field('operation') operation!: 'create' | 'update' | 'delete'
  @field('sync_status') syncStatus!: 'pending' | 'syncing' | 'synced' | 'failed'
  @field('error_message') errorMessage?: string
  @field('retry_count') retryCount!: number
  @date('last_attempt_at') lastAttemptAt?: Date

  // Increment retry count
  async incrementRetryCount(): Promise<void> {
    await this.update(record => {
      record.retryCount += 1
      record.lastAttemptAt = new Date()
    })
  }

  // Mark as synced
  async markAsSynced(): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'synced'
      record.lastAttemptAt = new Date()
    })
  }

  // Mark as failed
  async markAsFailed(error?: string): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'failed'
      record.errorMessage = error
      record.lastAttemptAt = new Date()
    })
  }

  // Mark as pending
  async markAsPending(): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'pending'
      record.lastAttemptAt = new Date()
    })
  }

  // Mark as syncing
  async markAsSyncing(): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'syncing'
      record.lastAttemptAt = new Date()
    })
  }

  // Reset retry count
  async resetRetryCount(): Promise<void> {
    await this.update(record => {
      record.retryCount = 0
    })
  }

  // Check if should retry
  get shouldRetry(): boolean {
    return this.retryCount < 3 && this.syncStatus === 'failed'
  }

  // Get age in hours
  get ageHours(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60))
  }
} 