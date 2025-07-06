import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

import BottomNavigation from "@/components/bottom-navigation";
import GoogleSheetsExport from "@/components/google-sheets-export";
import { exportToCSV, exportSessionToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [showGoogleSheetsDialog, setShowGoogleSheetsDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/analysis-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/analysis-sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json() as Promise<AnalysisSession[]>;
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('DELETE', `/api/analysis-sessions/${sessionId}`);
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
      return matchesSearch && matchesMethod;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "name":
          return a.plotName.localeCompare(b.plotName);
        case "canopy":
          return b.canopyCover - a.canopyCover;
        case "light":
          return b.lightTransmission - a.lightTransmission;
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

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="analysis-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-semibold">Session History</h1>
            <p className="text-xs opacity-80">
              {filteredSessions.length} of {sessions.length} sessions
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search and Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter & Search</span>
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  disabled={filteredSessions.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Dialog open={showGoogleSheetsDialog} onOpenChange={setShowGoogleSheetsDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filteredSessions.length === 0}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Google Sheets
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Export to Google Sheets</DialogTitle>
                    </DialogHeader>
                    <GoogleSheetsExport 
                      sessions={filteredSessions} 
                      selectedSessionIds={selectedSessions.length > 0 ? selectedSessions : undefined} 
                    />
                  </DialogContent>
                </Dialog>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Analysis Method
                </label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="GLAMA">GLAMA</SelectItem>
                    <SelectItem value="Canopeo">Canopeo</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
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
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedSessions.includes(session.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => handleSelectSession(session.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-800">{session.plotName}</h3>
                            <Badge className={getMethodColor(session.analysisMethod)}>
                              {session.analysisMethod}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {format(new Date(session.timestamp), 'PPp')}
                              </span>
                            </div>
                            
                            {session.latitude && session.longitude && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 font-mono">
                                  {session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {session.pixelsAnalyzed.toLocaleString()} pixels
                              </span>
                            </div>
                          </div>
                          
                          {session.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              "{session.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getCanopyCoverColor(session.canopyCover)}`}>
                            {session.canopyCover.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {session.lightTransmission.toFixed(1)}% light
                          </div>
                          {session.leafAreaIndex && (
                            <div className="text-xs text-gray-500">
                              LAI: {session.leafAreaIndex.toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportSession(session)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
