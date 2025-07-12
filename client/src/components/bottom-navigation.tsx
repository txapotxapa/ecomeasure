import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, BarChart3, History, Settings, Camera } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/tools", icon: Camera, label: "Tools" },
    { path: "/history", icon: History, label: "History" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 bg-card border-t border-border z-50 pb-[env(safe-area-inset-bottom)] h-16 flex items-center justify-center">
      <div className="flex justify-around w-full px-4">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center p-2 h-auto transition-colors ${
                isActive ? "text-primary bg-accent/20" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setLocation(item.path)}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'drop-shadow-lg' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
