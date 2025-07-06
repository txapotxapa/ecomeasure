import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricReference from "./metric-reference";
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
  Target,
  Calculator
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
        title: "Site Preparation",
        details: [
          "Select representative sampling points within your study area",
          "Ensure points are at least 10m apart to avoid spatial autocorrelation",
          "Clear any low vegetation or debris from a 2m radius around measurement point"
        ]
      },
      {
        step: 2,
        title: "Camera Setup",
        details: [
          "Hold camera/phone vertically, pointing directly upward (90° zenith angle)",
          "Maintain camera height of 1.3m above ground (standard breast height)",
          "Keep camera level using built-in spirit level or phone level app",
          "Avoid including your body or hands in the frame"
        ]
      },
      {
        step: 3,
        title: "Photo Capture",
        details: [
          "Take photo during overcast conditions for best contrast",
          "Avoid direct sunlight or deep shadows",
          "Capture square format if possible (1:1 aspect ratio)",
          "Ensure entire canopy area fills the frame",
          "Take 3-5 photos per point and select the best quality image"
        ]
      },
      {
        step: 4,
        title: "Data Recording",
        details: [
          "Record GPS coordinates (accuracy ±3m or better)",
          "Note weather conditions (overcast, sunny, cloudy)",
          "Record time of capture",
          "Document any unusual conditions or disturbances"
        ]
      }
    ],
    tips: [
      "Best results between 1-2 hours after sunrise or before sunset",
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
      "Marker poles or stakes",
      "Field notebook"
    ],
    procedure: [
      {
        step: 1,
        title: "Transect Setup",
        details: [
          "Establish a 20m transect line through representative vegetation",
          "Mark measurement points every 5m along transect (0m, 5m, 10m, 15m, 20m)",
          "Use GPS to record start and end coordinates of transect",
          "Orient transect to capture vegetation diversity"
        ]
      },
      {
        step: 2,
        title: "Height Measurements",
        details: [
          "Set up measuring pole at each measurement point",
          "Mark standard height intervals: 25cm, 50cm, 100cm, 150cm, 200cm",
          "Use consistent measurement heights across all points",
          "Ensure pole is vertical using spirit level"
        ]
      },
      {
        step: 3,
        title: "Photography Protocol",
        details: [
          "Position camera 2m from measurement pole",
          "Hold camera horizontally at each marked height",
          "Frame a 1m² area around the pole at each height",
          "Take photos looking perpendicular to transect direction",
          "Capture both directions (left and right of transect) at each height"
        ]
      },
      {
        step: 4,
        title: "Image Sequence",
        details: [
          "Start at 25cm height, photograph all 5 transect points",
          "Move systematically through each height level",
          "Label images clearly: Point1_25cm, Point1_50cm, etc.",
          "Ensure consistent distance and framing for all shots"
        ]
      }
    ],
    tips: [
      "Photograph during stable lighting conditions",
      "Avoid backlighting and strong shadows", 
      "Keep camera steady - use timer function if needed",
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
    description: "Conduct standardized quadrat sampling using camera-based ground cover analysis",
    equipment: [
      "Smartphone or digital camera",
      "1m × 1m quadrat frame (PVC or metal)",
      "Measuring tape (metric)",
      "Field notebook and pencils",
      "Species identification guides"
    ],
    procedure: [
      {
        step: 1,
        title: "Quadrat Placement",
        details: [
          "Use systematic or random sampling design across study area",
          "Place 1m × 1m frame firmly on ground surface",
          "Ensure frame sits level and covers representative vegetation",
          "Record GPS coordinates for each quadrat location",
          "Minimum 20 quadrats recommended for robust data"
        ]
      },
      {
        step: 2,
        title: "Photography Setup", 
        details: [
          "Position camera directly above center of quadrat",
          "Maintain height of 1.5-2m above frame for full coverage",
          "Ensure entire quadrat area is visible within frame",
          "Keep camera parallel to ground surface",
          "Avoid casting shadows on the quadrat"
        ]
      },
      {
        step: 3,
        title: "Image Capture",
        details: [
          "Take high-resolution photograph (minimum 3000×3000 pixels)",
          "Ensure sharp focus across entire quadrat",
          "Capture under uniform lighting conditions",
          "Include quadrat frame in image for scale reference",
          "Take backup photo if first image is unclear"
        ]
      },
      {
        step: 4,
        title: "Field Documentation",
        details: [
          "Record dominant species present (3-5 most abundant)",
          "Note any rare or unusual species observed",
          "Document disturbance indicators (grazing, trampling, etc.)",
          "Record substrate type (soil, rock, litter)",
          "Note percentage estimates for validation"
        ]
      }
    ],
    tips: [
      "Use consistent camera height across all quadrats",
      "Photograph during overcast conditions for even lighting",
      "Remove any debris that obscures vegetation before photography",
      "Take notes on species that may be difficult to identify in photos"
    ],
    measurements: [
      "Species cover percentage by grid cell",
      "Shannon diversity index", 
      "Species richness per quadrat",
      "Ground cover type percentages (bare soil, litter, rock)"
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
        <CardContent>
          <Tabs defaultValue="procedure" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="procedure">Field Procedure</TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Metric Standards
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="procedure" className="space-y-6">
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

              {/* Step-by-step Procedure */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Field Procedure
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
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <MetricReference toolType={toolType} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}