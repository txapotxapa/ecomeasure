import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Plus, 
  Mountain,
  Target,
  TreePine,
  Eye,
  Grid3X3,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";

interface SiteInfo {
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  photoUrl?: string; // Site documentation photo
  notes?: string; // Site notes for documentation
  createdAt: Date;
  sessionCounts: {
    canopy: number;
    horizontal_vegetation: number;
    daubenmire: number;
  };
}

interface SiteSelectorProps {
  currentSite: SiteInfo | null;
  onSiteChange: (site: SiteInfo) => void;
}

export default function SiteSelector({ currentSite, onSiteChange }: SiteSelectorProps) {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [, setLocation] = useLocation();

  // Load sites from localStorage
  useEffect(() => {
    const savedSites = localStorage.getItem('research-sites');
    if (savedSites) {
      try {
        const parsedSites = JSON.parse(savedSites).map((site: any) => ({
          ...site,
          createdAt: new Date(site.createdAt)
        }));
        setSites(parsedSites);
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    }
  }, []);

  // Watch for changes to current site from the create-site page
  useEffect(() => {
    const handleSiteCreated = (event: CustomEvent) => {
      const newSite = event.detail;
      onSiteChange(newSite);
      
      // Update sites list
      const savedSites = localStorage.getItem('research-sites');
      if (savedSites) {
        try {
          const parsedSites = JSON.parse(savedSites).map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt)
          }));
          setSites(parsedSites);
        } catch (error) {
          console.error('Error loading updated sites:', error);
        }
      }
    };

    // Listen for custom siteCreated event
    window.addEventListener('siteCreated', handleSiteCreated as EventListener);
    
    return () => {
      window.removeEventListener('siteCreated', handleSiteCreated as EventListener);
    };
  }, [onSiteChange]);

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'canopy': return TreePine;
      case 'horizontal_vegetation': return Eye;
      case 'daubenmire': return Grid3X3;
      default: return Target;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Research Site
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/create-site')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Site
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentSite ? (
          <div className="space-y-4">
            {/* Current Site Info */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{currentSite.name}</h3>
              <div className="space-y-2">
                {(currentSite.latitude !== 0 || currentSite.longitude !== 0) ? (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>{formatCoordinates(currentSite.latitude, currentSite.longitude)}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">No coordinates set</span>
                  </div>
                )}
                {currentSite.altitude && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mountain className="h-4 w-4 text-blue-600" />
                    <span>{currentSite.altitude.toFixed(0)}m elevation</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>Created {currentSite.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Site Notes */}
              {currentSite.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-sm mb-2">Site Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {currentSite.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Session Progress */}
            <div>
              <h4 className="font-medium mb-2">Measurement Progress</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(currentSite.sessionCounts).map(([tool, count]) => {
                  const Icon = getToolIcon(tool);
                  return (
                    <div key={tool} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <Icon className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {tool.replace('_', ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Change Site */}
            {sites.length > 1 && (
              <div>
                <Label htmlFor="siteSelect">Switch Site</Label>
                <Select
                  value={currentSite.name}
                  onValueChange={(siteName) => {
                    const site = sites.find(s => s.name === siteName);
                    if (site) onSiteChange(site);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.name} value={site.name}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No research site selected</p>
            <p className="text-sm text-muted-foreground">
              Use the "New Site" button above to create a site and start logging measurements
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}