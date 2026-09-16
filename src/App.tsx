import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { captureEvent, initPosthog } from "@/lib/analytics";
import { ClassManagement } from "./components/dashboard/ClassManagement/ClassManagement";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ActivityManagement } from "./components/dashboard/ClassManagement/ActivityManagement";
import { ActivitySubmissions } from "./components/dashboard/ActivitySubmissions";
import IndexLesson from "./pages/lesson/pages/Index";
import CreateLessonPlan from "./pages/lesson/pages/CreateLessonPlan";


const queryClient = new QueryClient();

const resolveRouterBase = () => {
  const configured = import.meta.env.VITE_APP_BASE_PATH;
  const fallback = import.meta.env.DEV ? "/" : "/teacher";
  const runtimeBase = typeof window !== "undefined" && window.location.pathname.startsWith("/teacher")
    ? "/teacher"
    : undefined;
  const value = configured ?? runtimeBase ?? fallback;

  if (!value || value === "/") {
    return "/";
  }

  let normalized = value.trim();

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized.replace(/\/+$/, "");
};

const routerBase = resolveRouterBase();

const PosthogManager = () => {
  const location = useLocation();
  const initializedRef = useRef(false);
  const loggedMissingKeyRef = useRef(false);
  const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  useEffect(() => {
    if (!posthogKey) {
      if (!loggedMissingKeyRef.current) {
        console.info("[PostHog] Key not provided. Analytics disabled for teacher module.");
        loggedMissingKeyRef.current = true;
      }
      return;
    }

    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    initPosthog(posthogKey, posthogHost)
      .then(() => {
        captureEvent("$pageview", { path: location.pathname });
      })
      .catch((error) => {
        console.debug("[PostHog] Initialization failed", error);
      });
  }, [posthogKey, posthogHost, location.pathname]);

  useEffect(() => {
    if (!posthogKey) {
      return;
    }

    captureEvent("$pageview", { path: location.pathname });
  }, [location.pathname, posthogKey]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={routerBase === "/" ? undefined : routerBase}>
            <PosthogManager />
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planos/:classId"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <CreateLessonPlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planos/:classId"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <CreateLessonPlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/atividades/:classId"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <ActivityManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/entregas/:activityId"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <ActivitySubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <ClassManagement />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
