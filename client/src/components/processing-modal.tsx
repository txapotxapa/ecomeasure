import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

interface ProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  stage: string;
  canCancel?: boolean;
  onCancel?: () => void;
  analysisType?: 'canopy' | 'horizontal_vegetation' | 'daubenmire';
}

export default function ProcessingModal({
  isOpen,
  onClose,
  progress,
  stage,
  canCancel = false,
  onCancel,
  analysisType = 'canopy',
}: ProcessingModalProps) {
  const estimatedTime = Math.max(0, Math.round((100 - progress) / 3)); // Rough estimation

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Processing Analysis</span>
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{stage}</span>
              <span className="text-gray-500">
                {estimatedTime > 0 ? `~${estimatedTime}s remaining` : "Almost done"}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {analysisType === 'canopy' && 'Analyzing canopy cover and light transmission patterns...'}
              {analysisType === 'horizontal_vegetation' && 'Analyzing vegetation density at multiple heights...'}
              {analysisType === 'daubenmire' && 'Analyzing ground cover using advanced method...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Please keep this window open during processing
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
