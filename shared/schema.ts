import { pgTable, text, serial, real, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const analysisSession = pgTable("analysis_sessions", {
  id: serial("id").primaryKey(),
  plotName: text("plot_name").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  imageUrl: text("image_url").notNull(),
  toolType: text("tool_type").notNull().default("canopy"), // 'canopy', 'horizontal_vegetation', 'daubenmire'
  analysisMethod: text("analysis_method").notNull().default("GLAMA"),
  zenithAngle: real("zenith_angle").default(90),
  
  // Common results
  canopyCover: real("canopy_cover"),
  lightTransmission: real("light_transmission"),
  leafAreaIndex: real("leaf_area_index"),
  pixelsAnalyzed: integer("pixels_analyzed").notNull(),
  processingTime: real("processing_time"),
  
  // Tool-specific results stored as JSON
  horizontalVegetationData: jsonb("horizontal_vegetation_data"), // For height-based analysis
  daubenmireData: jsonb("daubenmire_data"), // For quadrat sampling data
  
  notes: text("notes"),
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const insertAnalysisSessionSchema = createInsertSchema(analysisSession).omit({
  id: true,
  timestamp: true,
});

export const updateAnalysisSessionSchema = createInsertSchema(analysisSession).omit({
  id: true,
  timestamp: true,
}).partial();

export type InsertAnalysisSession = z.infer<typeof insertAnalysisSessionSchema>;
export type UpdateAnalysisSession = z.infer<typeof updateAnalysisSessionSchema>;
export type AnalysisSession = typeof analysisSession.$inferSelect;

export const analysisSettings = pgTable("analysis_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  defaultAnalysisMethod: text("default_analysis_method").notNull().default("GLAMA"),
  defaultZenithAngle: real("default_zenith_angle").notNull().default(90),
  autoGpsLogging: boolean("auto_gps_logging").notNull().default(true),
  imageQualityThreshold: real("image_quality_threshold").notNull().default(0.8),
  exportFormat: text("export_format").notNull().default("CSV"),
  
  // Tool-specific settings
  defaultToolType: text("default_tool_type").notNull().default("canopy"),
  horizontalVegetationHeights: jsonb("horizontal_vegetation_heights").default([50, 100, 150, 200]), // cm heights
  daubenmireQuadratSize: real("daubenmire_quadrat_size").notNull().default(20), // cm
  daubenmireGridSize: integer("daubenmire_grid_size").notNull().default(5), // 5x5 grid
  
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnalysisSettingsSchema = createInsertSchema(analysisSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertAnalysisSettings = z.infer<typeof insertAnalysisSettingsSchema>;
export type AnalysisSettings = typeof analysisSettings.$inferSelect;
