import { useState, useEffect } from 'react';
import { Camera, MapPin, Save, Share2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  action: () => void;
  color: string;
}

interface QuickActionsProps {
  onQuickCapture?: () => void;
  onQuickSave?: () => void;
  onQuickShare?: () => void;
  onLocationMark?: () => void;
  className?: string;
}

export default function QuickActions({
  onQuickCapture,
  onQuickSave,
  onQuickShare,
  onLocationMark,
  className
}: QuickActionsProps) {
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const { toast } = useToast();

  const quickActions: QuickAction[] = [
    {
      id: 'capture',
      label: 'Quick Capture',
      icon: Camera,
      shortcut: 'Ctrl+K',
      action: () => {
        onQuickCapture?.();
        setRecentAction('capture');
        toast({
          title: "Quick Capture",
          description: "Camera ready for rapid data collection",
        });
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'location',
      label: 'Mark Location',
      icon: MapPin,
      shortcut: 'Ctrl+L',
      action: () => {
        onLocationMark?.();
        setRecentAction('location');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            toast({
              title: "Location Marked",
              description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
            });
          },
          () => {
            toast({
              title: "Location Error",
              description: "Unable to get current location",
              variant: "destructive"
            });
          }
        );
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'save',
      label: 'Quick Save',
      icon: Save,
      shortcut: 'Ctrl+S',
      action: () => {
        onQuickSave?.();
        setRecentAction('save');
        toast({
          title: "Data Saved",
          description: "Current session saved locally",
        });
      },
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'share',
      label: 'Quick Share',
      icon: Share2,
      shortcut: 'Ctrl+Shift+S',
      action: () => {
        onQuickShare?.();
        setRecentAction('share');
        
        // Copy current data to clipboard
        const shareData = {
          timestamp: new Date().toISOString(),
          tool: 'Ecological Measurement Suite',
          url: window.location.href
        };
        
        navigator.clipboard.writeText(JSON.stringify(shareData, null, 2))
          .then(() => {
            toast({
              title: "Ready to Share",
              description: "Data copied to clipboard",
            });
          })
          .catch(() => {
            toast({
              title: "Share Failed",
              description: "Unable to copy data",
              variant: "destructive"
            });
          });
      },
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      const action = quickActions.find(a => {
        const keys = a.shortcut.toLowerCase().split('+');
        const ctrlPressed = keys.includes('ctrl') && (e.ctrlKey || e.metaKey);
        const shiftPressed = keys.includes('shift') && e.shiftKey;
        const key = keys[keys.length - 1];
        
        return ctrlPressed && 
               (keys.includes('shift') ? shiftPressed : !e.shiftKey) &&
               e.key.toLowerCase() === key;
      });

      if (action) {
        e.preventDefault();
        action.action();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Clear recent action after animation
  useEffect(() => {
    if (recentAction) {
      const timer = setTimeout(() => setRecentAction(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [recentAction]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isRecent = recentAction === action.id;
          
          return (
            <Button
              key={action.id}
              onClick={action.action}
              variant="outline"
              size="sm"
              className={cn(
                "h-auto flex flex-col items-center gap-1 py-3 transition-all",
                isRecent && "ring-2 ring-primary ring-offset-2",
                "hover:scale-105"
              )}
            >
              <div className={cn(
                "rounded-full p-2 text-white transition-colors",
                action.color
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {action.shortcut}
              </span>
            </Button>
          );
        })}
      </CardContent>
      
      {/* Floating indicator for recent action */}
      {recentAction && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-in zoom-in-50 fade-in duration-200">
          Used!
        </div>
      )}
    </Card>
  );
}