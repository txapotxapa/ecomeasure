import { field, date, relation } from '@nozbe/watermelondb/decorators'
import { Relation } from '@nozbe/watermelondb'
import BaseModel from './Base'
import { CloudCover, Precipitation, DataSource } from '../types'
import Session from './Session'
import Measurement from './Measurement'

export default class WeatherData extends BaseModel {
  static table = 'weather_data'
  static associations = {
    session: { type: 'belongs_to', key: 'session_id' },
    measurement: { type: 'belongs_to', key: 'measurement_id' },
  }

  @field('session_id') sessionId!: string
  @field('measurement_id') measurementId?: string
  @date('timestamp') timestamp!: Date
  @field('temperature') temperature?: number
  @field('humidity') humidity?: number
  @field('wind_speed') windSpeed?: number
  @field('wind_direction') windDirection?: number
  @field('pressure') pressure?: number
  @field('cloud_cover') cloudCover?: CloudCover
  @field('precipitation') precipitation?: Precipitation
  @field('visibility') visibility?: number
  @field('uv_index') uvIndex?: number
  @field('light_intensity') lightIntensity?: number
  @field('data_source') dataSource!: DataSource
  @field('notes') notes?: string

  @relation('sessions', 'session_id') session!: Relation<Session>
  @relation('measurements', 'measurement_id') measurement?: Relation<Measurement>

  // Get temperature in Fahrenheit
  get temperatureFahrenheit(): number | null {
    if (!this.temperature) return null
    return (this.temperature * 9/5) + 32
  }

  // Get wind speed in mph
  get windSpeedMph(): number | null {
    if (!this.windSpeed) return null
    return this.windSpeed * 2.237
  }

  // Get wind direction as compass point
  get windDirectionCompass(): string | null {
    if (!this.windDirection) return null
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(this.windDirection / 22.5) % 16
    return directions[index]
  }

  // Get pressure in inHg
  get pressureInHg(): number | null {
    if (!this.pressure) return null
    return this.pressure * 0.02953
  }

  // Get visibility in miles
  get visibilityMiles(): number | null {
    if (!this.visibility) return null
    return this.visibility * 0.000621371
  }

  // Update weather data
  async updateWeatherData(data: Partial<WeatherData>): Promise<void> {
    await this.update(record => {
      Object.assign(record, data)
    })
  }

  // Update notes
  async updateNotes(notes: string): Promise<void> {
    await this.update(record => {
      record.notes = notes
    })
  }
} 