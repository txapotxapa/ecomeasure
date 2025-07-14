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

  const requestPermissions = useCallback(async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, the browser will prompt on the first `getCurrentPosition` or `watchPosition` call.
        // We can proceed assuming we can ask. The actual grant/deny is handled by the browser.
        setStatus('PERMISSIONS_GRANTED');
        return;
      }

      setStatus('PERMISSIONS_PENDING');
      let permStatus: PermissionStatus = await Geolocation.checkPermissions();

      if (permStatus.location === 'denied' || permStatus.coarseLocation === 'denied') {
        setStatus('PERMISSIONS_DENIED');
        setError(new Error('Location permission has been denied. Please enable it in your device settings.'));
        return;
      }

      if (permStatus.location === 'prompt' || permStatus.coarseLocation === 'prompt') {
        permStatus = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
      }
      
      if (permStatus.location === 'granted' || permStatus.coarseLocation === 'granted') {
        setStatus('PERMISSIONS_GRANTED');
      } else {
        setStatus('PERMISSIONS_DENIED');
        setError(new Error('Location permission was not granted.'));
      }
    } catch (e: any) {
      setStatus('ERROR');
      setError(new Error(`Permission check failed: ${e.message}`));
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
    // When status becomes granted, start the location watch.
    if (status === 'PERMISSIONS_GRANTED') {
      startWatch();
    }
    
    // Cleanup the watch when the component unmounts.
    return () => {
      clearWatch();
    };
  }, [status, startWatch, clearWatch]);
  
  // This useEffect now only checks the initial status without requesting.
  useEffect(() => {
    const checkInitialStatus = async () => {
        if (Capacitor.isNativePlatform()) {
            const initialStatus = await Geolocation.checkPermissions();
            if (initialStatus.location === 'granted' || initialStatus.coarseLocation === 'granted') {
                setStatus('PERMISSIONS_GRANTED');
            } else if (initialStatus.location === 'denied' || initialStatus.coarseLocation === 'denied') {
                setStatus('PERMISSIONS_DENIED');
            } else {
                setStatus('INITIAL'); // Ready to be prompted
            }
        } else {
            // On web, we can't check without prompting, so we start in INITIAL state.
            // The first call to getCurrentLocation will trigger the browser prompt.
            setStatus('INITIAL');
        }
    };
    checkInitialStatus();
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Position | null> => {
    if (status !== 'PERMISSIONS_GRANTED') {
        // Optionally trigger request here, or rely on the gate
        // For now, we assume the gate has handled it.
        const err = new Error('Permissions not granted before requesting location.');
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
  }, [status, position]);


  const value: LocationState = {
    position,
    status,
    error,
    requestPermissions,
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