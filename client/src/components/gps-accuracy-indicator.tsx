import { useLocation } from "@/hooks/use-location";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, CheckCircle, Loader2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

type AccuracyStatus = 'acquiring' | 'good' | 'fair' | 'poor' | 'error' | 'denied' | 'initial';

interface GPSAccuracyIndicatorProps {
  className?: string;
}

export default function GPSAccuracyIndicator({ className }: GPSAccuracyIndicatorProps) {
  const { position, status: locationStatus, error } = useLocation();

  const getAccuracyStatus = (): AccuracyStatus => {
    switch (locationStatus) {
      case 'INITIAL':
      case 'PERMISSIONS_PENDING':
        return 'initial';
      case 'PERMISSIONS_DENIED':
        return 'denied';
      case 'ACQUIRING':
        return 'acquiring';
      case 'ERROR':
        return 'error';
      case 'AVAILABLE':
      case 'PERMISSIONS_GRANTED':
        if (position?.coords.accuracy) {
          if (position.coords.accuracy <= 5) return 'good';
          if (position.coords.accuracy <= 15) return 'fair';
          return 'poor';
        }
        return 'acquiring'; // Still waiting for first position
      default:
        return 'initial';
    }
  };
  
  const accuracyStatus = getAccuracyStatus();
  const accuracy = position?.coords.accuracy;
  const altitude = position?.coords.altitude;
  const altitudeAccuracy = position?.coords.altitudeAccuracy;

  const getStatusIcon = () => {
    switch (accuracyStatus) {
      case 'initial':
      case 'acquiring':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'good':
        return <CheckCircle className="h-3 w-3" />;
      case 'fair':
        return <MapPin className="h-3 w-3" />;
      case 'poor':
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      case 'denied':
        return <Ban className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    switch (accuracyStatus) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'poor':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'error':
      case 'denied':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (accuracyStatus) {
        case 'initial':
            return 'Initializing...';
        case 'acquiring':
            return 'Acquiring...';
        case 'denied':
            return 'Permission Denied';
        case 'error':
            return 'Error';
        case 'good':
        case 'fair':
        case 'poor':
            return accuracy ? `±${accuracy.toFixed(1)}m` : 'N/A';
        default:
            return '...';
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
          <span className="ml-1">GPS: {getStatusText()}</span>
        </Badge>
        
        {altitude !== null && altitude !== undefined && (
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusColor())}
          >
            <MapPin className="h-3 w-3 mr-1" />
            <span>
              Alt: {altitude.toFixed(1)}m
              {altitudeAccuracy && (
                <span className="text-xs opacity-75">
                  {` ±${altitudeAccuracy.toFixed(1)}m`}
                </span>
              )}
            </span>
          </Badge>
        )}
      </div>
      
      {accuracyStatus === 'poor' && (
        <p className="text-xs text-muted-foreground">
          Poor GPS accuracy. Move to an open area for a better signal.
        </p>
      )}
      
      {(accuracyStatus === 'error' || accuracyStatus === 'denied') && (
        <p className="text-xs text-destructive">
          GPS unavailable. {error?.message || 'Check location settings.'}
        </p>
      )}
    </div>
  );
}