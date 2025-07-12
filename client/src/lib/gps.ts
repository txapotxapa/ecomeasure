import { Geolocation } from '@capacitor/geolocation';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

export async function getCurrentLocation(): Promise<GeolocationPosition> {
  try {
    // Request permissions first
    const permissions = await Geolocation.requestPermissions();
    
    if (permissions.location !== 'granted') {
      throw new Error('Location permission denied');
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // Cache for 1 minute
    });

    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      },
      timestamp: position.timestamp,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get current location');
  }
}

export async function watchLocation(
  onLocationUpdate: (position: GeolocationPosition) => void,
  onError: (error: GeolocationError) => void
): Promise<string> {
  try {
    // Request permissions first
    const permissions = await Geolocation.requestPermissions();
    
    if (permissions.location !== 'granted') {
      throw new Error('Location permission denied');
    }

    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Cache for 30 seconds
      },
      (position, err) => {
        if (err) {
          onError({
            code: 1,
            message: err.message,
          });
          return;
        }

        if (position) {
          onLocationUpdate({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
            },
            timestamp: position.timestamp,
          });
        }
      }
    );

    return watchId;
  } catch (error: any) {
    onError({
      code: 1,
      message: error.message || 'Failed to watch location',
    });
    throw error;
  }
}

export async function clearLocationWatch(watchId: string): Promise<void> {
  await Geolocation.clearWatch({ id: watchId });
}

export function formatCoordinates(lat: number, lng: number): string {
  const formatDegrees = (coord: number, isLat: boolean) => {
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    const degrees = Math.abs(coord);
    return `${degrees.toFixed(6)}° ${direction}`;
  };

  return `${formatDegrees(lat, true)}, ${formatDegrees(lng, false)}`;
}

export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert to meters
}
