import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { revealOnScroll } from "@/lib/scroll-anim";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Tools from "@/pages/tools";
import Analysis from "@/pages/analysis";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import AccuracyReference from "@/pages/accuracy-reference";
import DocsPage from "@/pages/docs";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tools" component={Tools} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route path="/accuracy-reference" component={AccuracyReference} />
      <Route path="/docs" component={DocsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    let mode: 'light' | 'dark';
    mode = stored ?? 'light';
    if (!stored) localStorage.setItem('theme', 'light');
    const doc = document.documentElement;
    doc.classList.toggle('dark', mode === 'dark');
    doc.classList.toggle('light', mode === 'light');
    document.documentElement.classList.add('theme-transition');

    revealOnScroll();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
