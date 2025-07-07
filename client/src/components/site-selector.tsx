import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MapPin, 
  Plus, 
  Navigation, 
  Mountain,
  Target,
  TreePine,
  Eye,
  Grid3X3,
  Clock,
  Camera,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "@/lib/gps";
import ImageUpload from "@/components/image-upload";

interface SiteInfo {
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  photoUrl?: string; // Site documentation photo
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
  const [showNewSiteDialog, setShowNewSiteDialog] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [newSiteLocation, setNewSiteLocation] = useState<{
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null>(null);
  const [newSitePhoto, setNewSitePhoto] = useState<{ url: string; file: File } | null>(null);
  const { toast } = useToast();

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

  // Save sites to localStorage
  const saveSites = (updatedSites: SiteInfo[]) => {
    setSites(updatedSites);
    localStorage.setItem('research-sites', JSON.stringify(updatedSites));
  };

  const getCurrentLocationForNewSite = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentLocation();
      setNewSiteLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || undefined
      });
      toast({
        title: "Location acquired",
        description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
      });
    } catch (error) {
      toast({
        title: "Location error",
        description: "Could not get current location. You can enter coordinates manually.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const createNewSite = () => {
    if (!newSiteName.trim()) {
      toast({
        title: "Site name required",
        description: "Please enter a name for the new site",
        variant: "destructive",
      });
      return;
    }

    if (!newSiteLocation) {
      toast({
        title: "Location required",
        description: "Please get location or enter coordinates manually",
        variant: "destructive",
      });
      return;
    }

    const newSite: SiteInfo = {
      name: newSiteName.trim(),
      latitude: newSiteLocation.latitude,
      longitude: newSiteLocation.longitude,
      altitude: newSiteLocation.altitude,
      photoUrl: newSitePhoto?.url,
      createdAt: new Date(),
      sessionCounts: {
        canopy: 0,
        horizontal_vegetation: 0,
        daubenmire: 0
      }
    };

    const updatedSites = [...sites, newSite];
    saveSites(updatedSites);
    onSiteChange(newSite);
    
    // Reset form
    setNewSiteName("");
    setNewSiteLocation(null);
    setNewSitePhoto(null);
    setShowNewSiteDialog(false);

    toast({
      title: "Site created",
      description: `${newSite.name} is now your active research site`,
    });
  };

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
          <Dialog open={showNewSiteDialog} onOpenChange={setShowNewSiteDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Research Site</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    placeholder="e.g., Forest Plot A1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Button
                    onClick={getCurrentLocationForNewSite}
                    disabled={isGettingLocation}
                    variant="outline"
                    className="w-full"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Get Current Location
                      </>
                    )}
                  </Button>
                  
                  {newSiteLocation && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span>{formatCoordinates(newSiteLocation.latitude, newSiteLocation.longitude)}</span>
                      </div>
                      {newSiteLocation.altitude && (
                        <div className="flex items-center space-x-2 text-sm mt-1">
                          <Mountain className="h-4 w-4 text-blue-600" />
                          <span>{newSiteLocation.altitude.toFixed(0)}m elevation</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Site Photo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="site-photo">Site Documentation Photo (Optional)</Label>
                  <div className="text-sm text-gray-600 mb-2">
                    Add a photo to document the site characteristics for future reference
                  </div>
                  <ImageUpload 
                    onImageUploaded={setNewSitePhoto} 
                    currentImage={newSitePhoto?.url}
                  />
                </div>

                <Button 
                  onClick={createNewSite} 
                  className="w-full"
                  disabled={!newSiteName.trim() || !newSiteLocation}
                >
                  Create Site
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentSite ? (
          <div className="space-y-4">
            {/* Current Site Info */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{currentSite.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span>{formatCoordinates(currentSite.latitude, currentSite.longitude)}</span>
                </div>
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
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No research site selected</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a site to start logging measurements
            </p>
            <Button onClick={() => setShowNewSiteDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Site
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}