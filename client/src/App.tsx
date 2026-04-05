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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pending from "./pages/Pending";
import Renew from "./pages/Renew";
import AdminPanel from "./pages/AdminPanel";
import LandingPage from "./pages/LandingPage";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

// Subscription warning banner — shown when ≤ 2 days remain
function SubscriptionWarningBanner({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining > 2) return null;
  return (
    <div className="w-full bg-amber-900/60 border-b border-amber-700/60 px-4 py-2.5 flex items-center justify-center gap-3" dir="rtl">
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <span className="text-amber-200 text-sm font-medium">
        {daysRemaining <= 0
          ? "اشتراكك انتهى — يرجى التجديد الآن لتجنب إيقاف حسابك"
          : `اشتراكك سينتهي خلال ${daysRemaining} ${daysRemaining === 1 ? "يوم" : "أيام"} — `}
        {daysRemaining > 0 && (
          <Link href="/renew" className="text-amber-300 underline hover:text-amber-100 font-semibold">
            جدّد الآن
          </Link>
        )}
      </span>
    </div>
  );
}

// Auth guard: wraps protected routes
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
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

  // Suspended (expired subscription) → redirect to /renew
  if (user.status === "suspended") {
    return <Redirect to="/renew" />;
  }

  // Admin-only route check
  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  // Show subscription warning banner if ≤ 2 days remain
  const daysRemaining = (user as any).daysRemaining ?? 999;

  return (
    <>
      {daysRemaining <= 2 && <SubscriptionWarningBanner daysRemaining={daysRemaining} />}
      {children}
    </>
  );
}

// Public-only route: redirect to dashboard if already logged in and active
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
      {/* Landing page at root — always visible */}
      <Route path="/" component={LandingPage} />

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

      {/* Renewal page — for expired/suspended users */}
      <Route path="/renew" component={Renew} />

      {/* Admin panel */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute adminOnly>
            <AdminPanel />
          </ProtectedRoute>
        )}
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
