import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TreePine, 
  Layers, 
  Grid3x3, 
  Camera, 
  Ruler, 
  MapPin, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Target
} from "lucide-react";
import { ToolType } from "./tool-selector";

interface ToolInstructionsProps {
  toolType: ToolType;
  className?: string;
}

const toolInstructions = {
  canopy: {
    title: "Canopy Cover Analysis Instructions",
    icon: TreePine,
    description: "Measure forest canopy cover and light transmission using upward-facing photographs",
    equipment: [
      "Smartphone or digital camera",
      "Optional: Fisheye lens attachment", 
      "GPS device (or smartphone GPS)"
    ],
    procedure: [
      {
        step: 1,
        title: "Site Setup & Camera Position",
        details: [
          "Select representative sampling points within study area",
          "Space points ≥10m apart to avoid spatial autocorrelation",
          "Clear 2m radius around measurement point of low vegetation",
          "Hold camera at 1.3m height (standard breast height)",
          "Point camera directly upward at 90° zenith angle"
        ]
      },
      {
        step: 2,
        title: "Photo Capture & GPS Recording",
        details: [
          "Take photo during overcast conditions for best contrast",
          "Capture square format (1:1 aspect ratio) if possible",
          "Ensure entire canopy area fills frame completely",
          "Record GPS coordinates with ±3m accuracy or better",
          "Take 3-5 photos per point, select best quality image"
        ]
      }
    ],
    tips: [
      "Best results 1-2 hours after sunrise or before sunset",
      "Overcast sky provides optimal lighting conditions",
      "Avoid windy conditions that cause leaf movement",
      "Clean camera lens before each measurement"
    ],
    measurements: [
      "Canopy cover percentage (%)",
      "Light transmission (%)", 
      "Leaf Area Index (LAI)",
      "Gap fraction analysis"
    ]
  },
  
  horizontal_vegetation: {
    title: "Horizontal Vegetation Cover Instructions", 
    icon: Layers,
    description: "Assess vegetation density and structure at multiple height levels using horizontal photographs",
    equipment: [
      "Smartphone or digital camera",
      "Measuring tape or folding ruler (metric)",
      "Marker poles or stakes"
    ],
    procedure: [
      {
        step: 1,
        title: "Transect Setup & Height Marking",
        details: [
          "Establish 20m transect line through representative vegetation",
          "Mark measurement points every 5m along transect (0, 5, 10, 15, 20m)",
          "Set up measuring pole at each point with height marks",
          "Standard heights: 25cm, 50cm, 100cm, 150cm, 200cm",
          "Record GPS coordinates at start and end of transect"
        ]
      },
      {
        step: 2,
        title: "Photography Protocol",
        details: [
          "Position camera 2m from measurement pole at each height",
          "Frame 1m² area around pole at each marked height",
          "Take photos perpendicular to transect direction",
          "Capture both directions (left/right) at each height",
          "Maintain consistent camera distance and framing"
        ]
      }
    ],
    tips: [
      "Photograph during stable lighting conditions",
      "Avoid backlighting and strong shadows", 
      "Use camera timer function for stability",
      "Document any missing height levels due to terrain"
    ],
    measurements: [
      "Vegetation density by height (%)",
      "Height diversity index",
      "Vegetation profile classification",
      "Cover percentage per height interval"
    ]
  },

  daubenmire: {
    title: "Digital Daubenmire Frame Instructions",
    icon: Grid3x3, 
    description: "Simple photo-based quadrat sampling for ground cover analysis",
    equipment: [
      "Smartphone or digital camera",
      "1m × 1m quadrat frame (PVC or metal)",
      "GPS device (or smartphone GPS)"
    ],
    procedure: [
      {
        step: 1,
        title: "Setup & Photography",
        details: [
          "Place 1m × 1m frame on representative ground area",
          "Position camera 1.5-2m directly above center of frame",
          "Take high-resolution photo (≥3000×3000 pixels) showing entire quadrat",
          "Ensure frame edges are visible for scale reference",
          "Record GPS coordinates: ±3m accuracy required"
        ]
      },
      {
        step: 2,
        title: "Quality Check & Sampling Protocol",
        details: [
          "Verify sharp focus across entire quadrat area",
          "Check even lighting (no harsh shadows)",
          "Minimum 20 quadrats per study area for statistical validity",
          "Space quadrats ≥5m apart to avoid spatial autocorrelation",
          "Complete sampling within 2-3 hours for uniform conditions"
        ]
      }
    ],
    tips: [
      "Best results with overcast sky for even lighting",
      "Keep camera height consistent (1.5-2m) across all quadrats",
      "Include frame in photo - provides scale and analysis reference",
      "Remove debris only if it obscures vegetation assessment"
    ],
    measurements: [
      "Vegetation cover percentage per quadrat",
      "Bare ground percentage", 
      "Litter/organic matter percentage",
      "Species diversity analysis (automatic photo analysis)"
    ]
  }
};

export default function ToolInstructions({ toolType, className }: ToolInstructionsProps) {
  const instructions = toolInstructions[toolType];
  const IconComponent = instructions.icon;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <IconComponent className="w-5 h-5 mr-2" />
            {instructions.title}
          </CardTitle>
          <CardDescription>
            {instructions.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Equipment Needed */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Equipment Required
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {instructions.equipment.map((item, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Step-by-step Procedure with Metrics */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Field Procedure & Metric Standards
            </h4>
            {instructions.procedure.map((procedure, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">
                      Step {procedure.step}
                    </Badge>
                    <div className="flex-1">
                      <h5 className="font-medium mb-2">{procedure.title}</h5>
                      <ul className="space-y-1">
                        {procedure.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="text-sm text-gray-700 flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Tips and Best Practices */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Tips for Best Results
            </h4>
            <Alert>
              <AlertDescription>
                <ul className="space-y-1">
                  {instructions.tips.map((tip, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Measurements Output */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <Ruler className="w-4 h-4 mr-2" />
              Measurements Provided
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {instructions.measurements.map((measurement, index) => (
                <div key={index} className="flex items-center">
                  <Badge variant="secondary" className="text-xs">
                    {measurement}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}