import { useState, useCallback } from 'react';
import { Upload, FileStack, Play, Pause, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { analyzeCanopyImage } from '@/lib/image-processing';
import { analyzeDaubenmireFrame } from '@/lib/daubenmire-frame';
import { analyzeHorizontalVegetation } from '@/lib/horizontal-vegetation';
import { processBatch } from '@/lib/worker-utils';
import { cn } from '@/lib/utils';

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
  progress?: number;
}

interface BatchProcessorProps {
  toolType: 'canopy' | 'horizontal_vegetation' | 'daubenmire';
  onBatchComplete?: (results: any[]) => void;
  className?: string;
}

export default function BatchProcessor({ toolType, onBatchComplete, className }: BatchProcessorProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const validFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    const newFiles: BatchFile[] = validFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [toast]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    
    const validFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
    const newFiles: BatchFile[] = validFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const processFile = async (batchFile: BatchFile): Promise<void> => {
    setFiles(prev => prev.map(f => 
      f.id === batchFile.id ? { ...f, status: 'processing', progress: 0 } : f
    ));

    try {
      let result;
      
      switch (toolType) {
        case 'canopy':
          result = await analyzeCanopyImage(batchFile.file, {
            method: 'GLAMA',
            zenithAngle: 90,
            onProgress: (progress) => {
              setFiles(prev => prev.map(f => 
                f.id === batchFile.id ? { ...f, progress } : f
              ));
            }
          });
          break;
          
        case 'daubenmire':
          result = await analyzeDaubenmireFrame(batchFile.file, {
            method: 'color_analysis',
            onProgress: (progress) => {
              setFiles(prev => prev.map(f => 
                f.id === batchFile.id ? { ...f, progress } : f
              ));
            }
          });
          break;
          
        case 'horizontal_vegetation':
          result = await analyzeHorizontalVegetation(batchFile.file, {
            poleHeight: 100,
            direction: 'North',
            method: 'color_threshold',
            onProgress: (progress) => {
              setFiles(prev => prev.map(f => 
                f.id === batchFile.id ? { ...f, progress } : f
              ));
            }
          });
          break;
      }

      setFiles(prev => prev.map(f => 
        f.id === batchFile.id ? { ...f, status: 'completed', result, progress: 100 } : f
      ));
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === batchFile.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } : f
      ));
    }
  };

  const startBatchProcessing = async () => {
    setIsProcessing(true);
    setIsPaused(false);

    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      await processBatch(pendingFiles, processFile, 3); // Process 3 files concurrently
      
      const results = files
        .filter(f => f.status === 'completed' && f.result)
        .map(f => f.result);
      
      onBatchComplete?.(results);
      
      toast({
        title: "Batch processing complete",
        description: `Processed ${results.length} images successfully`,
      });
    } catch (error) {
      toast({
        title: "Batch processing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const progress = files.length > 0 
    ? (completedCount + errorCount) / files.length * 100 
    : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileStack className="h-5 w-5" />
          Batch Processing
        </CardTitle>
        <CardDescription>
          Process multiple images at once for {toolType.replace('_', ' ')} analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop images here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="batch-file-input"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => document.getElementById('batch-file-input')?.click()}
          >
            Select Images
          </Button>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {files.length} files ({completedCount} completed, {errorCount} errors)
              </span>
              {completedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                >
                  Clear Completed
                </Button>
              )}
            </div>

            <Progress value={progress} className="mb-2" />

            <div className="max-h-60 overflow-y-auto space-y-1">
              {files.map(file => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {file.status === 'pending' && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                    {file.status === 'processing' && <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                    {file.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {file.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                    
                    <span className="text-sm truncate">{file.file.name}</span>
                  </div>
                  
                  {file.progress !== undefined && file.status === 'processing' && (
                    <span className="text-xs text-muted-foreground">{file.progress}%</span>
                  )}
                  
                  {file.error && (
                    <span className="text-xs text-destructive" title={file.error}>Error</span>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeFile(file.id)}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        {files.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={startBatchProcessing}
              disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Processing
                </>
              )}
            </Button>
            
            {isProcessing && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}