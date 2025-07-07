import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageUploaded: (imageData: { url: string; file: File }) => void;
  onBatchUploaded?: (images: Array<{ url: string; file: File }>) => void;
  currentImage?: string;
  allowBatch?: boolean;
}

export default function ImageUpload({ onImageUploaded, onBatchUploaded, currentImage, allowBatch = true }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate all files first
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file. Please select JPEG or PNG images.`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please select smaller images.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    
    try {
      if (fileArray.length === 1) {
        // Single file upload
        const file = fileArray[0];
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
        
        onImageUploaded({
          url: result.imageUrl,
          file: file,
        });
        
        toast({
          title: "Image uploaded successfully",
          description: "Ready for analysis.",
        });
      } else if (allowBatch && onBatchUploaded) {
        // Batch upload
        const uploadedImages = [];
        
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }
          
          const result = await response.json();
          uploadedImages.push({
            url: result.imageUrl,
            file: file,
          });
        }
        
        onBatchUploaded(uploadedImages);
        
        toast({
          title: "Batch upload complete",
          description: `Successfully uploaded ${fileArray.length} images for batch processing.`,
        });
      } else {
        toast({
          title: "Multiple files not supported",
          description: "Please select one image at a time.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-card"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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
                {isDragging 
                  ? "Drop image(s) here to upload" 
                  : "Upload single image for analysis or multiple images for batch processing"
                }
              </p>
              <div className="space-y-2">
                <Button
                  onClick={handleCameraCapture}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Capture Photo"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image File(s)
                </Button>
              </div>
            </>
          )}
        </div>
        
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={allowBatch}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileSelect(files);
            }
          }}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
