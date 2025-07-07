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
  Leaf
} from "lucide-react";
import { useLocation } from "wouter";
import ToolSelector from "@/components/tool-selector";
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
  const [selectedTool, setSelectedTool] = useState<ToolType>('canopy');
  const [selectedImage, setSelectedImage] = useState<{ url: string; file: File } | null>(null);
  const [canopyHeight, setCanopyHeight] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null);
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
      
      return await apiRequest("/api/analysis-sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
        headers: { "Content-Type": "application/json" },
      });
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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Site Requirement Notice */}
        {!currentSite && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Site Required</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Please create or select a research site from the Home page before starting measurements. 
                    This ensures all data is properly organized and logged to the correct location.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
                    onClick={() => setLocation('/')}
                  >
                    Go to Home Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Site Display */}
        {currentSite && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 truncate">
                    Active Site: {currentSite.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-green-700 dark:text-green-300">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{currentSite.latitude.toFixed(6)}°, {currentSite.longitude.toFixed(6)}°</span>
                    </div>
                    {currentSite.altitude && (
                      <div className="flex items-center space-x-1">
                        <Mountain className="h-3 w-3 flex-shrink-0" />
                        <span>{currentSite.altitude.toFixed(0)}m</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tool Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Choose Measurement Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToolSelector 
              selectedTool={selectedTool} 
              onToolSelect={setSelectedTool}
            />
          </CardContent>
        </Card>

        {/* Tool-specific Interface */}
        {selectedTool === 'canopy' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TreePine className="h-5 w-5 mr-2" />
                Canopy Cover Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Upload Canopy Photo</Label>
                <ImageUpload 
                  onImageUploaded={setSelectedImage} 
                  currentImage={selectedImage?.url}
                />
              </div>

              {/* Optional Canopy Height */}
              <div className="space-y-2">
                <Label htmlFor="canopy-height">Canopy Height (meters) - Optional</Label>
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-gray-500" />
                  <Input
                    id="canopy-height"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={canopyHeight}
                    onChange={(e) => setCanopyHeight(e.target.value)}
                    placeholder="e.g., 15.5"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Measure from ground to highest vegetation point for complete site characterization
                </p>
              </div>

              {/* Analysis Buttons */}
              {selectedImage && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleCanopyAnalysis('GLAMA')}
                      disabled={isProcessing || !currentSite}
                      className="flex-1"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyze with GLAMA
                    </Button>
                    
                    <Button 
                      onClick={() => handleCanopyAnalysis('Canopeo')}
                      disabled={isProcessing || !currentSite}
                      variant="outline"
                      className="flex-1"
                    >
                      <Leaf className="h-4 w-4 mr-2" />
                      Analyze with Canopeo
                    </Button>
                  </div>
                  {!currentSite && (
                    <p className="text-xs text-amber-600 text-center">
                      Select a site to enable analysis
                    </p>
                  )}
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