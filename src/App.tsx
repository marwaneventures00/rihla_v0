import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Pathways from "./pages/Pathways.tsx";
import Learn from "./pages/Learn.tsx";
import Market from "./pages/Market.tsx";
import Profile from "./pages/Profile.tsx";
import Develop from "./pages/Develop.tsx";
// INSTITUTE_ENABLED = false
// import AdminDashboard from "./pages/AdminDashboard.tsx";
// import AdminObservatoire from "./pages/AdminObservatoire.tsx";
import PMO from "./pages/PMO.tsx";
import Pulse from "./pages/Pulse.tsx";
import AppLayout from "./components/AppLayout.tsx";
import MeetAndGreet from "./pages/MeetAndGreet.tsx";
import { LanguageProvider } from "./lib/i18n.tsx";

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Navigate to="/learn" replace />} />

            {/* Student app — canonical: /learn, /field, /pipeline; legacy /pathways, /market, /pmo kept */}
            <Route element={<AppLayout requireRole="student" />}>
              <Route path="/learn/*" element={<Learn />} />
              <Route path="/pathways" element={<Pathways />} />
              <Route path="/field" element={<Market />} />
              <Route path="/market" element={<Market />} />
              <Route path="/pipeline" element={<PMO />} />
              <Route path="/pmo" element={<PMO />} />
              <Route path="/pulse" element={<Pulse />} />
              <Route path="/develop" element={<Develop />} />
              <Route path="/meet-and-greet" element={<MeetAndGreet />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* INSTITUTE_ENABLED = false — admin / observatoire routes disabled
            <Route element={<AppLayout requireRole="admin" />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<AdminDashboard />} />
              <Route path="/admin/observatoire" element={<AdminObservatoire />} />
            </Route>
            */}

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </LanguageProvider>
);

export default App;
