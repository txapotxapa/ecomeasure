import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GPSAccuracy {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  status: 'acquiring' | 'good' | 'fair' | 'poor' | 'error';
}

interface GPSAccuracyIndicatorProps {
  onAccuracyUpdate?: (accuracy: GPSAccuracy) => void;
  className?: string;
}

export default function GPSAccuracyIndicator({ onAccuracyUpdate, className }: GPSAccuracyIndicatorProps) {
  const [gpsAccuracy, setGpsAccuracy] = useState<GPSAccuracy>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    status: 'acquiring'
  });
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsAccuracy(prev => ({ ...prev, status: 'error' }));
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        const altitude = position.coords.altitude;
        const altitudeAccuracy = position.coords.altitudeAccuracy;

        let status: GPSAccuracy['status'] = 'good';
        if (accuracy <= 3) {
          status = 'good';
        } else if (accuracy <= 10) {
          status = 'fair';
        } else {
          status = 'poor';
        }

        const newAccuracy = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy,
          altitude,
          altitudeAccuracy,
          status
        };

        setGpsAccuracy(newAccuracy);
        onAccuracyUpdate?.(newAccuracy);
      },
      (error) => {
        console.error('GPS error:', error);
        setGpsAccuracy(prev => ({ ...prev, status: 'error' }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    setWatchId(id);

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [onAccuracyUpdate]);

  const getStatusIcon = () => {
    switch (gpsAccuracy.status) {
      case 'acquiring':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'good':
        return <CheckCircle className="h-3 w-3" />;
      case 'fair':
        return <MapPin className="h-3 w-3" />;
      case 'poor':
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    switch (gpsAccuracy.status) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'poor':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge 
          variant="outline" 
          className={cn("text-xs", getStatusColor())}
        >
          {getStatusIcon()}
          <span className="ml-1">
            GPS: {gpsAccuracy.status === 'acquiring' ? 'Acquiring...' : 
                  gpsAccuracy.status === 'error' ? 'Error' :
                  gpsAccuracy.accuracy ? `±${gpsAccuracy.accuracy.toFixed(1)}m` : 'N/A'}
          </span>
        </Badge>
        
        {/* Altimeter Badge */}
        {gpsAccuracy.altitude !== null && (
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusColor())}
          >
            <MapPin className="h-3 w-3 mr-1" />
            <span>
              Alt: {gpsAccuracy.altitude.toFixed(1)}m
              {gpsAccuracy.altitudeAccuracy && (
                <span className="text-xs opacity-75">
                  {` ±${gpsAccuracy.altitudeAccuracy.toFixed(1)}m`}
                </span>
              )}
            </span>
          </Badge>
        )}
      </div>
      
      {gpsAccuracy.status === 'poor' && (
        <p className="text-xs text-muted-foreground">
          Poor GPS accuracy. Move to open area for better signal.
        </p>
      )}
      
      {gpsAccuracy.status === 'error' && (
        <p className="text-xs text-destructive">
          GPS unavailable. Check location permissions.
        </p>
      )}
    </div>
  );
}