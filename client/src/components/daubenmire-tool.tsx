import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  Upload, 
  Grid3x3, 
  BarChart3, 
  Target, 
  Trash2
} from "lucide-react";
import { analyzeDaubenmireFrame, type DaubenmireResult } from "@/lib/daubenmire-frame";
import ProcessingModal from "./processing-modal";
import { useToast } from "@/hooks/use-toast";

interface DaubenmireToolProps {
  onAnalysisComplete: (results: DaubenmireResult) => void;
}

export default function DaubenmireTool({ onAnalysisComplete }: DaubenmireToolProps) {
  // Load current site from localStorage to sync across tools
  const savedSite = localStorage.getItem('current-research-site');
  const currentSiteName = savedSite ? JSON.parse(savedSite).name : '';
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [siteName, setSiteName] = useState<string>(currentSiteName);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG or PNG image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };
    
    input.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast({
        title: "No Image",
        description: "Please capture or upload an image to analyze.",
        variant: "destructive"
      });
      return;
    }

    // Site name is now handled at app level - no longer required here

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Initializing digital frame analysis...');

    try {
      const results = await analyzeDaubenmireFrame(image, {
        method: 'color_analysis',
        onProgress: (progress, stage) => {
          setProgress(progress);
          setCurrentStage(stage);
        }
      });

      onAnalysisComplete(results);
      
      toast({
        title: "Analysis complete",
        description: `Ground cover analysis finished. Found ${results.speciesDiversity} vegetation types with ${results.totalCoverage.toFixed(1)}% total coverage.`,
      });
      
    } catch (error) {
      console.error('Daubenmire analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isReadyToAnalyze = () => {
    return image !== null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Grid3x3 className="w-5 h-5 mr-2" />
            Digital Daubenmire Sampling (Frame-Free)
          </CardTitle>
          <CardDescription>
            Camera-based ground cover analysis from 1.5m height for standardized sampling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Site information is handled at the app level - removed redundant input */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant={isReadyToAnalyze() ? "default" : "secondary"}>
                {image ? "Photo Ready" : "No Photo"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Camera Setup Information */}
          <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
            <h4 className="font-medium flex items-center mb-2">
              <Target className="w-4 h-4 mr-2" />
              Camera Setup Requirements
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Camera Height:</span>
                <p className="text-primary">1.5m ± 5cm</p>
              </div>
              <div>
                <span className="font-medium">Orientation:</span>
                <p className="text-primary">Directly downward (nadir)</p>
              </div>
              <div>
                <span className="font-medium">Sampling Area:</span>
                <p className="text-primary">1m² ± 0.1m²</p>
              </div>
            </div>
            
            {/* Accuracy Information */}
            <div className="mt-4 p-3 bg-muted/10 rounded-lg">
              <h5 className="text-sm font-medium mb-2">Measurement Accuracy</h5>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Camera height tolerance: ±5cm from 1.5m standard</p>
                <p>• Coverage area accuracy: 1m² ± 0.1m² (field of view dependent)</p>
                <p>• Species detection accuracy: 85-92% for common grassland species</p>
                <p>• Ground cover classification: ±5% for vegetation, bare ground, litter</p>
                <p>• Recommended: 5+ sampling points per 100m² for representative coverage</p>
                <p>• Best results with diffuse lighting (overcast or shaded conditions)</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Ground Cover Photo</Label>
            </div>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Ground cover quadrat"
                  className="w-full h-64 object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    {isDragging ? "Drop image here to upload" : "Drag & drop image or click to capture"}
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={handleCameraCapture}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Label htmlFor="file-upload" className="cursor-pointer w-full">
                      <Button variant="outline" asChild className="w-full">
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Select Image
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-600">
              Position camera 1.5m directly above sampling area for standardized frame-free analysis
            </p>
          </div>

          <Separator />

          {/* Analysis Button */}
          <div className="flex items-center justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={!isReadyToAnalyze() || isProcessing}
              className="w-full md:w-auto"
            >
              {isProcessing ? (
                <>
                  <BarChart3 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Ground Cover...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Ground Cover
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

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