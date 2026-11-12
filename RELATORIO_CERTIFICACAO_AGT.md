# Relatório de Progresso: Integração e Certificação AGT — Facturação Electrónica

**Projecto:** Sistema de Facturação Kapital360 (`facturas.kapital360.ao`)  
**Enquadramento Legal:** Decreto Presidencial n.º 71/25, de 20 de Março (Regime Jurídico das Facturas e Documentos Fiscalmente Relevantes — Angola)  
**Data:** 12 de Novembro de 2026  
**Estado Actual:** Desenvolvimento Técnico da API v1 Concluído | Em Fase de Homologação junto à AGT

---

## 1. Sumário Executivo

O sistema **Kapital360 Facturação** já se encontra em produção e concluiu a adaptação técnica da sua camada de comunicação para o padrão oficial de **Facturação Electrónica da AGT (API REST v1 — `schemaVersion: 2.0`)**, conforme a documentação oficial disponibilizada no Portal do Parceiro do Ministério das Finanças (`portaldoparceiro.hml.minfin.gov.ao`).

Para obter a certificação definitiva e operar em tempo real com a AGT em ambiente de produção, a Administração Geral Tributária exige o cumprimento obrigatório de **duas etapas sequenciais**:
1. **Homologação (Ambiente de Testes):** Registo no Portal do Parceiro, recepção das credenciais de teste da AGT, execução da bateria de testes nas APIs de homologação e emissão do **Certificado de Homologação**.
2. **Produção:** Emissão de credenciais específicas de produção pela AGT e activação final.

---

## 2. O Que Já Foi Implementado no Sistema (100% Concluído)

Toda a infraestrutura técnica exigida pela documentação oficial da AGT foi implementada no servidor (`backfacturas.kapital360.ao`):

### 2.1. Endpoint de Callback / Webhook (`HTTP POST`)
A AGT exige um endereço público no sistema para receber notificações automáticas sempre que uma factura é **validada** ou **rejeitada** pela AGT.
- **URL Oficial Configurada:** `https://backfacturas.kapital360.ao/api/webhooks/agt`
- **Funcionalidades implementadas:**
  - Recepção automática via `HTTP POST` sem bloqueio de CORS para domínios `.gov.ao`;
  - Resposta a testes de conectividade (`GET /api/webhooks/agt`);
  - Identificação automática da factura pelo número do documento (`documentNo` / `fullNumber`), `ATCUD` ou NIF do emitente;
  - Actualização imediata do estado da factura na base de dados e registo no histórico de auditoria AGT (`agt_submissions`).

### 2.2. Segurança e Assinaturas Digitais (`JWS RS256` + `Basic Auth`)
Conforme exigido pela especificação `schemaVersion: "2.0"` da AGT:
- **Autenticação HTTP `Basic Auth`:** Cabeçalho `Authorization: Basic <Base64(utilizador:senha)>` encriptado na base de dados.
- **Assinaturas Criptográficas `JWS` (`RS256` — RSA 2048 bits + SHA-256):**
  - `jwsSoftwareSignature`: Assina os dados do software (`productId`, `productVersion`, `softwareValidationNumber`) em todas as requisições.
  - `jwsDocumentSignature`: Assina individualmente cada factura emitida (cabeçalho, cliente e totais `netTotal`, `taxPayable`, `grossTotal`).
  - `jwsSignature`: Assina pedidos de séries e consultas fiscais.

### 2.3. Integração dos 5 Serviços REST Oficiais da AGT (`v1`)

| Serviço AGT | Endpoint Homologação | Estado no Sistema | Descrição |
| :--- | :--- | :---: | :--- |
| **`solicitarSerie`** | `POST .../sigt/fe/v1/solicitarSerie` | Concluído | Solicita criação de série na AGT e grava o código oficial (`seriesCode`) devolvido. |
| **`registarFactura`** | `POST .../sigt/fe/v1/registarFactura` | Concluído | Submete facturas (`FT`, `FR`, `NC`, `ND`, etc.), linhas, taxas de IVA/isenções e totais assinados via JWS, guardando o `requestID`. |
| **`obterEstado`** | `POST .../sigt/fe/v1/obterEstado` | Concluído | Consulta o resultado da validação de facturas submetidas através do `requestID`. |
| **`consultarFactura`** | `POST .../sigt/fe/v1/consultarFactura` | Concluído | Consulta os dados e estado de validação de uma factura específica na AGT. |
| **`listarFacturas`** | `POST .../sigt/fe/v1/listarFacturas` | Concluído | Lista todas as facturas registadas na AGT num intervalo de datas (`queryStartDate` a `queryEndDate`). |

---

## 3. Próximos Passos e Dependências Administrativas

### Pré-requisitos Fiscais / Administrativos Exigidos pela AGT
1. **NIF Activo** com actividade económica (CAE) registada;
2. **Representante Legal (NIF Singular)** vinculado no Portal do Contribuinte como representante legal da empresa;
3. **Certidão de Conformidade Tributária válida** (situação fiscal regularizada).

### Plano de Acção Imediato

| Passo | Acção | Responsável | Estado |
| :---: | :--- | :--- | :---: |
| **1** | Submeter o registo no **Portal do Parceiro** (`portaldoparceiro.hml.minfin.gov.ao`) informando a Callback URL `https://backfacturas.kapital360.ao/api/webhooks/agt` e a Chave Pública RSA. | Equipa Interna | Em curso |
| **2** | Enviar e-mail para `produtores.dfe.dcrr.agt@minfin.gov.ao` (com a Certidão de Conformidade Tributária) a solicitar as **credenciais Basic Auth de Homologação**, o `softwareValidationNumber` de teste e o **Caderno de Cenários de Teste**. | Equipa Interna / Direcção | Pendente de envio |
| **3** | Actualizar o servidor de produção (`backfacturas.kapital360.ao`) com a nova versão do backend já compilada (`backend/dist/index.js`). | Equipa Técnica | Pronto para deploy |
| **4** | Executar todos os cenários de teste no ambiente de homologação (`sifphml.minfin.gov.ao`) e solicitar acesso ao Web Service de Consulta de NIF. | Equipa Técnica | Aguarda credenciais AGT |
| **5** | Receber o **Certificado de Homologação** e solicitar o utilizador final de **Produção** (`sifp.minfin.gov.ao`). | Equipa Interna + AGT | Etapa final |

