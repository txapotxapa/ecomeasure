import { field, date, relation } from '@nozbe/watermelondb/decorators'
import { Relation } from '@nozbe/watermelondb'
import BaseModel from './Base'
import { PhotoType, Direction, UploadStatus } from '../types'
import Session from './Session'
import Site from './Site'
import Measurement from './Measurement'

export default class Photo extends BaseModel {
  static table = 'photos'
  static associations = {
    session: { type: 'belongs_to', key: 'session_id' },
    site: { type: 'belongs_to', key: 'site_id' },
    measurement: { type: 'belongs_to', key: 'measurement_id' },
  }

  @field('session_id') sessionId!: string
  @field('site_id') siteId!: string
  @field('measurement_id') measurementId?: string
  @field('photo_type') photoType!: PhotoType
  @field('direction') direction?: Direction
  @field('file_path') filePath!: string
  @field('original_filename') originalFilename!: string
  @field('file_size') fileSize!: number
  @field('mime_type') mimeType!: string
  @field('width') width?: number
  @field('height') height?: number
  @date('timestamp') timestamp!: Date
  @field('latitude') latitude?: number
  @field('longitude') longitude?: number
  @field('altitude') altitude?: number
  @field('compass_bearing') compassBearing?: number
  @field('camera_height') cameraHeight?: number
  @field('notes') notes?: string
  @field('upload_status') uploadStatus!: UploadStatus

  @relation('sessions', 'session_id') session!: Relation<Session>
  @relation('sites', 'site_id') site!: Relation<Site>
  @relation('measurements', 'measurement_id') measurement?: Relation<Measurement>

  // Get file size in human readable format
  get fileSizeFormatted(): string {
    if (this.fileSize < 1024) return `${this.fileSize} B`
    if (this.fileSize < 1024 * 1024) return `${(this.fileSize / 1024).toFixed(1)} KB`
    return `${(this.fileSize / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get image dimensions
  get dimensions(): string | null {
    if (!this.width || !this.height) return null
    return `${this.width}x${this.height}`
  }

  // Mark as uploaded
  async markAsUploaded(): Promise<void> {
    await this.update(record => {
      record.uploadStatus = 'uploaded'
    })
  }

  // Mark as failed
  async markAsFailed(): Promise<void> {
    await this.update(record => {
      record.uploadStatus = 'failed'
    })
  }

  // Update upload status
  async updateUploadStatus(status: UploadStatus): Promise<void> {
    await this.update(record => {
      record.uploadStatus = status
    })
  }

  // Update notes
  async updateNotes(notes: string): Promise<void> {
    await this.update(record => {
      record.notes = notes
    })
  }
} 