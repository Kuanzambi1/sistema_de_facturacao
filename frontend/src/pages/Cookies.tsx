import LegalLayout from "@/components/LegalLayout";
import {
  Cookie,
  Shield,
  Sliders,
  Settings2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCookiePreferencesModal } from "@/components/CookieConsent";

const tableOfContents = [
  { id: "cookie-1", title: "1. O que são Cookies e Como Funcionam" },
  { id: "cookie-2", title: "2. Porque utilizamos Cookies no Facturas K360" },
  { id: "cookie-3", title: "3. Categorias de Cookies Utilizados" },
  { id: "cookie-4", title: "4. Tabela Detalhada de Cookies da Plataforma" },
  { id: "cookie-5", title: "5. Como Gerir as suas Preferências" },
  { id: "cookie-6", title: "6. Gestão através do seu Navegador (Browser)" },
  { id: "cookie-7", title: "7. Impacto da Desactivação de Cookies" },
  { id: "cookie-8", title: "8. Actualizações e Contactos" },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de Cookies"
      subtitle="Saiba como o Facturas K360 utiliza cookies e tecnologias similares para assegurar a autenticação segura, lembrar as suas preferências e optimizar a sua experiência de navegação."
      badgeText="Transparência & Gestão de Consentimento"
      lastUpdated="28 de Outubro de 2026"
      activeDoc="cookies"
      tableOfContents={tableOfContents}
    >
      {/* Quick Action Box */}
      <div className="rounded-2xl border border-[#e66a00]/30 bg-gradient-to-br from-[#e66a00]/5 via-[#e66a00]/10 to-transparent p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#e66a00] font-bold text-sm">
            <Sliders className="h-4 w-4" />
            <span>Painel de Consentimento Rápido</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Deseja rever ou alterar as permissões de cookies concedidas ao Facturas K360 neste dispositivo?
          </p>
        </div>
        <Button
          onClick={openCookiePreferencesModal}
          className="bg-gradient-to-r from-[#e66a00] to-[#d45e00] hover:brightness-110 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-[#e66a00]/20 flex-shrink-0"
        >
          <Settings2 className="h-3.5 w-3.5 mr-2" />
          Gerir Preferências Agora
        </Button>
      </div>

      {/* Section 1 */}
      <section id="cookie-1" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            01
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            1. O que são Cookies e Como Funcionam
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Os <strong>cookies</strong> são pequenos ficheiros de texto transferidos e armazenados no seu computador, tablet ou smartphone
            através do navegador de internet (browser) quando visita o nosso website e acede à plataforma de facturação.
          </p>
          <p>
            Estes ficheiros contêm fragmentos de dados que permitem ao sistema reconhecer o seu dispositivo em visitas futuras,
            manter a sua sessão iniciada de forma segura e guardar parâmetros operacionais essenciais sem necessidade de reintrodução constante.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="cookie-2" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            02
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            2. Porque utilizamos Cookies no Facturas K360
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>O Facturas K360 recorre a cookies e tecnologias locais de armazenamento com as seguintes finalidades legítimas:</p>
          <ul className="space-y-2 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Segurança e Autenticação:</strong> Garantir que apenas utilizadores credenciados acedem à emissão de facturas da respectiva empresa;</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Integridade de Sessão:</strong> Prevenir ataques informáticos do tipo CSRF (Cross-Site Request Forgery);</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Preferências Visuais:</strong> Memorizar se prefere o tema visual claro ou escuro e a disposição das tabelas;</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Monitorização de Desempenho:</strong> Medir a rapidez com que as páginas e relatórios são carregados, para correcção contínua de estrangulamentos técnicos.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3 */}
      <section id="cookie-3" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            03
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            3. Categorias de Cookies Utilizados
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Categoria 1
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Obrigatório
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground">Estritamente Necessários</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Indispensáveis para a navegação básica e emissão de facturas. Sem eles, o login e a segurança das operações tributárias não podem ser garantidos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Categoria 2
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Configurável
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground">Funcionalidade & Preferências</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Guardam as definições do utilizador (como o tema claro/escuro, empresa ativa e filtros favoritos), proporcionando uma experiência contínua.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#e66a00] uppercase tracking-wider">
                Categoria 3
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e66a00]/10 text-[#e66a00]">
                Configurável
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground">Analíticos & Desempenho</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recolhem informação anónima agregada sobre tempo de resposta das APIs fiscais e eventuais mensagens de erro, sem identificar indivíduos.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="cookie-4" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            04
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            4. Tabela Detalhada de Cookies da Plataforma
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Nome do Cookie</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Duração</th>
                  <th className="p-3.5">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                <tr className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono font-bold text-primary">app_session_id</td>
                  <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Necessário</span></td>
                  <td className="p-3.5 text-muted-foreground">Sessão / 1 ano</td>
                  <td className="p-3.5 text-muted-foreground">Autenticação cifrada da sessão de trabalho do utilizador no sistema.</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono font-bold text-primary">facturas_k360_cookie_consent</td>
                  <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Necessário</span></td>
                  <td className="p-3.5 text-muted-foreground">12 meses</td>
                  <td className="p-3.5 text-muted-foreground">Registo do consentimento e preferências de privacidade escolhidas pelo utilizador.</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono font-bold text-primary">theme</td>
                  <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">Preferências</span></td>
                  <td className="p-3.5 text-muted-foreground">Persistente</td>
                  <td className="p-3.5 text-muted-foreground">Memorização do tema de interface selecionado (modo claro ou escuro).</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono font-bold text-primary">k360_active_company</td>
                  <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">Preferências</span></td>
                  <td className="p-3.5 text-muted-foreground">Persistente</td>
                  <td className="p-3.5 text-muted-foreground">Memorização da empresa activa seleccionada em contas com acesso multi-empresa.</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono font-bold text-primary">_k360_perf</td>
                  <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-[#e66a00]/10 text-[#e66a00] text-[10px] font-bold">Analítico</span></td>
                  <td className="p-3.5 text-muted-foreground">30 dias</td>
                  <td className="p-3.5 text-muted-foreground">Telemetria de performance para medir latência da assinatura digital de facturas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section id="cookie-5" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            05
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            5. Como Gerir as suas Preferências no Sistema
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Pode alterar as suas opções de consentimento para cookies analíticos e de preferências a qualquer momento.
            Ao clicar no botão abaixo, o diálogo de definições será exibido para personalização imediata:
          </p>
          <div>
            <Button
              onClick={openCookiePreferencesModal}
              className="bg-primary text-primary-foreground hover:brightness-110 font-bold text-xs h-10 px-5 rounded-xl shadow-md"
            >
              <Sliders className="h-4 w-4 mr-2" />
              Abrir Painel de Gestão de Cookies
            </Button>
          </div>
        </div>
      </section>

      {/* Section 6 */}
      <section id="cookie-6" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            06
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            6. Gestão através do seu Navegador (Browser)
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            A maioria dos navegadores permite configurar ou bloquear cookies nas respectivas opções de segurança e privacidade:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {[
              { name: "Google Chrome", desc: "Definições > Privacidade e Segurança > Cookies de terceiros" },
              { name: "Mozilla Firefox", desc: "Opções > Privacidade e Segurança > Cookies e dados de sites" },
              { name: "Microsoft Edge", desc: "Definições > Cookies e permissões do site" },
              { name: "Apple Safari", desc: "Preferências > Privacidade > Gerir dados de websites" },
            ].map((b) => (
              <div key={b.name} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-xs font-bold text-foreground">{b.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section id="cookie-7" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            07
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            7. Impacto da Desactivação de Cookies
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Se optar por bloquear todos os cookies no seu navegador (incluindo os cookies estritamente necessários),
            algumas partes da plataforma Facturas K360 poderão não funcionar adequadamente, designadamente a autenticação e manutenção de sessão activa.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="cookie-8" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            08
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            8. Actualizações e Contactos
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Esta política é revista periodicamente para refletir eventuais alterações tecnológicas ou legais.
            Em caso de dúvidas relativas aos cookies utilizados, contacte-nos através do endereço: <strong>privacidade@facturas-k360.ao</strong>.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
