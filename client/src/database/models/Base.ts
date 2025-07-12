import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'failed'

export default class BaseModel extends Model {
  // Common sync fields for all models
  @field('sync_status') syncStatus!: SyncStatus
  @date('last_sync_at') lastSyncAt?: Date
  @field('server_id') serverId?: string
  @field('version') version!: number

  // Timestamps
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  // Helper methods for sync management
  async markAsPending(): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'pending'
      record.version += 1
    })
  }

  async markAsSynced(serverId?: string): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'synced'
      record.lastSyncAt = new Date()
      if (serverId) {
        record.serverId = serverId
      }
    })
  }

  async markAsConflict(): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'conflict'
    })
  }

  async markAsFailed(): Promise<void> {
    await this.update(record => {
      record.syncStatus = 'failed'
    })
  }

  // Check if record needs syncing
  get needsSync(): boolean {
    return this.syncStatus === 'pending' || this.syncStatus === 'failed'
  }

  // Check if record has conflicts
  get hasConflict(): boolean {
    return this.syncStatus === 'conflict'
  }

  // Get sync age in milliseconds
  get syncAge(): number {
    if (!this.lastSyncAt) return Infinity
    return Date.now() - this.lastSyncAt.getTime()
  }
} 