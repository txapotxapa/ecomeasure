import { Card, CardContent } from "@/components/ui/card";
import { 
  TreePine, 
  Layers, 
  Grid3x3
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
    name: 'Canopy Cover',
    description: 'Gap light analysis using upward photos',
    icon: TreePine,
    iconColor: 'text-primary',
  },
  {
    id: 'horizontal_vegetation' as ToolType,
    name: 'Horizontal Vegetation',
    description: 'Multi-height vegetation density',
    icon: Layers,
    iconColor: 'text-primary',
  },
  {
    id: 'daubenmire' as ToolType,
    name: 'Ground Cover',
    description: 'Digital quadrat sampling',
    icon: Grid3x3,
    iconColor: 'text-primary',
  },
];

export default function ToolSelector({ selectedTool, onToolSelect, className }: ToolSelectorProps) {
  return (
    <div className={`grid gap-3 grid-cols-1 md:grid-cols-3 ${className}`}>
      {tools.map((tool) => {
        const isSelected = selectedTool === tool.id;
        const IconComponent = tool.icon;

        return (
          <Card 
            key={tool.id}
            className={`cursor-pointer transition-all duration-200 card-topo ${
              isSelected 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-accent/20' 
                : 'hover:bg-accent/10'
            }`}
            onClick={() => onToolSelect(tool.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <IconComponent className={`h-5 w-5 ${tool.iconColor} ${isSelected ? 'drop-shadow-lg' : ''}`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                </div>
                {isSelected && (
                  <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 animate-pulse"></div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}