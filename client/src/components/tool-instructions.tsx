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
    title: "Horizontal Vegetation Cover (Digital Robel Pole Method)", 
    icon: Layers,
    description: "Camera-based vegetation analysis using 4m distance photography of marked pole",
    equipment: [
      "2m vertical pole with colored bands (red/white) every 10cm",
      "Smartphone or digital camera with timer function",
      "Measuring tape (minimum 4m length)",
      "Tripod or stable camera support at 1m height"
    ],
    procedure: [
      {
        step: 1,
        title: "Pole Setup & Camera Positioning",
        details: [
          "Place 2m pole vertically at sampling center point",
          "Ensure pole has alternating colored bands every 10cm for clear digital analysis",
          "Set up camera/phone on tripod at 1m height above ground",
          "Measure exactly 4m distance from pole to camera position",
          "Use compass or GPS to identify cardinal directions"
        ]
      },
      {
        step: 2,
        title: "Digital Photography Protocol",
        details: [
          "Take photos from 4 cardinal directions: North, East, South, West",
          "Position camera 4m from pole at 1m height for each direction",
          "Frame pole centrally with surrounding vegetation visible",
          "Use timer or remote to avoid camera shake during capture",
          "Ensure consistent lighting and focus across all 4 photos"
        ]
      }
    ],
    tips: [
      "Digital photography provides better accuracy than visual readings (literature confirmed)",
      "Camera eliminates observer bias and creates permanent analysis records",
      "4m distance and 1m height are literature standards for optimal measurement",
      "Overcast lighting conditions provide most consistent results across photos"
    ],
    measurements: [
      "Digital obstruction analysis per direction",
      "Average vegetation density index",
      "Obstruction uniformity across directions",
      "Automated band detection from photos"
    ]
  },

  daubenmire: {
    title: "Digital Daubenmire Sampling Instructions",
    icon: Grid3x3, 
    description: "Frame-free photo-based ground cover analysis from standardized distance",
    equipment: [
      "Smartphone or digital camera",
      "GPS device (or smartphone GPS)",
      "Optional: measuring tape for distance verification"
    ],
    procedure: [
      {
        step: 1,
        title: "Camera Position & Photo Capture",
        details: [
          "Stand at representative ground area for sampling",
          "Hold camera 1.5m above ground level (consistent height)",
          "Point camera directly downward at 90° angle to ground",
          "Take high-resolution photo (≥3000×3000 pixels) of 1m² ground area",
          "Ensure even lighting across entire sampling area"
        ]
      },
      {
        step: 2,
        title: "Quality Check & Sampling Protocol",
        details: [
          "Verify sharp focus across entire ground area in photo",
          "Check that 1m² area is clearly captured (arm's length coverage)",
          "Record GPS coordinates: ±3m accuracy required",
          "Sample as many points as needed for your study objectives",
          "Literature suggests 30+ points spaced ≥5m apart for statistical comparisons"
        ]
      }
    ],
    tips: [
      "Best results with overcast sky for even lighting",
      "1.5m camera height captures approximately 1m² at arm's length",
      "Keep camera angle consistent (90° downward) across all samples",
      "Sample size depends on study goals: exploratory (5-10), comparative (30+)",
      "You can analyze single points or continue sampling as needed"
    ],
    measurements: [
      "Vegetation cover percentage per sample",
      "Bare ground percentage", 
      "Litter/organic matter percentage",
      "Ground cover diversity analysis (automatic photo analysis)"
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