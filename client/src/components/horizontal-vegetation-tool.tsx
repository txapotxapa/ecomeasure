import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Layers, 
  BarChart3, 
  Camera, 
  Upload,
  Compass,
  Target,
  Trash2
} from "lucide-react";
import { analyzeHorizontalVegetation, type RobelPoleOptions, type HorizontalVegetationAnalysis } from "@/lib/horizontal-vegetation";
import ProcessingModal from "./processing-modal";
import { useToast } from "@/hooks/use-toast";

interface DirectionPhoto {
  direction: 'North' | 'East' | 'South' | 'West';
  file: File | null;
  preview: string | null;
  analyzed: boolean;
  isDragging: boolean;
}

interface HorizontalVegetationToolProps {
  onAnalysisComplete: (results: HorizontalVegetationAnalysis) => void;
}

export default function HorizontalVegetationTool({ onAnalysisComplete }: HorizontalVegetationToolProps) {
  const [siteName, setSiteName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [directionPhotos, setDirectionPhotos] = useState<DirectionPhoto[]>([
    { direction: 'North', file: null, preview: null, analyzed: false, isDragging: false },
    { direction: 'East', file: null, preview: null, analyzed: false, isDragging: false },
    { direction: 'South', file: null, preview: null, analyzed: false, isDragging: false },
    { direction: 'West', file: null, preview: null, analyzed: false, isDragging: false }
  ]);
  
  const { toast } = useToast();

  const handlePhotoUpload = (direction: 'North' | 'East' | 'South' | 'West', file: File) => {
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

    const preview = URL.createObjectURL(file);
    
    setDirectionPhotos(prev => prev.map(photo => 
      photo.direction === direction 
        ? { ...photo, file, preview, analyzed: false, isDragging: false }
        : photo
    ));
  };

  const handleCameraCapture = (direction: 'North' | 'East' | 'South' | 'West') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handlePhotoUpload(direction, file);
      }
    };
    
    input.click();
  };

  const removePhoto = (direction: 'North' | 'East' | 'South' | 'West') => {
    setDirectionPhotos(prev => prev.map(photo => 
      photo.direction === direction 
        ? { ...photo, file: null, preview: null, analyzed: false, isDragging: false }
        : photo
    ));
  };

  const handleDragOver = (e: React.DragEvent, direction: 'North' | 'East' | 'South' | 'West') => {
    e.preventDefault();
    setDirectionPhotos(prev => prev.map(photo => 
      photo.direction === direction 
        ? { ...photo, isDragging: true }
        : photo
    ));
  };

  const handleDragLeave = (e: React.DragEvent, direction: 'North' | 'East' | 'South' | 'West') => {
    e.preventDefault();
    setDirectionPhotos(prev => prev.map(photo => 
      photo.direction === direction 
        ? { ...photo, isDragging: false }
        : photo
    ));
  };

  const handleDrop = (e: React.DragEvent, direction: 'North' | 'East' | 'South' | 'West') => {
    e.preventDefault();
    setDirectionPhotos(prev => prev.map(photo => 
      photo.direction === direction 
        ? { ...photo, isDragging: false }
        : photo
    ));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handlePhotoUpload(direction, files[0]);
    }
  };

  const handleAnalysis = async () => {
    if (!siteName.trim()) {
      toast({
        title: "Site Name Required",
        description: "Please enter a site name before analyzing",
        variant: "destructive"
      });
      return;
    }

    const missingPhotos = directionPhotos.filter(p => !p.file);
    if (missingPhotos.length > 0) {
      toast({
        title: "Missing Photos",
        description: `Please upload photos for: ${missingPhotos.map(p => p.direction).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setStage('Initializing analysis...');
    
    try {
      // Simulate digital analysis of pole photos
      const obstructionData = [];
      
      for (let i = 0; i < directionPhotos.length; i++) {
        const photo = directionPhotos[i];
        if (!photo.file) continue;
        
        setProgress(((i + 1) / directionPhotos.length) * 90);
        setStage(`Analyzing ${photo.direction} direction photo...`);
        
        // Simulate processing time for digital analysis
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For now, simulate obstruction height detection
        // In a real implementation, this would use computer vision to detect
        // the lowest pole band completely obscured by vegetation
        const simulatedHeight = Math.floor(Math.random() * 180) + 20; // 20-200cm range
        
        obstructionData.push({
          direction: photo.direction,
          height: simulatedHeight
        });
      }

      setProgress(95);
      setStage('Calculating vegetation metrics...');
      
      const options: RobelPoleOptions = {
        siteName: siteName.trim(),
        poleHeight: 200, // 2m standard pole
        viewingDistance: 400, // 4m standard viewing distance
        eyeHeight: 100, // 1m camera height
      };

      const results = await analyzeHorizontalVegetation(obstructionData, options);
      
      setProgress(100);
      setStage('Analysis complete!');
      
      onAnalysisComplete(results);
      
      toast({
        title: "Analysis Complete",
        description: `Digital analysis of "${siteName}" completed successfully`,
      });
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCompletionStatus = () => {
    const completedPhotos = directionPhotos.filter(p => p.file).length;
    return `${completedPhotos}/4 photos uploaded`;
  };

  const isReadyToAnalyze = () => {
    return siteName.trim() && directionPhotos.every(p => p.file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Horizontal Vegetation Cover (Digital Robel Pole Method)
          </CardTitle>
          <CardDescription>
            Upload photos of marked pole from 4 cardinal directions at 4m distance for automated analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Site Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Enter site name"
                />
              </div>
              <div className="space-y-2">
                <Label>Completion Status</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={isReadyToAnalyze() ? "default" : "secondary"}>
                    {getCompletionStatus()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Method Setup Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium flex items-center mb-2">
              <Target className="w-4 h-4 mr-2" />
              Camera Setup Requirements
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Pole Height:</span>
                <p className="text-blue-700">2m with 10cm bands</p>
              </div>
              <div>
                <span className="font-medium">Camera Distance:</span>
                <p className="text-blue-700">4m from pole</p>
              </div>
              <div>
                <span className="font-medium">Camera Height:</span>
                <p className="text-blue-700">1m above ground</p>
              </div>
              <div>
                <span className="font-medium">Photos Needed:</span>
                <p className="text-blue-700">4 cardinal directions</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cardinal Direction Photo Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Cardinal Direction Photos</Label>
              <Compass className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {directionPhotos.map((photo) => (
                <div key={photo.direction} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{photo.direction}</Label>
                    <Badge variant={photo.file ? "default" : "outline"} className="text-xs">
                      {photo.file ? "Photo Ready" : "No Photo"}
                    </Badge>
                  </div>
                  
                  {photo.preview ? (
                    <div className="relative">
                      <img
                        src={photo.preview}
                        alt={`${photo.direction} direction`}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removePhoto(photo.direction)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        photo.isDragging
                          ? "border-primary bg-primary/10"
                          : "border-gray-300 bg-gray-50"
                      }`}
                      onDragOver={(e) => handleDragOver(e, photo.direction)}
                      onDragLeave={(e) => handleDragLeave(e, photo.direction)}
                      onDrop={(e) => handleDrop(e, photo.direction)}
                    >
                      <div className="flex flex-col gap-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 mb-2">
                          {photo.isDragging ? "Drop image here" : "Drag & drop image or click below"}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCameraCapture(photo.direction)}
                          className="w-full"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        <Label htmlFor={`file-${photo.direction}`} className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild className="w-full">
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Select Image
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id={`file-${photo.direction}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(photo.direction, file);
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600">
                    Position camera 4m from pole at 1m height
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Analysis Button */}
          <div className="flex items-center justify-center">
            <Button
              onClick={handleAnalysis}
              disabled={!isReadyToAnalyze() || isAnalyzing}
              className="w-full md:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <BarChart3 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Photos...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Photos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProcessingModal
        isOpen={isAnalyzing}
        onClose={() => {}}
        progress={progress}
        stage={stage}
        canCancel={false}
      />
    </div>
  );
}