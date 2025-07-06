import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TreePine, Camera, BarChart3, MapPin, Leaf } from "lucide-react";
import ImageUpload from "@/components/image-upload";
import LocationDisplay from "@/components/location-display";
import ProcessingModal from "@/components/processing-modal";
import ToolSelector, { ToolType } from "@/components/tool-selector";
import HorizontalVegetationTool from "@/components/horizontal-vegetation-tool";
import DaubenmireTool from "@/components/daubenmire-tool";
import { analyzeCanopyImage, validateImage } from "@/lib/image-processing";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedTool, setSelectedTool] = useState<ToolType>('canopy');
  const [selectedImage, setSelectedImage] = useState<{ url: string; file: File } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
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
        title: "Error",
        description: "Failed to save analysis session",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (imageData: { url: string; file: File }) => {
    setSelectedImage(imageData);
  };

  const handleCanopyAnalysis = async () => {
    if (!selectedImage) return;

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
      const results = await analyzeCanopyImage(selectedImage.file, {
        method: "GLAMA",
        zenithAngle: 90,
        onProgress: (progress, stage) => {
          setProgress(progress);
          setCurrentStage(stage);
        },
      });

      const sessionData = {
        plotName: `Canopy Analysis ${new Date().toLocaleDateString()}`,
        imageUrl: selectedImage.url,
        toolType: 'canopy',
        analysisMethod: "GLAMA",
        zenithAngle: 90,
        canopyCover: results.canopyCover,
        lightTransmission: results.lightTransmission,
        leafAreaIndex: results.leafAreaIndex,
        pixelsAnalyzed: results.pixelsAnalyzed,
        processingTime: results.processingTime,
        isCompleted: true,
      };

      createSessionMutation.mutate(sessionData);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHorizontalVegetationAnalysis = async (results: any) => {
    const sessionData = {
      plotName: `Horizontal Vegetation ${new Date().toLocaleDateString()}`,
      imageUrl: '', // Multiple images, we'll use first one's URL
      toolType: 'horizontal_vegetation',
      analysisMethod: 'Multi-height analysis',
      canopyCover: results.averageCover,
      pixelsAnalyzed: results.measurements.reduce((sum: number, m: any) => sum + m.pixelsAnalyzed, 0),
      processingTime: results.measurements.reduce((sum: number, m: any) => sum + m.processingTime, 0),
      horizontalVegetationData: results,
      isCompleted: true,
    };

    createSessionMutation.mutate(sessionData);
  };

  const handleDaubenmireAnalysis = async (results: any) => {
    const sessionData = {
      plotName: `Daubenmire Frame ${new Date().toLocaleDateString()}`,
      imageUrl: '', // Will be set when image is uploaded
      toolType: 'daubenmire',
      analysisMethod: 'Quadrat sampling',
      canopyCover: results.totalCoverage,
      pixelsAnalyzed: results.cells.reduce((sum: number, cell: any) => sum + (cell.width * cell.height), 0),
      processingTime: results.processingTime,
      daubenmireData: results,
      isCompleted: true,
    };

    createSessionMutation.mutate(sessionData);
  };

  const renderToolInterface = () => {
    switch (selectedTool) {
      case 'canopy':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TreePine className="w-5 h-5 mr-2" />
                Canopy Analysis
              </CardTitle>
              <CardDescription>
                Analyze forest canopy cover and light transmission using camera images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Camera Required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm">GPS Optional</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Real-time Analysis</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">1. Capture Image</h3>
                <ImageUpload onImageUploaded={handleImageUpload} currentImage={selectedImage?.url} />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">2. Location (Optional)</h3>
                <LocationDisplay />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">3. Analyze</h3>
                <Button 
                  onClick={handleCanopyAnalysis}
                  disabled={!selectedImage || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Leaf className="w-4 h-4 mr-2" />
                      Analyze Canopy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'horizontal_vegetation':
        return <HorizontalVegetationTool onAnalysisComplete={handleHorizontalVegetationAnalysis} />;
      
      case 'daubenmire':
        return <DaubenmireTool onAnalysisComplete={handleDaubenmireAnalysis} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ToolSelector
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
      />
      
      {renderToolInterface()}

      <ProcessingModal
        isOpen={isProcessing}
        onClose={() => {}}
        progress={progress}
        stage={currentStage}
        canCancel={false}
      />
    </div>
  );
}