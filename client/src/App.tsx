import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import LandingPage from "./pages/landing-page";
import AdminLogin from "./pages/admin-login";
import POSCreation from "./pages/pos-creation";
import POSList from "./pages/pos-list";
import POSLogin from "./pages/pos-login";
import AdminDashboard from "./pages/admin-dashboard";
import POSInterface from "./pages/pos-interface";
import ProductManagement from "./pages/product-management";
import SalesAnalytics from "./pages/sales-analytics";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/pos/create" component={POSCreation} />
      <Route path="/pos/list" component={POSList} />
      <Route path="/pos/login" component={POSLogin} />
      <Route path="/pos/login/:id" component={POSLogin} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredUserType="admin" />
      <ProtectedRoute path="/pos/interface" component={POSInterface} requiredUserType="pos" />
      <ProtectedRoute path="/product-management" component={ProductManagement} requiredUserType="pos" />
      <ProtectedRoute path="/sales-analytics" component={SalesAnalytics} requiredUserType="pos" />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
