import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home, FileQuestion, HelpCircle, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#004b36]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#e66a00]/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg shadow-2xl border border-border/80 bg-card/90 backdrop-blur-md relative z-10 rounded-3xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#004b36] via-[#e66a00] to-[#006b4e]" />
        <CardContent className="pt-10 pb-10 px-6 sm:px-10 text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004b36] to-[#006b4e] flex items-center justify-center shadow-md shadow-[#004b36]/20">
              <img
                src="/logo.png"
                alt="Facturas K360"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span className="text-base font-extrabold text-foreground tracking-tight">Facturas K360</span>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileQuestion className="h-10 w-10 text-amber-600 animate-pulse" />
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#e66a00] px-3 py-1 rounded-full bg-[#e66a00]/10 border border-[#e66a00]/20">
              Erro 404
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-3 tracking-tight">
              Página Não Encontrada
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              O endereço que introduziu não existe, foi alterado ou já não se encontra disponível no sistema.
            </p>
          </div>

          {/* ─── HIGHLY PROMINENT "VOLTAR AO INÍCIO" BUTTON ─── */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#004b36] to-[#006b4e] text-white font-bold text-sm shadow-lg shadow-[#004b36]/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Voltar ao Início</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-muted/60 hover:bg-muted text-foreground font-semibold text-sm border border-border/80 transition-colors"
            >
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>Aceder à Minha Conta</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/termos" className="hover:text-foreground hover:underline">
              Termos e Condições
            </Link>
            <span>•</span>
            <Link href="/privacidade" className="hover:text-foreground hover:underline">
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-foreground hover:underline">
              Cookies
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
