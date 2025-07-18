import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Navigation, 
  Mountain,
  Target,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { useLocation as useAppLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import EcoMeasureLogo from "@/components/eco-measure-logo";
import { useLocation } from "@/hooks/use-location";

interface SiteInfo {
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  photoUrl?: string;
  notes?: string;
  createdAt: Date;
  sessionCounts: {
    canopy: number;
    horizontal_vegetation: number;
    daubenmire: number;
  };
}

export default function CreateSite() {
  const [, setLocation] = useAppLocation();
  const [siteName, setSiteName] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [siteLocation, setSiteLocation] = useState<{
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null>(null);
  const [manualCoords, setManualCoords] = useState({
    latitude: "",
    longitude: "",
  });
  const [useManualCoords, setUseManualCoords] = useState(false);
  const [siteNotes, setSiteNotes] = useState("");
  const { toast } = useToast();
  const { getCurrentLocation } = useLocation();

  const getCurrentLocationForSite = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentLocation();
      if (position) {
        setSiteLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ?? undefined,
        });
        toast({
          title: "Location acquired",
          description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        });
      } else {
        throw new Error("Failed to get position from hook.");
      }
    } catch (error: any) {
      console.error('GPS error:', error);
      toast({
        title: "Could not get location",
        description: error.message || "Please ensure GPS is enabled and permissions are granted.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const createSite = () => {
    if (!siteName.trim()) {
      toast({
        title: "Site name required",
        description: "Please enter a name for the new site",
        variant: "destructive",
      });
      return;
    }

    let finalLocation = siteLocation;

    // If using manual coordinates, validate and convert them
    if (useManualCoords) {
      const lat = parseFloat(manualCoords.latitude);
      const lng = parseFloat(manualCoords.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        toast({
          title: "Invalid coordinates",
          description: "Please enter valid latitude and longitude values",
          variant: "destructive",
        });
        return;
      }

      if (lat < -90 || lat > 90) {
        toast({
          title: "Invalid latitude",
          description: "Latitude must be between -90 and 90 degrees",
          variant: "destructive",
        });
        return;
      }

      if (lng < -180 || lng > 180) {
        toast({
          title: "Invalid longitude", 
          description: "Longitude must be between -180 and 180 degrees",
          variant: "destructive",
        });
        return;
      }

      finalLocation = { latitude: lat, longitude: lng };
    }

    const newSite: SiteInfo = {
      name: siteName.trim(),
      latitude: finalLocation?.latitude || 0,
      longitude: finalLocation?.longitude || 0,
      altitude: finalLocation?.altitude,
      notes: siteNotes.trim() || undefined,
      createdAt: new Date(),
      sessionCounts: {
        canopy: 0,
        horizontal_vegetation: 0,
        daubenmire: 0
      }
    };

    // Save to localStorage
    const existingSites = JSON.parse(localStorage.getItem('research-sites') || '[]');
    const updatedSites = [...existingSites, newSite];
    localStorage.setItem('research-sites', JSON.stringify(updatedSites));
    
    // Set as current site
    localStorage.setItem('current-research-site', JSON.stringify(newSite));

    // Trigger a custom event to notify other components of the site change
    window.dispatchEvent(new CustomEvent('siteCreated', { detail: newSite }));

    toast({
      title: "Site created successfully!",
      description: `${newSite.name} is now your active research site`,
    });

    // Navigate back to home
    setLocation('/');
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-black text-white pt-6 pb-8 shadow relative z-10 flex flex-col items-center">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <EcoMeasureLogo size={120} />
        <h1 className="text-xl font-bold mt-4">Create Research Site</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Site Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name *</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g., Forest Plot A1, North Meadow, Pine Stand 3"
                className="text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="siteNotes">Site Notes (Optional)</Label>
              <textarea
                id="siteNotes"
                value={siteNotes}
                onChange={(e) => setSiteNotes(e.target.value)}
                placeholder="Describe the site characteristics, vegetation, research objectives, etc."
                className="w-full p-3 rounded-md border border-input bg-background text-base resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!useManualCoords && (
              <>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={getCurrentLocationForSite}
                    disabled={isGettingLocation || useManualCoords}
                    className="flex-grow"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {isGettingLocation ? "Acquiring..." : "Use Current GPS Location"}
                  </Button>
                </div>

                {siteLocation && (
                  <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      Location set: {formatCoordinates(siteLocation.latitude, siteLocation.longitude)}
                      {siteLocation.altitude && ` at ${siteLocation.altitude.toFixed(1)}m altitude`}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Manual Coordinate Entry */}
            {useManualCoords && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={manualCoords.latitude}
                      onChange={(e) => setManualCoords(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="40.123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={manualCoords.longitude}
                      onChange={(e) => setManualCoords(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="-74.123456"
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <Button
                    onClick={() => {
                      setUseManualCoords(false);
                      setManualCoords({ latitude: "", longitude: "" });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Use GPS instead
                  </Button>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <strong>Note:</strong> GPS coordinates are optional but recommended for accurate field data logging. 
              You can create the site without coordinates and add them later.
            </div>
          </CardContent>
        </Card>

        {/* Create Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={createSite}
              disabled={!siteName.trim()}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <CheckCircle className="h-6 w-6 mr-3" />
              Create Site & Start Measuring
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}