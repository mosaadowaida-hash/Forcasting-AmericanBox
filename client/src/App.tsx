import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocalProductsProvider } from "./contexts/LocalProductsContext";
import Home from "./pages/Home";
import ComprehensiveDashboard from "./pages/ComprehensiveDashboard";
import DynamicProductsDashboard from "./pages/DynamicProductsDashboard";
import { Overview } from "./pages/Overview";
import { Ranking } from "./pages/Ranking";
import { Analysis } from "./pages/Analysis";
import { AdvancedFilter } from "./pages/AdvancedFilter";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={ComprehensiveDashboard} />
      <Route path="/dynamic-dashboard" component={DynamicProductsDashboard} />
      <Route path="/overview" component={Overview} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/advanced-filter" component={AdvancedFilter} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <LocalProductsProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LocalProductsProvider>
    </ErrorBoundary>
  );
}

export default App;
