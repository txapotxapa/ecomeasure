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
  Settings, 
  Sun,
  Moon,
  Eye,
  Grid3X3,
  Target,
  Layers,
  CheckCircle,
  Clock
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
import ProtocolSelector from "@/components/protocol-selector";
import ProtocolProgress from "@/components/protocol-progress";
import ExportManager from "@/components/export-manager";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import EcoMeasureLogo from "@/components/eco-measure-logo";

import { analyzeCanopyImage, validateImage } from "@/lib/image-processing";
import type { HorizontalVegetationAnalysis } from "@/lib/horizontal-vegetation";
import type { DaubenmireResult } from "@/lib/daubenmire-frame";
// Protocol template type definition
interface ProtocolTemplate {
  id: string;
  name: string;
  description?: string;
  measurements: any[];
}
import { AnalysisSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import LocalStorageService from "@/lib/local-storage";
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
  };


  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-black text-white pt-6 pb-12 shadow relative z-10 flex flex-col items-center">
        {/* Settings and Theme Toggle buttons top-right */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleTheme}
            className="text-white hover:bg-white/20 backdrop-blur-sm bg-white/10 border border-white/20"
          >
            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
          
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLocation('/settings')}
            className="text-white hover:bg-white/20 backdrop-blur-sm bg-white/10 border border-white/20"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        {/* Centered brand logo */}
        <EcoMeasureLogo size={160} />
      </header>
      {/* Site Information block removed per branding simplification */}

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Quick Actions block removed */}

        {/* Site Selector */}
        <SiteSelector 
          currentSite={currentSite}
          onSiteChange={handleSiteChange}
        />

        {/* Quick Measurement Tools - Home Screen Access */}
        {currentSite ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Start Measurement
              </CardTitle>
              <CardDescription>
                Direct access to measurement tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button
                  className="h-16 justify-start space-x-4 bg-primary hover:bg-primary/90"
                  onClick={() => setLocation('/tools?tool=canopy')}
                >
                  <TreePine className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-medium">Canopy Cover Analysis</div>
                    <div className="text-xs opacity-90">Upload photo → instant analysis results</div>
                  </div>
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex-col space-y-1 card-topo"
                    onClick={() => setLocation('/tools?tool=horizontal_vegetation')}
                  >
                    <Layers className="h-5 w-5 text-primary" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Horizontal Vegetation</div>
                      <div className="text-xs text-muted-foreground">Multi-height photos</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col space-y-1 card-topo"
                    onClick={() => setLocation('/tools?tool=daubenmire')}
                  >
                    <Grid3X3 className="h-5 w-5 text-primary" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Ground Cover</div>
                      <div className="text-xs text-muted-foreground">Advanced method</div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setLocation('/tools')}
            >
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Measurement Tools
              </CardTitle>
              <CardDescription>
                Click to access measurement tools (site creation optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors hover:opacity-100"
                  onClick={() => setLocation(tool.route)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${tool.lightColor} dark:${tool.darkColor}`}>
                      <tool.icon className={`h-6 w-6 ${tool.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {tool.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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