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
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import EcoMeasureLogo from "@/components/eco-measure-logo";

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
  const [, setLocation] = useLocation();
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

  const getCurrentLocationForSite = async () => {
    setIsGettingLocation(true);
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('GPS not supported on this device');
      }

      // Force permission prompt by making the actual geolocation request
      // The browser will show permission dialog automatically

      // Request location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
          }
        );
      });

      setSiteLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || undefined
      });
      
      toast({
        title: "Location acquired",
        description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
      });
    } catch (error: any) {
      console.error('GPS error:', error);
      
      let errorMessage = "Could not get current location.";
      let actionMessage = "You can enter coordinates manually below.";
      
      if (error.code === 1 || error.message?.includes('denied')) {
        errorMessage = "Location permission needed";
        actionMessage = "Click the location icon in your browser's address bar and select 'Allow', then try again.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable";
        actionMessage = "Make sure GPS is enabled on your device.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out";
        actionMessage = "Try again or enter coordinates manually below.";
      }
      
      toast({
        title: errorMessage,
        description: actionMessage,
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
              <div className="space-y-3">
                <div className="space-y-2">
                  <Button
                    onClick={getCurrentLocationForSite}
                    disabled={isGettingLocation}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                        Getting GPS location...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-5 w-5 mr-3" />
                        Use Current GPS Location
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your browser will ask for location permission
                  </p>
                </div>
                
                {siteLocation && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="font-mono">{formatCoordinates(siteLocation.latitude, siteLocation.longitude)}</span>
                    </div>
                    {siteLocation.altitude && (
                      <div className="flex items-center space-x-2 text-sm mt-1">
                        <Mountain className="h-4 w-4 text-blue-600" />
                        <span>{siteLocation.altitude.toFixed(0)}m elevation</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center">
                  <Button
                    onClick={() => setUseManualCoords(true)}
                    variant="outline"
                    size="sm"
                  >
                    Enter coordinates manually instead
                  </Button>
                </div>
              </div>
            )}

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