import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  Upload, 
  Layers, 
  BarChart3, 
  MapPin, 
  Trash2,
  Plus,
  Ruler
} from "lucide-react";
import { analyzeHorizontalVegetation, validateHorizontalVegetationImages } from "@/lib/horizontal-vegetation";
import ProcessingModal from "./processing-modal";
import { useToast } from "@/hooks/use-toast";

interface ImageWithHeight {
  file: File;
  height: number;
  preview: string;
}

interface HorizontalVegetationToolProps {
  onAnalysisComplete: (results: any) => void;
}

export default function HorizontalVegetationTool({ onAnalysisComplete }: HorizontalVegetationToolProps) {
  const [images, setImages] = useState<ImageWithHeight[]>([]);
  const [analysisMethod, setAnalysisMethod] = useState<'color_threshold' | 'edge_detection' | 'machine_learning'>('color_threshold');
  const [customHeights, setCustomHeights] = useState<number[]>([50, 100, 150, 200]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const height = customHeights[index] || 50 + (index * 50);
        
        setImages(prev => [...prev, {
          file,
          height,
          preview
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // For now, we'll simulate camera capture
      // In a real implementation, you'd show a camera interface
      toast({
        title: "Camera Ready",
        description: "Camera interface would open here. Use file upload for now.",
      });
      
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use file upload instead.",
        variant: "destructive"
      });
    }
  };

  const updateImageHeight = (index: number, height: number) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, height } : img
    ));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomHeight = () => {
    const newHeight = Math.max(...customHeights) + 50;
    setCustomHeights(prev => [...prev, newHeight]);
  };

  const updateCustomHeight = (index: number, height: number) => {
    setCustomHeights(prev => prev.map((h, i) => i === index ? height : h));
  };

  const removeCustomHeight = (index: number) => {
    setCustomHeights(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image to analyze.",
        variant: "destructive"
      });
      return;
    }

    const imageFiles = images.map(img => img.file);
    const heights = images.map(img => img.height);
    
    const validation = validateHorizontalVegetationImages(imageFiles, heights);
    if (!validation.isValid) {
      toast({
        title: "Invalid Images",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Starting analysis...');

    try {
      const results = await analyzeHorizontalVegetation(imageFiles, {
        heights,
        method: analysisMethod,
        onProgress: (progress, stage) => {
          setProgress(progress);
          setCurrentStage(stage);
        }
      });

      onAnalysisComplete(results);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Horizontal Vegetation Cover Analysis
          </CardTitle>
          <CardDescription>
            Measure vegetation density at different heights using horizontal camera angles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Photo Collection</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCameraCapture}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </span>
                  </Button>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((img, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={img.preview}
                        alt={`Vegetation at ${img.height}cm`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-gray-500" />
                        <Label htmlFor={`height-${index}`} className="text-sm">
                          Height (cm):
                        </Label>
                        <Input
                          id={`height-${index}`}
                          type="number"
                          value={img.height}
                          onChange={(e) => updateImageHeight(index, Number(e.target.value))}
                          className="w-20 h-8"
                          min="10"
                          max="500"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Analysis Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Analysis Settings</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="analysis-method">Analysis Method</Label>
                <Select value={analysisMethod} onValueChange={(value: any) => setAnalysisMethod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color_threshold">Color Threshold</SelectItem>
                    <SelectItem value="edge_detection">Edge Detection</SelectItem>
                    <SelectItem value="machine_learning">Machine Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quick Height Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {customHeights.map((height, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => updateCustomHeight(index, Number(e.target.value))}
                        className="w-16 h-8"
                        min="10"
                        max="500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomHeight(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomHeight}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Analysis Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleAnalyze}
              disabled={images.length === 0 || isProcessing}
              className="px-8 py-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Vegetation ({images.length} images)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Modal */}
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