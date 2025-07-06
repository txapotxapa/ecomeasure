import { useEffect, useState } from "react";
import { MapPin, Signal, SignalLow } from "lucide-react";
import { getCurrentLocation } from "@/lib/gps";

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export default function LocationDisplay() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateLocation = async () => {
      try {
        const position = await getCurrentLocation();
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date(),
          accuracy: position.coords.accuracy,
        });
        setError(null);
      } catch (err) {
        setError("Unable to get location");
        console.error("Location error:", err);
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 30000); // Update every 30 seconds

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b">
      <div className="flex items-center space-x-3 mb-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-gray-700">Current Location</span>
        <div className="flex items-center space-x-2 ml-auto">
          {isOnline ? (
            <Signal className="h-4 w-4 text-green-500" />
          ) : (
            <SignalLow className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-xs px-2 py-1 rounded ${
            isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
      
      {error ? (
        <div className="text-xs text-red-600 font-mono">{error}</div>
      ) : location ? (
        <div className="text-xs text-gray-600 font-mono space-y-1">
          <div>Lat: {location.latitude.toFixed(6)}°</div>
          <div>Lng: {location.longitude.toFixed(6)}°</div>
          <div>Updated: {location.timestamp.toLocaleString()}</div>
          {location.accuracy && (
            <div>Accuracy: ±{Math.round(location.accuracy)}m</div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500 font-mono">Getting location...</div>
      )}
    </div>
  );
}
