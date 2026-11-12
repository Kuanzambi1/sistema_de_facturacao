import LegalLayout from "@/components/LegalLayout";
import {
  Shield,
  Lock,
  UserCheck,
  FileCheck2,
  Database,
  Eye,
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const tableOfContents = [
  { id: "priv-1", title: "1. Enquadramento e Responsável pelo Tratamento" },
  { id: "priv-2", title: "2. Princípios de Protecção de Dados (Lei n.º 22/11)" },
  { id: "priv-3", title: "3. Categorias de Dados Recolhidos" },
  { id: "priv-4", title: "4. Finalidades e Fundamento do Tratamento" },
  { id: "priv-5", title: "5. Prazos de Conservação e Retenção Fiscal" },
  { id: "priv-6", title: "6. Medidas de Segurança e Criptografia" },
  { id: "priv-7", title: "7. Comunicação e Transmissão de Dados à AGT" },
  { id: "priv-8", title: "8. Direitos do Titular dos Dados" },
  { id: "priv-9", title: "9. Encarregado de Protecção de Dados (DPO)" },
  { id: "priv-10", title: "10. Autoridade de Controlo (APD Angola)" },
  { id: "priv-11", title: "11. Alterações a Esta Política" },
];

export default function Privacy() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      subtitle="Como recolhemos, tratamos, protegemos e conservamos os seus dados pessoais e empresariais, em rigoroso cumprimento com a Lei n.º 22/11 de Protecção de Dados Pessoais de Angola."
      badgeText="Conforme Lei n.º 22/11 & Directivas APD"
      lastUpdated="28 de Outubro de 2026"
      activeDoc="privacidade"
      tableOfContents={tableOfContents}
    >
      {/* Highlight Box */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 md:p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-sm md:text-base">
          <Shield className="h-5 w-5 flex-shrink-0" />
          <span>Compromisso com a Privacidade e Segurança</span>
        </div>
        <p className="text-xs md:text-sm text-foreground/80 leading-relaxed">
          No <strong>Facturas K360</strong>, a privacidade e a segurança dos dados dos nossos utilizadores e dos seus respectivos clientes
          constituem um pilar essencial. Tratamos as informações recolhidas exclusivamente para efeitos de prestação do serviço de facturação
          e cumprimento das obrigações impostas pela Administração Geral Tributária (AGT).
        </p>
      </div>

      {/* Section 1 */}
      <section id="priv-1" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            01
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            1. Enquadramento e Responsável pelo Tratamento
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Esta Política de Privacidade aplica-se a todos os dados recolhidos através da plataforma web, aplicações associadas e serviços
            prestados sob a marca <strong>Facturas K360</strong> na República de Angola.
          </p>
          <p>
            O responsável pelo tratamento dos dados de registo e gestão da conta de utilizador é a entidade operadora do Facturas K360,
            com sede em Luanda. No que respeita aos dados dos clientes finais inseridos nas facturas emitidas, o utilizador actua como
            <strong> Responsável pelo Tratamento</strong> e o Facturas K360 actua como <strong>Subcontratante</strong>.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="priv-2" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            02
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            2. Princípios de Protecção de Dados (Lei n.º 22/11)
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>O tratamento de dados pessoais no Facturas K360 obedece aos princípios fundamentais da Lei n.º 22/11:</p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {[
              { title: "Licitude e Boa-fé", desc: "Tratamento transparente assente em base legal legítima." },
              { title: "Finalidade Determinada", desc: "Dados tratados apenas para os fins expressamente indicados." },
              { title: "Proporcionalidade", desc: "Apenas recolhemos os dados estritamente necessários." },
              { title: "Exactidão e Actualidade", desc: "Mecanismos para manter os dados actualizados e corretos." },
              { title: "Segurança e Sigilo", desc: "Cifra robusta e medidas contra acesso não autorizado." },
              { title: "Não Discriminação", desc: "Garantia de igualdade e protecção plena dos direitos." },
            ].map((p, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-xs font-bold text-foreground">{p.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="priv-3" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            03
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            3. Categorias de Dados Recolhidos
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Consoante a utilização da plataforma, recolhemos e processamos as seguintes tipologias de dados:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                A. Dados de Registo e Conta do Subscritor
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nome da empresa ou empresário, NIF (10 dígitos), morada da sede, província, endereço de email, número de telefone e credenciais encriptadas.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                B. Dados Fiscais de Documentos e Clientes
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nomes e NIFs de clientes e fornecedores, moradas, descrição de produtos e serviços, valores transacionados, taxas de IVA aplicadas e motivos de isenção.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                C. Dados Técnicos e Logs de Auditoria
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Endereço IP de emissão, registo cronológico imutável de eventos fiscais (Audit Trail), assinaturas digitais com hash SHA-256 e identificador de navegador.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="priv-4" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            04
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            4. Finalidades e Fundamento do Tratamento
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>O tratamento das suas informações apoia-se em fundamentos de licitude inequívocos:</p>
          <ul className="space-y-2 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Cumprimento de Obrigação Legal e Fiscal (AGT):</strong> A emissão com assinatura digital, geração de ATCUD e SAF-T (AO) constituem deveres legais imperativos nos termos da lei tributária angolana.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Execução do Contrato de Subscrição:</strong> Disponibilização das funcionalidades contratadas, envio de facturas, gestão da conta e suporte técnico.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Interesse Legítimo e Segurança:</strong> Prevenção de ataques informáticos, detecção de acessos fraudulentos e optimização contínua da estabilidade dos servidores.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section id="priv-5" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            05
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            5. Prazos de Conservação e Retenção Fiscal
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Os dados estritamente comerciais e fiscais contidos nas facturas e relatórios emitidos são conservados durante o prazo mínimo
            obrigatório de <strong>5 a 10 anos</strong>, em estrito cumprimento com o Código Geral Tributário e a legislação comercial angolana,
            garantindo que o utilizador disponha sempre dos registos para eventuais inspecções fiscais.
          </p>
          <p>
            Os dados de navegação técnica e logs de auditoria não fiscais são eliminados ou anonimizados periodicamente após 12 meses.
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section id="priv-6" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            06
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            6. Medidas de Segurança e Criptografia
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Adoptamos os mais rigorosos padrões da indústria para proteger a integridade e confidencialidade dos dados:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Lock className="h-4 w-4" />
                <span>Cifra em Trânsito (TLS 1.3)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Todas as comunicações entre o seu navegador e a plataforma são protegidas por protocolos criptográficos com certificados SSL de alta segurança.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <KeyRound className="h-4 w-4" />
                <span>Assinatura Digital SHA-256</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cada documento emitido contém uma chave criptográfica sequencial imutável que impede qualquer alteração posterior não autorizada.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Database className="h-4 w-4" />
                <span>Cifra em Repouso (AES-256)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                As bases de dados e as cópias de segurança são integralmente cifradas em repouso com algoritmos de alta resistência.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <UserCheck className="h-4 w-4" />
                <span>Controlo de Acesso Baseado em Perfis (RBAC)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Acesso aos dados restrito aos utilizadores devidamente autorizados pela sua própria empresa através de permissões granulares.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section id="priv-7" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            07
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            7. Comunicação e Transmissão de Dados à AGT
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            O Facturas K360 não comercializa nem cede dados pessoais ou comerciais a terceiros para fins de marketing ou publicidade.
          </p>
          <p>
            Os dados fiscais e resumos de vendas são estruturados exclusivamente para efeitos de geração do ficheiro <strong>SAF-T (AO)</strong>
            e posterior comunicação com a <strong>Administração Geral Tributária (AGT)</strong>, em estrito cumprimento da lei fiscal aplicável.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="priv-8" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            08
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            8. Direitos do Titular dos Dados
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Nos termos da Lei n.º 22/11, assistem ao titular os seguintes direitos:</p>
          <ul className="space-y-2 pt-1">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span><strong>Direito de Informação e Acesso:</strong> Obter confirmação e cópia dos dados que lhe dizem respeito;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span><strong>Direito de Rectificação:</strong> Solicitar a correcção de dados inexactos ou desactualizados do seu perfil;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span><strong>Direito ao Apagamento:</strong> Solicitar o cancelamento de dados cadastrais, ressalvada a obrigação legal de conservação fiscal de facturas emitidas;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span><strong>Direito de Oposição:</strong> Opor-se ao tratamento de dados quando não exigido por lei ou contrato.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 9 */}
      <section id="priv-9" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            09
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            9. Encarregado de Protecção de Dados (DPO)
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Para exercer qualquer um dos seus direitos ou colocar questões sobre o tratamento das suas informações,
            poderá contactar directamente o nosso Encarregado de Protecção de Dados (DPO) através de:
          </p>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-foreground font-medium text-xs space-y-1">
            <p>• Email do DPO: <strong>dpo@facturas-k360.ao</strong> ou <strong>privacidade@facturas-k360.ao</strong></p>
            <p>• Morada: Luanda, República de Angola</p>
            <p>• Prazo de resposta: Até 15 dias úteis nos termos da legislação angolana.</p>
          </div>
        </div>
      </section>

      {/* Section 10 */}
      <section id="priv-10" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            10
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            10. Autoridade de Controlo (APD Angola)
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Sem prejuízo de qualquer outro recurso administrativo ou judicial, o titular dos dados tem o direito de apresentar reclamação
            junto da autoridade nacional de controlo competente:
          </p>
          <p className="font-semibold text-foreground">
            Agência de Protecção de Dados (APD) — República de Angola
          </p>
        </div>
      </section>

      {/* Section 11 */}
      <section id="priv-11" className="space-y-4 pt-4 scroll-mt-28">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
            11
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            11. Alterações a Esta Política
          </h2>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            O Facturas K360 reserva-se o direito de actualizar a presente Política de Privacidade sempre que tal se mostre necessário
            em virtude de alterações regulamentares da APD, AGT ou evolução funcional da plataforma.
            As versões actualizadas serão publicadas nesta página com indicação da respectiva data de revisão.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
