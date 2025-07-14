import { Geolocation, PositionOptions } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Renamed to avoid conflict with native GeolocationPosition
export interface GpsPosition {
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

async function browserGeo(opts: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
}): Promise<GeolocationPosition> { // Returns native GeolocationPosition
  // Check permission state first (supported in modern browsers)
  try {
    if (navigator.permissions && typeof navigator.permissions.query === 'function') {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (status.state === 'denied') {
        throw new Error('Location permission denied');
      }
      // If prompt or granted we continue; prompt will show browser dialog
    }
  } catch (_) {
    // permissions API not available – ignore and continue to request
  }

  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation not supported'));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

export async function getCurrentLocation(): Promise<GpsPosition> {
  // Attempt Capacitor plugin first; if unavailable or fails we fallback to browser
  try {
    // Request permissions first
    const permissions = await Geolocation.requestPermissions();

    if (permissions.location !== 'granted') {
      throw new Error('Location permission denied');
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20000, // Increased to 20 seconds
      maximumAge: 300000, // Allow cached position up to 5 minutes old
    });

    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
      },
      timestamp: position.timestamp,
    };
  } catch (error: any) {
    console.warn('[gps] Capacitor geolocation failed, falling back to navigator:', error?.message || error);
    // fall through to browser fallback
  }

  // Browser fallback (or primary on web)
  const pos = await browserGeo({
    enableHighAccuracy: true,
    timeout: 20000, // Increased to 20 seconds
    maximumAge: 300000, // Allow cached position up to 5 minutes old
  });
  return {
    coords: {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude ?? undefined,
      altitudeAccuracy: pos.coords.altitudeAccuracy ?? undefined,
      heading: pos.coords.heading ?? undefined,
      speed: pos.coords.speed ?? undefined,
    },
    timestamp: pos.timestamp,
  };
}

export async function watchLocation(
  onLocationUpdate: (position: GpsPosition) => void,
  onError: (error: GeolocationError) => void
): Promise<string> {
  // Attempt Capacitor plugin first
  try {
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
          onError({ code: 1, message: err.message });
          return;
        }
        if (position) {
          onLocationUpdate({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude ?? undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
              heading: position.coords.heading ?? undefined,
              speed: position.coords.speed ?? undefined,
            },
            timestamp: position.timestamp,
          });
        }
      }
    );

    return watchId;
  } catch (error: any) {
    console.warn('[gps] Capacitor watchPosition failed, falling back to navigator:', error?.message || error);
    // fall through to browser fallback
  }

  if (!navigator.geolocation) {
    onError({ code: 1, message: 'Geolocation not supported' });
    throw new Error('Geolocation not supported');
  }
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onLocationUpdate({
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude ?? undefined,
          altitudeAccuracy: pos.coords.altitudeAccuracy ?? undefined,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
        },
        timestamp: pos.timestamp,
      });
    },
    (err) => onError({ code: err.code, message: err.message }),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );
  return String(watchId);
}

export async function clearLocationWatch(watchId: string): Promise<void> {
  try {
    await Geolocation.clearWatch({ id: watchId });
  } catch {
    // Fallback for navigator watch
    if (watchId && typeof navigator.geolocation?.clearWatch === 'function') {
      navigator.geolocation.clearWatch(Number(watchId));
    }
  }
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
