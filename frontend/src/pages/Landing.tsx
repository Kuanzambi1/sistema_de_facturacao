import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  Star,
  Play,
  ArrowUpRight,
  Package,
  Clock,
  Cpu,
  HeartHandshake,
  TrendingUp,
  BadgeCheck,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { BILLING_CYCLES, formatPlanPrice, getMonthlyEquivalent, type BillingCycleId } from "@shared/const";
import { cn } from "@/lib/utils";

/* ─── Animated counter hook ──────────────────────────────────────────────── */
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
}

/* ─── Scroll-triggered fade-in hook ──────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: FileText,
    title: "Facturação Electrónica Completa",
    desc: "Emita Facturas, Notas de Crédito, Notas de Débito, Recibos e Facturas-Recibo com total conformidade AGT. Numeração sequencial automática por série.",
    highlights: ["ATCUD automático", "Hash SHA-256", "SAF-T (AO)"],
  },
  {
    icon: Shield,
    title: "100% Conforme com a AGT",
    desc: "Código Único de Documento (ATCUD), assinatura digital e ficheiros SAF-T gerados automaticamente. Sem preocupações com auditorias fiscais.",
    highlights: ["Exportação XML", "Validação de NIF", "Legislação actualizada"],
  },
  {
    icon: BarChart3,
    title: "Relatórios & Analytics",
    desc: "Dashboards interactivos com KPIs em tempo real. Acompanhe vendas, IVA a liquidar, clientes top e desempenho financeiro com gráficos intuitivos.",
    highlights: ["Vendas mensais", "Apuramento IVA", "Top clientes"],
  },
  {
    icon: Package,
    title: "Gestão de Inventário",
    desc: "Controle o stock em tempo real com alertas de stock mínimo, registo automático de entradas e saídas, e exportação SAF-T de inventário.",
    highlights: ["Stock em tempo real", "Alertas automáticos", "Movimentos detalhados"],
  },
  {
    icon: Users,
    title: "Gestão de Clientes & Fornecedores",
    desc: "Base de dados completa com validação de NIF angolano, portal do cliente para consulta de documentos, e importação em massa.",
    highlights: ["Portal do cliente", "Validação NIF", "Pesquisa avançada"],
  },
  {
    icon: Cpu,
    title: "Automatização Inteligente",
    desc: "Facturação recorrente automática, cálculo de IVA, numeração sequencial e envio de documentos por email — tudo sem intervenção manual.",
    highlights: ["Facturação recorrente", "Cálculo IVA auto", "Envio por email"],
  },
];

const stats = [
  { value: 500, suffix: "+", label: "Empresas confiam em nós" },
  { value: 50, suffix: "K+", label: "Facturas emitidas" },
  { value: 100, suffix: "%", label: "Conformidade AGT" },
  { value: 2, suffix: "s", label: "Tempo médio de emissão" },
];

const testimonials = [
  {
    name: "Ana Cristina",
    role: "CEO, Kambas Trading",
    text: "O Facturas K360 transformou a forma como gerimos a nossa facturação. Em minutos emitimos documentos com total conformidade AGT.",
    rating: 5,
  },
  {
    name: "João Baptista",
    role: "Contabilista, BM Consultores",
    text: "A exportação SAF-T automática poupou-nos horas de trabalho. É o sistema mais completo que testámos para o mercado angolano.",
    rating: 5,
  },
  {
    name: "Maria do Rosário",
    role: "Directora Financeira, Kianda Tech",
    text: "Interface moderna e intuitiva. Os relatórios em tempo real dão-nos uma visão clara do nosso negócio a qualquer momento.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "O Facturas K360 está em conformidade com a legislação fiscal angolana?",
    a: "Sim, 100%. O sistema gera automaticamente o Código Único de Documento (ATCUD), assinatura digital com hash SHA-256, e ficheiros SAF-T (AO) compatíveis com os requisitos da Administração Geral Tributária (AGT).",
  },
  {
    q: "Posso emitir todos os tipos de documentos fiscais?",
    a: "Sim. O sistema suporta Facturas, Facturas-Recibo, Notas de Crédito, Notas de Débito, Recibos e Facturas de Adiantamento, todos com numeração sequencial automática por série.",
  },
  {
    q: "Quanto tempo demora a começar a utilizar?",
    a: "Menos de 2 minutos. Crie a sua conta, configure os dados da empresa e comece imediatamente a emitir documentos fiscais. Sem instalações nem configurações complexas.",
  },
  {
    q: "Posso gerir o stock e inventário?",
    a: "Sim. O módulo de inventário permite controlar entradas e saídas de stock em tempo real, definir alertas de stock mínimo e exportar o inventário no formato SAF-T.",
  },
  {
    q: "Como funciona o plano gratuito?",
    a: "O plano gratuito inclui até 100 documentos por mês, 3 utilizadores, facturação AGT completa e portal do cliente. Ideal para experimentar o sistema sem compromisso.",
  },
];

const plans = [
  {
    name: "Grátis",
    desc: "Para experimentar o sistema",
    features: [
      "100 documentos/mês",
      "3 utilizadores",
      "Facturação AGT completa",
      "ATCUD & SAF-T",
      "Portal do cliente",
    ],
    cta: "Começar Grátis",
    highlighted: false,
    prices: { mensal: 0, trimestral: 0, semestral: 0, anual: 0 },
  },
  {
    name: "Pro",
    desc: "Para PME em crescimento",
    features: [
      "5.000 documentos/mês",
      "20 utilizadores",
      "Facturação recorrente",
      "Pagamentos & dunning",
      "Portal do cliente",
      "Relatórios avançados",
      "Suporte por email",
    ],
    cta: "Escolher Pro",
    highlighted: true,
    prices: { mensal: 15000, trimestral: 38000, semestral: 72000, anual: 130000 },
  },
  {
    name: "Escritório",
    desc: "Para contabilistas e escritórios",
    features: [
      "100.000 documentos/mês",
      "100 utilizadores",
      "Tudo do plano Pro",
      "Multi-empresa",
      "Suporte prioritário",
      "API de integração",
      "Onboarding dedicado",
    ],
    cta: "Escolher Escritório",
    highlighted: false,
    prices: { mensal: 35000, trimestral: 90000, semestral: 170000, anual: 310000 },
  },
];

/* ─── FAQ Accordion Item ─────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "border border-border/60 rounded-2xl transition-all duration-300 overflow-hidden",
        open ? "bg-card shadow-lg shadow-black/[0.03]" : "bg-card/50 hover:bg-card"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-[15px] font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Section Wrapper with scroll-reveal ─────────────────────────────────── */
function RevealSection({
  children,
  className,
  delay = 0,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.7s cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Landing() {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycleId>("mensal");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm shadow-black/[0.03]"
            : "bg-transparent"
        )}
      >
        <div className="container flex items-center justify-between h-16 md:h-[72px]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004b36] to-[#006b4e] flex items-center justify-center shadow-lg shadow-[#004b36]/25 overflow-hidden">
              <img
                src="/logo.png"
                alt="Facturas K360"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span className="text-lg font-extrabold text-foreground tracking-tight">
              Facturas K360
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#funcionalidades" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
              Funcionalidades
            </a>
            <a href="#precos" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
              Preços
            </a>
            <a href="#faq" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
              FAQ
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 py-2.5 rounded-xl hover:bg-accent/50"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#e66a00] to-[#d45e00] text-white text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-[#e66a00]/25 hover:shadow-lg hover:shadow-[#e66a00]/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Criar Conta Grátis
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent/50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 pb-6 animate-fade-in-up">
            <div className="flex flex-col gap-2 py-3">
              <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-foreground rounded-xl hover:bg-accent/50">Funcionalidades</a>
              <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-foreground rounded-xl hover:bg-accent/50">Preços</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-foreground rounded-xl hover:bg-accent/50">FAQ</a>
              <hr className="border-border/40 my-2" />
              <Link href="/login" className="px-4 py-3 text-sm font-semibold text-foreground rounded-xl hover:bg-accent/50">Entrar</Link>
              <Link href="/login" className="mx-4 py-3 rounded-xl bg-gradient-to-r from-[#e66a00] to-[#d45e00] text-white text-sm font-bold text-center shadow-md">
                Criar Conta Grátis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 md:pt-36 pb-20 md:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_rgba(0,75,54,0.08),_transparent)]" />
          <div className="absolute top-32 -left-20 w-80 h-80 bg-[#e66a00]/[0.04] rounded-full blur-[80px]" />
          <div className="absolute top-60 -right-20 w-96 h-96 bg-[#004b36]/[0.04] rounded-full blur-[100px]" />
          {/* Animated grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,75,54,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,75,54,1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] lg:text-[3.75rem] font-extrabold tracking-tight text-foreground leading-[1.08]">
                A plataforma de{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-[#004b36] via-[#006b4e] to-[#004b36] bg-clip-text text-transparent">
                    facturação
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="#e66a00" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
                  </svg>
                </span>
                <br />
                feita para Angola
              </h1>

              <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Emita documentos fiscais, gerencie inventário e gere relatórios —{" "}
                <span className="font-semibold text-foreground">
                  100% compatível com a legislação da AGT
                </span>
                . Tudo num único sistema.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#e66a00] to-[#d45e00] text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-[#e66a00]/25 hover:shadow-[#e66a00]/35 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
                >
                  Começar Agora — É Grátis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#funcionalidades"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-border/80 text-sm font-semibold text-foreground hover:border-[#004b36]/30 hover:bg-[#004b36]/[0.03] transition-all w-full sm:w-auto justify-center"
                >
                  <Play className="h-4 w-4 text-[#004b36]" />
                  Ver como funciona
                </a>
              </div>

              {/* Social proof mini */}
              <div className="flex items-center gap-4 mt-10 justify-center lg:justify-start">
                <div className="flex -space-x-2.5">
                  {[
                    "bg-gradient-to-br from-emerald-400 to-emerald-600",
                    "bg-gradient-to-br from-orange-400 to-orange-600",
                    "bg-gradient-to-br from-blue-400 to-blue-600",
                    "bg-gradient-to-br from-purple-400 to-purple-600",
                  ].map((bg, i) => (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full ${bg} border-2 border-background flex items-center justify-center`}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {["AC", "JB", "MR", "PL"][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground">500+</span> empresas satisfeitas
                  </p>
                </div>
              </div>
            </div>

            {/* Right — Dashboard Preview */}
            <div className="relative lg:ml-4">
              <div className="relative">
                {/* Glow effect behind the mockup */}
                <div className="absolute -inset-4 bg-gradient-to-br from-[#004b36]/10 via-transparent to-[#e66a00]/10 rounded-3xl blur-2xl" />

                {/* Main dashboard mockup — pure CSS replica */}
                <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-black/[0.08] bg-card">
                  {/* Fake browser bar */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/40">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="bg-background/80 rounded-md px-3 py-1 text-[9px] text-muted-foreground font-mono text-center">
                        app.facturas-k360.ao/dashboard
                      </div>
                    </div>
                  </div>
                  {/* Dashboard content replica */}
                  <div className="bg-background p-3 space-y-3" style={{ fontSize: 0 }}>
                    {/* Welcome banner */}
                    <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, oklch(0.18 0.04 240) 0%, oklch(0.25 0.07 230) 100%)' }}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none" style={{ background: 'rgba(230,106,0,0.12)' }} />
                      <div className="relative flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold text-white">Bem-vindo ao <span className="text-[#e66a00]">Facturas K360</span></p>
                          <p className="text-[7px] text-white/50 mt-0.5">Segunda-feira, 28 de Setembro de 2026</p>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg text-[7px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #e66a00, #d45e00)' }}>+ Nova Factura</div>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {['AGT Conforme', 'SAFT-AO', 'ATCUD Automático'].map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/10 text-[6px] font-medium text-white/70">{t}</span>
                        ))}
                      </div>
                    </div>
                    {/* KPI cards */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Total Facturado', value: '2.450.000 Kz', color: '#004b36', bg: 'rgba(0,75,54,0.06)' },
                        { label: 'Pendentes', value: '380.000 Kz', color: '#d97706', bg: 'rgba(217,119,6,0.06)' },
                        { label: 'Este Mês', value: '720.000 Kz', color: '#059669', bg: 'rgba(5,150,105,0.06)' },
                        { label: 'Clientes', value: '24', color: '#2563eb', bg: 'rgba(37,99,235,0.06)' },
                      ].map(k => (
                        <div key={k.label} className="rounded-lg border border-border/50 p-2" style={{ background: `linear-gradient(135deg, white, ${k.bg})` }}>
                          <p className="text-[6px] font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.48 0.015 160)' }}>{k.label}</p>
                          <p className="text-[10px] font-bold mt-1" style={{ color: 'oklch(0.13 0.02 160)' }}>{k.value}</p>
                        </div>
                      ))}
                    </div>
                    {/* Chart area */}
                    <div className="rounded-lg border border-border/50 bg-card p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: 'oklch(0.13 0.02 160)' }}>Vendas Mensais 2026</p>
                        <span className="text-[6px] font-semibold px-1.5 py-0.5 rounded-full bg-muted/60" style={{ color: 'oklch(0.48 0.015 160)' }}>AOA</span>
                      </div>
                      <div className="flex items-end gap-[3px] h-16">
                        {[35,52,44,68,58,75,82,90,64,72,85,48].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-[1px]">
                            <div className="w-full rounded-t" style={{ height: `${h * 0.55}px`, background: i < 9 ? '#004b36' : 'oklch(0.85 0.01 160)' }} />
                            <div className="w-full rounded-t" style={{ height: `${h * 0.15}px`, background: i < 9 ? '#e66a00' : 'oklch(0.90 0.01 160)' }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-[3px] mt-1">
                        {['J','F','M','A','M','J','J','A','S','O','N','D'].map(m => (
                          <span key={m} className="flex-1 text-center text-[5px]" style={{ color: 'oklch(0.48 0.015 160)' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                    {/* Recent invoices table */}
                    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/30">
                        <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: 'oklch(0.13 0.02 160)' }}>Últimos Documentos</p>
                        <span className="text-[6px] font-semibold" style={{ color: '#004b36' }}>Ver todos →</span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {[
                          { num: 'FT A/32', client: 'Kambas Trading', val: '485.000 Kz', status: 'Paga', sc: 'bg-emerald-50 text-emerald-700' },
                          { num: 'FT A/31', client: 'Kianda Tech', val: '120.000 Kz', status: 'Emitida', sc: 'bg-blue-50 text-blue-700' },
                          { num: 'NC A/5', client: 'BM Consultores', val: '45.000 Kz', status: 'Emitida', sc: 'bg-blue-50 text-blue-700' },
                        ].map(r => (
                          <div key={r.num} className="flex items-center px-2.5 py-1.5">
                            <span className="text-[7px] font-mono font-medium w-14" style={{ color: '#004b36' }}>{r.num}</span>
                            <span className="text-[7px] flex-1" style={{ color: 'oklch(0.13 0.02 160)' }}>{r.client}</span>
                            <span className="text-[7px] font-bold w-20 text-right" style={{ color: 'oklch(0.13 0.02 160)' }}>{r.val}</span>
                            <span className={`text-[5px] font-bold uppercase ml-2 px-1.5 py-0.5 rounded-full ${r.sc}`}>{r.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating invoice card */}
                <div className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-10 w-48 md:w-56 rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-black/[0.12] bg-card animate-float-slow">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#004b36]/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#004b36]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground">FT 2024/0032</p>
                          <p className="text-[9px] text-muted-foreground">Kambas Trading</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-extrabold text-foreground">485.000 Kz</p>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Paga
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <p className="text-[9px] text-muted-foreground font-mono">ATCUD: K360-0032/78</p>
                    </div>
                  </div>
                </div>

                {/* Floating compliance badge */}
                <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 rounded-2xl border border-border/60 shadow-xl shadow-black/[0.08] bg-card px-4 py-3 animate-float-slow" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
                      <BadgeCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">AGT Conforme</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">100% verificado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trusted By / Stats ──────────────────────────────────────────── */}
      <section className="relative border-y border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-[#004b36]/[0.02] via-transparent to-[#004b36]/[0.02]" />
        <div className="container relative py-16 md:py-20">
          <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-12">
            Confiado por empresas em todo o país
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((s) => {
              const { count, ref } = useCountUp(s.value);
              return (
                <div key={s.label} ref={ref} className="text-center">
                  <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    <span className="bg-gradient-to-r from-[#004b36] to-[#006b4e] bg-clip-text text-transparent">
                      {s.value === 2 ? "<" : ""}{count}{s.suffix}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground font-medium">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 md:py-32">
        <div className="container">
          <RevealSection className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#004b36]/[0.06] border border-[#004b36]/10 mb-6">
              <Zap className="h-3.5 w-3.5 text-[#004b36]" />
              <span className="text-xs font-semibold text-[#004b36] tracking-wide uppercase">
                Funcionalidades
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
              Tudo o que precisa para{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#004b36] to-[#006b4e] bg-clip-text text-transparent">
                gerir a facturação
              </span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Ferramentas poderosas pensadas para o empreendedor angolano cumprir a legislação fiscal sem complicação.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <RevealSection key={f.title} delay={i * 80}>
                <div className="group relative h-full p-7 md:p-8 rounded-2xl border border-border/60 bg-card hover:border-[#004b36]/20 transition-all duration-400 hover:shadow-xl hover:shadow-[#004b36]/[0.04]">
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#004b36]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

                  <div className="relative">
                    <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-[#004b36]/10 to-[#004b36]/5 flex items-center justify-center mb-6 group-hover:from-[#004b36]/15 group-hover:to-[#004b36]/10 transition-all duration-300 group-hover:scale-110">
                      <f.icon className="h-6 w-6 text-[#004b36]" />
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-3">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{f.desc}</p>

                    {/* Feature highlights */}
                    <div className="flex flex-wrap gap-2">
                      {f.highlights.map((h) => (
                        <span
                          key={h}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#004b36]/[0.05] text-[11px] font-semibold text-[#004b36]"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Product Showcase (Dashboard + Invoice) ──────────────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />
        <div className="container relative">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Uma interface que{" "}
              <span className="bg-gradient-to-r from-[#e66a00] to-[#d45e00] bg-clip-text text-transparent">
                simplifica tudo
              </span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Dashboard intuitivo, emissão de facturas em segundos e relatórios que tomam decisões por si.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            <RevealSection delay={100}>
              <div className="rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-black/[0.06] bg-card">
                {/* CSS-only dashboard mockup (larger) */}
                <div className="bg-background p-4 md:p-5 space-y-4">
                  {/* Welcome banner */}
                  <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, oklch(0.18 0.04 240) 0%, oklch(0.25 0.07 230) 100%)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none" style={{ background: 'rgba(230,106,0,0.12)' }} />
                    <div className="relative">
                      <p className="text-sm font-extrabold text-white">Bem-vindo ao <span className="text-[#e66a00]">Facturas K360</span></p>
                      <p className="text-[10px] text-white/50 mt-1">Segunda-feira, 28 de Setembro de 2026</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {['AGT Conforme', 'SAFT-AO', 'ATCUD Automático'].map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-[8px] font-medium text-white/70">{t}</span>
                      ))}
                    </div>
                  </div>
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Facturado', value: '2.450.000 Kz', icon: '📈', bg: 'rgba(0,75,54,0.06)' },
                      { label: 'Pendentes', value: '380.000 Kz', icon: '⏳', bg: 'rgba(217,119,6,0.06)' },
                      { label: 'Este Mês', value: '720.000 Kz', icon: '↗', bg: 'rgba(5,150,105,0.06)' },
                      { label: 'Clientes', value: '24', icon: '👥', bg: 'rgba(37,99,235,0.06)' },
                    ].map(k => (
                      <div key={k.label} className="rounded-xl border border-border/50 p-3" style={{ background: `linear-gradient(135deg, white, ${k.bg})` }}>
                        <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                        <p className="text-sm font-bold mt-1.5 text-foreground">{k.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div className="rounded-xl border border-border/50 bg-card p-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-foreground mb-3">Vendas Mensais 2026</p>
                    <div className="flex items-end gap-1 h-20">
                      {[35,52,44,68,58,75,82,90,64,72,85,48].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-[1px]">
                          <div className="w-full rounded-t" style={{ height: `${h * 0.75}px`, background: '#004b36' }} />
                          <div className="w-full rounded-t" style={{ height: `${h * 0.2}px`, background: '#e66a00' }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map(m => (
                        <span key={m} className="flex-1 text-center text-[6px] text-muted-foreground">{m}</span>
                      ))}
                    </div>
                  </div>
                  {/* Conformidade */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'ATCUD em todos os documentos', ok: true },
                      { label: 'Assinatura digital activa', ok: true },
                      { label: 'Séries comunicadas à AGT', ok: false },
                    ].map(c => (
                      <div key={c.label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[7px] font-medium border ${
                        c.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' : 'bg-amber-50 text-amber-800 border-amber-200/60'
                      }`}>
                        <span>{c.ok ? '✓' : '⚠'}</span>
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-lg font-bold text-foreground">Dashboard Inteligente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  KPIs, gráficos de vendas e alertas de conformidade — tudo num só ecrã.
                </p>
              </div>
            </RevealSection>

            <RevealSection delay={200}>
              <div className="rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-black/[0.06] bg-white max-w-md mx-auto">
                {/* CSS-only invoice document mockup */}
                <div className="p-5 md:p-6 space-y-4">
                  {/* Header: Company + Document type */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #004b36, #006b4e)' }}>
                          <img src="/logo.png" alt="" className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-foreground uppercase">DEMO Empresa, Lda.</p>
                          <p className="text-[8px] text-muted-foreground">NIF: 5417256890</p>
                        </div>
                      </div>
                      <p className="text-[7px] text-muted-foreground">Rua do Comércio, 123 — Luanda, Angola</p>
                      <p className="text-[7px] text-muted-foreground">Tel: +244 923 456 789</p>
                    </div>
                    <div className="border border-foreground/20 rounded-lg p-2.5 text-right">
                      <p className="text-[7px] font-bold text-muted-foreground uppercase">ORIGINAL</p>
                      <p className="text-xs font-extrabold text-foreground">Factura</p>
                      <p className="text-[9px] font-bold text-foreground">n.º FT A/32</p>
                    </div>
                  </div>
                  {/* Client */}
                  <div className="border-t border-border/40 pt-3">
                    <p className="text-[7px] italic text-muted-foreground">Exmo.(s) Sr(s)</p>
                    <p className="text-[10px] font-bold text-foreground">Kambas Trading, Lda.</p>
                    <p className="text-[7px] text-muted-foreground">NIF: 5401234567 — Av. 4 de Fevereiro, Luanda</p>
                  </div>
                  {/* Metadata row */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { l: 'Data', v: '28/09/2026' },
                      { l: 'Vencimento', v: '28/10/2026' },
                      { l: 'Contribuinte', v: '5401234567' },
                      { l: 'V/ Ref.', v: 'PO-2024' },
                    ].map(m => (
                      <div key={m.l} className="text-center bg-muted/30 rounded px-1 py-1">
                        <p className="text-[6px] font-semibold text-muted-foreground uppercase">{m.l}</p>
                        <p className="text-[7px] font-medium text-foreground">{m.v}</p>
                      </div>
                    ))}
                  </div>
                  {/* Items table */}
                  <div className="border border-border/40 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 bg-foreground/[0.06] px-2 py-1.5">
                      <span className="col-span-5 text-[6px] font-bold uppercase text-muted-foreground">Descrição</span>
                      <span className="col-span-1 text-[6px] font-bold uppercase text-muted-foreground text-right">Qtd.</span>
                      <span className="col-span-2 text-[6px] font-bold uppercase text-muted-foreground text-right">Preço</span>
                      <span className="col-span-1 text-[6px] font-bold uppercase text-muted-foreground text-right">IVA</span>
                      <span className="col-span-3 text-[6px] font-bold uppercase text-muted-foreground text-right">Total</span>
                    </div>
                    {[
                      { desc: 'Serviço de Consultoria TI', qty: '40h', price: '8.500,00', vat: '14%', total: '476.000,00' },
                      { desc: 'Licença Software Anual', qty: '1', price: '9.000,00', vat: '14%', total: '9.000,00' },
                    ].map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 px-2 py-1.5 border-t border-border/30">
                        <span className="col-span-5 text-[7px] text-foreground">{item.desc}</span>
                        <span className="col-span-1 text-[7px] text-foreground text-right">{item.qty}</span>
                        <span className="col-span-2 text-[7px] text-foreground text-right">{item.price}</span>
                        <span className="col-span-1 text-[7px] text-foreground text-right">{item.vat}</span>
                        <span className="col-span-3 text-[7px] font-bold text-foreground text-right">{item.total}</span>
                      </div>
                    ))}
                  </div>
                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1">
                      <div className="flex justify-between text-[8px]">
                        <span className="text-muted-foreground">Total sem imposto:</span>
                        <span className="text-foreground font-medium">349.000,00 Kz</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="text-foreground font-medium">-0,00 Kz</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-muted-foreground">Total de Impostos (IVA 14%):</span>
                        <span className="text-foreground font-medium">67.900,00 Kz</span>
                      </div>
                      <div className="border-t border-foreground/20 pt-1 flex justify-between">
                        <span className="text-[9px] font-extrabold text-foreground">Total a pagar:</span>
                        <span className="text-[11px] font-extrabold text-foreground">485.000,00 Kz</span>
                      </div>
                    </div>
                  </div>
                  {/* ATCUD + Hash footer */}
                  <div className="border-t border-border/40 pt-3 mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-[#004b36]" />
                      <span className="text-[7px] font-mono text-muted-foreground">ATCUD: K360-0032/78</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-[#004b36]" />
                      <span className="text-[7px] font-mono text-muted-foreground">Hash: d4a7b3c2e1f0...5f6g7h8i</span>
                    </div>
                    <p className="text-[6px] text-muted-foreground italic mt-1">Processado por programa certificado n.º 0000/AGT — Facturas K360</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-lg font-bold text-foreground">Facturas Profissionais</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Documentos com ATCUD, hash SHA-256 e assinatura digital — prontos a enviar.
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="container">
          <RevealSection className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e66a00]/[0.06] border border-[#e66a00]/10 mb-6">
              <Clock className="h-3.5 w-3.5 text-[#e66a00]" />
              <span className="text-xs font-semibold text-[#e66a00] tracking-wide uppercase">
                Simples e rápido
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
              Comece em{" "}
              <span className="bg-gradient-to-r from-[#e66a00] to-[#d45e00] bg-clip-text text-transparent">
                3 passos
              </span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto">
              Sem instalações. Sem configurações complexas. Sem burocracia.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Registe a sua empresa",
                desc: "Crie a sua conta gratuitamente com o NIF da empresa. Configuração assistida em menos de 2 minutos.",
                color: "from-[#004b36] to-[#006b4e]",
              },
              {
                step: "02",
                icon: Users,
                title: "Adicione os seus clientes",
                desc: "Importe ou cadastre clientes com NIF, morada e contactos. Validação automática de NIF angolano.",
                color: "from-[#e66a00] to-[#d45e00]",
              },
              {
                step: "03",
                icon: Receipt,
                title: "Emita facturas",
                desc: "Crie documentos fiscais com IVA, ATCUD e assinatura digital. Envio automático por email.",
                color: "from-[#004b36] to-[#006b4e]",
              },
            ].map((s, i) => (
              <RevealSection key={s.step} delay={i * 120}>
                <div className="relative text-center group">
                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+48px)] w-[calc(100%-96px)] h-0.5">
                      <div className="w-full h-full bg-gradient-to-r from-border to-border/40 rounded-full" />
                      <ChevronRight className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-border" />
                    </div>
                  )}

                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <s.icon className="h-8 w-8 text-white" />
                  </div>
                  <span className="inline-block text-xs font-bold text-muted-foreground/60 tracking-widest uppercase mb-2">
                    Passo {s.step}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {s.desc}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#004b36] via-[#003d2d] to-[#002e22]" />
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#e66a00]/[0.08] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/[0.03] rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="container relative">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              O que dizem os nossos{" "}
              <span className="text-[#e66a00]">clientes</span>
            </h2>
            <p className="mt-4 text-white/60 text-lg max-w-lg mx-auto">
              Empresas de todo o país já confiam no Facturas K360.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((t, i) => (
              <RevealSection key={t.name} delay={i * 100}>
                <div className="relative p-7 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.09] transition-all duration-300">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e66a00] to-[#d45e00] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {t.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/50">{t.role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────────── */}
      <section id="precos" className="py-24 md:py-32">
        <div className="container">
          <RevealSection className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#004b36]/[0.06] border border-[#004b36]/10 mb-6">
              <TrendingUp className="h-3.5 w-3.5 text-[#004b36]" />
              <span className="text-xs font-semibold text-[#004b36] tracking-wide uppercase">
                Preços transparentes
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
              Planos a partir de{" "}
              <span className="bg-gradient-to-r from-[#004b36] to-[#006b4e] bg-clip-text text-transparent">
                0 Kz
              </span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto">
              Escolha o plano ideal para o seu negócio. Sem surpresas, sem custos escondidos.
            </p>
          </RevealSection>

          {/* Billing cycle selector */}
          <RevealSection className="flex justify-center mb-14" delay={100}>
            <div className="inline-flex items-center gap-1 p-1.5 bg-muted/60 rounded-2xl border border-border/60">
              {Object.entries(BILLING_CYCLES).map(([key, cycle]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCycle(key as BillingCycleId)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative",
                    selectedCycle === key
                      ? "bg-[#004b36] text-white shadow-md shadow-[#004b36]/25"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cycle.label}
                  {key === "anual" && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-md bg-[#e66a00] text-[9px] font-bold text-white">
                      -25%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {plans.map((p, i) => {
              const price = p.prices[selectedCycle];
              const monthly = getMonthlyEquivalent(
                p.name === "Grátis" ? "gratis" : p.name === "Pro" ? "pro" : "escritorio",
                selectedCycle
              );
              const savings =
                selectedCycle !== "mensal" && price > 0
                  ? Math.round(
                      ((p.prices.mensal * BILLING_CYCLES[selectedCycle].months - price) /
                        (p.prices.mensal * BILLING_CYCLES[selectedCycle].months)) *
                        100
                    )
                  : 0;

              return (
                <RevealSection key={p.name} delay={i * 100}>
                  <div
                    className={cn(
                      "relative h-full p-8 rounded-2xl border bg-card flex flex-col transition-all duration-400",
                      p.highlighted
                        ? "border-[#e66a00]/40 shadow-2xl shadow-[#e66a00]/[0.08] scale-[1.02] ring-1 ring-[#e66a00]/20"
                        : "border-border/60 hover:border-border hover:shadow-xl hover:shadow-black/[0.04]"
                    )}
                  >
                    {p.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-[#e66a00] to-[#d45e00] text-white text-xs font-bold tracking-wider shadow-lg shadow-[#e66a00]/30 uppercase">
                        ⭐ Mais Popular
                      </div>
                    )}
                    <h3 className="text-xl font-extrabold text-foreground">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>

                    <div className="mt-6 mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-foreground">
                          {formatPlanPrice(price)}
                        </span>
                        {price > 0 && (
                          <span className="text-sm text-muted-foreground font-medium">
                            /{BILLING_CYCLES[selectedCycle].months === 1 ? "mês" : `${BILLING_CYCLES[selectedCycle].months} meses`}
                          </span>
                        )}
                      </div>
                      {price > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          ≈ {monthly.toLocaleString("pt-AO")} Kz/mês
                          {savings > 0 && (
                            <span className="ml-1.5 text-[#004b36] font-bold bg-[#004b36]/[0.06] px-2 py-0.5 rounded-md">
                              poupe {savings}%
                            </span>
                          )}
                        </p>
                      )}
                      {price === 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">Para sempre, sem compromisso</p>
                      )}
                    </div>

                    <ul className="space-y-3.5 mb-8 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                          <CheckCircle2 className="h-4.5 w-4.5 text-[#004b36] mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login"
                      className={cn(
                        "block text-center py-3.5 rounded-xl text-sm font-bold transition-all duration-200",
                        p.highlighted
                          ? "bg-gradient-to-r from-[#e66a00] to-[#d45e00] text-white shadow-lg shadow-[#e66a00]/25 hover:brightness-110 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                          : "bg-[#004b36]/[0.06] text-[#004b36] hover:bg-[#004b36]/[0.12] border border-[#004b36]/10"
                      )}
                    >
                      {p.cta}
                    </Link>
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 md:py-32 bg-muted/20">
        <div className="container">
          <RevealSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Perguntas{" "}
              <span className="bg-gradient-to-r from-[#004b36] to-[#006b4e] bg-clip-text text-transparent">
                frequentes
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
              Respostas rápidas às dúvidas mais comuns.
            </p>
          </RevealSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <RevealSection key={i} delay={i * 60}>
                <FaqItem q={faq.q} a={faq.a} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container">
          <RevealSection>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004b36] via-[#003d2d] to-[#002e22] p-12 md:p-20 text-center">
              {/* Decorative elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#e66a00]/[0.1] rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.04] rounded-full blur-[80px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.04]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/[0.03]" />
              </div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  Pronto para modernizar{" "}
                  <br className="hidden sm:block" />a sua facturação?
                </h2>
                <p className="mt-5 text-white/70 text-lg max-w-lg mx-auto leading-relaxed">
                  Junte-se a centenas de empresas angolanas que já simplificaram os seus processos fiscais.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#e66a00] to-[#d45e00] text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Criar Conta Grátis
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <a
                    href="#funcionalidades"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-sm font-semibold text-white hover:bg-white/[0.06] transition-all"
                  >
                    Explorar funcionalidades
                  </a>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-muted/20">
        <div className="container py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004b36] to-[#006b4e] flex items-center justify-center shadow-md shadow-[#004b36]/20 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Facturas K360"
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <span className="text-lg font-extrabold text-foreground">Facturas K360</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A plataforma de facturação electrónica feita para o empreendedor angolano.
                100% conforme com a AGT.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
                Produto
              </h4>
              <ul className="space-y-3">
                {["Funcionalidades", "Preços", "Segurança", "Roadmap"].map((item) => (
                  <li key={item}>
                    <a
                      href={item === "Funcionalidades" ? "#funcionalidades" : item === "Preços" ? "#precos" : "#"}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
                Recursos
              </h4>
              <ul className="space-y-3">
                {["Centro de Ajuda", "Documentação API", "Blog", "Actualizações"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>suporte@facturas-k360.ao</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>+244 923 456 789</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Luanda, Angola</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Facturas K360. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Termos de Serviço
              </a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── CSS Animations ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
