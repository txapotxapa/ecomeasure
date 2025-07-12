import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AccuracyReference from "@/components/accuracy-reference";

// Simple in-app markdown content – can be replaced later with real files
const TECHNICAL_MD = `# EcoMeasure Precision Field Analytics\n\nThis technical documentation summarises algorithms, data flow, and storage layers used in the EcoMeasure application suite.\n\n## Front-end (React + Vite)\n* Offline-first WatermelonDB schema for projects → sites → sessions → measurements.\n* Image processing done in web-workers; results cached by TanStack Query.\n* TailwindCSS for design-system with nature palette.\n\n## Back-end (Express + Drizzle ORM)\n* REST endpoints: /analysis-sessions, /upload-image, /export …\n* PostgreSQL via Neon serverless driver.\n* Session storage backed by connect-pg-simple.\n\n## Image-analysis algorithms\n* **Canopy** – Gap-light & LAI from GLAMA or Canopeo thresholding.\n* **Horizontal vegetation** – Digital Robel pole classification via HSV threshold.\n* **Daubenmire** – Colour clustering + CNN classifier (future ML hook).`;

const PHOTO_GUIDE_MD = `# Field Photography Guidelines\n\n> Consistent photos = consistent metrics.\n\n## Lighting\n* Prefer overcast skies or shoot within 1 hour of sunrise / sunset.\n* Avoid harsh midday shadows and dappled light.\n\n## Camera setup\n* Use rear camera, keep lens clean.\n* Lock focus & exposure before shooting.\n* Hold phone steady – use two hands or mini-tripod.\n\n## Positioning per tool\n| Tool | Height | Distance | Notes |
|------|--------|----------|-------|
| Canopy | 1.3 m (breast height) | N/A | Camera pointing straight up. |
| Horizontal vegetation | 1.0 m | 4 m from pole | Facing N-E-S-W. |
| Daubenmire | 1.5 m | N/A | Camera pointing straight down. |\n\n## File size & format\n* JPEG ≤ 10 MB recommended.\n* Avoid HEIC / RAW – convert on device if needed.`;

export default function DocsPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const docId = params.get("doc") || "technical";

  const [markdown, setMarkdown] = useState<string>("");

  useEffect(() => {
    if (docId === "accuracy") {
      // handled separately
      return;
    }
    if (docId === "photography") {
      setMarkdown(PHOTO_GUIDE_MD);
    } else {
      setMarkdown(TECHNICAL_MD);
    }
  }, [docId]);

  const titleMap: Record<string, string> = {
    technical: "Technical Documentation",
    photography: "Photography Guidelines",
    accuracy: "Measurement Accuracy Info",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{titleMap[docId]}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {docId === "accuracy" ? (
          <AccuracyReference />
        ) : (
          <article className="prose prose-invert max-w-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
} 