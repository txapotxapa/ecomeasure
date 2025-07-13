import { useEffect } from 'react';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';

export default function PermissionManager() {
  useEffect(() => {
    const requestAll = async () => {
      try {
        await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      } catch (e) {
        console.warn('Camera/photos permission request failed:', e);
      }
      try {
        await Filesystem.requestPermissions();
      } catch (e) {
        console.warn('Filesystem permission request failed:', e);
      }
      try {
        await Geolocation.requestPermissions();
      } catch (e) {
        console.warn('Geolocation permission request failed:', e);
      }
    };
    requestAll();
  }, []);

  return null;
}