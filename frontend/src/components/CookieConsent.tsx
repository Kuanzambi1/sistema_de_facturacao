import { useState, useEffect } from "react";
import { Cookie, Shield, Check, Settings2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";

const COOKIE_CONSENT_KEY = "facturas_k360_cookie_consent";
const COOKIE_CONSENT_VERSION = "1.0.0";

export interface CookiePreferences {
  necessary: boolean; // Always true
  functional: boolean;
  analytics: boolean;
  version: string;
  timestamp: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  version: COOKIE_CONSENT_VERSION,
  timestamp: "",
};

export function openCookiePreferencesModal() {
  window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if consent was already given
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        if (parsed.version === COOKIE_CONSENT_VERSION) {
          setPreferences(parsed);
          setShowBanner(false);
        } else {
          // Version updated, ask again
          setShowBanner(true);
        }
      } else {
        // Small delay to make entry smooth after page load
        const timer = setTimeout(() => setShowBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  // Listen to external triggers (e.g. from footer links or cookies policy page)
  useEffect(() => {
    const handleOpen = () => {
      setShowPreferences(true);
    };
    window.addEventListener("open-cookie-preferences", handleOpen);
    return () => window.removeEventListener("open-cookie-preferences", handleOpen);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const toSave: CookiePreferences = {
      ...prefs,
      necessary: true,
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Erro ao guardar consentimento de cookies", e);
    }
    setPreferences(toSave);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      functional: true,
      analytics: true,
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAcceptEssentialOnly = () => {
    savePreferences({
      necessary: true,
      functional: false,
      analytics: false,
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  return (
    <>
      {/* ─── Floating Cookie Banner ────────────────────────────────────── */}
      {showBanner && (
        <aside
          role="region"
          aria-label="Gestão de Cookies e Privacidade"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 animate-fade-in-up"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-5 md:p-6 shadow-2xl shadow-black/20 ring-1 ring-black/5 dark:ring-white/10">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#004b36] via-[#e66a00] to-[#006b4e]" />

            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-11 h-11 rounded-xl bg-gradient-to-br from-[#004b36]/10 to-[#004b36]/20 items-center justify-center flex-shrink-0 text-[#004b36] border border-[#004b36]/20">
                <Cookie className="h-6 w-6 text-[#004b36]" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Cookie className="sm:hidden h-5 w-5 text-[#004b36] flex-shrink-0" />
                    <h3 className="text-sm md:text-base font-bold text-foreground tracking-tight">
                      Gestão de Cookies & Privacidade
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#004b36]/10 text-[#004b36] border border-[#004b36]/20">
                    Lei n.º 22/11 (APD)
                  </span>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cookies essenciais para garantir o funcionamento seguro do sistema e a conformidade fiscal com a AGT.
                  Com o seu consentimento, também utilizamos cookies analíticos e de preferências para melhorar a sua experiência.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <span>Consulte a nossa</span>
                  <Link
                    href="/cookies"
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Política de Cookies
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <span>e</span>
                  <Link
                    href="/privacidade"
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Política de Privacidade
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="h-9 px-4 bg-gradient-to-r from-[#004b36] to-[#006b4e] hover:brightness-110 text-white font-semibold text-xs shadow-md shadow-[#004b36]/20"
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Aceitar Todos
                  </Button>
                  <Button
                    onClick={handleAcceptEssentialOnly}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3.5 text-xs font-medium hover:bg-muted"
                  >
                    Apenas Essenciais
                  </Button>
                  <Button
                    onClick={() => setShowPreferences(true)}
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-1" />
                    Personalizar
                  </Button>
                </div>
              </div>

              <button
                onClick={() => setShowBanner(false)}
                className="text-muted-foreground/60 hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
                title="Fechar este aviso temporariamente"
                aria-label="Fechar aviso de cookies"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ─── Preferences Dialog ────────────────────────────────────────── */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Cookie className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-bold">
                Preferências de Cookies
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Configure as categorias de cookies que autoriza o Facturas K360 a utilizar. Pode alterar ou revogar as suas preferências a qualquer momento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Category 1: Necessary */}
            <div className="rounded-xl border border-border/80 p-4 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-bold text-foreground">
                    Cookies Estritamente Necessários
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Sempre Activo
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fundamentais para o funcionamento da plataforma, garantindo a sua sessão de utilizador, segurança de transmissão de dados, protecção contra ataques CSRF e cumprimento das directrizes da AGT. Não podem ser desactivados.
              </p>
            </div>

            {/* Category 2: Functional */}
            <div className="rounded-xl border border-border/80 p-4 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    Cookies de Funcionalidade & Preferências
                  </span>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, functional: checked }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permitem que a plataforma memorize as suas escolhas (como o tema de cores claro/escuro, a empresa seleccionada por padrão e preferências de layout das tabelas de facturação).
              </p>
            </div>

            {/* Category 3: Analytics */}
            <div className="rounded-xl border border-border/80 p-4 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cookie className="h-4 w-4 text-[#e66a00]" />
                  <span className="text-sm font-bold text-foreground">
                    Cookies Analíticos & Desempenho
                  </span>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, analytics: checked }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ajudam-nos a compreender como os utilizadores interagem com o sistema, detectando erros técnicos e medindo tempos de carregamento para otimização contínua da velocidade de emissão de facturas. Todos os dados são agregados e anónimos.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <div className="flex items-center justify-between w-full">
              <Link
                href="/cookies"
                onClick={() => setShowPreferences(false)}
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Ler Política Completa
                <ExternalLink className="h-3 w-3" />
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="text-xs h-9"
                >
                  Aceitar Todos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveCustom}
                  className="text-xs h-9 bg-primary text-primary-foreground hover:brightness-110"
                >
                  Guardar Preferências
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
