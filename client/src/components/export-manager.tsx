import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Share, 
  Camera, 
  FileText, 
  FolderOpen, 
  Image as ImageIcon,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MobileExportService from "@/lib/mobile-export";

interface ExportManagerProps {
  sessions: any[];
  currentSession?: any;
  analysisResult?: any;
  imageData?: string;
}

export default function ExportManager({ 
  sessions, 
  currentSession, 
  analysisResult, 
  imageData 
}: ExportManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingStampedPhoto, setIsCreatingStampedPhoto] = useState(false);
  const { toast } = useToast();

  const handleCreateStampedPhoto = async () => {
    if (!imageData || !analysisResult || !currentSession) {
      toast({
        title: "Missing data",
        description: "Need image and analysis results to create stamped photo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingStampedPhoto(true);

      // Create stamped photo with analysis overlay
      const stampedPhoto = await MobileExportService.createStampedPhoto(
        imageData,
        {
          ...analysisResult,
          analysisMethod: 'GLAMA', // or get from settings
          timestamp: new Date().toISOString(),
        },
        currentSession.name || 'Analysis'
      );

      // Save to Pictures folder
      const filename = `analysis_${Date.now()}.jpg`;
      const photoUri = await MobileExportService.saveStampedPhoto(stampedPhoto, filename);

      toast({
        title: "✅ Photo saved successfully!",
        description: "Stamped photo saved to Pictures/EcoMeasure folder",
      });

      // Show share options
      const shouldShare = confirm("Photo saved! Would you like to share it to Google Photos or other apps?");
      if (shouldShare) {
        await MobileExportService.shareStampedPhoto(photoUri, currentSession.name || 'Analysis');
      }

    } catch (error: any) {
      toast({
        title: "Failed to create stamped photo",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreatingStampedPhoto(false);
    }
  };

  const handleExportCurrentSession = async (format: 'csv' | 'json' = 'csv') => {
    if (!currentSession) {
      toast({
        title: "No session selected",
        description: "Please select a session to export",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      const filename = `session_${currentSession.name || 'analysis'}_${Date.now()}`;
      const exportUri = await MobileExportService.exportAnalysisData(
        [currentSession],
        filename,
        {
          format,
          includeTimestamp: true,
          includeLocation: true,
        }
      );

      toast({
        title: "📁 Export complete!",
        description: `Data exported to Documents/EcoMeasure/Exports`,
      });

      // Ask if user wants to share
      const shouldShare = confirm("Export complete! Would you like to share the file?");
      if (shouldShare) {
        await MobileExportService.shareDataExport(exportUri, currentSession.name || 'Analysis');
      }

    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchExport = async () => {
    if (!sessions || sessions.length === 0) {
      toast({
        title: "No sessions available",
        description: "No analysis sessions to export",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      const result = await MobileExportService.batchExportSessions(sessions, {
        format: 'csv',
        includeTimestamp: true,
        includeLocation: true,
      });

      toast({
        title: "🎉 Batch export complete!",
        description: `Exported ${sessions.length} sessions and ${result.photoCount} stamped photos`,
      });

      // Ask if user wants to share
      const shouldShare = confirm(`Batch export complete! Exported ${sessions.length} sessions and ${result.photoCount} photos. Share the export folder?`);
      if (shouldShare) {
        await MobileExportService.shareDataExport(result.exportPath, 'Batch Export');
      }

    } catch (error: any) {
      toast({
        title: "Batch export failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Share
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Session</TabsTrigger>
            <TabsTrigger value="batch">Batch Export</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentSession ? (
              <>
                {/* Session Info */}
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">{currentSession.name || 'Current Analysis'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentSession.measurements?.length || 0} measurements
                  </p>
                </div>

                {/* Stamped Photo Export */}
                {imageData && analysisResult && (
                  <div className="space-y-2">
                    <h5 className="font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Create Stamped Photo
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Save analyzed photo with results overlay to Pictures folder
                    </p>
                    <Button
                      onClick={handleCreateStampedPhoto}
                      disabled={isCreatingStampedPhoto}
                      className="w-full"
                    >
                      {isCreatingStampedPhoto ? (
                        "Creating Stamped Photo..."
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Save Stamped Photo
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Data Export */}
                <div className="space-y-2">
                  <h5 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Export Data
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExportCurrentSession('csv')}
                      disabled={isExporting}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV Export
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExportCurrentSession('json')}
                      disabled={isExporting}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      JSON Export
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No session selected</p>
                <p className="text-sm">Start an analysis to enable exports</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            {sessions && sessions.length > 0 ? (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">All Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        {sessions.length} sessions available for export
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {sessions.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Export all sessions with data and stamped photos to Downloads folder
                  </p>
                  
                  <Button
                    onClick={handleBatchExport}
                    disabled={isExporting}
                    className="w-full"
                  >
                    {isExporting ? (
                      "Exporting All Sessions..."
                    ) : (
                      <>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Export All Sessions
                      </>
                    )}
                  </Button>
                </div>

                {/* Export Location Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-1" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Export Locations:</p>
                      <p className="text-blue-700">📁 Data: Documents/EcoMeasure/Exports</p>
                      <p className="text-blue-700">📷 Photos: Pictures/EcoMeasure</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No sessions available</p>
                <p className="text-sm">Complete some analysis sessions first</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}