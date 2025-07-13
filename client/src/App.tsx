import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { revealOnScroll } from "@/lib/scroll-anim";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { App as CapacitorApp } from '@capacitor/app';
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analysis from "@/pages/analysis";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import AccuracyReference from "@/pages/accuracy-reference";
import DocsPage from "@/pages/docs";
import CreateSite from "@/pages/create-site";
import SplashScreen from "@/components/splash-screen";
import PermissionManager from "@/components/permission-manager";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route path="/accuracy-reference" component={AccuracyReference} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/create-site" component={CreateSite} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Check if user has seen splash before and prefers to skip it
    const splashPreference = localStorage.getItem('skip-splash');
    return splashPreference !== 'true';
  });
  const [permissionsGranted, setPermissionsGranted] = useState(() => {
    // Check if permissions were previously granted
    const permissionStatus = localStorage.getItem('permissions-granted');
    return permissionStatus === 'true';
  });

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    let mode: 'light' | 'dark';
    mode = stored ?? 'dark';
    if (!stored) localStorage.setItem('theme', 'dark');
    const doc = document.documentElement;
    doc.classList.toggle('dark', mode === 'dark');
    doc.classList.toggle('light', mode === 'light');
    document.documentElement.classList.add('theme-transition');

    revealOnScroll();

    // Handle hardware back button on mobile
    const handleBackButton = () => {
      // Prevent app from closing on back button press
      // The app should only close when using home button or app switcher
      console.log('Hardware back button pressed - preventing app exit');
      // Do nothing - this prevents the default behavior of closing the app
    };

    // Register back button listener for Capacitor
    CapacitorApp.addListener('backButton', handleBackButton);

    // Cleanup
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handlePermissionsGranted = () => {
    setPermissionsGranted(true);
    localStorage.setItem('permissions-granted', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Show permissions first, then splash, then app */}
        {!permissionsGranted && (
          <PermissionManager onAllPermissionsGranted={handlePermissionsGranted} />
        )}
        {permissionsGranted && showSplash && (
          <SplashScreen 
            onComplete={handleSplashComplete}
            duration={3500}
            saveSkipPreference={true}
          />
        )}
        {permissionsGranted && (
          <div className="min-h-screen bg-background">
            <Router />
          </div>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
