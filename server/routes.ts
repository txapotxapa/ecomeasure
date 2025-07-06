import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisSessionSchema, updateAnalysisSessionSchema, insertAnalysisSettingsSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Analysis Sessions Routes
  app.post("/api/analysis-sessions", async (req, res) => {
    try {
      const validatedData = insertAnalysisSessionSchema.parse(req.body);
      const session = await storage.createAnalysisSession(validatedData);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/analysis-sessions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = limit 
        ? await storage.getRecentAnalysisSessions(limit)
        : await storage.getAllAnalysisSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analysis-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getAnalysisSession(id);
      if (!session) {
        return res.status(404).json({ message: "Analysis session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/analysis-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateAnalysisSessionSchema.parse(req.body);
      const session = await storage.updateAnalysisSession(id, validatedData);
      if (!session) {
        return res.status(404).json({ message: "Analysis session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/analysis-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAnalysisSession(id);
      if (!deleted) {
        return res.status(404).json({ message: "Analysis session not found" });
      }
      res.json({ message: "Analysis session deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Image Upload Route
  app.post("/api/upload-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const fileExtension = path.extname(req.file.originalname);
      const newFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const newPath = path.join('uploads', newFileName);
      
      await fs.rename(req.file.path, newPath);
      
      res.json({ 
        imageUrl: `/uploads/${newFileName}`,
        originalName: req.file.originalname,
        size: req.file.size 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Settings Routes
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const settings = await storage.getAnalysisSettings(userId);
      if (!settings) {
        // Return default settings if none exist
        const defaultSettings = {
          userId,
          defaultAnalysisMethod: "GLAMA",
          defaultZenithAngle: 90,
          autoGpsLogging: true,
          imageQualityThreshold: 0.8,
          exportFormat: "CSV"
        };
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertAnalysisSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateAnalysisSettings(validatedData);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Export Routes
  app.get("/api/export/:format", async (req, res) => {
    try {
      const format = req.params.format.toLowerCase();
      const sessions = await storage.getAllAnalysisSessions();
      
      if (format === 'csv') {
        const csvHeader = 'ID,Plot Name,Latitude,Longitude,Timestamp,Analysis Method,Zenith Angle,Canopy Cover (%),Light Transmission (%),Leaf Area Index,Pixels Analyzed,Processing Time (ms),Notes\n';
        const csvRows = sessions.map(session => 
          `${session.id},"${session.plotName}",${session.latitude || ''},${session.longitude || ''},${session.timestamp.toISOString()},"${session.analysisMethod}",${session.zenithAngle},${session.canopyCover},${session.lightTransmission},${session.leafAreaIndex || ''},${session.pixelsAnalyzed},${session.processingTime || ''},"${session.notes || ''}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="canopy_analysis_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeader + csvRows);
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
