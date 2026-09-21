import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Repeat,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/documentos", icon: Receipt, label: "Documentos" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/fornecedores", icon: Truck, label: "Fornecedores" },
  { href: "/produtos", icon: Package, label: "Produtos" },
  { href: "/inventario", icon: Warehouse, label: "Inventário" },
  { href: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

const adminNavItems = [
  { href: "/auditoria", icon: ShieldCheck, label: "Auditoria" },
  { href: "/agt", icon: Shield, label: "Comunicação AGT" },
  { href: "/recorrentes", icon: Repeat, label: "Recorrência" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { logout(); window.location.href = "/login"; },
  });

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border/60 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
        style={{
          background: "linear-gradient(180deg, oklch(0.998 0 0) 0%, oklch(0.985 0.003 160) 100%)",
        }}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-border/40 transition-all duration-300",
          sidebarOpen ? "gap-3 px-5 py-5" : "justify-center px-0 py-5"
        )}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm overflow-hidden"
            style={{ background: "linear-gradient(135deg, oklch(0.30 0.07 160) 0%, oklch(0.35 0.08 165) 100%)" }}>
            <img src="/logo.png" alt="Facturas K360" className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground tracking-tight">Facturas K360</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Facturação</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200",
              sidebarOpen ? "ml-auto" : "mx-auto mt-2"
            )}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-3 space-y-4", sidebarOpen ? "px-3" : "px-2")}>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard" ? location === "/dashboard" : location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "sidebar-nav-item",
                      isActive && "active",
                      !sidebarOpen && "justify-center px-2"
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon className={cn("flex-shrink-0 transition-all", sidebarOpen ? "h-4.5 w-4.5" : "h-5 w-5")} />
                    {sidebarOpen && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && sidebarOpen && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </a>
                </Link>
              );
            })}
          </div>

          {/* Secção de Administração */}
          {user?.role === "admin" && (
            <div className="pt-2">
              {sidebarOpen && (
                <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Administração
                </p>
              )}
              {!sidebarOpen && (
                <div className="my-2 border-t border-border/40" />
              )}
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const isActive = location.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}>
                      <a
                        className={cn(
                          "sidebar-nav-item",
                          isActive && "active",
                          !sidebarOpen && "justify-center px-2"
                        )}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className={cn("flex-shrink-0 transition-all", sidebarOpen ? "h-4.5 w-4.5" : "h-5 w-5")} />
                        {sidebarOpen && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {isActive && sidebarOpen && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User */}
        <div className={cn("border-t border-border/40 py-3", sidebarOpen ? "px-3" : "px-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl hover:bg-muted/50 transition-all duration-200",
                  sidebarOpen ? "px-3 py-2.5" : "justify-center px-2 py-2.5"
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/10">
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="min-w-0 text-left flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? "Utilizador"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.role === "admin" ? "Administrador" : "Utilizador"}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/60 shadow-lg">
              {user?.role === "admin" && (
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link href="/auditoria">
                    <a className="flex items-center gap-2.5 cursor-pointer py-2 font-medium text-violet-700">
                      <ShieldCheck className="h-4 w-4" /> Trilha de Auditoria
                    </a>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="rounded-lg">
                <Link href="/configuracoes"><a className="flex items-center gap-2.5 cursor-pointer py-2"><Settings className="h-4 w-4 text-muted-foreground" /> Configurações</a></Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer rounded-lg py-2"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-4 w-4 mr-2.5" /> Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
