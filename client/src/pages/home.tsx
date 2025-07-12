import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  TreePine, 
  Camera, 
  BarChart3, 
  MapPin, 
  History, 
  Settings, 
  TrendingUp,
  Sun,
  Moon,
  Bell,
  FileSpreadsheet,
  Eye,
  Grid3X3,
  Home as HomeIcon,
  Clock,
  Calendar,
  Award,
  Target,
  Download,
  Zap,
  Info,
  Mountain,
  Navigation,
  Layers,
  CheckCircle,
  Users,
  Compass
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { AnalysisSession } from "@shared/schema";
import BottomNavigation from "@/components/bottom-navigation";
import SiteSelector from "@/components/site-selector";
import { useTheme } from "@/hooks/use-theme";
import GPSAccuracyIndicator from "@/components/gps-accuracy-indicator";
import EcoMeasureLogo from "@/components/eco-measure-logo";
// Dark theme is now set by default in App.tsx

interface SiteInfo {
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  createdAt: Date;
  sessionCounts: {
    canopy: number;
    horizontal_vegetation: number;
    daubenmire: number;
  };
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null);

  // Fetch recent sessions for dashboard
  const { data: sessions = [], isLoading } = useQuery<AnalysisSession[]>({
    queryKey: ["/api/analysis-sessions"],
  });

  // Filter sessions for current site
  const siteSessionsFilter = currentSite 
    ? sessions.filter(s => s.siteName === currentSite.name)
    : sessions;

  const recentSessions = siteSessionsFilter.slice(0, 3);

  // Save current site to localStorage when it changes
  const handleSiteChange = (site: SiteInfo) => {
    setCurrentSite(site);
    localStorage.setItem('current-research-site', JSON.stringify(site));
  };

  // Load current site from localStorage
  useEffect(() => {
    const savedCurrentSite = localStorage.getItem('current-research-site');
    if (savedCurrentSite) {
      try {
        const siteData = JSON.parse(savedCurrentSite);
        setCurrentSite({
          ...siteData,
          createdAt: new Date(siteData.createdAt)
        });
      } catch (error) {
        console.error('Error loading current site:', error);
      }
    }
  }, []);

  const tools = [
    {
      id: 'canopy',
      title: 'Canopy Analysis',
      description: 'Measure forest canopy cover and light transmission using upward-facing camera',
      icon: TreePine,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      darkColor: 'bg-green-900/20',
      textColor: 'text-green-600',
              features: ['Gap light measurement', 'Advanced algorithms', 'LAI calculation'],
      route: '/tools?tool=canopy'
    },
    {
      id: 'horizontal_vegetation',
      title: 'Horizontal Vegetation',
      description: 'Analyze vegetation density using camera-based Digital Robel Pole method',
      icon: Eye,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      darkColor: 'bg-blue-900/20',
      textColor: 'text-blue-600',
      features: ['4m distance analysis', 'Cardinal directions', 'Density profiling'],
      route: '/tools?tool=horizontal_vegetation'
    },
    {
      id: 'daubenmire',
      title: 'Daubenmire Frame',
              description: 'Advanced ground cover analysis for vegetation classification',
      icon: Grid3X3,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      darkColor: 'bg-purple-900/20',
      textColor: 'text-purple-600',
              features: ['Advanced algorithm', 'Ground cover classification', 'Vegetation percentage'],
      route: '/tools?tool=daubenmire'
    }
  ];

  const quickActions = [
    {
      title: 'Start Analysis',
      description: 'Begin new field measurement',
      icon: Camera,
      color: 'bg-primary',
      action: () => setLocation('/tools')
    },
    {
      title: 'View Results',
      description: 'See recent analysis results',
      icon: BarChart3,
      color: 'bg-green-600',
      action: () => setLocation('/analysis')
    },
    {
      title: 'Session History',
      description: 'Browse past measurements',
      icon: History,
      color: 'bg-blue-600',
      action: () => setLocation('/history')
    },
    {
      title: 'Export Data',
      description: 'Download or share results',
      icon: Download,
      color: 'bg-purple-600',
      action: () => setLocation('/history')
    }
  ];

  const handleToolSelect = (route: string) => {
    setLocation(route);
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-black text-white pt-6 pb-12 shadow relative z-10 flex flex-col items-center">
        {/* Settings button top-right */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/settings')}
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* Centered brand logo */}
        <EcoMeasureLogo size={160} />
      </header>
      {/* Site Information block removed per branding simplification */}

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Quick Actions block removed */}

        {/* Site Selector */}
        <SiteSelector 
          currentSite={currentSite}
          onSiteChange={handleSiteChange}
        />

        {/* Quick Measurement Tools - Home Screen Access */}
        {currentSite ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Start Measurement
              </CardTitle>
              <CardDescription>
                Direct access to measurement tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button
                  className="h-16 justify-start space-x-4 bg-primary hover:bg-primary/90"
                  onClick={() => setLocation('/tools?tool=canopy')}
                >
                  <TreePine className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-medium">Canopy Cover Analysis</div>
                    <div className="text-xs opacity-90">Upload photo → instant analysis results</div>
                  </div>
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex-col space-y-1 card-topo"
                    onClick={() => setLocation('/tools?tool=horizontal_vegetation')}
                  >
                    <Layers className="h-5 w-5 text-primary" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Horizontal Vegetation</div>
                      <div className="text-xs text-muted-foreground">Multi-height photos</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col space-y-1 card-topo"
                    onClick={() => setLocation('/tools?tool=daubenmire')}
                  >
                    <Grid3X3 className="h-5 w-5 text-primary" />
                    <div className="text-center">
                      <div className="font-medium text-sm">Ground Cover</div>
                      <div className="text-xs text-muted-foreground">Advanced method</div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setLocation('/tools')}
            >
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Measurement Tools
              </CardTitle>
              <CardDescription>
                Click to access measurement tools (site creation optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors hover:opacity-100"
                  onClick={() => setLocation(tool.route)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${tool.lightColor} dark:${tool.darkColor}`}>
                      <tool.icon className={`h-6 w-6 ${tool.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {tool.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </span>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/history')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border cursor-pointer hover:bg-accent/20 transition-colors"
                    onClick={() => setLocation(`/analysis?id=${session.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {session.toolType === 'canopy' && <TreePine className="h-4 w-4 text-green-600" />}
                        {session.toolType === 'horizontal_vegetation' && <Eye className="h-4 w-4 text-blue-600" />}
                        {session.toolType === 'daubenmire' && <Grid3X3 className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{session.plotName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.timestamp), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {session.canopyCover && (
                        <p className="text-sm font-medium">{session.canopyCover.toFixed(1)}%</p>
                      )}
                      <Badge variant={session.isCompleted ? "default" : "secondary"} className="text-xs">
                        {session.isCompleted ? "Complete" : "In Progress"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start your first measurement to see results here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Quick Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">GPS Location</p>
                  <p className="text-sm text-muted-foreground">Auto-capture coordinates</p>
                </div>
              </div>
              <Switch checked={gpsEnabled} onCheckedChange={setGpsEnabled} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Auto-save Results</p>
                  <p className="text-sm text-muted-foreground">Automatically save completed analyses</p>
                </div>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Analysis completion alerts</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">{theme === 'dark' ? 'Dark' : 'Light'} Mode</p>
                </div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>

        {/* Help & Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Help & Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/docs?doc=technical')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                View Technical Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/docs?doc=photography')}>
                <Camera className="h-4 w-4 mr-2" />
                Photography Guidelines
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/docs?doc=accuracy')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Measurement Accuracy Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}