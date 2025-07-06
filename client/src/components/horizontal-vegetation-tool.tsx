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
  MapPin, 
  Compass,
  Ruler,
  Target
} from "lucide-react";
import { analyzeHorizontalVegetation, validateRobelPoleData, type RobelPoleOptions, type HorizontalVegetationAnalysis } from "@/lib/horizontal-vegetation";
import { useToast } from "@/hooks/use-toast";

interface CardinalReading {
  direction: 'North' | 'East' | 'South' | 'West';
  height: number;
  completed: boolean;
}

interface HorizontalVegetationToolProps {
  onAnalysisComplete: (results: HorizontalVegetationAnalysis) => void;
}

export default function HorizontalVegetationTool({ onAnalysisComplete }: HorizontalVegetationToolProps) {
  const [siteName, setSiteName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cardinalReadings, setCardinalReadings] = useState<CardinalReading[]>([
    { direction: 'North', height: 0, completed: false },
    { direction: 'East', height: 0, completed: false },
    { direction: 'South', height: 0, completed: false },
    { direction: 'West', height: 0, completed: false }
  ]);
  const [robelPoleOptions] = useState<RobelPoleOptions>({
    siteName: '',
    poleHeight: 200, // 2m standard pole
    viewingDistance: 400, // 4m standard viewing distance
    eyeHeight: 100, // 1m eye height
  });
  
  const { toast } = useToast();

  const handleReadingChange = (direction: 'North' | 'East' | 'South' | 'West', height: number) => {
    setCardinalReadings(prev => prev.map(reading => 
      reading.direction === direction 
        ? { ...reading, height, completed: height > 0 }
        : reading
    ));
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

    const obstructionData = cardinalReadings.map(reading => ({
      direction: reading.direction,
      height: reading.height
    }));

    const validation = validateRobelPoleData(obstructionData, robelPoleOptions);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid Data",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const options: RobelPoleOptions = {
        ...robelPoleOptions,
        siteName: siteName.trim()
      };

      const results = await analyzeHorizontalVegetation(obstructionData, options);
      
      onAnalysisComplete(results);
      
      toast({
        title: "Analysis Complete",
        description: `Site "${siteName}" analyzed successfully`,
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
    const completedReadings = cardinalReadings.filter(r => r.completed).length;
    return `${completedReadings}/4 readings completed`;
  };

  const isReadyToAnalyze = () => {
    return siteName.trim() && cardinalReadings.every(r => r.completed);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Horizontal Vegetation Cover (Robel Pole Method)
          </CardTitle>
          <CardDescription>
            Record visual obstruction heights from 4 cardinal directions using a 2m pole
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
              Setup Requirements
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Pole Height:</span>
                <p className="text-blue-700">2m (200cm)</p>
              </div>
              <div>
                <span className="font-medium">Viewing Distance:</span>
                <p className="text-blue-700">4m from pole</p>
              </div>
              <div>
                <span className="font-medium">Eye Height:</span>
                <p className="text-blue-700">1m above ground</p>
              </div>
              <div>
                <span className="font-medium">Readings:</span>
                <p className="text-blue-700">4 cardinal directions</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cardinal Direction Readings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Cardinal Direction Readings</Label>
              <Compass className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {cardinalReadings.map((reading) => (
                <div key={reading.direction} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{reading.direction}</Label>
                    <Badge variant={reading.completed ? "default" : "outline"} className="text-xs">
                      {reading.completed ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={reading.height || ''}
                      onChange={(e) => handleReadingChange(reading.direction, parseInt(e.target.value) || 0)}
                      className="pr-8"
                      min={0}
                      max={250}
                    />
                    <span className="absolute right-2 top-2 text-sm text-gray-500">cm</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Height where vegetation 100% obscures pole
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
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Site
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}