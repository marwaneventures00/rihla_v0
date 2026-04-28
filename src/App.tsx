import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Pathways from "./pages/Pathways.tsx";
import Market from "./pages/Market.tsx";
import Profile from "./pages/Profile.tsx";
import Develop from "./pages/Develop.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AppLayout from "./components/AppLayout.tsx";
import MeetAndGreet from "./pages/MeetAndGreet.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Student app */}
          <Route element={<AppLayout requireRole="student" />}>
            <Route path="/pathways" element={<Pathways />} />
            <Route path="/market" element={<Market />} />
            <Route path="/develop" element={<Develop />} />
            <Route path="/meet-and-greet" element={<MeetAndGreet />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin app */}
          <Route element={<AppLayout requireRole="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminDashboard />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
