import { AnalysisSession } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { MapPin, BarChart3 } from "lucide-react";

interface SessionCardProps {
  session: AnalysisSession;
  onClick?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}

export default function SessionCard({ session, onClick }: SessionCardProps) {
  // Prepare mini chart data (canopy cover over time placeholder)
  const mainValue = useMemo(() => {
    if (session.toolType === 'canopy') return `${(session.canopyCover ?? 0).toFixed(1)}% cover`;
    if (session.toolType === 'daubenmire') return `${(session.totalCoverage ?? 0).toFixed(1)}% cover`;
    if (session.toolType === 'horizontal_vegetation') return `${(session.vegetationDensity ?? 0).toFixed(1)}% density`;
    return 'Analysis';
  }, [session]);

  return (
    <Card className="card-3d cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium truncate max-w-[60%]">{session.plotName}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(session.timestamp).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="w-3 h-3" />
            {session.toolType}
          </div>
          <div className="text-sm font-medium">
            {mainValue}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 