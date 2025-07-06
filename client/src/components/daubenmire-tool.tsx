import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Camera, 
  Upload, 
  Grid3x3, 
  BarChart3, 
  Target, 
  Leaf,
  Ruler,
  Eye
} from "lucide-react";
import { analyzeDaubenmireFrame, validateDaubenmireImage, DaubenmireResult, DaubenmireGridCell } from "@/lib/daubenmire-frame";
import ProcessingModal from "./processing-modal";
import { useToast } from "@/hooks/use-toast";

interface DaubenmireToolProps {
  onAnalysisComplete: (results: DaubenmireResult) => void;
}

export default function DaubenmireTool({ onAnalysisComplete }: DaubenmireToolProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [gridSize, setGridSize] = useState<number>(5);
  const [quadratSize, setQuadratSize] = useState<number>(20);
  const [analysisMethod, setAnalysisMethod] = useState<'color_analysis' | 'supervised_classification' | 'manual_assisted'>('color_analysis');
  const [speciesLibrary, setSpeciesLibrary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [cellPreview, setCellPreview] = useState<DaubenmireGridCell | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateDaubenmireImage(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid Image",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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

  const parseSpeciesLibrary = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast({
        title: "No Image",
        description: "Please upload an image to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Starting analysis...');

    try {
      const speciesArray = parseSpeciesLibrary(speciesLibrary);
      
      const results = await analyzeDaubenmireFrame(image, {
        gridSize,
        quadratSize,
        method: analysisMethod,
        speciesLibrary: speciesArray.length > 0 ? speciesArray : undefined,
        onProgress: (progress, stage) => {
          setProgress(progress);
          setCurrentStage(stage);
        },
        onCellAnalysis: (cell, cellIndex) => {
          setCellPreview(cell);
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
            <Grid3x3 className="w-5 h-5 mr-2" />
            Digital Daubenmire Frame
          </CardTitle>
          <CardDescription>
            Replace traditional quadrat sampling with camera-based ground cover analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Quadrat Photo</Label>
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
                      Upload Image
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

            {imagePreview && (
              <Card className="overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={imagePreview}
                    alt="Quadrat for analysis"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Grid overlay */}
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {Array.from({ length: gridSize - 1 }, (_, i) => (
                        <g key={i}>
                          {/* Vertical lines */}
                          <line
                            x1={((i + 1) / gridSize) * 100}
                            y1="0"
                            x2={((i + 1) / gridSize) * 100}
                            y2="100"
                            stroke="rgba(255, 255, 255, 0.8)"
                            strokeWidth="0.5"
                          />
                          {/* Horizontal lines */}
                          <line
                            x1="0"
                            y1={((i + 1) / gridSize) * 100}
                            x2="100"
                            y2={((i + 1) / gridSize) * 100}
                            stroke="rgba(255, 255, 255, 0.8)"
                            strokeWidth="0.5"
                          />
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Grid: {gridSize}×{gridSize}</span>
                    <span>Quadrat: {quadratSize}cm</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Analysis Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Analysis Settings</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grid-size">Grid Size</Label>
                <Select value={gridSize.toString()} onValueChange={(value) => setGridSize(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grid size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3×3 Grid</SelectItem>
                    <SelectItem value="5">5×5 Grid</SelectItem>
                    <SelectItem value="10">10×10 Grid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quadrat-size">Quadrat Size (cm)</Label>
                <Input
                  id="quadrat-size"
                  type="number"
                  value={quadratSize}
                  onChange={(e) => setQuadratSize(Number(e.target.value))}
                  min="10"
                  max="100"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="analysis-method">Analysis Method</Label>
                <Select value={analysisMethod} onValueChange={(value: any) => setAnalysisMethod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color_analysis">Color Analysis</SelectItem>
                    <SelectItem value="supervised_classification">Supervised Classification</SelectItem>
                    <SelectItem value="manual_assisted">Manual Assisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="species-library">Species Library (Optional)</Label>
              <Textarea
                id="species-library"
                placeholder="Enter species names, one per line:&#10;Festuca rubra&#10;Trifolium repens&#10;Plantago major"
                value={speciesLibrary}
                onChange={(e) => setSpeciesLibrary(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Enter known species that might be present in the quadrat (one per line)
              </p>
            </div>
          </div>

          <Separator />

          {/* Preview Section */}
          {cellPreview && (
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Cell Analysis Preview
              </Label>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Cell Position: ({cellPreview.x}, {cellPreview.y})</p>
                      <p className="text-sm">Coverage: {cellPreview.coveragePercentage.toFixed(1)}%</p>
                      <p className="text-sm">Dominant: {cellPreview.dominantSpecies}</p>
                    </div>
                    <div>
                      <p className="text-sm">Bare Ground: {cellPreview.bareGround.toFixed(1)}%</p>
                      <p className="text-sm">Litter: {cellPreview.litter.toFixed(1)}%</p>
                      <p className="text-sm">Rock: {cellPreview.rock.toFixed(1)}%</p>
                    </div>
                  </div>
                  {cellPreview.species.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Species Found:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cellPreview.species.map((species, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {species}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analysis Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleAnalyze}
              disabled={!image || isProcessing}
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
                  Analyze Quadrat
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