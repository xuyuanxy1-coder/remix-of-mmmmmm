import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AssetsProvider } from "@/contexts/AssetsContext";
import { LoanProvider } from "@/contexts/LoanContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TradeHistoryProvider } from "@/contexts/TradeHistoryContext";
import { KYCProvider } from "@/contexts/KYCContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Market from "./pages/Market";
import Trade from "./pages/Trade";
import Loan from "./pages/Loan";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AssetsProvider>
          <LoanProvider>
            <NotificationProvider>
              <TradeHistoryProvider>
                <KYCProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/market" element={<Market />} />
                        <Route path="/trade/:symbol" element={<Trade />} />
                        <Route path="/loan" element={<Loan />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/admin" element={<Admin />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </KYCProvider>
              </TradeHistoryProvider>
            </NotificationProvider>
          </LoanProvider>
        </AssetsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
