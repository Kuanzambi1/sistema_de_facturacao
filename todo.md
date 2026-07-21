# Sistema de Facturação Electrónica AGT - TODO

## Base de Dados e Schema
- [x] Schema: tabela companies (empresa emitente)
- [x] Schema: tabela clients (clientes)
- [x] Schema: tabela suppliers (fornecedores)
- [x] Schema: tabela products (produtos/serviços)
- [x] Schema: tabela invoice_series (séries de facturação)
- [x] Schema: tabela invoices (documentos fiscais)
- [x] Schema: tabela invoice_items (linhas de documentos)
- [x] Schema: tabela inventory (inventário/stock)
- [x] Schema: tabela inventory_movements (movimentos de stock)
- [x] Aplicar migrações SQL

## Backend (tRPC Routers)
- [x] Router: company (configuração da empresa)
- [x] Router: clients (CRUD clientes)
- [x] Router: suppliers (CRUD fornecedores)
- [x] Router: products (CRUD produtos/serviços)
- [x] Router: invoices (emissão, listagem, anulação)
- [x] Router: inventory (gestão de stock)
- [x] Router: reports (relatórios e estatísticas)
- [x] Lógica: geração automática ATCUD
- [x] Lógica: numeração sequencial por série
- [x] Lógica: cálculo automático de IVA
- [x] Lógica: assinatura digital (hash SHA-256)
- [x] Lógica: exportação SAF-T (AO) XML

## Frontend - Layout e Navegação
- [x] Configurar tema elegante (cores, tipografia, espaçamentos)
- [x] AppLayout com sidebar de navegação
- [x] Página: Dashboard principal com KPIs
- [x] Navegação: Documentos Fiscais, Clientes, Fornecedores, Produtos, Inventário, Relatórios, Configurações

## Frontend - Dashboard
- [x] KPIs: total facturado, pendentes, IVA a liquidar
- [x] Gráfico: vendas mensais (barras)
- [x] Lista: últimas facturas emitidas
- [x] Alertas: conformidade fiscal AGT

## Frontend - Gestão de Clientes
- [x] Listagem de clientes com pesquisa e filtros
- [x] Formulário criar/editar cliente (NIF, nome, morada, contactos)
- [x] Validação de NIF angolano

## Frontend - Gestão de Fornecedores
- [x] Listagem de fornecedores com pesquisa e filtros
- [x] Formulário criar/editar fornecedor

## Frontend - Catálogo de Produtos/Serviços
- [x] Listagem de produtos com pesquisa e filtros
- [x] Formulário criar/editar produto (código, descrição, preço, IVA)
- [x] Gestão de categorias

## Frontend - Emissão de Documentos Fiscais
- [x] Formulário de emissão de factura
- [x] Suporte a todos os tipos: Factura, Nota de Crédito, Nota de Débito, Recibo, Factura-Recibo, Factura de Adiantamento
- [x] Adição de linhas de produto/serviço
- [x] Cálculo automático de subtotais, IVA e total
- [x] Botão: exportar XML SAF-T
- [x] Botão: anular documento
- [x] Listagem de documentos com filtros e pesquisa
- [x] Detalhe de documento com ATCUD e hash

## Frontend - Inventário
- [x] Listagem de stock por produto
- [x] Registo de entradas e saídas
- [x] Alertas de stock mínimo
- [x] Exportação SAF-T de Inventário

## Frontend - Relatórios e Estatísticas
- [x] Relatório de vendas por período
- [x] Relatório de IVA (apuramento)
- [x] Relatório de clientes (top clientes)
- [x] Análise financeira com gráficos (Recharts)

## Frontend - Configurações
- [x] Configuração da empresa emitente
- [x] Gestão de séries de facturação

## Testes
- [x] Testes unitários: geração ATCUD
- [x] Testes unitários: cálculo IVA
- [x] Testes unitários: hash SHA-256
- [x] Testes unitários: constantes fiscais AGT
- [x] Testes: auth.logout
- [x] 15/15 testes a passar
