import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PipelineProvider } from "./contexts/PipelineContext";
import ScenariosPage from "./pages/ScenariosPage";
import EvaluationsPage from "./pages/EvaluationsPage";
import RecommendationPage from "./pages/RecommendationPage";
import ArchivePage from "./pages/ArchivePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PipelineProvider>
          <Routes>
            <Route path="/" element={<ScenariosPage />} />
            <Route path="/evaluations" element={<EvaluationsPage />} />
            <Route path="/recommendation" element={<RecommendationPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            {/* Redirects for old routes */}
            <Route path="/agents" element={<Navigate to="/evaluations" replace />} />
            <Route path="/pipeline" element={<Navigate to="/evaluations" replace />} />
            <Route path="/results" element={<Navigate to="/recommendation" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PipelineProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
