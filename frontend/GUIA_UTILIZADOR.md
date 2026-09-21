# Facturas K360 — Guia do Utilizador

**Manual de Utilização do Sistema de Facturação Electrónica**

---

## Índice

1. [Primeiros Passos](#1-primeiros-passos)
2. [Dashboard](#2-dashboard)
3. [Gestão de Clientes](#3-gestão-de-clientes)
4. [Produtos & Serviços](#4-produtos--serviços)
5. [Emissão de Documentos](#5-emissão-de-documentos)
6. [Gestão de Pagamentos](#6-gestão-de-pagamentos)
7. [Inventário](#7-inventário)
8. [Relatórios](#8-relatórios)
9. [Facturação Recorrente](#9-facturação-recorrente)
10. [Portal do Cliente](#10-portal-do-cliente)
11. [Integração com a AGT](#11-integração-com-a-agt)
12. [Configurações](#12-configurações)
13. [Planos e Preços](#13-planos-e-preços)
14. [Perguntas Frequentes](#14-perguntas-frequentes)

---

## 1. Primeiros Passos

### Como aceder ao sistema

1. Abra o navegador (Google Chrome, Firefox, Edge)
2. Digite o endereço do sistema
3. Clique em **Entrar** no canto superior direito
4. Introduza o seu email e palavra-passe
5. Clique em **Entrar no Sistema**

### Primeira utilização

Ao entrar pela primeira vez, o sistema cria automaticamente uma conta de teste gratuita com 30 dias. Pode começar imediatamente a usar todas as funcionalidades.

### O que fazer primeiro

1. **Complete os dados da empresa** — Vá a Configurações > Empresa
2. **Adicione os seus produtos/serviços** — Vá a Produtos & Serviços
3. **Registe os seus clientes** — Vá a Clientes
4. **Emita o seu primeiro documento** — Clique em "Novo Documento"

---

## 2. Dashboard

O Dashboard é a primeira página que vê ao entrar. Mostra um resumo do seu negócio.

### O que pode ver

| Secção | O que mostra |
|--------|-------------|
| **Total Facturado** | Valor total de todos os documentos emitidos |
| **Valores Pendentes** | Dinheiro que ainda lhe devem |
| **Facturado no Mês** | quanto facturou desde o início do mês actual |
| **Clientes Activos** | Número total de clientes registados |
| **Gráfico de Vendas** | Evolução mês a mês |
| **Top Clientes** | Os 5 clientes que mais compram |
| **Últimos Documentos** | Documentos emitidos recentemente |
| **Alertas de Stock** | Produtos com stock abaixo do mínimo |
| **Conformidade AGT** | Estado da sua ligação à AGT |

---

## 3. Gestão de Clientes

### Adicionar um cliente

1. Clique em **Clientes** no menu lateral
2. Clique no botão **Novo Cliente**
3. Preencha os dados:
   - **Nome** (obrigatório) — Nome ou razão social
   - **NIF** — Número de Identificação Fiscal
   - **Telefone** — Número de telefone
   - **Email** — Endereço de email
   - **Morada** — Endereço completo
4. Clique em **Guardar**

### Pesquisar um cliente

Na barra de pesquisa no topo da lista, digite o nome, NIF ou email do cliente.

### Editar um cliente

1. Encontre o cliente na lista
2. Clique no ícone **Editar** (lápis)
3. Altere os dados necessários
4. Clique em **Guardar**

### Portal do Cliente

Cada cliente tem um link público para aceder aos seus documentos:

1. Na lista de clientes, clique no ícone **Portal** (olho)
2. Copie o link gerado
3. Envie o link ao cliente por email ou WhatsApp

O cliente pode ver todos os seus documentos e estado de pagamento sem precisar de login.

---

## 4. Produtos & Serviços

### Adicionar um produto

1. Clique em **Produtos & Serviços** no menu lateral
2. Clique em **Novo Item**
3. Preencha os dados:
   - **Código** (obrigatório) — Código único do produto (ex: PRD001)
   - **Tipo** — Produto ou Serviço
   - **Designação** (obrigatório) — Nome do produto
   - **Preço de Venda** (obrigatório) — Preço em Kz
   - **Taxa de IVA** — 14%, 10%, 6% ou Isento
4. Clique em **Criar Item**

### Diferença entre Produto e Serviço

| Característica | Produto | Serviço |
|---------------|---------|---------|
| Controlo de Stock | Sim | Não |
| Unidade de Medida | Sim (UN, KG, L...) | Não |
| IVA | Configurável | Sempre isento (retenção na fonte) |

### Productos isentos de IVA

1. Ao criar/editar o produto, active a opção **Isento de IVA**
2. Indique o motivo da isenção (ex: "Art. 12.º do CIVA")

---

## 5. Emissão de Documentos

### Tipos de documentos

| Tipo | Sigla | Quando usar |
|------|-------|------------|
| **Factura** | FT | Venda de bens ou serviços |
| **Factura-Recibo** | FR | Venda com pagamento imediato |
| **Nota de Crédito** | NC | Anular ou descontar um documento |
| **Nota de Débito** | ND | Cobrar valores em falta |
| **Guia de Remessa** | GR | Transporte de mercadorias |
| **Guia de Transporte** | GT | Documento de transporte |
| **Orçamento** | OR | Cotação/previsão de venda |
| **Recibo** | RC | Comprovativo de pagamento |

### Criar uma factura

1. Clique em **Documentos** > **Novo Documento**
2. Selecione o tipo de documento (ex: Factura)
3. Selecione a **Série** (ex: FT2026)
4. Preencha os dados do cliente:
   - Selecione um cliente existente OU
   - Preencha manualmente (nome, NIF, morada)
5. Adicione os itens:
   - Selecione um produto na barra de pesquisa
   - Ajuste a quantidade e preço se necessário
   - Clique em **Adicionar**
6. Revise os totais (subtotal, IVA, total)
7. Opcionalmente adicione observações
8. Clique em **Emitir Documento**

### Estados de um documento

```
Rascunho → Emitida → Paga
                    → Parcialmente Paga
                    → Vencida (data de vencimento passou)
                    → Anulada
```

- **Rascunho** — Documento criado mas não emitido
- **Emitida** — Documento emitido e comunicado à AGT
- **Paga** — Totalmente pago
- **Parcialmente Paga** — Pago parcialmente
- **Vencida** — Prazo de pagamento expirado
- **Anulada** — Documento cancelado (requer Nota de Crédito)

### Converter Orçamento em Factura

1. Abra o Orçamento
2. Clique em **Converter em Factura**
3. Confirme a conversão
4. O sistema cria uma nova Factura com os mesmos dados

---

## 6. Gestão de Pagamentos

### Registar um pagamento (pago total)

1. Na lista de documentos, clique no ícone **verde** (dinheiro) ao lado do documento
2. O pagamento é registado automaticamente com o valor total
3. O estado muda para **Paga**

### Registar um pagamento parcial

1. Abra o documento
2. Clique em **Registar Pagamento**
3. Preencha:
   - **Montante** — Valor pago
   - **Data** — Data do pagamento
   - **Método** — Numerário, Transferência, Cheque, Cartão
   - **Referência** — Número da transferência/cheque (opcional)
4. Clique em **Guardar pagamento**

### Métodos de pagamento

| Método | Descrição |
|--------|-----------|
| Numerário | Dinheiro em espécie |
| Transferência | Transferência bancária |
| Cheque | Pagamento por cheque |
| Cartão | Pagamento por cartão de crédito/débito |
| Outro | Outro método |

### Histórico de pagamentos

No detalhe de cada documento, pode ver todos os pagamentos registados, com data, método, referência e valor.

---

## 7. Inventário

### O que é o inventário

O inventário controla o stock dos seus produtos. Cada vez que emite uma factura com um produto, o stock é automaticamente reduzido.

### Movimentos de stock

| Tipo | Quando ocorre |
|------|--------------|
| **Entrada** | Compra de mercadoria |
| **Saída** | Venda (factura emitida) |
| **Devolução** | Cliente devolve produto |
| **Ajuste** | Correcção manual de stock |
| **Transferência** | Entre armazéns/lojas |

### Adicionar stock

1. Vá a **Inventário**
2. Clique em **Nova Entrada**
3. Selecione o produto
4. Indique a quantidade
5. Confirme

### Alertas de stock

Quando o stock de um produto atinge o mínimo configurado, o sistema mostra um alerta no Dashboard e no Inventário.

### Configurar stock mínimo

Ao criar/editar um produto:
1. Active a opção **Controlo de Stock**
2. Defina o **Stock Mínimo** — quantidade mínima antes de alertar

---

## 8. Relatórios

### Resumo Financeiro

Mostra os totais do período seleccionado:
- Total Facturado
- Base Tributável
- IVA Liquidado
- Total Recebível

### Mapa de IVA

Detalhe do IVA por mês, incluindo:
- Base de incidência
- IVA cobrado
- IVA a reter (serviços)

### Relatório de Recebíveis

Lista de documentos por estado de pagamento:
- Pagos
- Pendentes
- Vencidos

### Extracto de Cliente

Histórico completo de documentos e pagamentos de um cliente específico:
1. Selecione o cliente
2. O sistema mostra todos os documentos e pagamentos
3. Pode filtrar por período

---

## 9. Facturação Recorrente

A facturação recorrente cria documentos automaticamente com base em regras que definir.

### Criar uma regra

1. Vá a **Facturação Recorrente**
2. Clique em **Nova Regra**
3. Preencha:
   - **Nome** — Descrição da regra
   - **Cliente** — Cliente associado
   - **Tipo de documento** — Factura, Factura-Recibo, etc.
   - **Frequência** — Semanal, Mensal, Trimestral, etc.
   - **Data de início** — Quando começar
   - **Data de fim** — Quando parar (opcional)
   - **Itens** — Produtos/serviços a facturar
4. Clique em **Criar Regra**

### Executar regras manualmente

1. Na lista de regras, clique em **Executar Agora**
2. O sistema cria os documentos pendentes

### Nota

A facturação recorrente está disponível nos planos **Pro** e **Escritório**.

---

## 10. Portal do Cliente

O Portal do Cliente é uma página pública onde os seus clientes podem ver os seus documentos.

### Como funciona

1. Cada cliente tem um link único (token)
2. O cliente acede ao link no browser
3. Vê todos os seus documentos e estado de pagamento
4. Não precisa de login nem password

### Enviar o link ao cliente

1. Vá a **Clientes**
2. Encontre o cliente
3. Clique no ícone **Portal**
4. Copie o link
5. Envie por email, WhatsApp, SMS, etc.

---

## 11. Integração com a AGT

### O que é a AGT

A Administração Geral Tributária (AGT) é o organismo fiscal de Angola. Todos os documentos fiscais devem ser comunicados à AGT.

### Submissão de documentos

1. Vá a **AGT**
2. Clique em **Submeter à AGT**
3. O sistema envia o documento e obtém o **ATCUD** (Código Único de Documento)
4. O ATCUD aparece no documento e no PDF

### Consulta de estado

1. Vá a **AGT**
2. Clique em **Consultar Estado**
3. Veja se o documento foi aceite ou tem erros

### Exportação SAF-T AO

O ficheiro SAF-T AO é um relatório XML obrigatório para a AGT:

1. Vá a **Documentos**
2. Clique em **SAF-T (AO)**
3. Selecione o período
4. O ficheiro é descarregado automaticamente

### Declaração de IVA

1. Vá a **Relatórios** > **Mapa de IVA**
2. Revise os valores
3. Clique em **Exportar Declaração**
4. Envie o ficheiro à AGT

---

## 12. Configurações

### Dados da Empresa

1. Vá a **Configurações** > **Empresa**
2. Preencha:
   - Nome da empresa
   - NIF
   - Morada, Cidade, Província
   - Telefone e Email
   - Dados bancários (IBAN)
   - Número de validação do software AGT
3. Faça upload do logótipo (aparece nos documentos e PDF)
4. Clique em **Guardar**

### Séries de Facturação

As séries são a numeração dos documentos por tipo e ano:

1. Vá a **Configurações** > **Séries**
2. Clique em **Nova Série**
3. Selecione o tipo de documento (FT, FR, NC, etc.)
4. O sistema cria automaticamente a série para o ano actual

### Utilizadores

1. Vá a **Configurações** > **Utilizadores**
2. Adicione novos utilizadores com email e password
3. Defina o papel: **Admin** ou **Utilizador**

| Papel | O que pode fazer |
|-------|-----------------|
| **Admin** | Tudo (configurações, utilizadores, eliminar docs) |
| **Utilizador** | Emissão e gestão de documentos |

### Trocar Password

1. Vá a **Configurações** > **Password**
2. Introduza a password actual
3. Introduza a nova password
4. Confirme e clique em **Guardar**

---

## 13. Planos e Preços

### Planos disponíveis

| Plano | Documentos/Mês | Utilizadores | Preço Mensal |
|-------|---------------|-------------|-------------|
| **Grátis** | 100 | 3 | 0 Kz |
| **Pro** | 5.000 | 20 | 15.000 Kz |
| **Escritório** | 100.000 | 100 | 35.000 Kz |

### Ciclos de facturação

Pode pagar mensal, trimestral, semestral ou anual. Quanto mais tempo escolher, maior a poupança:

| Ciclo | Poupança |
|-------|---------|
| Mensal | Preço base |
| Trimestral | ~15% poupança |
| Semestral | ~20% poupança |
| Anual | ~27% poupança |

### Alterar de plano

1. Vá a **Plano**
2. Selecione o ciclo de facturação
3. Escolha o novo plano
4. Confirme

### O que inclui cada plano

**Grátis:**
- 100 documentos/mês
- 3 utilizadores
- Facturação AGT completa
- Portal do cliente

**Pro:**
- 5.000 documentos/mês
- 20 utilizadores
- Tudo do plano Grátis
- Facturação recorrente
- Pagamentos & dunning

**Escritório:**
- 100.000 documentos/mês
- 100 utilizadores
- Tudo do plano Pro
- Suporte prioritário
- Multi-empresa

---

## 14. Perguntas Frequentes

### Como eliminar um documento?

- Apenas utilizadores **Admin** podem eliminar documentos
- Documentos **pagos** só podem ser eliminados se tiverem uma Nota de Crédito
- Clique no ícone **Eliminar** (lixeira) na lista ou no detalhe

### Como anular um documento?

1. Abra o documento
2. Clique em **Anular**
3. Confirme a acção
4. Se o documento estiver pago, será necessário emitir uma Nota de Crédito primeiro

### O ATCUD é automático?

Sim. O sistema gera automaticamente o ATCUD ao emitir o documento, depois de submetido à AGT.

### O que acontece se o stock ficar zero?

O sistema alerta no Dashboard e no Inventário. Pode continuar a vender (o stock fica negativo) ou configurar o sistema para bloquear vendas sem stock.

### Como ver o que devo a um cliente?

1. Vá a **Relatórios**
2. Clique em **Extracto de Cliente**
3. Selecione o cliente
4. Veja todos os documentos e pagamentos

### Posso usar o sistema no telemóvel?

Sim. O sistema é 100% responsivo e funciona em qualquer dispositivo com browser.

### Como contactsar o suporte?

- Email: titokuanzambi@gmail.com
- Telefone: (verifique nos dados da empresa)

---

*Facturas K360 — Sistema de Facturação Electrónica para Angola*
*Guia do Utilizador v1.0 — Setembro 2026*
