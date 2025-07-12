import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Download, Share2, TreePine, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import { AnalysisSession } from "@shared/schema";
import GoogleSheetsExport from "./google-sheets-export";

interface AnalysisResultsProps {
  session: AnalysisSession;
  onExport?: () => void;
  onShare?: () => void;
  compact?: boolean;
}

export default function AnalysisResults({ 
  session, 
  onExport, 
  onShare, 
  compact = false 
}: AnalysisResultsProps) {
  const [showGoogleSheetsDialog, setShowGoogleSheetsDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  
  const formatProcessingTime = (ms?: number) => {
    if (!ms) return "N/A";
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const formatNumber = (num: number | undefined | null, decimals: number = 1) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return num.toFixed(decimals);
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TreePine className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-gray-800">{session.plotName}</h3>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(session.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          {/* Thumbnail for compact view */}
          {session.imageUrl && (
            <div className="mb-4">
              <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer group">
                    <img
                      src={session.imageUrl}
                      alt="Analysis thumbnail"
                      className="w-full h-32 object-cover rounded-lg transition-opacity group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Analyzed Image - {session.plotName}</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center">
                    <img
                      src={session.imageUrl}
                      alt="Full size analyzed image"
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Canopy Cover</span>
                <span className="text-2xl font-bold text-primary">
                  {formatNumber(session.canopyCover)}%
                </span>
              </div>
              <Progress value={session.canopyCover} className="h-2" />
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Light Trans.</span>
                <span className="text-2xl font-bold text-secondary">
                  {formatNumber(session.lightTransmission)}%
                </span>
              </div>
              <Progress value={session.lightTransmission} className="h-2" />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onExport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Analysis Results</span>
          </span>
          <Badge variant="outline">{session.analysisMethod}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Thumbnail */}
        {session.imageUrl && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Analyzed Image
            </h4>
            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group">
                  <img
                    src={session.imageUrl}
                    alt="Analysis thumbnail"
                    className="w-full h-48 object-cover rounded-lg transition-opacity group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <div className="bg-white/90 px-3 py-2 rounded-md">
                      <p className="text-sm font-medium text-gray-800">Click to view full size</p>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Analyzed Image - {session.plotName}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  <img
                    src={session.imageUrl}
                    alt="Full size analyzed image"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Main Results – switch by tool */}
        {session.toolType === 'canopy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Canopy Cover</span>
                <span className="text-3xl font-bold text-primary">
                  {formatNumber(session.canopyCover)}%
                </span>
              </div>
              <Progress value={session.canopyCover} className="h-3" />
              <p className="text-xs text-gray-600 mt-2">% of sky obscured by vegetation</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Light Transmission</span>
                <span className="text-3xl font-bold text-secondary">
                  {formatNumber(session.lightTransmission)}%
                </span>
              </div>
              <Progress value={session.lightTransmission} className="h-3" />
              <p className="text-xs text-gray-600 mt-2">% of light reaching forest floor</p>
            </div>
          </div>
        )}

        {session.toolType === 'daubenmire' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Total Ground Cover</span>
                <span className="text-3xl font-bold text-purple-600">
                  {formatNumber(session.totalCoverage)}%
                </span>
              </div>
              <Progress value={session.totalCoverage ?? undefined} className="h-3" />
              <p className="text-xs text-gray-600 mt-2">% of frame covered by vegetation + litter</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Bare Ground</span>
                <span className="text-3xl font-bold text-yellow-600">
                  {formatNumber(session.bareGroundPercentage)}%
                </span>
              </div>
              <Progress value={session.bareGroundPercentage ?? undefined} className="h-3" />
              <p className="text-xs text-gray-600 mt-2">% of frame with exposed soil</p>
            </div>
          </div>
        )}

        {/* Additional Metrics */}
        {session.toolType === 'canopy' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">
                {session.leafAreaIndex ? formatNumber(session.leafAreaIndex, 2) : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">Leaf Area Index</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">
                {session.pixelsAnalyzed.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Pixels Analyzed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">{session.zenithAngle}°</div>
              <div className="text-xs text-gray-600">Zenith Angle</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">{formatProcessingTime(session.processingTime)}</div>
              <div className="text-xs text-gray-600">Processing Time</div>
            </div>
          </div>
        )}

        {session.toolType === 'daubenmire' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">
                {session.litterPercentage != null ? formatNumber(session.litterPercentage) : 'N/A'}%
              </div>
              <div className="text-xs text-gray-600">Litter</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">
                {session.rockPercentage != null ? formatNumber(session.rockPercentage) : 'N/A'}%
              </div>
              <div className="text-xs text-gray-600">Rock</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">
                {session.speciesDiversity ?? 'N/A'}
              </div>
              <div className="text-xs text-gray-600">Species Count</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">
                {session.shannonIndex ? formatNumber(session.shannonIndex,2) : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">Shannon Index</div>
            </div>
          </div>
        )}

        {/* Location Information */}
        {(session.latitude && session.longitude) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Location Data</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono ml-2">{session.latitude.toFixed(6)}°</span>
              </div>
              <div>
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono ml-2">{session.longitude.toFixed(6)}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {session.notes && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
            <p className="text-sm text-gray-700">{session.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={onExport} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={showGoogleSheetsDialog} onOpenChange={setShowGoogleSheetsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Google Sheets
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Export to Google Sheets</DialogTitle>
              </DialogHeader>
              <GoogleSheetsExport 
                sessions={[session]} 
                selectedSessionIds={[session.id]} 
              />
            </DialogContent>
          </Dialog>
          <Button onClick={onShare} variant="outline" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
