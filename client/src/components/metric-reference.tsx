import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ruler, Target, Eye } from "lucide-react";

interface MetricReferenceProps {
  toolType: 'canopy' | 'horizontal_vegetation' | 'daubenmire';
  className?: string;
}

const metricStandards = {
  canopy: {
    title: "Canopy Analysis - Metric Standards",
    measurements: [
      { metric: "Camera Height", value: "1.3m", description: "Standard breast height above ground" },
      { metric: "Zenith Angle", value: "90°", description: "Camera pointing directly upward" },
      { metric: "Clear Radius", value: "2m", description: "Area cleared around measurement point" },
      { metric: "Point Spacing", value: "≥10m", description: "Minimum distance between sampling points" },
      { metric: "GPS Accuracy", value: "±3m", description: "Required positioning accuracy" },
      { metric: "Image Resolution", value: "≥2000×2000px", description: "Minimum photo resolution" }
    ],
    fieldSizes: [
      { area: "Plot", dimension: "20m × 20m", description: "Standard research plot size" },
      { area: "Transect", dimension: "50m length", description: "Linear sampling transect" },
      { area: "Grid Cell", dimension: "10m × 10m", description: "Systematic sampling grid" }
    ]
  },
  horizontal_vegetation: {
    title: "Horizontal Vegetation - Metric Standards", 
    measurements: [
      { metric: "Transect Length", value: "20m", description: "Standard transect for vegetation sampling" },
      { metric: "Sampling Points", value: "Every 5m", description: "Measurement intervals along transect" },
      { metric: "Camera Distance", value: "2m", description: "Distance from vegetation to camera" },
      { metric: "Frame Area", value: "1m²", description: "Area captured in each photograph" },
      { metric: "Height Intervals", value: "25cm steps", description: "Standard height measurements" },
      { metric: "Standard Heights", value: "25, 50, 100, 150, 200cm", description: "Recommended measurement levels" }
    ],
    fieldSizes: [
      { area: "Sampling Frame", dimension: "1m × 1m", description: "Area captured per height level" },
      { area: "Transect", dimension: "20m × 2m", description: "Total sampling area per transect" },
      { area: "Plot", dimension: "100m × 100m", description: "Large scale vegetation study area" }
    ]
  },
  daubenmire: {
    title: "Digital Daubenmire Sampling - Metric Standards",
    measurements: [
      { metric: "Camera Height", value: "1.5m", description: "Standard height above ground for consistent 1m² coverage" },
      { metric: "Ground Coverage", value: "1m²", description: "Area captured per photo at 1.5m height" },
      { metric: "Camera Angle", value: "90°", description: "Directly downward for accurate ground assessment" },
      { metric: "Sample Size", value: "≥30 points", description: "Literature standard for statistical validity" },
      { metric: "Point Spacing", value: "≥5m", description: "Minimum distance between sampling points" },
      { metric: "Image Resolution", value: "≥3000×3000px", description: "Required for detailed ground cover analysis" }
    ],
    fieldSizes: [
      { area: "Sampling Area", dimension: "1m²", description: "Ground area captured per photo" },
      { area: "Plot", dimension: "50m × 50m", description: "Area for systematic point placement" },
      { area: "Study Site", dimension: "1ha (100m × 100m)", description: "Large-scale community analysis" }
    ]
  }
};

export default function MetricReference({ toolType, className }: MetricReferenceProps) {
  const standards = metricStandards[toolType];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Ruler className="w-5 h-5 mr-2" />
          {standards.title}
        </CardTitle>
        <CardDescription>
          Precise metric measurements and field standards for consistent data collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Key Measurements */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Critical Measurements
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {standards.measurements.map((measurement, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{measurement.metric}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {measurement.value}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{measurement.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Field Area Specifications */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Field Area Specifications
          </h4>
          <div className="space-y-2">
            {standards.fieldSizes.map((fieldSize, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                <div>
                  <span className="text-sm font-medium">{fieldSize.area}</span>
                  <p className="text-xs text-gray-600">{fieldSize.description}</p>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {fieldSize.dimension}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">Quick Reference Tips</h5>
          <div className="text-xs text-blue-800 space-y-1">
            {toolType === 'canopy' && (
              <>
                <p>• Use smartphone compass app to ensure 90° zenith angle</p>
                <p>• 1.3m height = eye level for average person (150-180cm tall)</p>
                <p>• GPS coordinates should have ≤3m accuracy for plot mapping</p>
              </>
            )}
            {toolType === 'horizontal_vegetation' && (
              <>
                <p>• 25cm intervals capture fine-scale vegetation structure</p>
                <p>• 2m camera distance provides 1m² field of view</p>
                <p>• Take photos at same time of day for consistent lighting</p>
              </>
            )}
            {toolType === 'daubenmire' && (
              <>
                <p>• 1m × 1m frame = 1 square meter sampling area</p>
                <p>• Higher camera height = less geometric distortion</p>
                <p>• Grid analysis accuracy improves with image resolution</p>
              </>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}