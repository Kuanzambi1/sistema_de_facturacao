import LegalLayout from "@/components/LegalLayout";
import {
  FileText,
  ShieldCheck,
  Building,
  CreditCard,
  AlertTriangle,
  Scale,
  Clock,
  CheckCircle,
  HelpCircle,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const tableOfContents = [
  { id: "seccao-1", title: "1. Identificação do Prestador e Objecto" },
  { id: "seccao-2", title: "2. Aceitação dos Termos e Condições" },
  { id: "seccao-3", title: "3. Descrição dos Serviços (SaaS)" },
  { id: "seccao-4", title: "4. Conformidade Fiscal AGT & Legislação" },
  { id: "seccao-5", title: "5. Registo, Contas e Segurança de Acesso" },
  { id: "seccao-6", title: "6. Responsabilidades e Obrigações do Utilizador" },
  { id: "seccao-7", title: "7. Planos, Preços e Facturação em Kwanzas" },
  { id: "seccao-8", title: "8. Nível de Serviço (SLA) e Disponibilidade" },
  { id: "seccao-9", title: "9. Propriedade Intelectual e Licença de Uso" },
  { id: "seccao-10", title: "10. Suspensão, Rescisão e Cancelamento" },
  { id: "seccao-11", title: "11. Limitação de Responsabilidade" },
  { id: "seccao-12", title: "12. Lei Aplicável e Foro Competente" },
  { id: "seccao-13", title: "13. Contactos Oficiais" },
];

export default function Terms() {
  return (
    <LegalLayout
      title="Termos e Condições"
      subtitle="Regras de utilização, condições contratuais e direitos relativos ao uso do software de facturação electrónica Facturas K360 em território angolano."
      badgeText="Conforme Decreto Presidencial n.º 292/18 & AGT"
      lastUpdated="28 de Outubro de 2026"
      activeDoc="termos"
      tableOfContents={tableOfContents}
    >
      {/* Intro Note */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 md:p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-primary font-bold text-sm md:text-base">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
          <span>Informação Prévia Importante</span>
        </div>
        <p className="text-xs md:text-sm text-foreground/80 leading-relaxed">
          O presente documento estabelece as condições gerais que regem a subscrição, acesso e utilização da plataforma
          <strong> Facturas K360</strong>. Ao criar uma conta ou aceder aos serviços, a sua entidade concorda expressamente em
          vincular-se a estes Termos e Condições. Caso não concorde, deverá abster-se de utilizar a nossa solução.
        </p>
      </div>

      {/* Section 1 */}
      <section id="seccao-1" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            01
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            1. Identificação do Prestador e Objecto
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A plataforma <strong>Facturas K360</strong> é uma solução tecnológica fornecida e operada como Software como Serviço (SaaS),
            com sede e representação operacional em <strong>Luanda, República de Angola</strong>.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O objectivo primordial do sistema consiste em fornecer a empresários individuais, micro, pequenas, médias e grandes empresas
            ferramentas digitais integradas para a emissão de documentos com relevância fiscal (Facturas, Facturas-Recibo, Notas de Crédito, Notas de Débito, Recibos),
            controlo de stocks, gestão de clientes, fornecedores e cumprimento dos requisitos da Administração Geral Tributária (AGT).
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="seccao-2" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            02
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            2. Aceitação dos Termos e Condições
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A aceitação destes Termos ocorre no momento da criação de conta de utilizador, marcação da caixa de seleção no formulário de registo
            ou mediante a utilização efectiva de qualquer funcionalidade do Facturas K360.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Capacidade Jurídica:</strong> O utilizador declara possuir poderes bastantes para vincular a pessoa colectiva ou singular em nome da qual actua.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Veracidade Cadastral:</strong> O utilizador assegura que o NIF (Número de Identificação Fiscal) e demais elementos identificativos indicados são autênticos e válidos em Angola.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3 */}
      <section id="seccao-3" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            03
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            3. Descrição dos Serviços (SaaS)
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Facturas K360 é disponibilizado via web e dispositivos móveis sem necessidade de instalação local de servidores, compreendendo:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {[
              "Emissão e gestão de Facturas e Facturas-Recibo em AOA",
              "Assinatura digital sequencial com cálculo de hash SHA-256",
              "Geração automática de Código Único de Documento (ATCUD)",
              "Exportação periódica e anual de ficheiro SAF-T (AO) para a AGT",
              "Gestão de artigos, categorias, stocks e alertas de reposição",
              "Base de dados de clientes e fornecedores com validação de NIF",
              "Facturação recorrente automatizada para contratos de serviços",
              "Relatórios analíticos de vendas, apuramento de IVA e mapas de retenção",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs text-foreground font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e66a00]" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="seccao-4" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            04
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            4. Conformidade Fiscal AGT & Legislação Angolana
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A arquitectura do sistema cumpre rigorosamente os normativos fiscais vigentes na República de Angola, designadamente:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Imutabilidade e Encadeamento de Documentos Fiscais
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nos termos da lei angolana, uma vez emitido um documento fiscal com numeração definitiva, este não pode ser apagado nem alterado.
                Quaisquer correcções deverão ser realizadas através da emissão de Nota de Crédito ou Nota de Débito nos termos do Código do IVA.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#004b36]/20 bg-[#004b36]/5 space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Código Único de Documento (ATCUD) e Ficheiro SAF-T (AO)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O Facturas K360 gera o código de validação da série e o número sequencial respeitando as regras técnicas da AGT.
                O ficheiro SAF-T de facturação pode ser descarregado a qualquer momento em formato XML validado para submissão no portal da AGT.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section id="seccao-5" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            05
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            5. Registo, Contas e Segurança de Acesso
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Para aceder à plataforma, o utilizador deverá criar uma conta com endereço de correio electrónico válido e palavra-passe robusta.
            A segurança e a confidencialidade das credenciais de acesso são da exclusiva responsabilidade do utilizador.
          </p>
          <p>
            Qualquer actividade realizada através da sua conta presume-se ter sido efetuada por si ou por terceiros devidamente autorizados.
            Em caso de suspeita de extravio ou utilização indevida da conta, o utilizador obriga-se a notificar de imediato o Facturas K360 através do canal de suporte.
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section id="seccao-6" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            06
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            6. Responsabilidades e Obrigações do Utilizador
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Constituem obrigações específicas do utilizador do Facturas K360:</p>
          <ul className="space-y-2.5 pt-1">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>Garantir a veracidade dos dados dos seus clientes e produtos inseridos no sistema;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>Selecionar correctamente o regime de IVA aplicável (Regime Geral, Regime Simplificado ou Regime de Exclusão);</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>Indicar o motivo legal de isenção de IVA quando aplicável, com referência ao Código do IVA ou legislação subsidiária;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>Submeter atempadamente os ficheiros SAF-T à Administração Geral Tributária dentro dos prazos legais;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>Não utilizar a plataforma para emissão de documentos simulados ou fraudulentos.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 7 */}
      <section id="seccao-7" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            07
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            7. Planos, Preços e Facturação em Kwanzas (AOA)
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Facturas K360 disponibiliza planos gratuitos e planos pagos (mensal, trimestral, semestral e anual).
            Todos os preços são fixados em <strong>Kwanzas Angolanos (AOA)</strong> e sujeitos às taxas tributárias em vigor.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <p className="text-xs font-bold text-foreground">Plano Grátis</p>
              <p className="text-lg font-extrabold text-primary mt-1">0 Kz</p>
              <p className="text-[11px] text-muted-foreground mt-1">Até 100 documentos/mês e 3 utilizadores.</p>
            </div>
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
              <p className="text-xs font-bold text-foreground">Plano Pro</p>
              <p className="text-lg font-extrabold text-primary mt-1">15.000 Kz/mês</p>
              <p className="text-[11px] text-muted-foreground mt-1">5.000 documentos/mês e 20 utilizadores.</p>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <p className="text-xs font-bold text-foreground">Plano Escritório</p>
              <p className="text-lg font-extrabold text-primary mt-1">35.000 Kz/mês</p>
              <p className="text-[11px] text-muted-foreground mt-1">100.000 documentos/mês e multi-empresa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8 */}
      <section id="seccao-8" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            08
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            8. Nível de Serviço (SLA) e Cópias de Segurança
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            O Facturas K360 compromete-se a assegurar uma taxa de disponibilidade média de <strong>99.9%</strong> do serviço,
            salvo janelas programadas de manutenção técnica previamente comunicadas.
          </p>
          <p>
            São realizadas cópias de segurança (backups) automáticas e diárias com encriptação em múltiplos centros de dados geograficamente dispersos,
            garantindo a recuperação célere em caso de contingência.
          </p>
        </div>
      </section>

      {/* Section 9 */}
      <section id="seccao-9" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            09
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            9. Propriedade Intelectual e Licença de Uso
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Todos os direitos de propriedade intelectual relativos ao código-fonte, design, logótipos, algoritmos e documentação pertencem exclusivamente
            ao Facturas K360.
          </p>
          <p>
            É concedida ao utilizador uma licença limitada, não exclusiva, intransmissível e revogável para utilizar o software nos exactos termos subscritos.
            Todos os dados comerciais e facturas inseridos pelo utilizador permanecem propriedade integral do respectivo utilizador.
          </p>
        </div>
      </section>

      {/* Section 10 */}
      <section id="seccao-10" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            10
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            10. Suspensão, Rescisão e Cancelamento
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            O utilizador pode cancelar a sua subscrição a qualquer momento através do painel de administração da sua conta.
            Mesmo após o cancelamento da subscrição paga, o utilizador mantém acesso de consulta para descarregar o histórico fiscal e ficheiros SAF-T.
          </p>
          <p>
            O Facturas K360 reserva-se o direito de suspender ou rescindir imediatamente o acesso à conta em casos de fraude comprovada,
            tentativa de violação de segurança ou utilização do software em desconformidade com a legislação angolana.
          </p>
        </div>
      </section>

      {/* Section 11 */}
      <section id="seccao-11" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            11
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            11. Limitação de Responsabilidade
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            O Facturas K360 não se responsabiliza por coimas, juros de mora ou penalizações fiscais decorrentes de declarações erróneas,
            atrasos no envio de SAF-T por parte do utilizador ou preenchimento incorrecto de taxas e isenções de IVA.
          </p>
          <p>
            Na extensão máxima permitida pela lei angolana, a responsabilidade indemnizatória máxima do Facturas K360 limita-se ao valor
            efectivamente pago pelo utilizador nos últimos doze meses de subscrição do serviço.
          </p>
        </div>
      </section>

      {/* Section 12 */}
      <section id="seccao-12" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            12
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            12. Lei Aplicável e Foro Competente
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Os presentes Termos e Condições são regidos e interpretados em conformidade com as leis da <strong>República de Angola</strong>.
          </p>
          <p>
            Para a resolução de qualquer litígio emergente da interpretação, execução ou cessação destes Termos que não possa ser dirimido por mútuo acordo,
            é competente com expressa renúncia a qualquer outro o foro da <strong>Comarca de Luanda</strong>.
          </p>
        </div>
      </section>

      {/* Section 13 */}
      <section id="seccao-13" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            13
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            13. Contactos Oficiais
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Para dúvidas jurídicas ou questões de conformidade fiscal, entre em contacto através de:</p>
          <div className="space-y-1.5 pt-1 text-foreground font-medium">
            <p>• Correio electrónico: <strong>legal@facturas-k360.ao</strong> / <strong>suporte@facturas-k360.ao</strong></p>
            <p>• Linha de apoio ao cliente: <strong>+244 923 456 789</strong></p>
            <p>• Localização: <strong>Luanda, República de Angola</strong></p>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
