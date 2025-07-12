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
  Target
} from "lucide-react";

import BottomNavigation from "@/components/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnalysisSettings } from "@shared/schema";

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['/api/settings', 'default'],
    queryFn: async () => {
      const response = await fetch('/api/settings/default');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json() as Promise<AnalysisSettings>;
    },
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

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

        {/* Accuracy Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Measurement Accuracy Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View detailed accuracy specifications for all measurement tools
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/accuracy-reference'}
              className="w-full"
            >
              <Target className="h-4 w-4 mr-2" />
              View Accuracy Reference
            </Button>
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
