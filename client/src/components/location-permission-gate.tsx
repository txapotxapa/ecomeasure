import { ReactNode } from 'react';
import { useLocation } from '@/hooks/use-location';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, XCircle } from 'lucide-react';
import EcoMeasureLogo from './eco-measure-logo';

interface LocationPermissionGateProps {
  children: ReactNode;
}

export default function LocationPermissionGate({ children }: LocationPermissionGateProps) {
  const { status, error, requestPermissions } = useLocation();

  const renderOverlay = (title: string, message: string, showButton: boolean) => (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center text-center p-8">
        <EcoMeasureLogo className="h-20 w-20 mb-6" />
        <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                {title === 'Location Required' && <MapPin className="h-6 w-6" />}
                {title === 'Requesting...' && <Loader2 className="h-6 w-6 animate-spin" />}
                {title === 'Permission Denied' && <XCircle className="h-6 w-6 text-destructive" />}
                {title}
            </h2>
            <p className="text-muted-foreground mb-6">
                {message}
            </p>
            {showButton && (
                <Button onClick={requestPermissions} size="lg">
                    Enable Location Services
                </Button>
            )}
            {error && <p className="text-destructive text-sm mt-4">{error.message}</p>}
        </div>
    </div>
  );

  if (status === 'INITIAL') {
    return renderOverlay(
        'Location Required', 
        'This app requires access to your location to accurately tag ecological measurements. Please press the button below to grant permission.', 
        true
    );
  }

  if (status === 'PERMISSIONS_PENDING') {
    return renderOverlay('Requesting...', 'Waiting for you to grant location permission from the system prompt.', false);
  }

  if (status === 'PERMISSIONS_DENIED') {
    return renderOverlay(
        'Permission Denied',
        'Location access is required. Please enable it in your browser or system settings, then refresh the app.',
        false // Or a button to show instructions
    );
  }

  if (status === 'ERROR') {
    return renderOverlay('Error', error?.message || 'An unknown error occurred while checking permissions.', false);
  }

  // If status is PERMISSIONS_GRANTED, ACQUIRING, or AVAILABLE, render the app
  return <>{children}</>;
} 