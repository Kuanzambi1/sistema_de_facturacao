import { Link } from "wouter";
import { useState } from "react";
import {
  FileText,
  Shield,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Globe,
  Lock,
  Users,
  Receipt,
  Building2,
  Sparkles,
} from "lucide-react";
import { BILLING_CYCLES, formatPlanPrice, getMonthlyEquivalent, type BillingCycleId } from "@shared/const";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: FileText,
    title: "Facturação Electrónica",
    desc: "Emita facturas, orçamentos e guias de remessa com conformidade total com a AGT.",
  },
  {
    icon: Shield,
    title: "ATCUD & SAFT",
    desc: "Código Único de Documento e relatórios SAFT-AO gerados automaticamente.",
  },
  {
    icon: Zap,
    title: "Rápido & Simples",
    desc: "Interface intuitiva. Facturas emitidas em segundos, não em minutos.",
  },
  {
    icon: BarChart3,
    title: "Relatórios em Tempo Real",
    desc: "Dashboards, declarações de IVA e inventário sempre actualizados.",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    desc: "Base de dados de clientes com portal próprio para consulta de documentos.",
  },
  {
    icon: Lock,
    title: "Seguro & Confiável",
    desc: "Dados protegidos com autenticação segura e backups automáticos.",
  },
];

const stats = [
  { value: "500+", label: "Empresas activas" },
  { value: "100%", label: "Conformidade AGT" },
  { value: "24/7", label: "Disponibilidade" },
  { value: "<2s", label: "Tempo de emissão" },
];

const plans = [
  {
    name: "Grátis",
    desc: "Para experimentar o sistema",
    features: ["100 documentos/mês", "3 utilizadores", "Facturação AGT completa", "Portal do cliente"],
    cta: "Começar Grátis",
    highlighted: false,
    prices: { mensal: 0, trimestral: 0, semestral: 0, anual: 0 },
  },
  {
    name: "Pro",
    desc: "Para PME em crescimento",
    features: ["5.000 documentos/mês", "20 utilizadores", "Facturação recorrente", "Pagamentos & dunning", "Portal do cliente"],
    cta: "Escolher Pro",
    highlighted: true,
    prices: { mensal: 15000, trimestral: 38000, semestral: 72000, anual: 130000 },
  },
  {
    name: "Escritório",
    desc: "Para contabilistas e escritórios",
    features: ["100.000 documentos/mês", "100 utilizadores", "Tudo do plano Pro", "Suporte prioritário", "Multi-empresa"],
    cta: "Escolher Escritório",
    highlighted: false,
    prices: { mensal: 35000, trimestral: 90000, semestral: 170000, anual: 310000 },
  },
];

export default function Landing() {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycleId>("mensal");
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004b36] to-[#004b36]/80 flex items-center justify-center shadow-md shadow-[#004b36]/20 overflow-hidden">
              <img src="/logo.png" alt="Facturas K360" className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">Facturas K360</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e66a00] to-[#e66a00]/90 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-[#e66a00]/25"
            >
              Criar Conta Grátis
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#e66a00]/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-[#004b36]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="container relative py-24 md:py-32 text-center">

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Facturação Electrónica
            <br />
            <span className="bg-gradient-to-r from-[#004b36] to-[#004b36]/70 bg-clip-text text-transparent">
              com conformidade fiscal
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sistema completo para emissão de documentos fiscais, gestão de inventário e
            relatórios — <span className="font-semibold text-foreground">100% compatível com a AGT</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#e66a00] to-[#e66a00]/85 text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-[#e66a00]/25 hover:shadow-[#e66a00]/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              Começar Agora — É Grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#funcionalidades"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-border text-sm font-semibold text-foreground hover:bg-accent/50 transition-all"
            >
              Saber Mais
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#004b36] to-[#004b36]/70 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Tudo o que precisa<br className="hidden sm:block" /> num só lugar
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
            Ferramentas pensadas para o empreendedor angolano cumprir a legislação fiscal sem complicação.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative p-7 rounded-2xl border border-border/60 bg-card hover:border-[#004b36]/25 hover:shadow-xl hover:shadow-[#004b36]/5 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#004b36]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004b36]/10 to-[#004b36]/5 flex items-center justify-center mb-5 group-hover:from-[#004b36]/15 group-hover:to-[#004b36]/10 transition-all">
                  <f.icon className="h-5.5 w-5.5 text-[#004b36]" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Como funciona
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Três passos simples para começar a emitir facturas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", icon: Building2, title: "Registe a sua empresa", desc: "Crie a sua conta gratuitamente em menos de 2 minutos." },
              { step: "2", icon: Users, title: "Adicione os seus clientes", desc: "Importe ou cadastre os seus clientes com NIF e dados fiscais." },
              { step: "3", icon: Receipt, title: "Emita facturas", desc: "Crie documentos fiscais com IVA, ATCUD e envio por email automático." },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e66a00] to-[#e66a00]/80 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#e66a00]/20">
                  <span className="text-xl font-extrabold text-white">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="container py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Planos a partir de <span className="text-[#004b36]">0 Kz</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">Escolha o plano ideal para o seu negócio.</p>
        </div>

        {/* Billing cycle selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/60">
            {Object.entries(BILLING_CYCLES).map(([key, cycle]) => (
              <button
                key={key}
                onClick={() => setSelectedCycle(key as BillingCycleId)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  selectedCycle === key
                    ? "bg-[#004b36] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {cycle.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => {
            const price = p.prices[selectedCycle];
            const monthly = getMonthlyEquivalent(
              p.name === "Grátis" ? "gratis" : p.name === "Pro" ? "pro" : "escritorio",
              selectedCycle
            );
            const savings = selectedCycle !== "mensal" && price > 0
              ? Math.round(((p.prices.mensal * BILLING_CYCLES[selectedCycle].months - price) / (p.prices.mensal * BILLING_CYCLES[selectedCycle].months)) * 100)
              : 0;

            return (
              <div
                key={p.name}
                className={`relative p-8 rounded-2xl border bg-card flex flex-col transition-all duration-300 ${
                  p.highlighted
                    ? "border-[#e66a00]/40 shadow-2xl shadow-[#e66a00]/10 scale-[1.02]"
                    : "border-border/60 hover:border-border hover:shadow-lg"
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#e66a00] to-[#e66a00]/85 text-white text-xs font-bold tracking-wide shadow-md shadow-[#e66a00]/25">
                    Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                <div className="mt-5 mb-7">
                  <span className="text-4xl font-extrabold text-foreground">{formatPlanPrice(price)}</span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground ml-1 font-medium">
                      /{BILLING_CYCLES[selectedCycle].months === 1 ? "mês" : `${BILLING_CYCLES[selectedCycle].months} meses`}
                    </span>
                  )}
                  {price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ {monthly.toLocaleString("pt-AO")} Kz/mês
                      {savings > 0 && <span className="ml-1 text-[#004b36] font-semibold"> poupe {savings}%</span>}
                    </p>
                  )}
                  {price === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Tempo limitado</p>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="h-4.5 w-4.5 text-[#004b36] mt-0.5 flex-shrink-0" />
                      <span className="font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${
                    p.highlighted
                      ? "bg-gradient-to-r from-[#e66a00] to-[#e66a00]/85 text-white shadow-md shadow-[#e66a00]/20 hover:brightness-110 hover:shadow-lg"
                      : "bg-[#004b36]/8 text-[#004b36] hover:bg-[#004b36]/15"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004b36] to-[#004b36]/90 p-12 md:p-16 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e66a00]/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Pronto para começar?
            </h2>
            <p className="mt-4 text-white/80 text-lg max-w-lg mx-auto">
              Crie a sua conta gratuita e comece a emitir facturas em minutos.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#e66a00] text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-black/20 mt-8 hover:scale-[1.02] active:scale-[0.98]"
            >
              Criar Conta Grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#004b36] to-[#004b36]/80 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Facturas K360" className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <span className="font-bold text-foreground">Facturas K360</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Facturas K360. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
