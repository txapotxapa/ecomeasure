import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TreePine, 
  Eye,
  Grid3X3,
  CheckCircle,
  History,
  ArrowRight,
  Sun,
  Moon
} from "lucide-react";
import { useLocation as useAppLocation } from "wouter";
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
import { useLocation } from "@/hooks/use-location";

import { analyzeCanopyImage, validateImage } from "@/lib/image-processing";
import type { HorizontalVegetationAnalysis } from "@/lib/horizontal-vegetation";
import type { DaubenmireResult } from "@/lib/daubenmire-frame";
import { AnalysisSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
  const [, setLocation] = useAppLocation();
  const { theme, toggleTheme } = useTheme();
  
  const [selectedTool, setSelectedTool] = useState<ToolType>('canopy');
  const [selectedImage, setSelectedImage] = useState<{ url: string; file: File } | null>(null);
  const [canopyHeight, setCanopyHeight] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null);
  const [currentAnalysisResults, setCurrentAnalysisResults] = useState<any>(null);
  const [showSiteCreator, setShowSiteCreator] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { position: currentPosition, getCurrentLocation } = useLocation();

  const { data: sessions = [], isLoading } = useQuery<AnalysisSession[]>({
    queryKey: ["/api/analysis-sessions"],
  });

  const recentSessions = sessions.slice(0, 5);

  const tools = [
    {
      id: 'canopy',
      title: 'Canopy Cover Analysis',
      description: 'Upload hemispherical photos for canopy analysis',
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
      icon: Grid3X3,
      features: ['Species diversity', 'Shannon index', 'Ground classification'],
      lightColor: 'bg-purple-100',
      darkColor: 'bg-purple-900/20',
      textColor: 'text-purple-600'
    }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedTool]);

  useEffect(() => {
    const savedCurrentSite = localStorage.getItem('current-research-site');
    if (savedCurrentSite) {
      try {
        const siteData = JSON.parse(savedCurrentSite);
        setCurrentSite({ ...siteData, createdAt: new Date(siteData.createdAt) });
      } catch (error) { console.error('Error loading current site:', error); }
    }
  }, []);

  const handleSiteChange = (site: SiteInfo) => {
    setCurrentSite(site);
    localStorage.setItem('current-research-site', JSON.stringify(site));
  };

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("/api/analysis-sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-sessions"] });
      toast({
        title: "Analysis Complete",
        description: `Session ${data.id} saved to history.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const performAnalysis = async (type: ToolType, analysisFn: () => Promise<any>, additionalData: object = {}) => {
    setIsProcessing(true);
    setCurrentStage("Getting location...");
    setProgress(10);

    try {
      const location = await getCurrentLocation();
      if (!location) {
        toast({ title: "Location Error", description: "Could not get GPS location.", variant: "destructive" });
        return;
      }

      setCurrentStage("Analyzing...");
      setProgress(50);
      const results = await analysisFn();
      setCurrentAnalysisResults(results);
      
      setProgress(95);
      setCurrentStage("Saving session...");

      const sessionData = {
        type,
        results,
        siteName: currentSite?.name,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        ...additionalData,
      };

      createSessionMutation.mutate(sessionData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStage("");
    }
  };


  const handleCanopyAnalysis = async (method: 'GLAMA' | 'Canopeo') => {
    if (!selectedImage) {
      toast({ title: "Missing Image", description: "Please upload an image first.", variant: "destructive" });
      return;
    }
    const validation = validateImage(selectedImage.file);
    if (!validation.isValid) {
      toast({ title: "Invalid Image", description: validation.error, variant: "destructive" });
      return;
    }
    
    await performAnalysis('canopy', async () => {
        const formData = new FormData();
        formData.append("image", selectedImage.file);
        const uploadResponse = await fetch("/api/upload-image", { method: "POST", body: formData });
        if (!uploadResponse.ok) throw new Error("Image upload failed");
        const { url: uploadedImageUrl } = await uploadResponse.json();
        
        const analysisResults = await analyzeCanopyImage(selectedImage.url, method, (p, s) => {
            setProgress(50 + p * 0.4);
            setCurrentStage(s);
        });
        analysisResults.canopyHeight = Number(canopyHeight) || null;
        return { ...analysisResults, imageUrl: uploadedImageUrl };
    });
  };

  const handleHorizontalVegetationAnalysis = (results: HorizontalVegetationAnalysis) => {
    performAnalysis('horizontal_vegetation', async () => results);
  };

  const handleDaubenmireAnalysis = (results: DaubenmireResult, imageUrl?: string) => {
    performAnalysis('daubenmire', async () => results, { imageUrl });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <EcoMeasureLogo className="h-8 w-8" />
              <h1 className="text-xl font-bold tracking-tight">EcoMeasure</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={toggleTheme} variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6 space-y-8">
        
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                  <p className="text-muted-foreground">
                    Welcome back! Start a new analysis or review past sessions.
                  </p>
                </div>
                <div className="flex-shrink-0">
                   <GPSAccuracyIndicator />
                </div>
            </div>
             <SiteSelector 
                currentSite={currentSite}
                onSiteChange={handleSiteChange}
                showCreator={showSiteCreator}
                setShowCreator={setShowSiteCreator}
                lastPosition={currentPosition}
             />
          </section>

          {currentAnalysisResults && (
            <Card className="bg-muted/30">
              <CardHeader><CardTitle>Last Analysis Results</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs bg-background p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(currentAnalysisResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <section id="tools" className="pt-4">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Analysis Tools</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Card 
                  key={tool.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${selectedTool === tool.id ? `ring-2 ring-primary ${tool.darkColor}` : ''}`}
                  onClick={() => setSelectedTool(tool.id as ToolType)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${tool.lightColor} ${tool.darkColor}`}>
                        <tool.icon className={`h-6 w-6 ${tool.textColor}`} />
                      </div>
                      <CardTitle>{tool.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{tool.description}</p>
                    <ul className="space-y-2 text-sm">
                      {tool.features.map(feat => (
                        <li key={feat} className="flex items-center gap-2">
                           <CheckCircle className="h-4 w-4 text-green-500" />
                           <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          <section className="pt-4">
             <Card className="min-h-[300px]">
                <CardContent className="p-6">
                    {selectedTool === 'canopy' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold">Canopy Cover Analysis</h3>
                            <ImageUpload onImageSelect={setSelectedImage} />
                            {selectedImage && (
                              <>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                  <Label htmlFor="canopy-height">Canopy Height (optional, meters)</Label>
                                  <Input 
                                    id="canopy-height" type="number" value={canopyHeight}
                                    onChange={(e) => setCanopyHeight(e.target.value)}
                                    placeholder="e.g., 15.5"
                                  />
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={() => handleCanopyAnalysis('GLAMA')} disabled={isProcessing}>Analyze with GLAMA</Button>
                                    <Button onClick={() => handleCanopyAnalysis('Canopeo')} disabled={isProcessing}>Analyze with Canopeo</Button>
                                </div>
                              </>
                            )}
                        </div>
                    )}
                    {selectedTool === 'horizontal_vegetation' && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Horizontal Vegetation Profile</h3>
                            <HorizontalVegetationTool onSubmit={handleHorizontalVegetationAnalysis} disabled={isProcessing} />
                        </div>
                    )}
                    {selectedTool === 'daubenmire' && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Ground Cover (Daubenmire Frame)</h3>
                            <DaubenmireTool onSubmit={handleDaubenmireAnalysis} disabled={isProcessing} />
                        </div>
                    )}
                </CardContent>
             </Card>
          </section>

          <section className="pt-4">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Activity</h2>
            {isLoading && <div className="space-y-4"><div className="h-20 bg-muted/40 rounded-lg animate-pulse"></div><div className="h-20 bg-muted/40 rounded-lg animate-pulse"></div></div>}
            {!isLoading && sessions.length === 0 && (
              <div className="text-center py-10 border rounded-lg">
                  <History className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">No sessions yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Perform an analysis to see its history here.</p>
              </div>
            )}
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <Card key={session.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-full">
                        {session.type === 'canopy' && <TreePine className="h-6 w-6 text-muted-foreground" />}
                        {session.type === 'horizontal_vegetation' && <Eye className="h-6 w-6 text-muted-foreground" />}
                        {session.type === 'daubenmire' && <Grid3X3 className="h-6 w-6 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{session.type.replace('_', ' ')} Analysis</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(session.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                         {session.siteName && <Badge variant="outline" className="mt-1">{session.siteName}</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setLocation(`/analysis?sessionId=${session.id}`)}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {sessions.length > 5 && (
              <div className="mt-4 text-center">
                 <Button variant="outline" onClick={() => setLocation('/history')}>View All History <History className="ml-2 h-4 w-4" /></Button>
              </div>
            )}
          </section>
          <ExportManager sessions={sessions} sites={[]} protocols={[]} />
        </div>
      </main>
      
      <ProcessingModal isOpen={isProcessing} progress={progress} stage={currentStage} />
      <BottomNavigation />
    </div>
  );
}