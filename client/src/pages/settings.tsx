import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Save, 
  Download,
  Trash2,
  MapPin,
  Camera,
  BarChart3,
  FileText,
  Smartphone,
  Target,
  Bell,
  FileSpreadsheet,
  Sun,
  Moon,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mic,
  FolderOpen
} from "lucide-react";

import BottomNavigation from "@/components/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { apiRequest } from "@/lib/queryClient";
import { AnalysisSettings } from "@shared/schema";
import { Camera as CapacitorCamera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export default function Settings() {
  const [settings, setSettings] = useState<AnalysisSettings>({
    id: 0,
    userId: "default",
    defaultAnalysisMethod: "GLAMA",
    defaultZenithAngle: 90,
    autoGpsLogging: true,
    imageQualityThreshold: 0.8,
    exportFormat: "CSV",
    defaultToolType: "canopy",
    horizontalVegetationHeights: [0.5, 1.0, 1.5, 2.0],
    daubenmireQuadratSize: 1,
    daubenmireGridSize: 10,
    updatedAt: new Date(),
  });

  // Additional app settings
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(false);
  
  // Permission states
  const [permissions, setPermissions] = useState({
    location: 'unknown',
    camera: 'unknown',
    storage: 'unknown',
    microphone: 'unknown'
  });

  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['/api/settings', 'default'],
    queryFn: async () => {
      const response = await apiRequest('/api/settings/default');
      return response.json() as Promise<AnalysisSettings>;
    },
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  // Check permissions on load
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const locationPerm = await Geolocation.checkPermissions();
        const cameraPerm = await CapacitorCamera.checkPermissions();
        
        setPermissions({
          location: locationPerm.location,
          camera: cameraPerm.camera,
          storage: cameraPerm.photos,
          microphone: 'prompt' // Will be checked when needed
        });
      } else {
        setPermissions({
          location: navigator.geolocation ? 'prompt' : 'denied',
          camera: navigator.mediaDevices ? 'prompt' : 'denied',
          storage: 'granted',
          microphone: navigator.mediaDevices ? 'prompt' : 'denied'
        });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermission = async (type: 'location' | 'camera' | 'microphone') => {
    try {
      if (Capacitor.isNativePlatform()) {
        if (type === 'location') {
          const result = await Geolocation.requestPermissions();
          setPermissions(prev => ({ ...prev, location: result.location }));
          
          if (result.location === 'granted') {
            toast({
              title: "Location permission granted",
              description: "GPS features are now available",
            });
          }
        } else if (type === 'camera') {
          const result = await CapacitorCamera.requestPermissions({ permissions: ['camera', 'photos'] });
          setPermissions(prev => ({ 
            ...prev, 
            camera: result.camera,
            storage: result.photos 
          }));
          
          if (result.camera === 'granted') {
            toast({
              title: "Camera permission granted",
              description: "Photo capture is now available",
            });
          }
        } else if (type === 'microphone') {
          // For microphone, we need to request it during actual use
          toast({
            title: "Microphone permission",
            description: "Will be requested when recording audio",
          });
          setPermissions(prev => ({ ...prev, microphone: 'prompt' }));
        }
      } else {
        toast({
          title: "Permissions not required",
          description: "Web version doesn't require explicit permissions",
        });
      }
    } catch (error) {
      toast({
        title: "Permission request failed",
        description: "Please grant permission manually in device settings",
        variant: "destructive",
      });
    }
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPermissionText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      default:
        return 'Not requested';
    }
  };

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<AnalysisSettings>) => {
      const response = await apiRequest('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = async () => {
    await saveSettingsMutation.mutateAsync(settings);
  };

  const handleExportAllData = async () => {
    try {
      const response = await fetch('/api/export/csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecocanopy_data_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "All data exported to CSV file",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm("Are you sure you want to clear all analysis data? This action cannot be undone.")) {
      // Since we don't have a bulk delete endpoint, we'll just show a message
      toast({
        title: "Clear data",
        description: "This feature will be implemented in a future version",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="pb-20">
        <div className="p-4 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-semibold">Settings</h1>
            <p className="text-xs opacity-80">Configure your analysis preferences</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Analysis Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Analysis Defaults</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultMethod">Default Analysis Method</Label>
              <Select 
                value={settings.defaultAnalysisMethod} 
                onValueChange={(value) => setSettings({...settings, defaultAnalysisMethod: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLAMA">Standard Analysis</SelectItem>
                  <SelectItem value="Canopeo">Advanced Analysis</SelectItem>
                  <SelectItem value="Custom">Custom Threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultZenith">
                Default Zenith Angle: {settings.defaultZenithAngle}°
              </Label>
              <Slider
                value={[settings.defaultZenithAngle]}
                onValueChange={(value) => setSettings({...settings, defaultZenithAngle: value[0]})}
                min={0}
                max={90}
                step={5}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualityThreshold">
                Image Quality Threshold: {(settings.imageQualityThreshold * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[settings.imageQualityThreshold]}
                onValueChange={(value) => setSettings({...settings, imageQualityThreshold: value[0]})}
                min={0.1}
                max={1.0}
                step={0.1}
                className="py-2"
              />
              <p className="text-sm text-gray-600">
                Minimum quality threshold for image analysis
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Location Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoGps">Auto GPS Logging</Label>
                <p className="text-sm text-gray-600">
                  Automatically capture GPS coordinates with each analysis
                </p>
              </div>
              <Switch
                id="autoGps"
                checked={settings.autoGpsLogging}
                onCheckedChange={(checked) => setSettings({...settings, autoGpsLogging: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>App Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Permission */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Location Access</p>
                  <p className="text-xs text-muted-foreground">GPS coordinates for site mapping</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getPermissionIcon(permissions.location)}
                <span className="text-sm mr-2">{getPermissionText(permissions.location)}</span>
                {permissions.location !== 'granted' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => requestPermission('location')}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            {/* Camera Permission */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Camera className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Camera Access</p>
                  <p className="text-xs text-muted-foreground">Photo capture for analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getPermissionIcon(permissions.camera)}
                <span className="text-sm mr-2">{getPermissionText(permissions.camera)}</span>
                {permissions.camera !== 'granted' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => requestPermission('camera')}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            {/* Storage Permission */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FolderOpen className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">File Storage</p>
                  <p className="text-xs text-muted-foreground">Save analysis data and exports</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getPermissionIcon(permissions.storage)}
                <span className="text-sm mr-2">{getPermissionText(permissions.storage)}</span>
                {permissions.storage !== 'granted' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toast({ 
                      title: "Storage access", 
                      description: "File storage uses app-specific directories and doesn't require additional permissions on Android 15"
                    })}
                  >
                    Info
                  </Button>
                )}
              </div>
            </div>

            {/* Microphone Permission */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mic className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Microphone Access</p>
                  <p className="text-xs text-muted-foreground">Voice notes and audio recordings</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getPermissionIcon(permissions.microphone)}
                <span className="text-sm mr-2">{getPermissionText(permissions.microphone)}</span>
                {permissions.microphone !== 'granted' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => requestPermission('microphone')}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> You can use the app without permissions, but some features may be limited. GPS and camera access enable full functionality.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <span>App Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoSave">Auto-save Results</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically save completed analyses
                </p>
              </div>
              <Switch
                id="autoSave"
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analysis completion alerts
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {theme === 'dark' ? 'Dark' : 'Light'} Mode
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                <Switch
                  id="theme"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Export Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportFormat">Default Export Format</Label>
              <Select 
                value={settings.exportFormat} 
                onValueChange={(value) => setSettings({...settings, exportFormat: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV (Comma-separated values)</SelectItem>
                  <SelectItem value="JSON">JSON (JavaScript Object Notation)</SelectItem>
                  <SelectItem value="PDF">PDF (Portable Document Format)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Data Management</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportAllData}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export All Data</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearAllData}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Data</span>
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    View live spreadsheet and export data from the{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/history'; }} className="font-medium underline">
                      History tab
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help & Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Help & Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/docs?doc=technical'}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                View Technical Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/docs?doc=photography'}>
                <Camera className="h-4 w-4 mr-2" />
                Photography Guidelines
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/docs?doc=accuracy'}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Measurement Accuracy Info
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/accuracy-reference'}
                className="w-full justify-start"
              >
                <Target className="h-4 w-4 mr-2" />
                View Accuracy Reference
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Device Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">User Agent</Label>
                <p className="font-mono text-xs text-gray-800 truncate">
                  {navigator.userAgent}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Screen Resolution</Label>
                <p className="font-mono text-gray-800">
                  {screen.width} × {screen.height}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Viewport Size</Label>
                <p className="font-mono text-gray-800">
                  {window.innerWidth} × {window.innerHeight}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Online Status</Label>
                <p className="font-mono text-gray-800">
                  {navigator.onLine ? "Online" : "Offline"}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Geolocation Support</Label>
                <p className="font-mono text-gray-800">
                  {navigator.geolocation ? "Supported" : "Not supported"}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Camera Support</Label>
                <p className="font-mono text-gray-800">
                  {navigator.mediaDevices ? "Supported" : "Not supported"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>About EcoCanopy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                EcoCanopy is a mobile web application for gap light analysis and canopy cover 
                percentage calculation in ecological research.
              </p>
              <p className="mb-2">
                The app implements scientifically validated algorithms for canopy cover
                analysis and vegetation classification.
              </p>
              <p>
                <strong>Version:</strong> 1.0.0<br />
                <strong>Build:</strong> {new Date().toISOString().split('T')[0]}<br />
                <strong>License:</strong> Proprietary
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </span>
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
