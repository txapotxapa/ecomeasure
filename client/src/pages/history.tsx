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
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TreePine,
  Eye,
  Grid3X3,
  Clock,
  Target
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AnalysisSession } from "@shared/schema";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import SessionCard from "@/components/session-card";
import { useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case 'canopy': return TreePine;
      case 'horizontal_vegetation': return Eye;
      case 'daubenmire': return Grid3X3;
      default: return BarChart3;
    }
  };

  const getToolColor = (toolType: string) => {
    switch (toolType) {
      case 'canopy': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'horizontal_vegetation': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'daubenmire': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatRelativeTime = (date: Date) => {
    if (isToday(date)) return `Today at ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, 'HH:mm')}`;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const groupSessionsByDate = (sessions: AnalysisSession[]) => {
    const groups: { [key: string]: AnalysisSession[] } = {};
    sessions.forEach(session => {
      const date = new Date(session.timestamp);
      const key = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d, yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
    return groups;
  };

  const getSessionStats = (sessions: AnalysisSession[]) => {
    const stats = {
      total: sessions.length,
      canopy: sessions.filter(s => s.toolType === 'canopy').length,
      horizontal: sessions.filter(s => s.toolType === 'horizontal_vegetation').length,
      daubenmire: sessions.filter(s => s.toolType === 'daubenmire').length,
      avgCanopy: 0,
      recentActivity: 0
    };
    
    const canopySessions = sessions.filter(s => s.canopyCover);
    if (canopySessions.length > 0) {
      stats.avgCanopy = canopySessions.reduce((sum, s) => sum + (s.canopyCover || 0), 0) / canopySessions.length;
    }
    
    const today = new Date();
    stats.recentActivity = sessions.filter(s => {
      const sessionDate = new Date(s.timestamp);
      const daysDiff = (today.getTime() - sessionDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 7;
    }).length;
    
    return stats;
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

  const stats = getSessionStats(sessions);
  const groupedSessions = groupSessionsByDate(filteredSessions);

  return (
    <div className="pb-20 max-w-full overflow-x-hidden">
      {/* Modern Header with Stats */}
      <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
          <HistoryIcon className="h-6 w-6" />
              </div>
          <div>
                <h1 className="text-xl font-bold">Field Data</h1>
                <p className="text-sm opacity-90">
                  {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportAll}
              disabled={filteredSessions.length === 0}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs opacity-80">Total Sessions</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <div className="text-xs opacity-80">This Week</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.avgCanopy > 0 ? `${stats.avgCanopy.toFixed(0)}%` : '--'}</div>
              <div className="text-xs opacity-80">Avg Canopy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Bar - Always Visible */}
            <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
            placeholder="Search measurements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12 text-base"
              />
            </div>

        {/* Collapsible Filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-12">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filters & Sort</span>
                {(methodFilter !== "all" || toolTypeFilter !== "all" || sortBy !== "date") && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </div>
              {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                    <Label className="text-sm font-medium">Tool Type</Label>
                    <Select value={toolTypeFilter} onValueChange={setToolTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="all">All Tools</SelectItem>
                        <SelectItem value="canopy">🌲 Canopy Analysis</SelectItem>
                        <SelectItem value="horizontal_vegetation">👁️ Horizontal Vegetation</SelectItem>
                        <SelectItem value="daubenmire">⬜ Ground Cover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                    <Label className="text-sm font-medium">Analysis Method</Label>
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                        <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="GLAMA">GLAMA</SelectItem>
                        <SelectItem value="Canopeo">Canopeo</SelectItem>
                        <SelectItem value="Digital Robel Pole">Digital Robel</SelectItem>
                        <SelectItem value="Frame-free Analysis">Frame-free</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                    <Label className="text-sm font-medium">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="date">📅 Newest First</SelectItem>
                        <SelectItem value="name">📝 Plot Name</SelectItem>
                        <SelectItem value="canopy">🌲 Canopy Cover</SelectItem>
                        <SelectItem value="light">☀️ Light Transmission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                      onClick={() => {
                        setMethodFilter("all");
                        setToolTypeFilter("all");
                        setSortBy("date");
                        setSearchTerm("");
                      }}
                  className="w-full"
                >
                      Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Recent Highlight */}
        {sessions.length > 0 && !searchTerm && methodFilter === "all" && toolTypeFilter === "all" && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="pt-4">
              {(() => {
                const latestSession = sessions.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )[0];
                const ToolIcon = getToolIcon(latestSession.toolType);
                
                return (
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-green-100/50 rounded-lg transition-colors"
                    onClick={() => setLocation(`/analysis?id=${latestSession.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getToolColor(latestSession.toolType)}`}>
                        <ToolIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200">
                          Latest Result: {latestSession.toolType === 'canopy' 
                            ? `${latestSession.canopyCover?.toFixed(1)}% canopy cover`
                            : latestSession.toolType === 'daubenmire'
                            ? `${latestSession.totalCoverage?.toFixed(1)}% ground cover`
                            : 'Analysis completed'}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          {latestSession.siteName || latestSession.plotName} • {formatRelativeTime(new Date(latestSession.timestamp))}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {latestSession.analysisMethod}
                    </Badge>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="animate-pulse space-y-3">
                    <div className="flex space-x-3">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
                  <HistoryIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No measurements found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || methodFilter !== "all" || toolTypeFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                      : "Start by creating your first field measurement"
                  }
                </p>
                </div>
                {(!searchTerm && methodFilter === "all" && toolTypeFilter === "all") && (
                  <Button onClick={() => setLocation('/')} className="mt-4">
                    Start Measuring
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Grouped Timeline View */
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([dateGroup, groupSessions]) => (
              <div key={dateGroup} className="space-y-3">
                <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{dateGroup}</h3>
                    <Badge variant="secondary">{groupSessions.length}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  {groupSessions.slice(0, itemsToShow).map((session, index) => {
                    const ToolIcon = getToolIcon(session.toolType);
                    
                    return (
                      <Card 
                        key={session.id} 
                        className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary relative"
                        onClick={() => setLocation(`/analysis?id=${session.id}`)}
                      >
                        {/* Timeline Dot */}
                        <div className="absolute -left-8 top-6 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                        
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-2 rounded-lg ${getToolColor(session.toolType)}`}>
                                <ToolIcon className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium truncate">{session.siteName || session.plotName}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {session.analysisMethod}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {session.toolType === 'canopy' && session.canopyCover && (
                                    <>
                                      <div>
                                        <span className="text-muted-foreground">Canopy Cover:</span>
                                        <span className={`ml-1 font-medium ${getCanopyCoverColor(session.canopyCover)}`}>
                                          {session.canopyCover.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Light Trans:</span>
                                        <span className="ml-1 font-medium">
                                          {session.lightTransmission?.toFixed(1)}%
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {session.toolType === 'daubenmire' && (
                                    <>
                                      <div>
                                        <span className="text-muted-foreground">Ground Cover:</span>
                                        <span className="ml-1 font-medium">
                                          {session.totalCoverage?.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Species:</span>
                                        <span className="ml-1 font-medium">
                                          {session.speciesDiversity}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {session.toolType === 'horizontal_vegetation' && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Vegetation Analysis:</span>
                                      <span className="ml-1 font-medium">Complete</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(new Date(session.timestamp), 'HH:mm')}</span>
                                  </div>
                                  {(session.latitude && session.longitude) && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}</span>
                  </div>
                )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {itemsToShow < filteredSessions.length && (
              <div ref={loaderRef} className="space-y-3 ml-6">
                {[1,2,3].map(i => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
