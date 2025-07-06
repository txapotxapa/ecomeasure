import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ToolInstructions from "./tool-instructions";
import { 
  TreePine, 
  Layers, 
  Grid3x3, 
  Camera, 
  MapPin, 
  BarChart3,
  Ruler,
  Target,
  Leaf,
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export type ToolType = 'canopy' | 'horizontal_vegetation' | 'daubenmire';

interface ToolSelectorProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  className?: string;
}

const tools = [
  {
    id: 'canopy' as ToolType,
    name: 'Canopy Cover Analysis',
    description: 'Measure forest canopy cover and light transmission using upward-facing photographs',
    icon: TreePine,
    color: 'hover:bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100',
    features: ['Gap Light Analysis', 'Leaf Area Index', 'Light Transmission'],
    methods: ['GLAMA', 'Canopeo', 'Custom Analysis']
  },
  {
    id: 'horizontal_vegetation' as ToolType,
    name: 'Horizontal Vegetation Cover',
    description: 'Assess vegetation density at multiple height levels using horizontal photographs',
    icon: Layers,
    color: 'hover:bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100',
    features: ['Multi-Height Analysis', 'Density Profiles', 'Vegetation Structure'],
    methods: ['Color Threshold', 'Edge Detection', 'Machine Learning']
  },
  {
    id: 'daubenmire' as ToolType,
    name: 'Digital Daubenmire Frame',
    description: 'Simple photo-based quadrat sampling for ground cover analysis',
    icon: Grid3x3,
    color: 'hover:bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100',
    features: ['Ground Cover Analysis', 'Species Diversity', 'Photo-Based Sampling'],
    methods: ['Grid Analysis', 'Automated Classification', 'Coverage Calculation']
  },
];

export default function ToolSelector({ selectedTool, onToolSelect, className }: ToolSelectorProps) {
  const [expandedTool, setExpandedTool] = useState<ToolType | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ecological Measurement Suite
        </h2>
        <p className="text-gray-600">
          Choose your field research tool and follow the metric-based protocols
        </p>
      </div>

      <div className="space-y-4">
        {/* Tool Selection Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((tool) => {
            const isSelected = selectedTool === tool.id;
            const isExpanded = expandedTool === tool.id;
            const IconComponent = tool.icon;

            return (
              <Card 
                key={tool.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : tool.color
                }`}
                onClick={() => {
                  if (isExpanded) {
                    onToolSelect(tool.id);
                  } else {
                    setExpandedTool(tool.id);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tool.badgeColor}`}>
                        <IconComponent className={`w-5 h-5 ${tool.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <Button size="sm" variant="default">
                        Select
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Key Features
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {tool.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Analysis Methods
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {tool.methods.map((method, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Camera className="w-3 h-3 mr-1" />
                            Camera Required
                          </span>
                          <span className="flex items-center">
                            <Ruler className="w-3 h-3 mr-1" />
                            Metric Scale
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Selected Tool Status */}
        {selectedTool && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-green-600" />
                <span className="font-medium">
                  {tools.find(t => t.id === selectedTool)?.name} Ready
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Instructions
                  {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setExpandedTool(null)}
                >
                  Change Tool
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Section */}
        {selectedTool && showInstructions && (
          <div className="mt-4">
            <ToolInstructions toolType={selectedTool} />
          </div>
        )}
      </div>
    </div>
  );
}