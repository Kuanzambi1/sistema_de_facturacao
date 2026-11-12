import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Home,
  Shield,
  FileText,
  Cookie,
  Printer,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Lock,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openCookiePreferencesModal } from "./CookieConsent";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  badgeText: string;
  lastUpdated: string;
  activeDoc: "termos" | "privacidade" | "cookies";
  children: ReactNode;
  tableOfContents?: { id: string; title: string }[];
}

export default function LegalLayout({
  title,
  subtitle,
  badgeText,
  lastUpdated,
  activeDoc,
  children,
  tableOfContents = [],
}: LegalLayoutProps) {
  const [location] = useLocation();

  const handlePrint = () => {
    window.print();
  };

  const navLinks = [
    { href: "/termos", label: "Termos e Condições", id: "termos", icon: FileText },
    { href: "/privacidade", label: "Política de Privacidade", id: "privacidade", icon: Shield },
    { href: "/cookies", label: "Política de Cookies", id: "cookies", icon: Cookie },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ─── Top Sticky Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl transition-all shadow-sm">
        <div className="container flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Left: Brand + Voltar ao Início button */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* ─── HIGHLY PROMINENT "VOLTAR AO INÍCIO" BUTTON ─── */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-r from-[#004b36] to-[#006b4e] text-white font-bold text-xs md:text-sm shadow-md shadow-[#004b36]/25 hover:shadow-lg hover:shadow-[#004b36]/35 hover:scale-[1.03] active:scale-[0.97] transition-all group border border-emerald-400/30"
              title="Voltar à página inicial do Facturas K360"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Voltar ao Início</span>
            </Link>

            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#004b36] to-[#006b4e] flex items-center justify-center shadow-md shadow-[#004b36]/20 overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="Facturas K360"
                  className="w-6 h-6 md:w-7 md:h-7 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-extrabold text-foreground tracking-tight leading-none block">
                  Facturas K360
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Portal Jurídico
                </span>
              </div>
            </Link>
          </div>

          {/* Center/Right Nav: Document switcher & Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick switcher (desktop) */}
            <nav className="hidden lg:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeDoc === link.id;
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      isActive
                        ? "bg-card text-foreground shadow-sm border border-border/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Cookie Manager Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={openCookiePreferencesModal}
              className="hidden md:inline-flex items-center gap-1.5 text-xs h-9 rounded-xl border-border/70 hover:bg-muted font-medium"
              title="Gerir as suas preferências de cookies"
            >
              <Sliders className="h-3.5 w-3.5 text-[#e66a00]" />
              <span>Gerir Cookies</span>
            </Button>

            {/* Print Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs h-9 rounded-xl text-muted-foreground hover:text-foreground"
              title="Imprimir documento ou guardar como PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </Button>

            {/* Login CTA */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 md:px-4 md:py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs md:text-sm border border-border/60 transition-colors"
            >
              <span>Entrar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Mobile Document Switcher ──────────────────────────────────── */}
      <div className="lg:hidden border-b border-border/60 bg-muted/30 px-4 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeDoc === link.id;
            return (
              <Link
                key={link.id}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-[#004b36] text-white shadow-sm font-semibold"
                    : "bg-card text-muted-foreground border border-border/60 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/50 via-muted/20 to-background py-10 md:py-14">
        {/* Decorative elements */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#004b36]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#e66a00]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative">
          {/* Breadcrumb + Extra visible "Voltar" */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1 font-medium">
                <Home className="h-3.5 w-3.5" />
                Início
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-foreground font-semibold">{title}</span>
            </div>

            <Link
              href="/"
              className="inline-flex sm:hidden items-center gap-1.5 text-xs font-bold text-[#004b36] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Início
            </Link>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004b36]/10 border border-[#004b36]/20 text-[#004b36] text-xs font-bold uppercase tracking-wider mb-4">
              <Shield className="h-3.5 w-3.5 text-[#004b36]" />
              <span>{badgeText}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {title}
            </h1>

            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/40">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Última actualização: {lastUpdated}</span>
              </div>
              <span className="text-muted-foreground/40">•</span>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span>Facturas K360 • Luanda, República de Angola</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Area with Table of Contents Sidebar ──────────── */}
      <main className="container flex-1 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Sticky Table of Contents (Desktop) */}
          {tableOfContents.length > 0 && (
            <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-5">
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/50 text-foreground font-bold text-sm">
                  <FileText className="h-4 w-4 text-[#004b36]" />
                  <span>Nesta Página</span>
                </div>
                <nav className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {tableOfContents.map((item, idx) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="group flex items-start gap-2.5 py-1.5 px-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground/60 w-4 text-right pt-0.5 group-hover:text-primary">
                        {idx + 1}.
                      </span>
                      <span className="flex-1 leading-snug">{item.title}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Prominent Quick Return Card in Sidebar */}
              <div className="rounded-2xl border border-[#004b36]/20 bg-gradient-to-br from-[#004b36]/5 via-[#004b36]/10 to-transparent p-5 space-y-3">
                <p className="text-xs font-bold text-foreground">
                  Precisa de voltar ao site principal?
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Pode regressar à página inicial ou aceder directamente à plataforma para emitir facturas.
                </p>
                <Link
                  href="/"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#004b36] to-[#006b4e] text-white font-bold text-xs shadow-md shadow-[#004b36]/20 hover:brightness-110 transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao Início
                </Link>
              </div>
            </aside>
          )}

          {/* Legal Text Content */}
          <div
            className={cn(
              "space-y-8",
              tableOfContents.length > 0 ? "lg:col-span-8" : "lg:col-span-12 max-w-4xl mx-auto"
            )}
          >
            {children}

            {/* ─── BOTTOM PROMINENT "VOLTAR AO INÍCIO" & CONTACT CARD ─── */}
            <div className="mt-16 pt-8 border-t border-border/80">
              <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card to-muted/40 p-6 md:p-8 shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e66a00] uppercase tracking-wider">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Transparência e Conformidade Total</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground">
                      Tem dúvidas sobre este documento?
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      A nossa equipa jurídica e de conformidade tributária em Luanda está à sua inteira disposição para esclarecimentos adicionais.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        suporte@facturas-k360.ao
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        +244 923 456 789
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Luanda, Angola
                      </span>
                    </div>
                  </div>

                  {/* ─── EXTRA PROMINENT VOLTAR AO INÍCIO BUTTON ─── */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#004b36] via-[#005a41] to-[#006b4e] text-white font-extrabold text-sm shadow-xl shadow-[#004b36]/25 hover:shadow-2xl hover:shadow-[#004b36]/35 hover:scale-[1.03] active:scale-[0.98] transition-all group border border-emerald-400/30"
                      title="Voltar à página inicial"
                    >
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      <span>« Voltar ao Início »</span>
                    </Link>

                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-card border-2 border-border/80 hover:border-primary/40 text-foreground font-bold text-sm hover:bg-muted/50 transition-all text-center"
                    >
                      <span>Aceder ao Sistema</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-muted/20 mt-auto">
        <div className="container py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#004b36] to-[#006b4e] flex items-center justify-center text-white font-bold text-xs">
                K360
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Facturas K360</p>
                <p className="text-xs text-muted-foreground">
                  Facturação Electrónica Certificada para Angola
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <Link href="/" className="font-semibold text-primary hover:underline flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Voltar ao Início
              </Link>
              <Link href="/termos" className="hover:text-foreground transition-colors">
                Termos e Condições
              </Link>
              <Link href="/privacidade" className="hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">
                Política de Cookies
              </Link>
              <button
                type="button"
                onClick={openCookiePreferencesModal}
                className="hover:text-foreground transition-colors underline cursor-pointer"
              >
                Configurar Cookies
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Facturas K360. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
