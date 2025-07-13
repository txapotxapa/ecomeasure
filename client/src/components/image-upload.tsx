import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, ImageIcon, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useRef } from 'react';

interface ImageUploadProps {
  onImageUploaded: (imageData: { url: string; file: File }) => void;
  onBatchUploaded?: (images: Array<{ url: string; file: File }>) => void;
  currentImage?: string;
  allowBatch?: boolean;
  onAnalyze?: () => void;
}

export default function ImageUpload({ onImageUploaded, onBatchUploaded, currentImage, allowBatch = true, onAnalyze }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const saveImageLocally = async (dataUrl: string): Promise<string> => {
    try {
      // Generate unique filename
      const filename = `image_${Date.now()}.jpg`;
      
      // Remove data URL prefix if present
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      
      // Save image to local filesystem
      const result = await Filesystem.writeFile({
        path: `images/${filename}`,
        data: base64Data,
        directory: Directory.Data,
      });
      
      // Return the local file URI or fallback to data URL
      return result.uri || dataUrl;
    } catch (error) {
      console.error('Failed to save image locally:', error);
      // Return the original data URL as fallback
      return dataUrl;
    }
  };

  const handleImageCapture = async (source: CameraSource) => {
    try {
      setIsUploading(true);

      // Request camera & photo library permissions when running natively
      if (Capacitor.isNativePlatform()) {
        const permissions = await CapacitorCamera.requestPermissions({ permissions: ['camera', 'photos'] });
        if (permissions.camera !== 'granted' && source === CameraSource.Camera) {
          throw new Error('Camera permission denied');
        }
        if (permissions.photos !== 'granted' && source !== CameraSource.Camera) {
          throw new Error('Photos permission denied');
        }
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
      });

      if (image.dataUrl) {
        // Convert to File object for compatibility
        const file = dataURLtoFile(image.dataUrl, `photo_${Date.now()}.jpg`);
        
        // Show preview for verification
        setPreviewImage(image.dataUrl);
        setCapturedFile(file);
        
        toast({
          title: "Image captured",
          description: "Please verify the image quality before analyzing.",
        });
      }
      
    } catch (error: any) {
      toast({
        title: "Capture failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Web/browser fallback for gallery selection
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setCapturedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyAndSave = async () => {
    if (!previewImage || !capturedFile) return;
    
    try {
      setIsUploading(true);
      
      // Save locally
      const localUrl = await saveImageLocally(previewImage);
      
      onImageUploaded({
        url: localUrl,
        file: capturedFile,
      });
      
      // Clear preview
      setPreviewImage(null);
      setCapturedFile(null);
      
      toast({
        title: "Image confirmed",
        description: "Ready for analysis!",
      });
      
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    setCapturedFile(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          {previewImage ? (
            // Preview verification state
            <div className="space-y-4">
              <img
                src={previewImage}
                alt="Preview image"
                className="max-w-full max-h-64 mx-auto rounded-lg object-cover border-2 border-dashed border-blue-300"
              />
              <p className="text-sm text-muted-foreground">
                Please verify the image quality. Is this suitable for vegetation analysis?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={handleVerifyAndSave}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? "Saving..." : "✓ Confirm"}
                </Button>
              </div>
            </div>
          ) : currentImage ? (
            // Final confirmed image state
            <div className="space-y-4">
              <img
                src={currentImage}
                alt="Confirmed image"
                className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onImageUploaded({ url: "", file: new File([], "") })}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Image
                </Button>
                {onAnalyze && (
                  <Button
                    onClick={onAnalyze}
                    className="flex-1"
                    size="sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Initial state: no image selected yet
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Button onClick={() => handleImageCapture(CameraSource.Camera)} disabled={isUploading}>
                  <Camera className="h-4 w-4 mr-2" />
                  {isUploading ? 'Opening...' : 'Take Photo'}
                </Button>
                {Capacitor.isNativePlatform() ? (
                  <Button onClick={() => handleImageCapture(CameraSource.Photos)} disabled={isUploading} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Opening...' : 'Choose From Gallery'}
                  </Button>
                ) : (
                  <Button onClick={openFilePicker} disabled={isUploading} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Loading...' : 'Choose File'}
                  </Button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground">Capture a new photo or select one from your library.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
