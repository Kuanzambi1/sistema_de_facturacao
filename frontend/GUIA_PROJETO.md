# Facturas K360 — Guia do Projecto

**Sistema de Facturação Electrónica Multi-Tenante para Angola**
**Versão:** 1.0.0 | **Data:** Setembro 2026

---

## 1. Visão Geral

O **Facturas K360** é um sistema SaaS (Software as a Service) de facturação electrónica, projecto multi-tenante, desenvolvido para empresas angolanas. O sistema é totalmente conforme com a legislação fiscal da AGT (Administração Geral Tributária), incluindo:

- **ATCUD** — Código Único de Documento (automático)
- **Assinatura Digital** — SHA-256 para integridade dos documentos
- **SAF-T AO** — Exportação para o ficheiro-standard da AGT
- **Validação de NIF** — Validação automática de contribuintes
- **Envio à AGT** — Submissão electrónica de documentos

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React + TypeScript | 19.2 |
| **Build** | Vite | 7.1 |
| **Estilos** | Tailwind CSS | 4.1 |
| **UI Components** | Radix UI + shadcn/ui | 28+ componentes |
| **Gráficos** | Recharts | 2.15 |
| **Animações** | Framer Motion | 12.23 |
| **Router** | Wouter | 3.3 |
| **Formulários** | React Hook Form + Zod | 7.64 / 4.1 |
| **API** | tRPC v11 | 11.6 |
| **State** | TanStack React Query | 5.90 |
| **Backend** | Express.js | 4.21 |
| **ORM** | Drizzle ORM | 0.44 |
| **Base de Dados** | MySQL | 8.x |
| **PDF** | jsPDF | 4.2 |
| **Email** | Nodemailer (Brevo) | 9.0 |
| **Auth** | JWT (jose) | 6.1 |
| **Armazenamento** | AWS S3 / Forge | Opcional |
| **Testes** | Vitest | 2.1 |

---

## 3. Arquitectura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Landing   │  │ Login    │  │ Portal do Cliente │  │
│  │ Page      │  │ Page     │  │ (público)         │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │              App Autenticada                  │   │
│  │  Dashboard │ Docs │ Clientes │ Produtos       │   │
│  │  Inventário│ Relatórios │ Configurações      │   │
│  │  Recorrentes│ AGT │ Plano                    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                          │
                    tRPC (HTTP)
                          │
┌─────────────────────────────────────────────────────┐
│                  SERVIDOR (Express)                   │
│  ┌──────────────────────────────────────────────┐   │
│  │             18 Routers tRPC                   │   │
│  │  auth │ tenant │ company │ clients            │   │
│  │  suppliers │ products │ series │ invoices      │   │
│  │  payments │ recurring │ agt │ inventory        │   │
│  │  users │ audit │ reports │ portal │ fiscal     │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │           Camada de Base de Dados             │   │
│  │         Drizzle ORM → MySQL                   │   │
│  │         15 tabelas │ Faturação                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 4. Módulos Funcionais

### 4.1 Autenticação & Utilizadores
- Login/logout com JWT (cookie httpOnly)
- Registo de novas empresas (auto-cria tenant + company)
- Papéis: **admin** e **utilizador**
- Gestão de utilizadores (CRUD, reset password, roles)
- Troca de password

### 4.2 Dashboard
- 4 KPIs: Total Facturado, Valores Pendentes, Facturado no Mês, Clientes Activos
- Gráfico de vendas mensais (barras)
- Top 5 clientes por volume
- Últimos documentos emitidos
- Alertas de stock baixo
- Conformidade AGT (status checks)
- Secção de destaque com boas-vindas e funcionalidades

### 4.3 Documentos Fiscais
- **Factura** / **Factura-Recibo** / **Proforma**
- **Nota de Crédito** / **Nota de Débito**
- **Guia de Remessa** / **Guia de Transporte**
- **Recibo**
- Emissão com: ATCUD automático, IVA, retenção na fonte (IRT 6.5%), desconto
- Cálculo automático: base tributável, IVA, total
- Numeração automática por série (ex: FT2026/1)
- Estado: Rascunho → Emitida → Paga → Parcialmente Paga → Anulada
- Pagamentos parciais e totais
- Conversão de Proforma → Factura
- Eliminação com validação (requer Nota de Crédito para docs pagos)
- Envio à AGT e consulta de estado
- Exportação SAF-T AO
- Declaração de IVA
- PDF e HTML para impressão (com logo da empresa)

### 4.4 Clientes & Fornecedores
- CRUD completo com pesquisa
- Validação de NIF
- Portal do cliente (link público com token)
- Conta corrente (histórico de documentos)
- Notas de vencimento por email

### 4.5 Produtos & Serviços
- Catálogo unificado (produtos e serviços)
- Código manual (utilizador define)
- Controlo de stock (com alertas de stock mínimo)
- Taxas de IVA configuráveis (14%, 10%, 6%, isento)
- Preço de venda e compra
- Categorias
- Cálculo automático de retenção na fonte para serviços

### 4.6 Inventário
- Movimentos: Entrada, Saída, Devolução, Ajuste, Transferência
- Histórico de movimentos por produto
- Alertas de stock abaixo do mínimo

### 4.7 Séries de Facturação
- Gestão por tipo de documento e ano
- Formato: `{Código}{Ano}/{Núm}` — ex: FT2026/1, NC2026/1
- Criação automática ao emitir documento

### 4.8 Relatórios
- **Resumo Financeiro**: Total Facturado, Base Tributável, IVA Liquidado, Total Recebível
- **Mapa de IVA**: Detalhe por mês com IVA a reter
- **Relatório de Recebíveis**: Estados de pagamento
- **Extracto de Cliente/Fornecedor**: Conta corrente com pesquisa

### 4.9 Facturação Recorrente
- Regras automáticas por cliente/produto
- Frequência: Diária, Semanal, Quinzenal, Mensal, Trimestral, Semestral, Anual
- Execução manual ou automática (agendada)

### 4.10 Portal do Cliente (público)
- Link público com token (`/p/{token}`)
- Visualização de documentos do cliente
- Estado de pagamento

### 4.11 Integração AGT
- Submissão de documentos à AGT
- Consulta de estado de submissão
- Registo de séries
- Exportação SAF-T AO (XML)
- Declaração de IVA

### 4.12 Configurações
- Dados da empresa (NIF, morada, IBANs, logo)
- Upload de logo (base64, aparece no PDF)
- Gestão de séries de facturação
- Gestão de utilizadores

### 4.13 Sistema SaaS (Planos)
- 3 planos: **Grátis**, **Pro**, **Escritório**
- 4 ciclos de facturação: Mensal, Trimestral, Semestral, Anual
- Limites por plano (documentos/mês, utilizadores)
- Feature gating (facturação recorrente = Pro+)
- Trial de 30 dias

---

## 5. Base de Dados (15 Tabelas)

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Contas SaaS (plano, ciclo, estado) |
| `users` | Utilizadores do sistema (papéis) |
| `company` | Dados da empresa emissora |
| `invoice_series` | Séries de documentos por tipo/ano |
| `clients` | Clientes |
| `suppliers` | Fornecedores |
| `product_categories` | Categorias de produtos |
| `products` | Catálogo de produtos/serviços |
| `invoices` | Cabeçalhos de documentos fiscais |
| `invoice_items` | Linhas de documentos |
| `inventory_movements` | Movimentos de stock |
| `payments` | Pagamentos de documentos |
| `recurring_rules` | Regras de facturação recorrente |
| `audit_logs` | Registo de auditoria |
| `agt_submissions` | Histórico de submissões à AGT |

---

## 6. Planos & Preços (AOA)

| Plano | Docs/Mês | Utilizadores | Mensal | Trimestral | Semestral | Anual |
|-------|----------|-------------|--------|------------|-----------|-------|
| **Grátis** | 100 | 3 | 0 | 0 | 0 | 0 |
| **Pro** | 5.000 | 20 | 15.000 | 38.000 | 72.000 | 130.000 |
| **Escritório** | 100.000 | 100 | 35.000 | 90.000 | 170.000 | 310.000 |

**Funcionalidades por plano:**
- **Grátis**: Facturação AGT completa, portal do cliente
- **Pro**: + Facturação recorrente, pagamentos & dunning
- **Escritório**: + Suporte prioritário, multi-empresa

---

## 7. Páginas do Sistema (15 rotas)

| Rota | Página | Acesso |
|------|--------|--------|
| `/` | Landing Page (marketing) | Público |
| `/login` | Login / Registo | Público |
| `/p/:token` | Portal do Cliente | Público (token) |
| `/dashboard` | Dashboard | Autenticado |
| `/clientes` | Gestão de Clientes | Autenticado |
| `/fornecedores` | Gestão de Fornecedores | Autenticado |
| `/produtos` | Produtos & Serviços | Autenticado |
| `/documentos` | Lista de Documentos | Autenticado |
| `/documentos/novo` | Novo Documento | Autenticado |
| `/documentos/:id` | Detalhe do Documento | Autenticado |
| `/inventario` | Inventário | Autenticado |
| `/relatorios` | Relatórios | Autenticado |
| `/recorrentes` | Facturação Recorrente | Autenticado |
| `/agt` | Integração AGT | Autenticado |
| `/plano` | Subscrição & Planos | Autenticado |
| `/configuracoes` | Configurações | Autenticado |

---

## 8. Routers da API (18 módulos)

| Router | Funcionalidade |
|--------|---------------|
| `auth` | Login, registo, logout, perfil |
| `tenant` | Dados do tenant, uso, actualizar plano |
| `company` | Empresa emissora, upload de logo |
| `clients` | CRUD de clientes, portal, conta corrente |
| `suppliers` | CRUD de fornecedores |
| `products` | CRUD de produtos/serviços, categorias |
| `series` | Séries de documentos |
| `invoices` | CRUD de documentos, submissão AGT, SAF-T |
| `payments` | Registo de pagamentos |
| `recurring` | Regras de facturação recorrente |
| `agt` | Submissões AGT, registo de séries |
| `inventory` | Movimentos de stock, alertas |
| `users` | Gestão de utilizadores (admin) |
| `audit` | Logs de auditoria (admin) |
| `reports` | KPIs, vendas, relatórios financeiros |
| `portal` | Portal público do cliente |
| `fiscal` | Constantes fiscais (IVAs, províncias) |
| `system` | Health check, notificações |

---

## 9. Conformidade Fiscal AGT

| Requisito | Estado |
|-----------|--------|
| ATCUD em todos os documentos | Implementado |
| Assinatura digital (SHA-256) | Implementado |
| Validação de NIF | Implementado |
| Exportação SAF-T AO | Implementado |
| Declaração de IVA | Implementado |
| Submissão à AGT | Implementado |
| Consulta de estado AGT | Implementado |
| Registo de séries | Implementado |
| Numeração sequencial por série | Implementado |
| Retenção na fonte (IRT 6.5%) | Implementado |
| IVA 14% / 10% / 6% / Isento | Implementado |
| QR Code | Em desenvolvimento |

---

## 10. Segurança

- **Autenticação JWT** com cookie httpOnly (jose)
- **Roles**: admin e utilizador com controlo de acesso por procedimento
- **Proteção multi-tenante**: cada tenant só acede aos seus dados
- **Audit logs**: todas as acções críticas são registadas
- **Validação Zod**: todos os inputs são validados no servidor
- **HTTPS** (produção) + **SMTP TLS** para emails
- **Senhas** com mínimo 8 caracteres, maiúscula e número obrigatórios

---

## 11. Estrutura de Ficheiros

```
sistema_faturacao/
├── client/src/
│   ├── pages/           # 15 páginas React
│   ├── components/      # Componentes UI (shadcn/ui)
│   ├── lib/             # Utils, trpc client, hooks
│   ├── index.css        # Estilos globais (Tailwind)
│   └── App.tsx          # Rotas
├── server/
│   ├── routers.ts       # 18 routers tRPC
│   ├── db/              # Camada de acesso a dados
│   ├── pdf.ts           # Geração de PDF
│   └── _core/           # Env, middleware, auth
├── drizzle/
│   ├── schema.ts        # Schema da BD (15 tabelas)
│   └── migrations/      # Migrations SQL
├── shared/
│   └── const.ts         # Planos, constantes partilhadas
└── package.json
```

---

## 12. Testes

- **Framework**: Vitest
- **Testes**: 15/15 a passar
- **Cobertura**: Routers tRPC, lógica fiscal, cálculos de IVA

---

## 13. Deploy & Ambiente

| Item | Configuração |
|------|-------------|
| Base de dados | MySQL 8.x (`faturacao`) |
| ORM | Drizzle com `drizzle-kit` |
| Node.js | v20+ |
| Package manager | pnpm 10.4 |
| SMTP | Brevo (smtp-relay.brevo.com:587) |
| Storage | Local (base64) / S3 (opcional) |

---

## 14. Funcionalidades em Desenvolvimento / Roadmap

| Prioridade | Funcionalidade |
|-----------|---------------|
| Alta | QR Code em documentos |
| Alta | Integração com portal EMIS |
| Média | Notificações push |
| Média | Dashboard de contabilidade |
| Baixa | App mobile (React Native) |
| Baixa | Multi-idioma (PT/EN) |

---

## 15. Contactos & Suporte

- **Desenvolvimento**: equipa interna
- **Email de suporte**: titokuanzambi@gmail.com
- **Repositório**: local (Git)

---

*Documento gerado automaticamente — Facturas K360 v1.0.0*
