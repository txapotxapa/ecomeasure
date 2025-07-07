import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  TreePine, 
  Eye, 
  Grid3X3, 
  Camera,
  Target,
  MapPin,
  Mountain,
  AlertTriangle,
  Ruler,
  BarChart3,
  Leaf,
  Layers
} from "lucide-react";
import { useLocation } from "wouter";
import type { ToolType } from "@/components/tool-selector";
import ImageUpload from "@/components/image-upload";
import HorizontalVegetationTool from "@/components/horizontal-vegetation-tool";
import DaubenmireTool from "@/components/daubenmire-tool";
import ProcessingModal from "@/components/processing-modal";
import BottomNavigation from "@/components/bottom-navigation";

import { analyzeCanopyImage, validateImage } from "@/lib/image-processing";
import type { HorizontalVegetationAnalysis } from "@/lib/horizontal-vegetation";
import type { DaubenmireResult } from "@/lib/daubenmire-frame";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SiteInfo {
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  photoUrl?: string;
  createdAt: Date;
  sessionCounts: {
    canopy: number;
    horizontal_vegetation: number;
    daubenmire: number;
  };
}

export default function Tools() {
  const [, setLocation] = useLocation();
  // Get tool from URL parameter or default to canopy
  const urlParams = new URLSearchParams(window.location.search);
  const urlTool = urlParams.get('tool') as ToolType;
  const [selectedTool, setSelectedTool] = useState<ToolType>(
    urlTool && ['canopy', 'horizontal_vegetation', 'daubenmire'].includes(urlTool) 
      ? urlTool 
      : 'canopy'
  );
  const [selectedImage, setSelectedImage] = useState<{ url: string; file: File } | null>(null);
  const [canopyHeight, setCanopyHeight] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null);
  const [currentAnalysisResults, setCurrentAnalysisResults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load current site from localStorage and check for tool parameter in URL
  useEffect(() => {
    // Load site from localStorage - should sync with home page
    const savedCurrentSite = localStorage.getItem('current-research-site');
    if (savedCurrentSite) {
      try {
        const siteData = JSON.parse(savedCurrentSite);
        setCurrentSite({
          ...siteData,
          createdAt: new Date(siteData.createdAt)
        });
      } catch (error) {
        console.error('Error loading current site:', error);
      }
    }

    // Check for tool parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const toolParam = urlParams.get('tool') as ToolType;
    if (toolParam && ['canopy', 'horizontal_vegetation', 'daubenmire'].includes(toolParam)) {
      setSelectedTool(toolParam);
    }
  }, []);

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      // Add current site information to session data
      if (currentSite) {
        sessionData.siteName = currentSite.name;
        sessionData.latitude = currentSite.latitude;
        sessionData.longitude = currentSite.longitude;
        sessionData.altitude = currentSite.altitude;
        sessionData.sitePhotoUrl = currentSite.photoUrl;
      }
      
      const response = await apiRequest("/api/analysis-sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
        headers: { "Content-Type": "application/json" },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-sessions"] });
      setLocation(`/analysis?id=${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCanopyAnalysis = async (method: 'GLAMA' | 'Canopeo') => {
    if (!selectedImage || !currentSite) {
      toast({
        title: "Missing Requirements",
        description: !selectedImage ? "Please upload an image first" : "Please select a research site",
        variant: "destructive",
      });
      return;
    }

    // Validate image file
    const validation = validateImage(selectedImage.file);
    if (!validation.isValid) {
      toast({
        title: "Invalid Image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage("Starting analysis...");

    try {
      console.log('Starting canopy analysis with method:', method);
      console.log('Image file:', selectedImage.file.name, selectedImage.file.size, 'bytes');
      console.log('Image file type:', selectedImage.file.type);
      console.log('Current site:', currentSite);
      
      const results = await analyzeCanopyImage(selectedImage.file, {
        method: method,
        zenithAngle: 90,
        onProgress: (progress, stage) => {
          console.log(`Progress: ${progress}% - ${stage}`);
          setProgress(progress);
          setCurrentStage(stage);
        },
      });

      console.log('Analysis results:', results);
      
      if (!results || typeof results.canopyCover !== 'number') {
        throw new Error('Invalid analysis results received');
      }

      const sessionData = {
        plotName: `Canopy Analysis ${new Date().toLocaleDateString()}`,
        imageUrl: selectedImage.url,
        toolType: 'canopy',
        analysisMethod: method,
        zenithAngle: 90,
        canopyCover: results.canopyCover,
        canopyHeight: canopyHeight ? parseFloat(canopyHeight) : null,
        lightTransmission: results.lightTransmission,
        leafAreaIndex: results.leafAreaIndex,
        pixelsAnalyzed: results.pixelsAnalyzed,
        processingTime: results.processingTime,
        isCompleted: true,
      };

      console.log('Creating session with data:', sessionData);
      
      // Store results for display in data sheet
      setCurrentAnalysisResults({
        ...sessionData,
        timestamp: new Date().toISOString(),
      });
      
      createSessionMutation.mutate(sessionData);
    } catch (error) {
      console.error('Canopy analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHorizontalVegetationAnalysis = (results: HorizontalVegetationAnalysis) => {
    const sessionData = {
      plotName: `Horizontal Vegetation ${new Date().toLocaleDateString()}`,
      imageUrl: "", // Will be set by the tool
      toolType: 'horizontal_vegetation',
      analysisMethod: "Digital Robel Pole",
      pixelsAnalyzed: 0,
      horizontalVegetationData: results,
      isCompleted: true,
    };

    createSessionMutation.mutate(sessionData);
  };

  const handleDaubenmireAnalysis = (results: DaubenmireResult) => {
    const sessionData = {
      plotName: `Daubenmire Frame ${new Date().toLocaleDateString()}`,
      imageUrl: "", // Will be set by the tool
      toolType: 'daubenmire',
      analysisMethod: "Frame-free Analysis",
      pixelsAnalyzed: 0,
      daubenmireData: results,
      isCompleted: true,
    };

    createSessionMutation.mutate(sessionData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Streamlined Site Status */}
        {!currentSite && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium text-amber-800">No site selected</div>
                    <div className="text-xs text-amber-600">Create a site to start measuring</div>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => setLocation('/')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Create Site
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Combined Site and Tool Selection */}
        {currentSite && (
          <Card>
            <CardHeader className="space-y-4">
              {/* Compact Site Info */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">{currentSite.name}</div>
                    <div className="text-xs text-green-600">
                      {currentSite.latitude !== 0 || currentSite.longitude !== 0 
                        ? `${currentSite.latitude.toFixed(4)}°, ${currentSite.longitude.toFixed(4)}°`
                        : "No coordinates"
                      }
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/')}
                  className="border-green-300 text-green-700"
                >
                  Change
                </Button>
              </div>

              {/* Quick Tool Selection */}
              <div>
                <CardTitle className="flex items-center mb-3">
                  <Camera className="h-5 w-5 mr-2" />
                  Quick Measurement
                </CardTitle>
                <div className="grid gap-4">
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTool === 'canopy' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTool('canopy')}
                  >
                    <div className="flex items-center space-x-4">
                      <TreePine className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold">Canopy Cover Analysis</h3>
                        <p className="text-sm text-muted-foreground">GLAMA method for gap light measurement</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTool === 'horizontal_vegetation' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTool('horizontal_vegetation')}
                  >
                    <div className="flex items-center space-x-4">
                      <Layers className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Horizontal Vegetation</h3>
                        <p className="text-sm text-muted-foreground">Multi-height density analysis</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTool === 'daubenmire' 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTool('daubenmire')}
                  >
                    <div className="flex items-center space-x-4">
                      <Grid3X3 className="h-8 w-8 text-amber-600" />
                      <div>
                        <h3 className="font-semibold">Ground Cover Analysis</h3>
                        <p className="text-sm text-muted-foreground">Digital quadrat sampling</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Streamlined Tool Interface */}
        {selectedTool === 'canopy' && currentSite && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TreePine className="h-5 w-5 mr-2" />
                Canopy Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Upload */}
              <ImageUpload 
                onImageUploaded={setSelectedImage} 
                currentImage={selectedImage?.url}
              />

              {/* Auto-analyze on upload or show analyze button */}
              {selectedImage && !currentAnalysisResults && (
                <Button 
                  onClick={() => handleCanopyAnalysis('GLAMA')}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isProcessing ? "Analyzing..." : "Analyze with GLAMA"}
                </Button>
              )}

              {/* Optional Height Entry - Only after analysis */}
              {currentAnalysisResults && (
                <div className="space-y-2">
                  <Label htmlFor="canopy-height">Canopy Height (optional)</Label>
                  <Input
                    id="canopy-height"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={canopyHeight}
                    onChange={(e) => setCanopyHeight(e.target.value)}
                    placeholder="e.g., 15.5 meters"
                  />
                </div>
              )}

              {/* Analysis Results Data Sheet */}
              {currentAnalysisResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Analysis Results</Label>
                    <Badge variant="outline" className="text-xs">
                      {new Date(currentAnalysisResults.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Canopy Cover:</span>
                          <span className="text-sm font-mono">
                            {currentAnalysisResults.canopyCover?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Light Transmission:</span>
                          <span className="text-sm font-mono">
                            {currentAnalysisResults.lightTransmission?.toFixed(1)}%
                          </span>
                        </div>
                        {currentAnalysisResults.leafAreaIndex && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Leaf Area Index:</span>
                            <span className="text-sm font-mono">
                              {currentAnalysisResults.leafAreaIndex?.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Pixels Analyzed:</span>
                          <span className="text-sm font-mono">
                            {currentAnalysisResults.pixelsAnalyzed?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Processing Time:</span>
                          <span className="text-sm font-mono">
                            {currentAnalysisResults.processingTime?.toFixed(2)}s
                          </span>
                        </div>
                        {currentAnalysisResults.canopyHeight && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Canopy Height:</span>
                            <span className="text-sm font-mono">
                              {currentAnalysisResults.canopyHeight}m
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Site: {currentSite?.name}</span>
                        <span>Method: {currentAnalysisResults.analysisMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {selectedTool === 'horizontal_vegetation' && (
          <HorizontalVegetationTool 
            onAnalysisComplete={handleHorizontalVegetationAnalysis}
          />
        )}
        
        {selectedTool === 'daubenmire' && (
          <DaubenmireTool 
            onAnalysisComplete={handleDaubenmireAnalysis}
          />
        )}

        <ProcessingModal
          isOpen={isProcessing}
          onClose={() => setIsProcessing(false)}
          progress={progress}
          stage={currentStage}
          canCancel={true}
          onCancel={() => setIsProcessing(false)}
        />
      </div>

      <BottomNavigation />
    </div>
  );
}