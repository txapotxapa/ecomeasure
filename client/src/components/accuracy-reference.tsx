import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TreePine, Layers, Grid3x3 } from "lucide-react";

export default function AccuracyReference() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Measurement Accuracy Reference
        </CardTitle>
        <CardDescription>
          Scientific accuracy standards for ecological field measurements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Canopy Cover Analysis */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Canopy Cover Analysis (GLAMA Method)
          </h3>
          <div className="ml-6 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Measurement</Badge>
                <p className="text-muted-foreground">Canopy Cover</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Accuracy</Badge>
                <p className="font-mono">±2-3%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Camera Height</Badge>
                <p className="text-muted-foreground">1.3m (breast height)</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Tolerance</Badge>
                <p className="font-mono">±10cm</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">LAI (Deciduous)</Badge>
                <p className="text-muted-foreground">Leaf Area Index</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Accuracy</Badge>
                <p className="font-mono">±0.3</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">LAI (Coniferous)</Badge>
                <p className="text-muted-foreground">Leaf Area Index</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Accuracy</Badge>
                <p className="font-mono">±0.5</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <p className="font-medium mb-1">Best Practices:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Take 3-5 photos per point, select highest quality</li>
                <li>GPS accuracy requirement: ±3m or better</li>
                <li>Optimal lighting: Overcast sky or dawn/dusk</li>
                <li>Avoid windy conditions causing leaf movement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Horizontal Vegetation */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Horizontal Vegetation (Digital Robel Pole)
          </h3>
          <div className="ml-6 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Method Accuracy</Badge>
                <p className="text-muted-foreground">Camera vs Visual</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">r² Value</Badge>
                <p className="font-mono">0.62 vs 0.26</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Camera Distance</Badge>
                <p className="text-muted-foreground">From pole center</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Tolerance</Badge>
                <p className="font-mono">4m ±10cm</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Camera Height</Badge>
                <p className="text-muted-foreground">Above ground</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Tolerance</Badge>
                <p className="font-mono">1m ±5cm</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Direction Accuracy</Badge>
                <p className="text-muted-foreground">Cardinal directions</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Tolerance</Badge>
                <p className="font-mono">±5°</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <p className="font-medium mb-1">Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Pole height: 2m with 10cm visibility bands</li>
                <li>4 photos at cardinal directions (N, E, S, W)</li>
                <li>Minimum 3 replicates per site recommended</li>
                <li>Use compass or GPS bearing for directions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Daubenmire Frame */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Digital Daubenmire (Frame-Free)
          </h3>
          <div className="ml-6 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Camera Height</Badge>
                <p className="text-muted-foreground">Above ground</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Tolerance</Badge>
                <p className="font-mono">1.5m ±5cm</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Coverage Area</Badge>
                <p className="text-muted-foreground">Sampling quadrat</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Accuracy</Badge>
                <p className="font-mono">1m² ±0.1m²</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Species Detection</Badge>
                <p className="text-muted-foreground">Common grassland</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Accuracy</Badge>
                <p className="font-mono">85-92%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-1">Cover Classification</Badge>
                <p className="text-muted-foreground">Veg/Bare/Litter</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Accuracy</Badge>
                <p className="font-mono">±5%</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <p className="font-medium mb-1">Sampling Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>5+ sampling points per 100m² for representation</li>
                <li>Camera orientation: Directly downward (nadir)</li>
                <li>Best results with diffuse lighting</li>
                <li>Avoid shadows from photographer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* General GPS Requirements */}
        <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            GPS Accuracy Requirements
          </h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• Horizontal accuracy: ±3m or better (consumer GPS typical)</p>
            <p>• Altitude accuracy: ±5m (barometric sensors improve to ±1m)</p>
            <p>• Wait for GPS fix: 30-60 seconds for best accuracy</p>
            <p>• Record HDOP/PDOP values when available</p>
            <p>• Multiple readings at same point improve precision</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}