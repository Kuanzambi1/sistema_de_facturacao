-- Executar este script na aba SQL do phpMyAdmin da Hostinger caso queira aplicar manualmente:

ALTER TABLE `invoices` ADD COLUMN `clientRef` varchar(100) NULL;
ALTER TABLE `invoices` ADD COLUMN `cancelReason` varchar(255) NULL;
ALTER TABLE `invoices` ADD COLUMN `rectificationType` enum('anulacao_total','rectificacao_parcial') NULL;
ALTER TABLE `invoices` ADD COLUMN `printCount` int NOT NULL DEFAULT 0;
ALTER TABLE `invoices` ADD COLUMN `operatorName` varchar(255) NULL;
ALTER TABLE `invoices` ADD COLUMN `convertedInvoiceId` int NULL;
ALTER TABLE `invoices` ADD COLUMN `deliveryLocation` text NULL;
ALTER TABLE `invoices` ADD COLUMN `deliveryDate` datetime NULL;
ALTER TABLE `invoices` ADD COLUMN `exchangeRate` decimal(10, 4) DEFAULT '1.0000';
ALTER TABLE `invoices` ADD COLUMN `recurringRuleId` int NULL;
ALTER TABLE `invoices` ADD COLUMN `notes` text NULL;
ALTER TABLE `invoices` ADD COLUMN `internalNotes` text NULL;
ALTER TABLE `invoices` ADD COLUMN `pdfUrl` text NULL;
ALTER TABLE `invoices` ADD COLUMN `xmlUrl` text NULL;
ALTER TABLE `invoices` ADD COLUMN `agtSubmitted` tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE `invoices` ADD COLUMN `agtSubmissionDate` datetime NULL;
ALTER TABLE `invoices` ADD COLUMN `agtResponse` text NULL;
ALTER TABLE `invoices` ADD COLUMN `createdBy` int NULL;
ALTER TABLE `invoices` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP','CM') NOT NULL;

ALTER TABLE `invoice_series` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP','CM') NOT NULL;
ALTER TABLE `invoice_items` ADD COLUMN `vatExemptReasonCode` varchar(10) NULL;

ALTER TABLE `company` MODIFY COLUMN `logoUrl` longtext NULL;
ALTER TABLE `company` ADD COLUMN `rsaPrivateKey` text NULL;
ALTER TABLE `company` ADD COLUMN `rsaPublicKey` text NULL;
ALTER TABLE `company` ADD COLUMN `digitalSignatureKey` text NULL;
ALTER TABLE `company` ADD COLUMN `agtPortalUser` varchar(100) NULL;
ALTER TABLE `company` ADD COLUMN `agtPortalPassword` text NULL;
ALTER TABLE `company` ADD COLUMN `agtEndpoint` varchar(255) NULL;
ALTER TABLE `company` ADD COLUMN `softwareValidationNumber` varchar(50) DEFAULT '000/AGT/202X';
ALTER TABLE `company` ADD COLUMN `taxRegime` enum('geral','simplificado','exclusao') DEFAULT 'geral';

ALTER TABLE `suppliers` ADD COLUMN `taxRegime` enum('geral','simplificado','exclusao') DEFAULT 'geral';
ALTER TABLE `suppliers` MODIFY COLUMN `type` enum('empresa','singular','estado','outro') DEFAULT 'empresa';
ALTER TABLE `clients` MODIFY COLUMN `type` enum('empresa','singular','estado','outro') DEFAULT 'empresa';
ALTER TABLE `tenants` ADD COLUMN `billingCycle` enum('mensal','trimestral','semestral','anual') NOT NULL DEFAULT 'mensal';

CREATE TABLE IF NOT EXISTS `vat_exemption_reasons` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantId` int NOT NULL,
  `code` varchar(10) NOT NULL,
  `description` varchar(255) NOT NULL,
  `legalBasis` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
