import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TreePine, 
  Camera, 
  BarChart3, 
  MapPin, 
  History, 
  Sun,
  Moon,
  Eye,
  Grid3X3,
  Target,
  Layers,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import type { ToolType } from "@/components/tool-selector";
import ImageUpload from "@/components/image-upload";
import HorizontalVegetationTool from "@/components/horizontal-vegetation-tool";
import DaubenmireTool from "@/components/daubenmire-tool";
import ProcessingModal from "@/components/processing-modal";
import BottomNavigation from "@/components/bottom-navigation";
import SiteSelector from "@/components/site-selector";
import GPSAccuracyIndicator from "@/components/gps-accuracy-indicator";
import ExportManager from "@/components/export-manager";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import EcoMeasureLogo from "@/components/eco-measure-logo";

import { analyzeCanopyImage, validateImage } from "@/lib/image-processing";
import type { HorizontalVegetationAnalysis } from "@/lib/horizontal-vegetation";
import type { DaubenmireResult } from "@/lib/daubenmire-frame";
import { AnalysisSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
// Dark theme is now set by default in App.tsx

interface SiteInfo {
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  photoUrl?: string;
  notes?: string;
  createdAt: Date;
  sessionCounts: {
    canopy: number;
    horizontal_vegetation: number;
    daubenmire: number;
  };
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // Tool selection state
  const [selectedTool, setSelectedTool] = useState<ToolType>('canopy');
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent sessions for dashboard
  const { data: sessions = [], isLoading } = useQuery<AnalysisSession[]>({
    queryKey: ["/api/analysis-sessions"],
  });

  // Get recent sessions (last 5)
  const recentSessions = sessions.slice(0, 5);

  // Tool configuration for home page
  const tools = [
    {
      id: 'canopy',
      title: 'Canopy Cover Analysis',
      description: 'Upload hemispherical photos for canopy analysis',
      route: '/tools?tool=canopy',
      icon: TreePine,
      features: ['GLAMA & Canopeo algorithms', 'GPS integration', 'Height estimation'],
      lightColor: 'bg-green-100',
      darkColor: 'bg-green-900/20',
      textColor: 'text-green-600'
    },
    {
      id: 'horizontal_vegetation',
      title: 'Horizontal Vegetation',
      description: 'Multi-height photo analysis for vegetation density',
      route: '/tools?tool=horizontal_vegetation',
      icon: Eye,
      features: ['Digital Robel pole', 'Multiple heights', 'Cover analysis'],
      lightColor: 'bg-blue-100',
      darkColor: 'bg-blue-900/20',
      textColor: 'text-blue-600'
    },
    {
      id: 'daubenmire',
      title: 'Ground Cover Analysis',
      description: 'Detailed ground cover classification',
      route: '/tools?tool=daubenmire',
      icon: Grid3X3,
      features: ['Species diversity', 'Shannon index', 'Ground classification'],
      lightColor: 'bg-purple-100',
      darkColor: 'bg-purple-900/20',
      textColor: 'text-purple-600'
    }
  ];

  // Scroll to top when tool changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedTool]);

  // Load current site from localStorage
  useEffect(() => {
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
  }, []);

  // Save current site to localStorage when it changes
  const handleSiteChange = (site: SiteInfo) => {
    setCurrentSite(site);
    localStorage.setItem('current-research-site', JSON.stringify(site));
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
    onSuccess: async (data) => {
      console.log('✅ Session created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-sessions"] });
      
      // Also store in localStorage for offline support and history synchronization
      try {
        const existingSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const updatedSessions = [data, ...existingSessions];
        localStorage.setItem('sessions', JSON.stringify(updatedSessions));
        console.log('📱 Session also saved to localStorage for offline access');
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
      
      // Show success message - don't navigate immediately
      toast({
        title: "Analysis Complete",
        description: `Session ${data.id} saved to history. Results shown below.`,
      });
      
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

      // Get GPS location if available - simple and reliable
      let gpsData: { latitude: number | null; longitude: number | null } = { latitude: null, longitude: null };
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('GPS not supported'));
            return;
          }
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
      
      // Store results for display in data sheet
      const analysisResults = {
        ...sessionData,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Setting analysis results:', analysisResults);
      
      // Ensure we set the results BEFORE calling the mutation
      setCurrentAnalysisResults(analysisResults);
      
      toast({
        title: "Analysis Complete",
        description: `Canopy cover: ${results.canopyCover.toFixed(1)}%, Light transmission: ${results.lightTransmission.toFixed(1)}%`,
      });

      // Reset photo for next measurement
      setSelectedImage(null);
      setCanopyHeight("");

      console.log('🚀 CALLING createSessionMutation.mutate for CANOPY analysis');
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

  const handleHorizontalVegetationAnalysis = async (results: HorizontalVegetationAnalysis) => {
    // Get GPS location if available - now uses centralized helper
    let gpsData: GpsPosition | null = null;
    try {
      gpsData = await getCurrentLocation();
    } catch (error) {
      console.log('GPS not available, continuing without location');
    }

    const sessionData = {
      plotName: currentSite?.name || `Untitled Location ${new Date().toLocaleDateString()}`,
      imageUrl: "", // Will be set by the tool
      toolType: 'horizontal_vegetation',
      analysisMethod: "Digital Robel Pole",
      pixelsAnalyzed: 0,
      latitude: currentSite?.latitude || gpsData?.coords.latitude,
      longitude: currentSite?.longitude || gpsData?.coords.longitude,
      horizontalVegetationData: results,
      isCompleted: true,
    };

    createSessionMutation.mutate(sessionData);
    
    // Reset image selections to allow repeat measurements
    setSelectedImage(null);
  };

  const handleDaubenmireAnalysis = async (results: DaubenmireResult, imageUrl?: string) => {
    // Get GPS location if available - now uses centralized helper
    let gpsData: GpsPosition | null = null;
    try {
      gpsData = await getCurrentLocation();
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
      latitude: currentSite?.latitude || gpsData?.coords.latitude,
      longitude: currentSite?.longitude || gpsData?.coords.longitude,
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
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-black text-white pt-6 pb-12 shadow relative z-10 flex flex-col items-center">
        {/* Theme Toggle button top-right */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleTheme}
            className="text-white hover:bg-white/20 backdrop-blur-sm bg-white/10 border border-white/20"
          >
            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </div>

        {/* Centered brand logo */}
        <EcoMeasureLogo size={160} />
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Site Selector */}
        <SiteSelector 
          currentSite={currentSite}
          onSiteChange={handleSiteChange}
        />

        {/* Tool Selection */}
        <Card className="border-2 border-blue-500">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Choose Your Measurement Tool
              </div>
            </CardTitle>
            <div className="grid gap-4">
              <div 
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTool === 'canopy' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-800/40 dark:text-foreground' 
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
                onClick={() => setSelectedTool('canopy')}
              >
                <div className="flex items-center space-x-4">
                  <TreePine className="h-8 w-8 text-green-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Canopy Cover Analysis</h3>
                    <p className="text-sm text-muted-foreground">Standard method for gap light measurement</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTool === 'horizontal_vegetation' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
                onClick={() => setSelectedTool('horizontal_vegetation')}
              >
                <div className="flex items-center space-x-4">
                  <Layers className="h-8 w-8 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Horizontal Vegetation</h3>
                    <p className="text-sm text-muted-foreground">Multi-height density analysis</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTool === 'daubenmire' 
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
                onClick={() => setSelectedTool('daubenmire')}
              >
                <div className="flex items-center space-x-4">
                  <Grid3X3 className="h-8 w-8 text-amber-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Ground Cover Analysis</h3>
                    <p className="text-sm text-muted-foreground">Advanced ground cover method</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tool Interface Section */}
        {selectedTool === 'canopy' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TreePine className="h-5 w-5 mr-2" />
                Canopy Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {/* Photo Upload */}
              {!currentAnalysisResults && (
                <ImageUpload 
                  onImageUploaded={setSelectedImage} 
                  currentImage={selectedImage?.url}
                />
              )}

              {/* Optional Height Entry */}
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

              {/* Analyze Button */}
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

              {/* Analysis Results */}
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
                      </div>
                    </div>
                  </div>
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

        {/* Processing Modal */}
        <ProcessingModal
          isOpen={isProcessing}
          onClose={() => setIsProcessing(false)}
          progress={progress}
          stage={currentStage}
          canCancel={true}
          onCancel={() => setIsProcessing(false)}
          analysisType={selectedTool}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </span>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/history')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border cursor-pointer hover:bg-accent/20 transition-colors"
                    onClick={() => setLocation(`/analysis?id=${session.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {session.toolType === 'canopy' && <TreePine className="h-4 w-4 text-green-600" />}
                        {session.toolType === 'horizontal_vegetation' && <Eye className="h-4 w-4 text-blue-600" />}
                        {session.toolType === 'daubenmire' && <Grid3X3 className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{session.plotName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.timestamp), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {session.canopyCover && (
                        <p className="text-sm font-medium">{session.canopyCover.toFixed(1)}%</p>
                      )}
                      <Badge variant={session.isCompleted ? "default" : "secondary"} className="text-xs">
                        {session.isCompleted ? "Complete" : "In Progress"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start your first measurement to see results here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}