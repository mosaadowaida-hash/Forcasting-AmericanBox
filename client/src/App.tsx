import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import { Overview } from "./pages/Overview";
import { Ranking } from "./pages/Ranking";
import { Analysis } from "./pages/Analysis";
import { AdvancedFilter } from "./pages/AdvancedFilter";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/">{() => <Redirect to="/dashboard" />}</Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/overview" component={Overview} />
        <Route path="/ranking" component={Ranking} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/advanced-filter" component={AdvancedFilter} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
