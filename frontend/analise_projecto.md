# Relatório de Análise do Projecto: Sistema de Facturação Electrónica AGT (Angola)

Este documento apresenta uma análise detalhada da arquitetura, tecnologias, regras fiscais (conformidade AGT) e estrutura de base de dados do projecto **Sistema de Facturação Electrónica**.

---

## 1. Visão Geral do Projecto
O projecto é um sistema integrado de facturação electrónica em conformidade com as regras da **AGT (Administração Geral Tributária)** de Angola. Suporta a emissão de diversos tipos de documentos comerciais e fiscais, cálculo de impostos, controle de stock, relatórios de apuramento de IVA e exportação do ficheiro fiscal **SAF-T (AO) XML**.

---

## 2. Pilha Tecnológica (Stack)

O projecto está estruturado como um monorepo/aplicação web moderna de alto desempenho:

| Camada | Tecnologia | Utilidade / Função |
| :--- | :--- | :--- |
| **Frontend** | React 19 & Vite | Interface rápida, SPA responsiva e baseada em componentes. |
| **Estilização** | Tailwind CSS v4 | Estilização utilitária moderna e responsiva. |
| **Rotas (Client)** | Wouter | Roteador simples e leve para React. |
| **Comunicação API** | tRPC (v11) & React Query | Comunicação *end-to-end type-safe* (tipagem partilhada) entre Cliente e Servidor. |
| **Backend** | Express & Node.js (TSX) | Servidor API rápido e fiável em TypeScript. |
| **Validação** | Zod | Validação rigorosa dos schemas de dados no Frontend e Backend. |
| **Base de Dados** | MySQL & Drizzle ORM | ORM TypeScript moderno com migrações automáticas (`drizzle-kit`). |
| **Testes** | Vitest | Execução rápida de testes unitários e de integração. |

---

## 3. Arquitetura de Ficheiros e Diretórios

A estrutura do projecto está organizada de forma modular:

*   [`client/`](file:///c:/www/sistema_faturacao/client): Código da aplicação React.
    *   [`src/pages/`](file:///c:/www/sistema_faturacao/client/src/pages): Páginas como Dashboard, Documentos, Clientes, Inventário, Relatórios.
    *   [`src/components/`](file:///c:/www/sistema_faturacao/client/src/components): Componentes visuais reutilizáveis (gráficos Recharts, Sidebar, Dialogs).
    *   [`src/contexts/`](file:///c:/www/sistema_faturacao/client/src/contexts): Provedor de temas e contextos partilhados.
*   [`server/`](file:///c:/www/sistema_faturacao/server): Código da API e lógica de negócio.
    *   [`server/_core/`](file:///c:/www/sistema_faturacao/server/_core): Serviços centrais (autenticação, logs, heartbeat, integração com IA e mapas).
    *   [`server/db.ts`](file:///c:/www/sistema_faturacao/server/db.ts): Métodos de consulta e mutação de dados usando Drizzle ORM.
    *   [`server/fiscal.ts`](file:///c:/www/sistema_faturacao/server/fiscal.ts): Núcleo de lógica fiscal angolana (assinaturas SHA-256, ATCUD, SAF-T).
    *   [`server/routers.ts`](file:///c:/www/sistema_faturacao/server/routers.ts): Definição de todos os endpoints tRPC.
*   [`shared/`](file:///c:/www/sistema_faturacao/shared): Tipos e constantes partilhados entre frontend e backend.
*   [`drizzle/`](file:///c:/www/sistema_faturacao/drizzle): Configurações e ficheiros de schema da base de dados.
    *   [`schema.ts`](file:///c:/www/sistema_faturacao/drizzle/schema.ts): Schemas relacionais (Tabelas e Enumerações).

---

## 4. Estrutura da Base de Dados (Drizzle Schema)

A base de dados é gerida via **Drizzle ORM** com as seguintes tabelas principais:

1.  **`users`**: Utilizadores do sistema com controlo de permissões (`role: "user" | "admin"`).
2.  **`company`**: Configuração dos dados fiscais da empresa emitente (NIF, regime de IVA: *geral, simplificado, exclusão*, assinaturas e credenciais da AGT).
3.  **`invoice_series`**: Séries de facturação configuradas por tipo de documento e ano, contendo o código de validação.
4.  **`clients`** e **`suppliers`**: Cadastro de entidades com dados comerciais e validação de NIF angolano.
5.  **`products`**: Catálogo de produtos/serviços com controle de stock, preços de custo/venda e taxas de IVA associadas.
6.  **`invoices`**: Cabeçalhos dos documentos fiscais emitidos. Guarda dados fiscais vitais como `atcud`, `hash` de assinatura, `hashControl` e totais.
7.  **`invoice_items`**: Linhas individuais de produtos/serviços associados a cada fatura.
8.  **`inventory_movements`**: Histórico de entradas, saídas e ajustes de stock associados a produtos e faturas/fornecedores.

---

## 5. Regras e Conformidade Fiscal (Regulamento AGT Angola)

A lógica fiscal, implementada em [`server/fiscal.ts`](file:///c:/www/sistema_faturacao/server/fiscal.ts), respeita os normativos de certificação de software em Angola:

### A. Geração de ATCUD
O ATCUD é gerado sob o formato `ATCUD:{CódigoValidação}-{NúmeroSequencial}`.
*   O código de validação da série é gerado baseado no código da série, ano e tipo de documento (usando hash SHA-256 abreviado).
*   O número sequencial é formatado com 8 dígitos preenchidos com zeros à esquerda (ex: `00000001`).

### B. Assinatura Digital (Hash do Documento)
Cada fatura ou nota emitida é assinada digitalmente utilizando criptografia SHA-256 baseada nos seguintes dados:
1.  Data de emissão (`issueDate`).
2.  Data do sistema (`systemDate`).
3.  Número do documento (`fullNumber`, ex: `FT A/1`).
4.  Total bruto do documento (`grossTotal` formatado a duas casas decimais).
5.  Hash do documento anterior (encadeamento de assinaturas para garantir imutabilidade).

O sistema extrai os primeiros 4 caracteres do hash resultante para efeitos de controlo visual no documento impresso (`hashControl`).

### C. Exportação SAF-T (AO) XML
O sistema possui um gerador nativo que compila o ficheiro **AuditFile (SAF-T AO)** na versão **1.01_01**, contendo:
*   Cabeçalho da Empresa Emitente (`Header`).
*   Lista detalhada de faturas e notas de crédito/débito (`SalesInvoices`).
*   Estrutura de linhas (`Line`) com taxas de IVA associadas e os respetivos códigos (NOR - Normal, ISE - Isento).

---

## 6. Cobertura de Testes

O projecto dispõe de testes robustos implementados com **Vitest**, assegurando que os módulos críticos funcionam perfeitamente:

*   **Testes Fiscais (`server/fiscal.test.ts`)**:
    *   Validação de geração correta do ATCUD.
    *   Validação das regras de cálculo de IVA e arredondamento nas linhas e nos totais da fatura.
    *   Validação da consistência dos hashes SHA-256 gerados.
    *   Confirmação das constantes de províncias e taxas da AGT.
*   **Testes de Autenticação (`server/auth.logout.test.ts`)**:
    *   Garantia de que os fluxos de terminação de sessão (logout) estão funcionais e seguros.

> [!NOTE]
> Todos os **15/15 testes unitários e de integração** estão a passar com sucesso.
