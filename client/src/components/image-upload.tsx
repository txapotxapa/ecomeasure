import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ImageUploadProps {
  onImageUploaded: (imageData: { url: string; file: File }) => void;
  onBatchUploaded?: (images: Array<{ url: string; file: File }>) => void;
  currentImage?: string;
  allowBatch?: boolean;
}

export default function ImageUpload({ onImageUploaded, onBatchUploaded, currentImage, allowBatch = true }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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

  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    return result.imageUrl;
  };

  const handleImageCapture = async (source: CameraSource) => {
    try {
      setIsUploading(true);
      
      // Request camera permissions
      const permissions = await CapacitorCamera.requestPermissions();
      if (permissions.camera !== 'granted') {
        throw new Error('Camera permission denied');
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
      });

      if (image.dataUrl) {
        // Convert to File object
        const file = dataURLtoFile(image.dataUrl, `photo_${Date.now()}.jpg`);
        
        // Upload to server
        const url = await uploadImageToServer(file);
        
        onImageUploaded({
          url: url,
          file: file,
        });
        
        toast({
          title: "Image captured successfully",
          description: "Ready for analysis.",
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

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          {currentImage ? (
            <div className="space-y-4">
              <img
                src={currentImage}
                alt="Uploaded image"
                className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImageUploaded({ url: "", file: new File([], "") })}
              >
                <X className="h-4 w-4 mr-2" />
                Remove Image
              </Button>
            </div>
          ) : (
            <>
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Capture or select an image for vegetation analysis
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => handleImageCapture(CameraSource.Camera)}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isUploading ? "Processing..." : "Take Photo"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleImageCapture(CameraSource.Photos)}
                  disabled={isUploading}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select from Gallery
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
