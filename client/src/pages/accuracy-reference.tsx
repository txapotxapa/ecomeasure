import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import AccuracyReferenceComponent from "@/components/accuracy-reference";

export default function AccuracyReferencePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/settings')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Accuracy Reference</h1>
            <p className="text-xs opacity-80">Scientific measurement standards</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AccuracyReferenceComponent />
      </div>
    </div>
  );
}