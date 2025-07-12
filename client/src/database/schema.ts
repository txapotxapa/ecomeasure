import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 2,
  tables: [
    // Projects table - top-level organization
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'lead_researcher', type: 'string' },
        { name: 'organization', type: 'string', isOptional: true },
        { name: 'start_date', type: 'number' },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'status', type: 'string' }, // 'active', 'completed', 'paused'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Sync fields
        { name: 'sync_status', type: 'string' }, // 'synced', 'pending', 'conflict'
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'version', type: 'number' },
      ]
    }),

    // Sites table - research locations within projects
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'altitude', type: 'number', isOptional: true },
        { name: 'ecosystem_type', type: 'string', isOptional: true },
        { name: 'vegetation_type', type: 'string', isOptional: true },
        { name: 'site_photo_url', type: 'string', isOptional: true },
        { name: 'access_notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Sync fields
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'version', type: 'number' },
      ]
    }),

    // Sessions table - field work sessions
    tableSchema({
      name: 'sessions',
      columns: [
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'protocol_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'session_name', type: 'string' },
        { name: 'researcher_name', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'weather_conditions', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'active', 'completed', 'abandoned'
        { name: 'progress_data', type: 'string', isOptional: true }, // JSON tracking protocol completion
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Sync fields
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'version', type: 'number' },
      ]
    }),

    // Measurements table - all types of measurements
    tableSchema({
      name: 'measurements',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'measurement_type', type: 'string' }, // 'canopy', 'horizontal', 'ground'
        { name: 'measurement_name', type: 'string' },
        { name: 'timestamp', type: 'number' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'altitude', type: 'number', isOptional: true },
        { name: 'gps_accuracy', type: 'number', isOptional: true },
        
        // Common measurement fields
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'analysis_method', type: 'string', isOptional: true },
        { name: 'processing_time', type: 'number', isOptional: true },
        { name: 'pixels_analyzed', type: 'number', isOptional: true },
        
        // Canopy-specific fields
        { name: 'canopy_cover', type: 'number', isOptional: true },
        { name: 'light_transmission', type: 'number', isOptional: true },
        { name: 'leaf_area_index', type: 'number', isOptional: true },
        { name: 'zenith_angle', type: 'number', isOptional: true },
        { name: 'canopy_height', type: 'number', isOptional: true },
        
        // Ground cover (Daubenmire) fields
        { name: 'total_coverage', type: 'number', isOptional: true },
        { name: 'species_diversity', type: 'number', isOptional: true },
        { name: 'bare_ground_percentage', type: 'number', isOptional: true },
        { name: 'litter_percentage', type: 'number', isOptional: true },
        { name: 'rock_percentage', type: 'number', isOptional: true },
        { name: 'shannon_index', type: 'number', isOptional: true },
        { name: 'evenness_index', type: 'number', isOptional: true },
        { name: 'dominant_species', type: 'string', isOptional: true }, // JSON string
        { name: 'quadrat_size', type: 'number', isOptional: true },
        
        // Horizontal vegetation fields
        { name: 'vegetation_density', type: 'number', isOptional: true },
        { name: 'average_height', type: 'number', isOptional: true },
        { name: 'max_height', type: 'number', isOptional: true },
        { name: 'min_height', type: 'number', isOptional: true },
        { name: 'vegetation_layers', type: 'string', isOptional: true }, // JSON string
        { name: 'obstruction_percentage', type: 'number', isOptional: true },
        
        // Analysis data (stored as JSON)
        { name: 'raw_data', type: 'string', isOptional: true },
        { name: 'metadata', type: 'string', isOptional: true },
        
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        
        // Sync fields
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'version', type: 'number' },
      ]
    }),

    // Photos table - all images associated with measurements
    tableSchema({
      name: 'photos',
      columns: [
        { name: 'measurement_id', type: 'string', isIndexed: true },
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'photo_type', type: 'string' }, // 'measurement', 'site', 'documentation'
        { name: 'direction', type: 'string', isOptional: true }, // 'north', 'south', 'east', 'west', 'up', 'down'
        { name: 'file_path', type: 'string' },
        { name: 'original_filename', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'mime_type', type: 'string' },
        { name: 'width', type: 'number', isOptional: true },
        { name: 'height', type: 'number', isOptional: true },
        { name: 'timestamp', type: 'number' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'altitude', type: 'number', isOptional: true },
        { name: 'compass_bearing', type: 'number', isOptional: true },
        { name: 'camera_height', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        
        // Sync fields
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'version', type: 'number' },
        { name: 'upload_status', type: 'string' }, // 'pending', 'uploading', 'uploaded', 'failed'
      ]
    }),

    // Weather data table
    tableSchema({
      name: 'weather_data',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'measurement_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'timestamp', type: 'number' },
        { name: 'temperature', type: 'number', isOptional: true },
        { name: 'humidity', type: 'number', isOptional: true },
        { name: 'wind_speed', type: 'number', isOptional: true },
        { name: 'wind_direction', type: 'number', isOptional: true },
        { name: 'pressure', type: 'number', isOptional: true },
        { name: 'cloud_cover', type: 'string', isOptional: true }, // 'clear', 'partly_cloudy', 'overcast'
        { name: 'precipitation', type: 'string', isOptional: true }, // 'none', 'light', 'moderate', 'heavy'
        { name: 'visibility', type: 'number', isOptional: true },
        { name: 'uv_index', type: 'number', isOptional: true },
        { name: 'light_intensity', type: 'number', isOptional: true }, // lux
        { name: 'data_source', type: 'string' }, // 'manual', 'sensor', 'api'
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        
        // Sync fields
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'version', type: 'number' },
      ]
    }),

    // Sync logs table – tracks per-record changes for incremental replication
    tableSchema({
      name: 'sync_logs',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'record_id', type: 'string', isIndexed: true },
        { name: 'operation', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'timestamp', type: 'number' },
        { name: 'payload', type: 'string', isOptional: true }, // JSON diff or full
      ]
    }),

    // Protocol templates table for sampling methodologies
    tableSchema({
      name: 'protocol_templates',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' }, // 'preset', 'custom', 'shared'
        { name: 'ecosystem_type', type: 'string', isOptional: true }, // 'forest', 'grassland', 'riparian', 'wetland'
        { name: 'created_by', type: 'string' },
        { name: 'is_public', type: 'boolean' },
        { name: 'is_preset', type: 'boolean' },
        
        // Sampling design
        { name: 'sampling_pattern', type: 'string' }, // 'grid', 'transect', 'random', 'systematic'
        { name: 'number_of_points', type: 'number' },
        { name: 'point_spacing', type: 'number', isOptional: true }, // meters
        { name: 'transect_length', type: 'number', isOptional: true }, // meters
        { name: 'transect_count', type: 'number', isOptional: true },
        { name: 'plot_size', type: 'number', isOptional: true }, // square meters
        
        // Tool configuration
        { name: 'tools_enabled', type: 'string' }, // JSON array: ['canopy', 'horizontal', 'ground']
        { name: 'canopy_config', type: 'string', isOptional: true }, // JSON config
        { name: 'horizontal_config', type: 'string', isOptional: true }, // JSON config
        { name: 'ground_config', type: 'string', isOptional: true }, // JSON config
        
        // Data collection requirements
        { name: 'required_photos', type: 'string', isOptional: true }, // JSON array of photo types
        { name: 'required_measurements', type: 'string', isOptional: true }, // JSON array
        { name: 'weather_recording', type: 'boolean' },
        { name: 'gps_required', type: 'boolean' },
        { name: 'notes_template', type: 'string', isOptional: true },
        
        // Quality control
        { name: 'min_gps_accuracy', type: 'number', isOptional: true }, // meters
        { name: 'photo_requirements', type: 'string', isOptional: true }, // JSON config
        { name: 'validation_rules', type: 'string', isOptional: true }, // JSON config
        
        // Metadata
        { name: 'tags', type: 'string', isOptional: true }, // JSON array of strings
        { name: 'instructions', type: 'string', isOptional: true },
        { name: 'estimated_time', type: 'number', isOptional: true }, // minutes
        { name: 'difficulty_level', type: 'string', isOptional: true }, // 'beginner', 'intermediate', 'advanced'
        
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        
        // Sync fields
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'version', type: 'number' },
      ]
    }),

    // Sync log table for tracking sync operations
    tableSchema({
      name: 'sync_log',
      columns: [
        { name: 'table_name', type: 'string' },
        { name: 'record_id', type: 'string' },
        { name: 'operation', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'sync_status', type: 'string' }, // 'pending', 'syncing', 'synced', 'failed'
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'retry_count', type: 'number' },
        { name: 'last_attempt_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})

// Migration schemas for future versions
export const migrations = [
  // Migration examples for version 2, 3, etc.
  // {
  //   toVersion: 2,
  //   steps: [
  //     addColumns({
  //       table: 'projects',
  //       columns: [
  //         { name: 'budget', type: 'number', isOptional: true },
  //       ]
  //     }),
  //   ]
  // }
] 