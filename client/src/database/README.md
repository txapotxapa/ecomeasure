# Offline-First Database with WatermelonDB

This directory contains a complete offline-first database implementation using WatermelonDB for the Forest Canopy Analyzer application. The database supports field research work with automatic sync when internet connection is available.

## Overview

### Architecture
- **Database**: WatermelonDB with SQLite adapter
- **Sync**: Automatic bi-directional sync with conflict resolution
- **Offline Support**: Full functionality without internet connection
- **Models**: 7 main tables with relationships and business logic

### Key Features
- ✅ Offline-first design - works without internet
- ✅ Automatic sync when connection available
- ✅ Conflict resolution with multiple strategies
- ✅ Type-safe TypeScript interfaces
- ✅ Business logic built into models
- ✅ GPS and photo integration
- ✅ Comprehensive field data support

## Installation

```bash
npm install @nozbe/watermelondb
npm install @nozbe/watermelondb/adapters/sqlite
```

## Database Schema

### Tables

1. **projects** - Top-level research projects
2. **sites** - Research locations within projects
3. **sessions** - Field work sessions at sites
4. **measurements** - All types of measurements (canopy, horizontal, ground)
5. **photos** - Images associated with measurements
6. **weather_data** - Weather conditions during measurements
7. **sync_log** - Sync operation tracking

### Relationships

```
projects
├── sites (1:many)
│   ├── sessions (1:many)
│   │   ├── measurements (1:many)
│   │   │   ├── photos (1:many)
│   │   │   └── weather_data (1:many)
│   │   └── weather_data (1:many)
│   └── measurements (1:many)
```

## Usage Examples

### Basic Setup

```typescript
import { DatabaseService } from './database'

// Initialize database
const db = DatabaseService.getInstance()
await db.initialize()

// Get sync manager
const syncManager = db.getSyncManager()
await syncManager.sync()
```

### Creating Projects and Sites

```typescript
// Create a new research project
const project = await db.createProject({
  name: 'Forest Biodiversity Study 2024',
  description: 'Long-term monitoring of forest canopy changes',
  leadResearcher: 'Dr. Jane Smith',
  organization: 'University Research Center',
  status: 'active'
})

// Create a site within the project
const site = await db.createSite({
  projectId: project.id,
  name: 'Research Plot A',
  description: 'Primary old-growth forest site',
  latitude: 45.1234,
  longitude: -122.5678,
  altitude: 450,
  ecosystemType: 'temperate_forest',
  vegetationType: 'old_growth_conifer'
})
```

### Field Data Collection

```typescript
// Start a field session
const session = await db.createSession({
  siteId: site.id,
  projectId: project.id,
  sessionName: 'Spring 2024 Survey',
  researcherName: 'Field Team Alpha',
  weatherConditions: 'Clear, mild wind',
  notes: 'Ideal conditions for canopy photography'
})

// Take a canopy measurement
const measurement = await db.createMeasurement({
  sessionId: session.id,
  siteId: site.id,
  measurementType: 'canopy',
  measurementName: 'Canopy Coverage Point 1',
  latitude: 45.1235,
  longitude: -122.5679,
  altitude: 452,
  imageUrl: '/photos/canopy_001.jpg',
  analysisMethod: 'GLAMA'
})

// Update with analysis results
await measurement.updateCanopyData({
  canopyCover: 87.5,
  lightTransmission: 12.5,
  leafAreaIndex: 4.2,
  zenithAngle: 90,
  processingTime: 2340,
  pixelsAnalyzed: 1024000,
  rawData: {
    thresholds: { green: 120, blue: 110 },
    regions: { sky: 128000, canopy: 896000 }
  }
})
```

### Ground Cover Analysis

```typescript
// Ground cover measurement (Daubenmire method)
const groundMeasurement = await db.createMeasurement({
  sessionId: session.id,
  siteId: site.id,
  measurementType: 'ground',
  measurementName: 'Quadrat 1 - Ground Cover',
  imageUrl: '/photos/ground_001.jpg'
})

await groundMeasurement.updateGroundData({
  totalCoverage: 65.3,
  speciesDiversity: 12,
  bareGroundPercentage: 15.2,
  litterPercentage: 19.5,
  rockPercentage: 8.7,
  shannonIndex: 2.34,
  evennessIndex: 0.78,
  dominantSpecies: ['Vaccinium ovatum', 'Polystichum munitum', 'Oxalis oregana'],
  quadratSize: 20
})
```

### Horizontal Vegetation Analysis

```typescript
// Horizontal vegetation measurement
const horizontalMeasurement = await db.createMeasurement({
  sessionId: session.id,
  siteId: site.id,
  measurementType: 'horizontal',
  measurementName: 'Vegetation Density - North View',
  imageUrl: '/photos/horizontal_001.jpg'
})

await horizontalMeasurement.updateHorizontalData({
  vegetationDensity: 73.8,
  averageHeight: 185,
  maxHeight: 320,
  minHeight: 45,
  obstructionPercentage: 68.2,
  vegetationLayers: {
    understory: { coverage: 45, avgHeight: 85 },
    midstory: { coverage: 65, avgHeight: 180 },
    canopy: { coverage: 85, avgHeight: 280 }
  }
})
```

### Photo Management

```typescript
// Add photos to measurements
const photo = await measurement.addPhoto({
  filePath: '/storage/photos/canopy_001_full.jpg',
  originalFilename: 'IMG_2024_001.jpg',
  fileSize: 2847392,
  mimeType: 'image/jpeg',
  width: 3024,
  height: 4032,
  direction: 'up',
  notes: 'Clear sky conditions, optimal lighting'
})

// Get all photos for a measurement
const photos = await db.getMeasurementPhotos(measurement.id)
```

### Weather Data

```typescript
// Add weather data to session
const weatherData = await db.weatherData.create(record => {
  record.sessionId = session.id
  record.timestamp = new Date()
  record.temperature = 18.5 // Celsius
  record.humidity = 65 // %
  record.windSpeed = 3.2 // m/s
  record.windDirection = 225 // degrees
  record.pressure = 1013.2 // hPa
  record.cloudCover = 'partly_cloudy'
  record.precipitation = 'none'
  record.visibility = 10000 // meters
  record.uvIndex = 6
  record.lightIntensity = 45000 // lux
  record.dataSource = 'manual'
  record.syncStatus = 'pending'
  record.version = 1
})
```

### Querying Data

```typescript
// Get all active projects
const activeProjects = await db.getActiveProjects()

// Get sites for a project
const sites = await db.getProjectSites(project.id)

// Get active sessions
const activeSessions = await db.getActiveSessions()

// Get measurements for a session
const measurements = await db.getSessionMeasurements(session.id)

// Complex queries with filtering
const recentCanopyMeasurements = await db.measurements
  .query()
  .where('measurement_type', 'canopy')
  .where('timestamp', Q.gt(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
  .sortBy('timestamp', 'desc')
  .fetch()
```

### Sync Management

```typescript
// Check sync status
const syncStatus = await syncManager.getSyncStatus()
console.log('Online:', syncStatus.isOnline)
console.log('Pending operations:', syncStatus.pendingOperations)
console.log('Conflicts:', syncStatus.conflicts)

// Manual sync
try {
  await syncManager.sync()
  console.log('Sync completed successfully')
} catch (error) {
  console.error('Sync failed:', error)
}

// Auto-sync every 60 seconds
await syncManager.enableAutoSync(60000)
```

### Conflict Resolution

```typescript
// Handle sync conflicts
const conflicts = await syncManager.getConflictsCount()
if (conflicts > 0) {
  // Resolve conflict by choosing local version
  await syncManager.resolveConflict(
    'measurements',
    'measurement_id_123',
    'local'
  )
  
  // Or choose server version
  await syncManager.resolveConflict(
    'measurements',
    'measurement_id_123',
    'server'
  )
  
  // Or provide custom resolution
  await syncManager.resolveConflict(
    'measurements',
    'measurement_id_123',
    'custom',
    {
      canopyCover: 85.0, // Combined/averaged value
      lightTransmission: 15.0,
      notes: 'Resolved: Combined field and lab analysis'
    }
  )
}
```

### Data Export

```typescript
// Export data for analysis
const measurements = await db.measurements.query().fetch()
const exportData = measurements.map(m => ({
  id: m.id,
  site: m.site.name,
  type: m.measurementType,
  timestamp: m.timestamp.toISOString(),
  canopyCover: m.canopyCover,
  lightTransmission: m.lightTransmission,
  latitude: m.latitude,
  longitude: m.longitude,
  qualityScore: m.qualityScore
}))

// Convert to CSV or JSON for analysis
const csv = convertToCSV(exportData)
const json = JSON.stringify(exportData, null, 2)
```

### Database Statistics

```typescript
// Get database statistics
const stats = await db.getStats()
console.log('Database Statistics:', {
  totalRecords: stats.totalRecords,
  syncedRecords: stats.syncedRecords,
  pendingSync: stats.pendingRecords,
  conflicts: stats.conflictRecords,
  projects: stats.projects,
  sites: stats.sites,
  sessions: stats.sessions,
  measurements: stats.measurements,
  photos: stats.photos
})
```

## Server-Side Integration

### API Endpoints

The sync system expects these server endpoints:

```typescript
// GET /api/sync/ping - Check server availability
// POST /api/sync/pull - Pull changes from server
// POST /api/sync/push - Push changes to server

// Pull endpoint example
app.post('/api/sync/pull', async (req, res) => {
  const { lastPulledAt, schemaVersion } = req.body
  
  // Get changes since lastPulledAt
  const changes = await getChangesFrom(lastPulledAt)
  
  res.json({
    changes,
    timestamp: Date.now()
  })
})

// Push endpoint example
app.post('/api/sync/push', async (req, res) => {
  const { changes, lastPulledAt } = req.body
  
  // Apply changes to server database
  const result = await applyChanges(changes)
  
  res.json({
    success: true,
    conflicts: result.conflicts,
    timestamp: Date.now()
  })
})
```

### Migration Strategy

```typescript
// Migration from current schema to WatermelonDB
const migrationScript = async () => {
  // 1. Export existing data
  const existingSessions = await getCurrentSessions()
  
  // 2. Create projects and sites
  const projects = new Map()
  const sites = new Map()
  
  for (const session of existingSessions) {
    let project = projects.get(session.siteName)
    if (!project) {
      project = await db.createProject({
        name: session.siteName,
        leadResearcher: 'Migrated',
        status: 'active'
      })
      projects.set(session.siteName, project)
    }
    
    let site = sites.get(session.plotName)
    if (!site) {
      site = await db.createSite({
        projectId: project.id,
        name: session.plotName,
        latitude: session.latitude || 0,
        longitude: session.longitude || 0,
        altitude: session.altitude
      })
      sites.set(session.plotName, site)
    }
    
    // 3. Create sessions and measurements
    const newSession = await db.createSession({
      siteId: site.id,
      projectId: project.id,
      sessionName: `Session ${session.id}`,
      researcherName: 'Migrated'
    })
    
    const measurement = await db.createMeasurement({
      sessionId: newSession.id,
      siteId: site.id,
      measurementType: session.toolType,
      measurementName: session.plotName,
      imageUrl: session.imageUrl
    })
    
    // Update with existing data
    if (session.toolType === 'canopy') {
      await measurement.updateCanopyData({
        canopyCover: session.canopyCover,
        lightTransmission: session.lightTransmission,
        leafAreaIndex: session.leafAreaIndex,
        zenithAngle: session.zenithAngle,
        processingTime: session.processingTime,
        pixelsAnalyzed: session.pixelsAnalyzed
      })
    }
  }
}
```

## Performance Considerations

### Optimization Tips

1. **Batch Operations**: Use batch writes for multiple records
2. **Lazy Loading**: Load relationships only when needed
3. **Indexing**: Key fields are indexed for fast queries
4. **Cleanup**: Regularly clean up old data and sync logs

```typescript
// Efficient batch operations
await db.database.write(async () => {
  const batch = []
  
  for (const data of measurementData) {
    const measurement = db.measurements.prepareCreate(record => {
      // ... set properties
    })
    batch.push(measurement)
  }
  
  await db.database.batch(batch)
})
```

### Storage Management

```typescript
// Cleanup old data
await db.cleanupOldData(365) // Keep 1 year of data

// Cleanup sync logs
await syncManager.cleanupSyncLogs(30) // Keep 30 days of logs

// Vacuum database
await db.database.adapter.query('VACUUM')
```

## Testing

```typescript
// Unit tests for models
describe('Measurement Model', () => {
  it('should calculate quality score correctly', async () => {
    const measurement = await db.createMeasurement({
      sessionId: 'test-session',
      siteId: 'test-site',
      measurementType: 'canopy',
      measurementName: 'Test Measurement',
      latitude: 45.1234,
      longitude: -122.5678,
      imageUrl: '/test-image.jpg'
    })
    
    await measurement.updateCanopyData({
      canopyCover: 85.0,
      lightTransmission: 15.0,
      leafAreaIndex: 4.2,
      processingTime: 2000,
      pixelsAnalyzed: 1000000
    })
    
    expect(measurement.qualityScore).toBeGreaterThan(80)
  })
})
```

## Troubleshooting

### Common Issues

1. **Sync Conflicts**: Use conflict resolution strategies
2. **Storage Full**: Clean up old data and photos
3. **Performance**: Check indexes and query optimization
4. **Network Issues**: Implement retry logic with exponential backoff

### Debug Tools

```typescript
// Enable debug logging
import { logger } from '@nozbe/watermelondb/utils/logger'
logger.silence = false

// Monitor sync operations
syncManager.addListener(status => {
  console.log('Sync Status:', status)
})

// Database introspection
const stats = await db.getStats()
console.log('Database Stats:', stats)
```

This offline-first database provides a robust foundation for field research applications with automatic sync, conflict resolution, and comprehensive data modeling for ecological measurements. 