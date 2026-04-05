import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import { Overview } from "./pages/Overview";
import { Ranking } from "./pages/Ranking";
import { Analysis } from "./pages/Analysis";
import { AdvancedFilter } from "./pages/AdvancedFilter";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pending from "./pages/Pending";
import AdminPanel from "./pages/AdminPanel";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

// Auth guard: wraps protected routes
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Pending → show pending page
  if (user.status === "pending") {
    return <Pending />;
  }

  // Suspended → show suspended message
  if (user.status === "suspended") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 text-lg font-medium mb-2">تم إيقاف حسابك</p>
          <p className="text-slate-400 text-sm">يرجى التواصل مع المسؤول لإعادة التفعيل</p>
        </div>
      </div>
    );
  }

  // Admin-only route check
  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

// Public-only route: redirect to dashboard if already logged in
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (user && user.status === "active") {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public auth routes */}
      <Route path="/login">
        {() => (
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        )}
      </Route>
      <Route path="/signup">
        {() => (
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        )}
      </Route>

      {/* Admin panel */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute adminOnly>
            <AdminPanel />
          </ProtectedRoute>
        )}
      </Route>

      {/* Root redirect */}
      <Route path="/">
        {() => <Redirect to="/dashboard" />}
      </Route>

      {/* Protected app routes */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/overview">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Overview />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/ranking">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Ranking />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/analysis">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Analysis />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/advanced-filter">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <AdvancedFilter />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
