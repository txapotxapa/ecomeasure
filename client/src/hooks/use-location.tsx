import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

type LocationStatus = 'INITIAL' | 'PERMISSIONS_PENDING' | 'PERMISSIONS_DENIED' | 'PERMISSIONS_GRANTED' | 'ACQUIRING' | 'AVAILABLE' | 'ERROR';

interface LocationState {
  position: Position | null;
  status: LocationStatus;
  error: Error | null;
  requestPermissions: () => Promise<void>;
  getCurrentLocation: () => Promise<Position | null>;
}

const LocationContext = createContext<LocationState | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [status, setStatus] = useState<LocationStatus>('INITIAL');
  const [error, setError] = useState<Error | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);

  const checkAndRequestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('PERMISSIONS_GRANTED'); // Assume granted for web for now, browser will prompt
      return 'granted';
    }

    try {
      setStatus('PERMISSIONS_PENDING');
      let permStatus: PermissionStatus = await Geolocation.checkPermissions();

      if (permStatus.location === 'denied' || permStatus.coarseLocation === 'denied') {
        setStatus('PERMISSIONS_DENIED');
        setError(new Error('Location permission denied.'));
        return 'denied';
      }

      if (permStatus.location === 'prompt' || permStatus.coarseLocation === 'prompt') {
        permStatus = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
      }

      if (permStatus.location === 'granted' || permStatus.coarseLocation === 'granted') {
        setStatus('PERMISSIONS_GRANTED');
        return 'granted';
      } else {
        setStatus('PERMISSIONS_DENIED');
        setError(new Error('Location permission was not granted.'));
        return 'denied';
      }
    } catch (e: any) {
      setStatus('ERROR');
      setError(new Error(`Permission check failed: ${e.message}`));
      return 'denied';
    }
  }, []);

  const startWatch = useCallback(async () => {
    if (watchId) return; // Watch already started

    setStatus('ACQUIRING');

    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 20000, // 20 seconds
          maximumAge: 300000, // 5 minutes
        },
        (pos, err) => {
          if (err) {
            setStatus('ERROR');
            setError(new Error(`Error watching position: ${err.message}`));
            setPosition(null);
            return;
          }
          if(pos) {
            setStatus('AVAILABLE');
            setPosition(pos);
            setError(null);
          }
        }
      );
      setWatchId(id);
    } catch (e: any) {
      setStatus('ERROR');
      setError(new Error(`Failed to start location watch: ${e.message}`));
    }
  }, [watchId]);

  const clearWatch = useCallback(() => {
    if (watchId) {
      Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    checkAndRequestPermissions().then(permissionState => {
      if (permissionState === 'granted') {
        startWatch();
      }
    });

    return () => {
      clearWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const getCurrentLocation = useCallback(async (): Promise<Position | null> => {
    const permissionState = await checkAndRequestPermissions();
    if (permissionState !== 'granted') {
        const err = new Error('Permission not granted');
        setError(err);
        setStatus('PERMISSIONS_DENIED');
        throw err;
    }

    // If we already have a recent position from the watcher, use it.
    if (position && (Date.now() - position.timestamp) < 60000) { // 1 minute
        return position;
    }

    setStatus('ACQUIRING');
    try {
        const currentPosition = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 300000,
        });
        setPosition(currentPosition);
        setStatus('AVAILABLE');
        return currentPosition;
    } catch (e: any) {
        const err = new Error(`Could not get current location: ${e.message}`);
        setError(err);
        setStatus('ERROR');
        throw err;
    }
  }, [checkAndRequestPermissions, position]);


  const value: LocationState = {
    position,
    status,
    error,
    requestPermissions: checkAndRequestPermissions,
    getCurrentLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}; 