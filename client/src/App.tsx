import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Suppliers from "./pages/Suppliers";
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import NewInvoice from "./pages/NewInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import RecurringRules from "./pages/RecurringRules";
import AgtPage from "./pages/AgtPage";
import PlanPage from "./pages/PlanPage";
import Portal from "./pages/Portal";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AppLayout } from "./components/AppLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Login />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clientes" component={Clients} />
      <Route path="/fornecedores" component={Suppliers} />
      <Route path="/produtos" component={Products} />
      <Route path="/documentos" component={Invoices} />
      <Route path="/documentos/novo" component={NewInvoice} />
      <Route path="/documentos/:id" component={InvoiceDetail} />
      <Route path="/inventario" component={Inventory} />
      <Route path="/relatorios" component={Reports} />
      <Route path="/recorrentes" component={RecurringRules} />
      <Route path="/agt" component={AgtPage} />
      <Route path="/plano" component={PlanPage} />
      <Route path="/configuracoes" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/login" component={Login} />
            <Route path="/p/:token" component={Portal} />
            <Route>
              <AuthGuard>
                <AppLayout>
                  <Router />
                </AppLayout>
              </AuthGuard>
            </Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
