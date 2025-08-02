import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProjectPage } from "./pages/ProjectPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/auth" component={Auth} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/create-project" component={CreateProjectPage} />
          <Route path="/project/:id" component={ProjectPage} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
