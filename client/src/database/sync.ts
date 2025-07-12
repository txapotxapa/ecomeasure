import { Database } from '@nozbe/watermelondb'
import { synchronize } from '@nozbe/watermelondb/sync'
import { SyncConflict, SyncOperation, SyncStatus, ApiResponse } from './types'

// Sync configuration
export class SyncManager {
  private database: Database
  private syncUrl: string
  private authToken?: string
  private syncInProgress: boolean = false
  private listeners: Array<(status: SyncStatus) => void> = []

  constructor(database: Database, syncUrl: string) {
    this.database = database
    this.syncUrl = syncUrl
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.authToken = token
  }

  // Add sync status listener
  addListener(listener: (status: SyncStatus) => void): void {
    this.listeners.push(listener)
  }

  // Remove sync status listener
  removeListener(listener: (status: SyncStatus) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  // Notify listeners of sync status change
  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(listener => listener(status))
  }

  // Check if device is online
  private async isOnline(): Promise<boolean> {
    try {
      const response = await fetch(`${this.syncUrl}/ping`, {
        method: 'HEAD',
        headers: this.getHeaders(),
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Get sync headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    return headers
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const isOnline = await this.isOnline()
    const pendingOperations = await this.getPendingOperationsCount()
    const conflicts = await this.getConflictsCount()
    const lastSyncAt = await this.getLastSyncTime()

    return {
      isOnline,
      lastSyncAt,
      pendingOperations,
      conflicts,
      errors: 0, // TODO: Track errors
      inProgress: this.syncInProgress,
    }
  }

  // Get pending operations count
  private async getPendingOperationsCount(): Promise<number> {
    const syncLog = this.database.get('sync_log')
    const pending = await syncLog.query().where('sync_status', 'pending').fetch()
    return pending.length
  }

  // Get conflicts count
  private async getConflictsCount(): Promise<number> {
    const tables = ['projects', 'sites', 'sessions', 'measurements', 'photos', 'weather_data']
    let conflictCount = 0
    
    for (const tableName of tables) {
      const collection = this.database.get(tableName)
      const conflicts = await collection.query().where('sync_status', 'conflict').fetch()
      conflictCount += conflicts.length
    }
    
    return conflictCount
  }

  // Get last sync time
  private async getLastSyncTime(): Promise<Date | undefined> {
    const syncLog = this.database.get('sync_log')
    const lastSync = await syncLog.query()
      .where('sync_status', 'synced')
      .sortBy('updated_at', 'desc')
      .take(1)
      .fetch()
    
    return lastSync.length > 0 ? lastSync[0].updatedAt : undefined
  }

  // Full sync operation
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress')
    }

    this.syncInProgress = true
    const startTime = Date.now()

    try {
      const isOnline = await this.isOnline()
      if (!isOnline) {
        throw new Error('Device is offline')
      }

      // Update sync status
      this.notifyListeners(await this.getSyncStatus())

      // Use WatermelonDB sync
      await synchronize({
        database: this.database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          const response = await fetch(`${this.syncUrl}/sync/pull`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
              lastPulledAt,
              schemaVersion,
              migration,
            }),
          })

          if (!response.ok) {
            throw new Error(`Pull failed: ${response.statusText}`)
          }

          return await response.json()
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          const response = await fetch(`${this.syncUrl}/sync/push`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
              changes,
              lastPulledAt,
            }),
          })

          if (!response.ok) {
            throw new Error(`Push failed: ${response.statusText}`)
          }

          return await response.json()
        },
        migrationsEnabledAtVersion: 1,
      })

      // Log successful sync
      await this.logSyncOperation('sync', 'success', Date.now() - startTime)

    } catch (error) {
      // Log failed sync
      await this.logSyncOperation('sync', 'failed', Date.now() - startTime, error.message)
      throw error
    } finally {
      this.syncInProgress = false
      this.notifyListeners(await this.getSyncStatus())
    }
  }

  // Resolve conflict by choosing local or server version
  async resolveConflict(
    tableName: string,
    recordId: string,
    resolution: 'local' | 'server' | 'custom',
    customData?: any
  ): Promise<void> {
    const collection = this.database.get(tableName)
    const record = await collection.find(recordId)

    if (record.syncStatus !== 'conflict') {
      throw new Error('Record is not in conflict state')
    }

    await this.database.write(async () => {
      if (resolution === 'local') {
        // Keep local version, mark as pending sync
        await record.update(r => {
          r.syncStatus = 'pending'
          r.version += 1
        })
      } else if (resolution === 'server') {
        // This would require fetching server version
        // For now, mark as synced
        await record.update(r => {
          r.syncStatus = 'synced'
          r.lastSyncAt = new Date()
        })
      } else if (resolution === 'custom' && customData) {
        // Apply custom resolution
        await record.update(r => {
          Object.assign(r, customData)
          r.syncStatus = 'pending'
          r.version += 1
        })
      }
    })
  }

  // Force sync specific record
  async forceSyncRecord(tableName: string, recordId: string): Promise<void> {
    const collection = this.database.get(tableName)
    const record = await collection.find(recordId)

    await this.database.write(async () => {
      await record.update(r => {
        r.syncStatus = 'pending'
        r.version += 1
      })
    })

    // Trigger sync if online
    if (await this.isOnline()) {
      await this.sync()
    }
  }

  // Log sync operation
  private async logSyncOperation(
    operation: string,
    status: 'success' | 'failed',
    duration: number,
    error?: string
  ): Promise<void> {
    const syncLog = this.database.get('sync_log')
    
    await this.database.write(async () => {
      await syncLog.create(record => {
        record.tableName = 'sync_operations'
        record.recordId = `${operation}_${Date.now()}`
        record.operation = 'create'
        record.syncStatus = status === 'success' ? 'synced' : 'failed'
        record.errorMessage = error
        record.retryCount = 0
        record.lastAttemptAt = new Date()
      })
    })
  }

  // Auto-sync when online
  async enableAutoSync(intervalMs: number = 60000): Promise<void> {
    setInterval(async () => {
      if (!this.syncInProgress && await this.isOnline()) {
        const pendingCount = await this.getPendingOperationsCount()
        if (pendingCount > 0) {
          try {
            await this.sync()
          } catch (error) {
            console.warn('Auto-sync failed:', error)
          }
        }
      }
    }, intervalMs)
  }

  // Bulk operations for efficient syncing
  async bulkCreate(tableName: string, records: any[]): Promise<void> {
    const collection = this.database.get(tableName)
    
    await this.database.write(async () => {
      for (const recordData of records) {
        await collection.create(record => {
          Object.assign(record, recordData)
          record.syncStatus = 'pending'
          record.version = 1
        })
      }
    })
  }

  async bulkUpdate(tableName: string, updates: Array<{ id: string; data: any }>): Promise<void> {
    const collection = this.database.get(tableName)
    
    await this.database.write(async () => {
      for (const update of updates) {
        const record = await collection.find(update.id)
        await record.update(r => {
          Object.assign(r, update.data)
          r.syncStatus = 'pending'
          r.version += 1
        })
      }
    })
  }

  // Cleanup old sync logs
  async cleanupSyncLogs(olderThanDays: number = 30): Promise<void> {
    const syncLog = this.database.get('sync_log')
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
    
    const oldLogs = await syncLog.query()
      .where('created_at', Q.lt(cutoffTime))
      .fetch()

    await this.database.write(async () => {
      for (const log of oldLogs) {
        await log.markAsDeleted()
      }
    })
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    totalRecords: number
    syncedRecords: number
    pendingRecords: number
    conflictRecords: number
    failedRecords: number
  }> {
    const tables = ['projects', 'sites', 'sessions', 'measurements', 'photos', 'weather_data']
    let totalRecords = 0
    let syncedRecords = 0
    let pendingRecords = 0
    let conflictRecords = 0
    let failedRecords = 0

    for (const tableName of tables) {
      const collection = this.database.get(tableName)
      const all = await collection.query().fetch()
      totalRecords += all.length

      const synced = await collection.query().where('sync_status', 'synced').fetch()
      syncedRecords += synced.length

      const pending = await collection.query().where('sync_status', 'pending').fetch()
      pendingRecords += pending.length

      const conflicts = await collection.query().where('sync_status', 'conflict').fetch()
      conflictRecords += conflicts.length

      const failed = await collection.query().where('sync_status', 'failed').fetch()
      failedRecords += failed.length
    }

    return {
      totalRecords,
      syncedRecords,
      pendingRecords,
      conflictRecords,
      failedRecords,
    }
  }
}

// Conflict resolution strategies
export const ConflictResolution = {
  // Always choose local version
  LOCAL_WINS: 'local' as const,
  
  // Always choose server version
  SERVER_WINS: 'server' as const,
  
  // Choose most recent version
  MOST_RECENT: 'most_recent' as const,
  
  // Manual resolution required
  MANUAL: 'manual' as const,
}

export type ConflictResolutionStrategy = typeof ConflictResolution[keyof typeof ConflictResolution]

// Default conflict resolution
export function getDefaultConflictResolution(
  tableName: string,
  localRecord: any,
  serverRecord: any
): ConflictResolutionStrategy {
  // For critical data, always require manual resolution
  if (tableName === 'projects' || tableName === 'sites') {
    return ConflictResolution.MANUAL
  }
  
  // For measurements, prefer local version (field data is authoritative)
  if (tableName === 'measurements') {
    return ConflictResolution.LOCAL_WINS
  }
  
  // For other tables, use most recent
  return ConflictResolution.MOST_RECENT
} 