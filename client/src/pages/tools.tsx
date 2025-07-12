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
  Layers,
  FileText,
  CheckCircle,
  Clock,
  Navigation2
} from "lucide-react";
import { useLocation } from "wouter";
import type { ToolType } from "@/components/tool-selector";
import ImageUpload from "@/components/image-upload";
import HorizontalVegetationTool from "@/components/horizontal-vegetation-tool";
import DaubenmireTool from "@/components/daubenmire-tool";
import ProcessingModal from "@/components/processing-modal";
import BottomNavigation from "@/components/bottom-navigation";
import SiteSelector from "@/components/site-selector";
import GPSAccuracyIndicator from "@/components/gps-accuracy-indicator";
import ProtocolSelector from "@/components/protocol-selector";
import ProtocolProgress from "@/components/protocol-progress";
import { useToast } from "@/hooks/use-toast";

import { analyzeCanopyImage, validateImage } from "@/lib/image-processing";
import type { HorizontalVegetationAnalysis } from "@/lib/horizontal-vegetation";
import type { DaubenmireResult } from "@/lib/daubenmire-frame";
import type { ProtocolTemplate } from "@/database/types";

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
  const [showSiteCreator, setShowSiteCreator] = useState(false);
  const [currentGPS, setCurrentGPS] = useState<{
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    altitudeAccuracy?: number;
  } | null>(null);
  
  // Protocol state
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolTemplate | null>(null);
  const [protocolProgress, setProtocolProgress] = useState<{
    currentPointIndex: number;
    completedPoints: number[];
    completedMeasurements: { [key: string]: boolean };
    startTime: Date;
    issues: any[];
  } | null>(null);
  const [showProtocolSelector, setShowProtocolSelector] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Scroll to top when component mounts or tool changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedTool]);



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

    // Check for protocol parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const protocolParam = urlParams.get('protocol');
    if (protocolParam) {
      // Create preset protocol based on URL parameter
      let presetProtocol: ProtocolTemplate | null = null;
      
      switch (protocolParam) {
        case 'forest_inventory':
          presetProtocol = {
            id: 'forest_inventory',
            name: 'Forest Inventory',
            description: 'Comprehensive forest canopy and vegetation assessment',
            category: 'forest' as any,
            ecosystem_type: 'forest' as any,
            difficulty_level: 'intermediate' as any,
            estimated_duration: 45,
            sampling_design: {
              pattern: 'systematic' as any,
              total_points: 25,
              point_spacing: 10,
              transect_length: null,
              plot_size: null,
              buffer_distance: 5,
              randomization: false
            },
            tools: {
              canopy_enabled: true,
              horizontal_enabled: true,
              ground_enabled: true,
              canopy_config: {},
              horizontal_config: {},
              ground_config: {}
            }
          };
          break;
        case 'grassland_assessment':
          presetProtocol = {
            id: 'grassland_assessment',
            name: 'Grassland Assessment',
            description: 'Point-intercept method for grassland vegetation analysis',
            category: 'grassland' as any,
            ecosystem_type: 'grassland' as any,
            difficulty_level: 'beginner' as any,
            estimated_duration: 25,
            sampling_design: {
              pattern: 'point_intercept' as any,
              total_points: 50,
              point_spacing: 5,
              transect_length: null,
              plot_size: null,
              buffer_distance: 2,
              randomization: false
            },
            tools: {
              canopy_enabled: false,
              horizontal_enabled: true,
              ground_enabled: true,
              canopy_config: {},
              horizontal_config: {},
              ground_config: {}
            }
          };
          break;
        case 'riparian_survey':
          presetProtocol = {
            id: 'riparian_survey',
            name: 'Riparian Survey',
            description: 'Transect-based riparian zone vegetation assessment',
            category: 'riparian' as any,
            ecosystem_type: 'riparian' as any,
            difficulty_level: 'advanced' as any,
            estimated_duration: 60,
            sampling_design: {
              pattern: 'transect' as any,
              total_points: 15,
              point_spacing: 20,
              transect_length: 300,
              plot_size: null,
              buffer_distance: 10,
              randomization: false
            },
            tools: {
              canopy_enabled: true,
              horizontal_enabled: true,
              ground_enabled: true,
              canopy_config: {},
              horizontal_config: {},
              ground_config: {}
            }
          };
          break;
      }

      if (presetProtocol) {
        handleProtocolSelect(presetProtocol);
      }
    }

    // Check for tool parameter in URL
    const toolParam = urlParams.get('tool') as ToolType;
    if (toolParam && ['canopy', 'horizontal_vegetation', 'daubenmire'].includes(toolParam)) {
      setSelectedTool(toolParam);
    }
  }, []);

  // Protocol handling functions
  const handleProtocolSelect = (protocol: ProtocolTemplate) => {
    setSelectedProtocol(protocol);
    setShowProtocolSelector(false);
    
    // Initialize protocol progress
    setProtocolProgress({
      currentPointIndex: 0,
      completedPoints: [],
      completedMeasurements: {},
      startTime: new Date(),
      issues: []
    });
    
    // Set tool based on protocol's first required tool
    const firstTool = protocol.tools?.canopy_enabled ? 'canopy' : 
                     protocol.tools?.horizontal_enabled ? 'horizontal_vegetation' : 
                     protocol.tools?.ground_enabled ? 'daubenmire' : 'canopy';
    setSelectedTool(firstTool);
    
    toast({
      title: "Protocol Selected",
      description: `Following ${protocol.name} protocol with ${protocol.sampling_design?.total_points || 0} points`,
    });
  };

  const handleProtocolProgress = (pointIndex: number, toolType: ToolType, completed: boolean) => {
    if (!protocolProgress) return;
    
    const newProgress = { ...protocolProgress };
    const measurementKey = `${pointIndex}-${toolType}`;
    
    if (completed) {
      newProgress.completedMeasurements[measurementKey] = true;
      if (!newProgress.completedPoints.includes(pointIndex)) {
        // Check if all required measurements for this point are complete
        const protocol = selectedProtocol;
        if (protocol) {
          const requiredMeasurements = [];
          if (protocol.tools?.canopy_enabled) requiredMeasurements.push(`${pointIndex}-canopy`);
          if (protocol.tools?.horizontal_enabled) requiredMeasurements.push(`${pointIndex}-horizontal_vegetation`);
          if (protocol.tools?.ground_enabled) requiredMeasurements.push(`${pointIndex}-daubenmire`);
          
          const allComplete = requiredMeasurements.every(key => newProgress.completedMeasurements[key]);
          if (allComplete) {
            newProgress.completedPoints.push(pointIndex);
            newProgress.currentPointIndex = Math.min(pointIndex + 1, (protocol.sampling_design?.total_points || 1) - 1);
          }
        }
      }
    }
    
    setProtocolProgress(newProgress);
  };

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      console.log('🔄 Starting session creation with data:', sessionData);
      
      // Add current site information to session data
      if (currentSite) {
        sessionData.siteName = currentSite.name;
        sessionData.latitude = currentSite.latitude;
        sessionData.longitude = currentSite.longitude;
        sessionData.altitude = currentSite.altitude;
        sessionData.sitePhotoUrl = currentSite.photoUrl;
        console.log('📍 Added site data:', { siteName: sessionData.siteName, lat: sessionData.latitude, lon: sessionData.longitude });
      }
      
      // Add real-time GPS data including altitude if available
      if (currentGPS) {
        sessionData.latitude = currentGPS.latitude;
        sessionData.longitude = currentGPS.longitude;
        if (currentGPS.altitude !== null && currentGPS.altitude !== undefined) {
          sessionData.altitude = currentGPS.altitude;
        }
        console.log('🛰️ Added GPS data:', { lat: sessionData.latitude, lon: sessionData.longitude, alt: sessionData.altitude });
      }
      
      // Add protocol information to session data
      if (selectedProtocol) {
        sessionData.protocolId = selectedProtocol.id;
        sessionData.protocolName = selectedProtocol.name;
        sessionData.protocolProgress = protocolProgress;
        console.log('📋 Added protocol data:', { protocolId: sessionData.protocolId, protocolName: sessionData.protocolName });
      }
      
      console.log('📤 Sending request to API with final data:', sessionData);
      
      const response = await apiRequest("/api/analysis-sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
        headers: { "Content-Type": "application/json" },
      });
      
      const result = await response.json();
      console.log('📥 API response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Session created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-sessions"] });
      
      // Update protocol progress
      if (selectedProtocol && protocolProgress) {
        handleProtocolProgress(protocolProgress.currentPointIndex, selectedTool, true);
      }
      
      // Show success message - don't navigate immediately
      toast({
        title: "Analysis Complete",
        description: `Session ${data.id} saved to history. Results shown below.`,
      });
      
      // Don't navigate immediately - let user see results first
      console.log('Results should be visible in the UI now');
    },
    onError: (error) => {
      console.error('Full error object:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error message:', errorMessage);
      toast({
        title: "Error creating session",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleCanopyAnalysis = async (method: 'GLAMA' | 'Canopeo') => {
    if (!selectedImage) {
      toast({
        title: "Missing Requirements",
        description: "Please upload an image first",
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

      // Get GPS location if available
      let gpsData: { latitude: number | null; longitude: number | null } = { latitude: null, longitude: null };
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        gpsData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (error) {
        console.log('GPS not available, continuing without location');
      }

      const sessionData = {
        siteName: currentSite?.name || 'Untitled Location',
        plotName: currentSite?.name || `Untitled Location ${new Date().toLocaleDateString()}`,
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
        latitude: currentSite?.latitude || gpsData.latitude,
        longitude: currentSite?.longitude || gpsData.longitude,
        isCompleted: true,
      };

      console.log('🔥 CANOPY ANALYSIS: Creating session with data:', sessionData);
      console.log('Session data keys:', Object.keys(sessionData));
      console.log('ImageUrl value:', sessionData.imageUrl);
      console.log('PixelsAnalyzed value:', sessionData.pixelsAnalyzed);
      console.log('About to call createSessionMutation.mutate...');
      
      // Store results for display in data sheet
      const analysisResults = {
        ...sessionData,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Setting analysis results:', analysisResults);
      
      // Ensure we set the results BEFORE calling the mutation
      setCurrentAnalysisResults(analysisResults);
      
      // Give UI time to update
      setTimeout(() => {
        console.log('Results should now be visible in UI');
        console.log('Current analysis results state:', analysisResults);
      }, 100);
      
      toast({
        title: "Analysis Complete",
        description: `Canopy cover: ${results.canopyCover.toFixed(1)}%, Light transmission: ${results.lightTransmission.toFixed(1)}%`,
      });

      // Reset photo for next measurement
      setSelectedImage(null);
      setCanopyHeight("");
 
      console.log('🚀 CALLING createSessionMutation.mutate for CANOPY analysis');
      createSessionMutation.mutate(sessionData);
      
      // Show option to name site if untitled
      if (currentSite?.name === "Untitled Location") {
        setTimeout(() => {
          toast({
            title: "Analysis Complete",
            description: "Would you like to name this location?",
            action: (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSiteCreator(true)}
              >
                Name Site
              </Button>
            ),
            duration: 10000,
          });
        }, 1000);
      }
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

  const handleHorizontalVegetationAnalysis = async (results: HorizontalVegetationAnalysis) => {
    // Get GPS location if available
    let gpsData: { latitude: number | null; longitude: number | null } = { latitude: null, longitude: null };
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      gpsData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      console.log('GPS not available, continuing without location');
    }

    const sessionData = {
      plotName: currentSite?.name || `Untitled Location ${new Date().toLocaleDateString()}`,
      imageUrl: "", // Will be set by the tool
      toolType: 'horizontal_vegetation',
      analysisMethod: "Digital Robel Pole",
      pixelsAnalyzed: 0,
      latitude: currentSite?.latitude || gpsData.latitude,
      longitude: currentSite?.longitude || gpsData.longitude,
      horizontalVegetationData: results,
      isCompleted: true,
    };

    createSessionMutation.mutate(sessionData);
    
    // Reset image selections to allow repeat measurements
    setSelectedImage(null);

    // Show option to name site if untitled
    if (currentSite?.name === "Untitled Location") {
      setTimeout(() => {
        toast({
          title: "Analysis Complete",
          description: "Would you like to name this location?",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSiteCreator(true)}
            >
              Name Site
            </Button>
          ),
          duration: 10000,
        });
      }, 1000);
    }
  };

  const handleDaubenmireAnalysis = async (results: DaubenmireResult, imageUrl?: string) => {
    // Get GPS location if available
    let gpsData: { latitude: number | null; longitude: number | null } = { latitude: null, longitude: null };
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      gpsData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      console.log('GPS not available, continuing without location');
    }

    const sessionData = {
      siteName: currentSite?.name || 'Untitled Location',
      plotName: currentSite?.name || `Untitled Location ${new Date().toLocaleDateString()}`,
      imageUrl: imageUrl || "/placeholder.jpg",
      toolType: 'daubenmire',
      analysisMethod: "Frame-free Analysis",
      pixelsAnalyzed: results.samplingArea * 1000000, // Convert m² to approximate pixels
      processingTime: results.processingTime,
      latitude: currentSite?.latitude || gpsData.latitude,
      longitude: currentSite?.longitude || gpsData.longitude,
      // Daubenmire specific fields
      totalCoverage: results.totalCoverage,
      speciesDiversity: results.speciesDiversity,
      bareGroundPercentage: results.bareGroundPercentage,
      litterPercentage: results.litterPercentage,
      rockPercentage: results.rockPercentage,
      shannonIndex: results.shannonIndex,
      evennessIndex: results.evennessIndex,
      dominantSpecies: results.dominantSpecies,
      isCompleted: true,
    };

    console.log('🌱 DAUBENMIRE ANALYSIS: Creating session with data:', sessionData);
    
    // Store results for display in data sheet
    setCurrentAnalysisResults({
      ...sessionData,
      timestamp: new Date().toISOString(),
    });
    
    toast({
      title: "Daubenmire Analysis Complete", 
      description: `Total coverage: ${results.totalCoverage.toFixed(1)}%, Species diversity: ${results.speciesDiversity}`,
    });

    console.log('🚀 CALLING createSessionMutation.mutate for DAUBENMIRE analysis');
    createSessionMutation.mutate(sessionData);

    // Reset any selected images for repeat measurements
    setSelectedImage(null);

    // Show option to name site if untitled
    if (currentSite?.name === "Untitled Location") {
      setTimeout(() => {
        toast({
          title: "Analysis Complete",
          description: "Would you like to name this location?",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSiteCreator(true)}
            >
              Name Site
            </Button>
          ),
          duration: 10000,
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Protocol Selection disabled per user request */}

        {/* Protocol Progress */}
        {selectedProtocol && protocolProgress && (
          <Card className="border-2 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  {selectedProtocol.name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {protocolProgress.completedPoints.length} / {selectedProtocol.sampling_design?.total_points || 0}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProtocol(null);
                      setProtocolProgress(null);
                      setShowProtocolSelector(false);
                      toast({
                        title: "Protocol Cleared",
                        description: "You can now measure without protocol restrictions",
                      });
                    }}
                  >
                    Clear Protocol
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProtocolProgress 
                protocol={selectedProtocol}
                progress={protocolProgress}
                currentGPS={currentGPS}
              />
            </CardContent>
          </Card>
        )}

        {/* Site Selection - Optional */}
        {!currentSite && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Ready to Measure</h3>
                <p className="text-sm text-muted-foreground">
                  Start measuring immediately or create a named site first
                </p>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => {
                      // Create untitled site and proceed
                      const untitledSite: SiteInfo = {
                        name: "Untitled Location",
                        latitude: 0,
                        longitude: 0,
                        createdAt: new Date(),
                        sessionCounts: { canopy: 0, horizontal_vegetation: 0, daubenmire: 0 }
                      };
                      setCurrentSite(untitledSite);
                    }}
                    className="w-full"
                    variant="default"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Without Site
                  </Button>
                  <Button 
                    onClick={() => setShowSiteCreator(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Create Named Site
                  </Button>
                </div>
                
                {showSiteCreator && (
                  <div className="mt-4">
                    <SiteSelector 
                      currentSite={currentSite}
                      onSiteChange={(site) => {
                        setCurrentSite(site);
                        setShowSiteCreator(false);
                        localStorage.setItem('current-research-site', JSON.stringify(site));
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tool Selection - Always Visible */}
        <Card className="border-2 border-blue-500">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Choose Your Measurement Tool
              </div>
              {selectedProtocol && (
                <Badge variant="outline" className="text-xs">
                  Protocol: {selectedProtocol.name}
                </Badge>
              )}
            </CardTitle>
            <div className="grid gap-4">
              <div 
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTool === 'canopy' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-800/40 dark:text-foreground' 
                    : (!selectedProtocol || selectedProtocol.tools?.canopy_enabled)
                      ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (!selectedProtocol || selectedProtocol.tools?.canopy_enabled) {
                    setSelectedTool('canopy');
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <TreePine className={`h-8 w-8 ${(!selectedProtocol || selectedProtocol.tools?.canopy_enabled) ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Canopy Cover Analysis</h3>
                      {selectedProtocol && !selectedProtocol.tools?.canopy_enabled && (
                        <Badge variant="secondary" className="text-xs">Disabled</Badge>
                      )}
                      {selectedProtocol && selectedProtocol.tools?.canopy_enabled && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Standard method for gap light measurement</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTool === 'horizontal_vegetation' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : (!selectedProtocol || selectedProtocol.tools?.horizontal_enabled)
                      ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (!selectedProtocol || selectedProtocol.tools?.horizontal_enabled) {
                    setSelectedTool('horizontal_vegetation');
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <Layers className={`h-8 w-8 ${(!selectedProtocol || selectedProtocol.tools?.horizontal_enabled) ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Horizontal Vegetation</h3>
                      {selectedProtocol && !selectedProtocol.tools?.horizontal_enabled && (
                        <Badge variant="secondary" className="text-xs">Disabled</Badge>
                      )}
                      {selectedProtocol && selectedProtocol.tools?.horizontal_enabled && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Multi-height density analysis</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTool === 'daubenmire' 
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                    : (!selectedProtocol || selectedProtocol.tools?.ground_enabled)
                      ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (!selectedProtocol || selectedProtocol.tools?.ground_enabled) {
                    setSelectedTool('daubenmire');
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <Grid3X3 className={`h-8 w-8 ${(!selectedProtocol || selectedProtocol.tools?.ground_enabled) ? 'text-amber-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Ground Cover Analysis</h3>
                      {selectedProtocol && !selectedProtocol.tools?.ground_enabled && (
                        <Badge variant="secondary" className="text-xs">Disabled</Badge>
                      )}
                      {selectedProtocol && selectedProtocol.tools?.ground_enabled && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Advanced ground cover method</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Site Selection and Info */}
        {currentSite && (
          <Card>
            <CardHeader className="space-y-4">
              {showSiteCreator && currentSite.name === "Untitled Location" && (
                <div className="mb-4">
                  <SiteSelector 
                    currentSite={null}
                    onSiteChange={(site) => {
                      setCurrentSite(site);
                      setShowSiteCreator(false);
                      localStorage.setItem('current-research-site', JSON.stringify(site));
                    }}
                  />
                </div>
              )}
              
              {/* Current Location Info */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{currentSite.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {currentSite.name === "Untitled Location" 
                        ? "GPS will be logged with each measurement"
                        : (currentSite.latitude !== 0 || currentSite.longitude !== 0 
                          ? `${currentSite.latitude.toFixed(4)}°, ${currentSite.longitude.toFixed(4)}°`
                          : "No coordinates set")
                      }
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {currentSite.name === "Untitled Location" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSiteCreator(true)}
                    >
                      Name Site
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setCurrentSite(null);
                      setShowSiteCreator(false);
                      localStorage.removeItem('current-research-site');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Streamlined Tool Interface */}
        {selectedTool === 'canopy' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TreePine className="h-5 w-5 mr-2" />
                Canopy Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Setup Guide with Visual Diagram */}
              <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                <h4 className="font-medium flex items-center mb-3 text-sm">
                  <Target className="w-4 h-4 mr-2" />
                  Canopy Cover Analysis Setup Guide
                </h4>
                
                {/* Visual Diagram */}
                <div className="mb-4 p-3 bg-background/50 rounded-lg border">
                  <div className="text-center space-y-2">
                    <div className="text-xs font-medium mb-2">Side View - Proper Camera Position</div>
                    <div className="relative w-full h-24 bg-gradient-to-b from-sky-200 to-green-200 rounded-lg overflow-hidden">
                      {/* Sky with canopy */}
                      <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-sky-300 to-sky-200">
                        <div className="absolute top-4 left-2 w-8 h-6 bg-green-600 rounded-full opacity-80"></div>
                        <div className="absolute top-2 left-12 w-12 h-8 bg-green-700 rounded-full opacity-70"></div>
                        <div className="absolute top-6 left-24 w-6 h-4 bg-green-500 rounded-full opacity-60"></div>
                      </div>
                      {/* Ground level */}
                      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-green-300 to-green-200">
                        {/* Person with camera */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <div className="w-2 h-8 bg-amber-600 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-800 rounded-full mt-1 ml-0.5"></div>
                          <div className="text-xs mt-1 text-center font-medium">1.3m</div>
                        </div>
                        {/* Height indicator */}
                        <div className="absolute bottom-0 right-4 w-px h-12 bg-gray-600"></div>
                        <div className="absolute bottom-12 right-3 text-xs">Camera Height</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">Setup Instructions:</div>
                  <p>• Hold camera at 1.3m height (standard breast height)</p>
                  <p>• Point camera directly upward toward canopy</p>
                  <p>• Ensure camera is level and perpendicular to ground</p>
                  <p>• Take photo during overcast conditions for best results</p>
                  <p>• Avoid direct sunlight to prevent glare and shadows</p>
                  
                  <div className="font-medium text-foreground mt-2 mb-1">Accuracy Specifications:</div>
                  <p>• Standard method accuracy: ±2-3% for canopy cover</p>
                  <p>• GPS accuracy requirement: ±3m or better</p>
                  <p>• LAI estimation: ±0.3 deciduous, ±0.5 coniferous</p>
                </div>
              </div>

              {/* GPS Accuracy Indicator */}
              <GPSAccuracyIndicator 
                className="mb-2" 
                onAccuracyUpdate={(gpsData) => {
                  if (gpsData.latitude && gpsData.longitude) {
                    setCurrentGPS({
                      latitude: gpsData.latitude,
                      longitude: gpsData.longitude,
                      altitude: gpsData.altitude || undefined,
                      accuracy: gpsData.accuracy || undefined,
                      altitudeAccuracy: gpsData.altitudeAccuracy || undefined
                    });
                  }
                }} 
              />

              {/* Single Unified Photo Upload - Only show when no results */}
              {!currentAnalysisResults && (
                <ImageUpload 
                  onImageUploaded={setSelectedImage} 
                  onBatchUploaded={(images) => {
                    if (images.length > 1) {
                      // Process multiple images for batch analysis
                      toast({
                        title: "Multiple Images Selected",
                        description: `${images.length} images ready for analysis`,
                      });
                      // For now, just use the first image for single analysis
                      // TODO: Implement batch canopy analysis
                      setSelectedImage(images[0]);
                    } else {
                      setSelectedImage(images[0]);
                    }
                  }}
                  currentImage={selectedImage?.url}
                  allowBatch={true}
                />
              )}

              {/* Optional Height Entry - Available before analysis */}
              {selectedImage && !currentAnalysisResults && (
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

              {/* Auto-analyze on upload or show analyze button */}
              {selectedImage && !currentAnalysisResults && (
                <Button 
                  onClick={() => handleCanopyAnalysis('GLAMA')}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isProcessing ? "Analyzing..." : "Analyze"}
                </Button>
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
                        {currentAnalysisResults.toolType === 'canopy' && (
                          <>
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
                          </>
                        )}
                        {currentAnalysisResults.toolType === 'daubenmire' && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Total Coverage:</span>
                              <span className="text-sm font-mono">
                                {currentAnalysisResults.totalCoverage?.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Species Diversity:</span>
                              <span className="text-sm font-mono">
                                {currentAnalysisResults.speciesDiversity}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Bare Ground:</span>
                              <span className="text-sm font-mono">
                                {currentAnalysisResults.bareGroundPercentage?.toFixed(1)}%
                              </span>
                            </div>
                          </>
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
                            {(currentAnalysisResults.processingTime / 1000)?.toFixed(2)}s
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
                        {currentAnalysisResults.toolType === 'daubenmire' && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Litter:</span>
                              <span className="text-sm font-mono">
                                {currentAnalysisResults.litterPercentage?.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Shannon Index:</span>
                              <span className="text-sm font-mono">
                                {currentAnalysisResults.shannonIndex?.toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Site: {currentSite?.name || currentAnalysisResults.siteName || 'Untitled Location'}</span>
                        <span>Method: {currentAnalysisResults.analysisMethod}</span>
                      </div>
                      {(currentGPS?.altitude || currentSite?.altitude) && (
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span>Altitude: {(currentGPS?.altitude || currentSite?.altitude)?.toFixed(1)}m</span>
                          <span>
                            GPS: {currentGPS?.latitude?.toFixed(6)}, {currentGPS?.longitude?.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        onClick={() => setLocation('/analysis')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        View Full Analysis
                      </Button>
                      <Button 
                        onClick={() => setLocation('/history')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        View History
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset button to analyze another image */}
              {currentAnalysisResults && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={() => {
                      setCurrentAnalysisResults(null);
                      setSelectedImage(null);
                      setCanopyHeight("");
                    }}
                    variant="outline" 
                    className="w-full"
                    size="lg"
                  >
                    Analyze Another Image
                  </Button>
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
          analysisType={selectedTool}
        />
      </div>

      <BottomNavigation />
    </div>
  );
}