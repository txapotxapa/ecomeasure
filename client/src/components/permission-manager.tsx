import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Camera, 
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Camera as CapacitorCamera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

interface PermissionStatus {
  location: 'granted' | 'denied' | 'prompt' | 'unknown';
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  storage: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface PermissionManagerProps {
  onAllPermissionsGranted: () => void;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ onAllPermissionsGranted }) => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    location: 'unknown',
    camera: 'unknown', 
    storage: 'unknown'
  });
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const { toast } = useToast();

  // Check current permission status
  const checkPermissions = async () => {
    const newPermissions: PermissionStatus = {
      location: 'unknown',
      camera: 'unknown',
      storage: 'unknown'
    };

    try {
      // Check location permission
      if (Capacitor.isNativePlatform()) {
        const locationPerm = await Geolocation.checkPermissions();
        newPermissions.location = locationPerm.location;
        
        const cameraPerm = await CapacitorCamera.checkPermissions();
        newPermissions.camera = cameraPerm.camera;
        newPermissions.storage = cameraPerm.photos;
      } else {
        // Web fallback - check if geolocation is available
        newPermissions.location = navigator.geolocation ? 'prompt' : 'denied';
        newPermissions.camera = 'prompt'; // Web camera requires user gesture
        newPermissions.storage = 'granted'; // Web storage is always available
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }

    setPermissions(newPermissions);
    
    // Check if all permissions are granted
    const allGranted = Object.values(newPermissions).every(status => status === 'granted');
    if (allGranted) {
      onAllPermissionsGranted();
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestAllPermissions = async () => {
    setIsRequestingPermissions(true);
    
    try {
      if (Capacitor.isNativePlatform()) {
        // For Android 15+, request permissions more aggressively
        console.log('🔐 Requesting permissions for Android 15+');
        
        // Request location permission with high accuracy
        const locationResult = await Geolocation.requestPermissions();
        console.log('📍 Location permission result:', locationResult);
        
        // Request camera permissions with all options
        const cameraResult = await CapacitorCamera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        console.log('📷 Camera permission result:', cameraResult);
        
        // Update state with results
        setPermissions({
          location: locationResult.location,
          camera: cameraResult.camera,
          storage: cameraResult.photos
        });

        // Android 15 might return 'limited' or 'restricted' - treat as granted for now
        const locationOK = ['granted', 'limited'].includes(locationResult.location);
        const cameraOK = ['granted', 'limited'].includes(cameraResult.camera);
        const storageOK = ['granted', 'limited'].includes(cameraResult.photos);
        
        const allGranted = locationOK && cameraOK && storageOK;
        
        if (allGranted) {
          console.log('✅ All permissions granted for Android 15');
          toast({
            title: "Permissions granted",
            description: "All permissions have been granted. You can now use all app features.",
          });
          onAllPermissionsGranted();
        } else {
          console.log('❌ Some permissions denied:', { locationResult, cameraResult });
          toast({
            title: "Permissions needed",
            description: "Please grant location and camera access in your device settings to use all features.",
            variant: "destructive",
          });
        }
      } else {
        // Web environment - try to trigger permission prompts
        try {
          // Trigger location permission
          await new Promise<void>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(),
              () => reject(),
              { timeout: 5000 }
            );
          });
          
          setPermissions(prev => ({ ...prev, location: 'granted' }));
        } catch {
          setPermissions(prev => ({ ...prev, location: 'denied' }));
        }
        
        // Web camera and storage are handled per-use
        setPermissions(prev => ({ 
          ...prev, 
          camera: 'granted', 
          storage: 'granted' 
        }));
        
        onAllPermissionsGranted();
      }
    } catch (error: any) {
      console.error('Permission request error:', error);
      toast({
        title: "Permission request failed",
        description: error.message || "Please try again or grant permissions manually in settings.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'denied':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getPermissionText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      default:
        return 'Required';
    }
  };

  const allPermissionsGranted = Object.values(permissions).every(status => status === 'granted');

  if (allPermissionsGranted) {
    return null; // Don't show if all permissions are granted
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>App Permissions Required</CardTitle>
          <p className="text-sm text-muted-foreground">
            EcoMeasure needs these permissions to provide field research capabilities
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Permission */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Location Access</p>
                <p className="text-xs text-muted-foreground">GPS coordinates for site mapping</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.location)}
              <span className="text-sm">{getPermissionText(permissions.location)}</span>
            </div>
          </div>

          {/* Camera Permission */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Camera className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Camera Access</p>
                <p className="text-xs text-muted-foreground">Photo capture for analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.camera)}
              <span className="text-sm">{getPermissionText(permissions.camera)}</span>
            </div>
          </div>

          {/* Storage Permission */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Media Access</p>
                <p className="text-xs text-muted-foreground">Save and access photos</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.storage)}
              <span className="text-sm">{getPermissionText(permissions.storage)}</span>
            </div>
          </div>

          <Button 
            onClick={requestAllPermissions}
            disabled={isRequestingPermissions}
            className="w-full"
            size="lg"
          >
            {isRequestingPermissions ? 'Requesting Permissions...' : 'Grant All Permissions'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            These permissions are required for core app functionality. You can change them later in device settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManager;