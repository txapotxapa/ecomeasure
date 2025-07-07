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
import GPSAccuracyIndicator from "./gps-accuracy-indicator";
import { useToast } from "@/hooks/use-toast";

interface DaubenmireToolProps {
  onAnalysisComplete: (results: DaubenmireResult, imageUrl?: string) => void;
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

    console.log('Starting Daubenmire analysis with image:', image.name, 'size:', image.size);
    
    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Uploading image...');

    try {
      // Upload image first
      const formData = new FormData();
      formData.append('image', image);
      
      console.log('Uploading image to server...');
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful, starting analysis...');
      setCurrentStage('Analyzing ground cover with Canopeo-like method...');

      const results = await analyzeDaubenmireFrame(image, {
        method: 'color_analysis',
        onProgress: (progress, stage) => {
          console.log(`Analysis progress: ${progress}% - ${stage}`);
          setProgress(progress);
          setCurrentStage(stage);
        }
      });

      console.log('Analysis complete:', results);
      onAnalysisComplete(results, uploadData.imageUrl);
      
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

          {/* Setup Guide with Visual Diagram */}
          <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
            <h4 className="font-medium flex items-center mb-3 text-sm">
              <Target className="w-4 h-4 mr-2" />
              Ground Cover Analysis Setup Guide
            </h4>
            
            {/* Visual Diagram */}
            <div className="mb-4 p-3 bg-background/50 rounded-lg border">
              <div className="text-center space-y-2">
                <div className="text-xs font-medium mb-2">Side View - Proper Camera Position</div>
                <div className="relative w-full h-24 bg-gradient-to-b from-sky-200 to-green-200 rounded-lg overflow-hidden">
                  {/* Sky */}
                  <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-sky-300 to-sky-200"></div>
                  {/* Ground level with quadrat area */}
                  <div className="absolute bottom-0 left-0 w-full h-18 bg-gradient-to-t from-green-300 to-green-200">
                    {/* Quadrat sampling area */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 border-2 border-dashed border-gray-700 bg-green-400/30">
                      <div className="grid grid-cols-2 gap-px h-full">
                        <div className="bg-green-600/40"></div>
                        <div className="bg-amber-600/40"></div>
                        <div className="bg-gray-600/40"></div>
                        <div className="bg-green-500/40"></div>
                      </div>
                    </div>
                    {/* Person with camera */}
                    <div className="absolute bottom-2 left-8">
                      <div className="w-2 h-12 bg-amber-600 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-800 rounded-full mt-1 ml-0.5"></div>
                      <div className="text-xs mt-1 text-center font-medium">1.5m</div>
                    </div>
                    {/* Height indicator */}
                    <div className="absolute bottom-0 right-4 w-px h-16 bg-gray-600"></div>
                    <div className="absolute bottom-16 right-3 text-xs">Camera Height</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground mb-1">Setup Instructions:</div>
              <p>• Hold camera at 1.5m height above ground</p>
              <p>• Point camera directly downward at sampling area</p>
              <p>• Ensure camera is level and perpendicular to ground</p>
              <p>• Frame covers approximately 1m² sampling area</p>
              <p>• Take photo during overcast conditions for even lighting</p>
              
              <div className="font-medium text-foreground mt-2 mb-1">Analysis Specifications:</div>
              <p>• Ground cover classification accuracy: ±5-7%</p>
              <p>• Species identification with coverage percentages</p>
              <p>• Bare ground, litter, and rock surface analysis</p>
              <p>• Shannon diversity index calculation</p>
            </div>
          </div>

          <Separator />

          {/* GPS Accuracy Indicator */}
          <GPSAccuracyIndicator className="mb-4" />

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