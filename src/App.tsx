import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Inbox from "./pages/Inbox.tsx";
import Priorities from "./pages/Priorities.tsx";
import ActionPlan from "./pages/ActionPlan.tsx";
import Calendar from "./pages/Calendar.tsx";
import Integrations from "./pages/Integrations.tsx";
import History from "./pages/History.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/priorities" element={<Priorities />} />
            <Route path="/action-plan" element={<ActionPlan />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
