import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Eye, Download, FileText } from "lucide-react";
import { AnalysisSession } from "@shared/schema";

import BottomNavigation from "@/components/bottom-navigation";
import AnalysisResults from "@/components/analysis-results";
import DataVisualization from "@/components/data-visualization";
import { exportSessionToCSV, shareResults } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

export default function Analysis() {
  const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(null);
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/analysis-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/analysis-sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json() as Promise<AnalysisSession[]>;
    },
  });

  // Handle URL parameters to show specific session
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('id');
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === parseInt(sessionId));
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [sessions]);

  const handleExport = async (session: AnalysisSession) => {
    try {
      await exportSessionToCSV(session);
      toast({
        title: "Export successful",
        description: "Analysis data exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (session: AnalysisSession) => {
    try {
      await shareResults(session);
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GLAMA':
        return 'bg-green-100 text-green-800';
      case 'Canopeo':
        return 'bg-blue-100 text-blue-800';
      case 'Custom':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    if (sessions.length === 0) return null;

    const canopySessions = sessions.filter(s => s.toolType === 'canopy');
    const daubenmireSessions = sessions.filter(s => s.toolType === 'daubenmire');
    const horizontalSessions = sessions.filter(s => s.toolType === 'horizontal_vegetation');

    const avgCanopyCover = canopySessions.length > 0 
      ? canopySessions.reduce((sum, s) => sum + (s.canopyCover || 0), 0) / canopySessions.length
      : 0;
    const avgLightTransmission = canopySessions.length > 0
      ? canopySessions.reduce((sum, s) => sum + (s.lightTransmission || 0), 0) / canopySessions.length
      : 0;
    const totalPixels = sessions.reduce((sum, s) => sum + (s.pixelsAnalyzed || 0), 0);
    const avgProcessingTime = sessions.reduce((sum, s) => sum + (s.processingTime || 0), 0) / sessions.length;

    return {
      avgCanopyCover,
      avgLightTransmission,
      totalPixels,
      avgProcessingTime,
      totalSessions: sessions.length,
      canopySessions: canopySessions.length,
      daubenmireSessions: daubenmireSessions.length,
      horizontalSessions: horizontalSessions.length,
    };
  };

  const stats = calculateStats();

  if (selectedSession) {
    return (
      <div className="pb-20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => setSelectedSession(null)}
            >
              ← Back to Analysis
            </Button>
            <Badge className={getMethodColor(selectedSession.analysisMethod)}>
              {selectedSession.analysisMethod}
            </Badge>
          </div>

          <AnalysisResults
            session={selectedSession}
            onExport={() => handleExport(selectedSession)}
            onShare={() => handleShare(selectedSession)}
          />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="research-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-semibold">Analysis Dashboard</h1>
            <p className="text-xs opacity-80">Ecological Measurement Statistics</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            <TabsTrigger value="details">Session Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Statistics */}
            {stats && (
              <Card>
                <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Summary Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.avgCanopyCover.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Canopy Cover</div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.avgLightTransmission.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Light Trans.</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.avgProcessingTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Process Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Analysis Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No analysis sessions found</p>
                <p className="text-sm">Start by uploading an image on the home page</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{session.plotName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.timestamp).toLocaleDateString()} • {new Date(session.timestamp).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className={getMethodColor(session.analysisMethod)}>
                            {session.analysisMethod}
                          </Badge>
                          {session.latitude && session.longitude && (
                            <Badge variant="outline">GPS</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {session.toolType === 'canopy' ? `${(session.canopyCover || 0).toFixed(1)}%` : 
                         session.toolType === 'daubenmire' ? `${(session.totalCoverage || 0).toFixed(1)}%` :
                         session.toolType === 'horizontal_vegetation' ? `${(session.vegetationDensity || 0).toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.toolType === 'canopy' ? `${(session.lightTransmission || 0).toFixed(1)}% light` :
                         session.toolType === 'daubenmire' ? `${session.speciesDiversity || 0} species` :
                         session.toolType === 'horizontal_vegetation' ? `${session.averageHeight || 0}cm avg` : 'Complete'}
                      </div>
                      <div className="flex items-center space-x-1 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(session);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
          
          <TabsContent value="visualizations">
            <DataVisualization sessions={sessions} />
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Recent Sessions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map(session => (
                    <Card 
                      key={session.id} 
                      className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{session.plotName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getMethodColor(session.analysisMethod)}>
                          {session.analysisMethod}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
