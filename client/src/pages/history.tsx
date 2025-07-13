import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  MapPin,
  Calendar,
  BarChart3,
  FileSpreadsheet
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AnalysisSession } from "@shared/schema";
import { format } from "date-fns";
import SessionCard from "@/components/session-card";
import { useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

import BottomNavigation from "@/components/bottom-navigation";
import GoogleSheetsExport from "@/components/google-sheets-export";
import { exportToCSV, exportSessionToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [toolTypeFilter, setToolTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [showGoogleSheetsDialog, setShowGoogleSheetsDialog] = useState(false);
  const [showCurrentData, setShowCurrentData] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>('cards');
  const [itemsToShow, setItemsToShow] = useState(20);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/analysis-sessions'],
    queryFn: async () => {
      const response = await apiRequest('/api/analysis-sessions');
      return response.json() as Promise<AnalysisSession[]>;
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest(`/api/analysis-sessions/${sessionId}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analysis-sessions'] });
      toast({
        title: "Session deleted",
        description: "Analysis session has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => {
      const matchesSearch = session.plotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod = methodFilter === "all" || session.analysisMethod === methodFilter;
      const matchesTool   = toolTypeFilter === "all" || session.toolType === toolTypeFilter;
      return matchesSearch && matchesMethod && matchesTool;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "name":
          return a.plotName.localeCompare(b.plotName);
        case "canopy":
          return (b.canopyCover || 0) - (a.canopyCover || 0);
        case "light":
          return (b.lightTransmission || 0) - (a.lightTransmission || 0);
        default:
          return 0;
      }
    });

  const handleExportAll = async () => {
    try {
      await exportToCSV(filteredSessions);
      toast({
        title: "Export successful",
        description: `${filteredSessions.length} sessions exported to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleExportSession = async (session: AnalysisSession) => {
    try {
      await exportSessionToCSV(session);
      toast({
        title: "Export successful",
        description: "Session data exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (window.confirm("Are you sure you want to delete this analysis session?")) {
      await deleteSessionMutation.mutateAsync(sessionId);
    }
  };

  const handleSelectSession = (sessionId: number) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === filteredSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(filteredSessions.map(s => s.id));
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

  const getCanopyCoverColor = (cover: number) => {
    if (cover >= 80) return 'text-green-600';
    if (cover >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const columnSet = (toolTypeFilter === 'canopy') ? ['Canopy %','Light %','LAI','Height (m)'] :
                    (toolTypeFilter === 'daubenmire') ? ['Total %','Diversity','Bare %','Litter %'] :
                    (toolTypeFilter === 'horizontal_vegetation') ? ['Status','--','--','--'] : ['Metric1','Metric2','Metric3','Metric4'];

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting) {
      setItemsToShow(prev => Math.min(prev + 20, filteredSessions.length));
    }
  }, [filteredSessions.length]);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="pb-20 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="analysis-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="h-6 w-6" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">Session History</h1>
            <p className="text-xs opacity-80 truncate">
              {filteredSessions.length} of {sessions.length} sessions
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-full overflow-x-hidden">
        {/* Search and Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <span className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter & Search</span>
              </span>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="flex-1 sm:flex-none"
                  >
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'spreadsheet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('spreadsheet')}
                    className="flex-1 sm:flex-none"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Spreadsheet
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  disabled={filteredSessions.length === 0}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {/* Google Sheets export temporarily disabled */}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by plot name or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Analysis Method
                </label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="GLAMA">Standard Analysis</SelectItem>
                    <SelectItem value="Canopeo">Advanced Analysis</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tool-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tool Type</Label>
                <Select value={toolTypeFilter} onValueChange={setToolTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tools</SelectItem>
                    <SelectItem value="canopy">Canopy</SelectItem>
                    <SelectItem value="horizontal_vegetation">Horizontal</SelectItem>
                    <SelectItem value="daubenmire">Daubenmire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="name">Plot Name</SelectItem>
                    <SelectItem value="canopy">Canopy Cover</SelectItem>
                    <SelectItem value="light">Light Transmission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={filteredSessions.length === 0}
                  className="w-full"
                >
                  {selectedSessions.length === filteredSessions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Measurement Quick View */}
        {sessions.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              {(() => {
                const latestSession = sessions.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )[0];
                
                return (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-800">
                          Latest: {latestSession.toolType === 'canopy' 
                            ? `${latestSession.canopyCover?.toFixed(1)}% canopy cover`
                            : latestSession.toolType === 'daubenmire'
                            ? `${latestSession.totalCoverage?.toFixed(1)}% ground cover`
                            : 'Analysis completed'}
                        </div>
                        <div className="text-xs text-green-600">
                          {latestSession.siteName} • {format(new Date(latestSession.timestamp), "MMM d, HH:mm")} • Logged ✓
                        </div>
                      </div>
                    </div>
                    <Badge className={getMethodColor(latestSession.analysisMethod)}>
                      {latestSession.analysisMethod}
                    </Badge>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sessions found</p>
                <p className="text-sm">
                  {searchTerm || methodFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Start by creating your first analysis session"
                  }
                </p>
              </div>
            ) : viewMode === 'cards' && (
              <div className="grid grid-cols-1 gap-4">
                {filteredSessions.slice(0, itemsToShow).map(session => (
                  <SessionCard key={session.id} session={session} onClick={() => setLocation(`/analysis?id=${session.id}`)} />
                ))}
                {itemsToShow < filteredSessions.length && (
                  <div ref={loaderRef} className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded" />)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
