CREATE TABLE `agt_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`invoiceId` int,
	`action` enum('registar_serie','submeter_documento','consultar_documento','submeter_saft') NOT NULL,
	`payload` text,
	`response` text,
	`status` enum('sucesso','erro','pendente') DEFAULT 'pendente',
	`message` varchar(500),
	`submittedAt` datetime NOT NULL,
	CONSTRAINT `agt_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`action` varchar(50) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`entityLabel` varchar(255),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`paymentDate` datetime NOT NULL,
	`method` enum('numerario','transferencia','cheque','cartao','outro') DEFAULT 'outro',
	`reference` varchar(100),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`clientId` int,
	`clientName` varchar(255),
	`clientNif` varchar(20),
	`clientEmail` varchar(320),
	`documentType` enum('FT','FR') NOT NULL DEFAULT 'FT',
	`frequency` enum('semanal','mensal','bimestral','trimestral','semestral','anual') NOT NULL DEFAULT 'mensal',
	`dayOfMonth` int NOT NULL DEFAULT 1,
	`startDate` datetime,
	`nextRunDate` datetime NOT NULL,
	`items` json NOT NULL,
	`discountPercent` decimal(5,2) DEFAULT '0',
	`withholdingTaxPercent` decimal(5,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunDate` datetime,
	`lastInvoiceId` int,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nif` varchar(20),
	`plan` enum('gratis','pro','escritorio') NOT NULL DEFAULT 'gratis',
	`status` enum('trial','ativo','suspenso','cancelado') NOT NULL DEFAULT 'trial',
	`trialEndsAt` datetime,
	`nextBillingDate` datetime,
	`portalEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoice_series` DROP INDEX `invoice_series_code_unique`;--> statement-breakpoint
ALTER TABLE `invoices` DROP INDEX `invoices_fullNumber_unique`;--> statement-breakpoint
ALTER TABLE `products` DROP INDEX `products_code_unique`;--> statement-breakpoint
ALTER TABLE `invoice_series` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR') NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR') NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `status` enum('rascunho','emitida','paga','parcialmente_paga','anulada','vencida','convertida','expirada') NOT NULL DEFAULT 'rascunho';--> statement-breakpoint
ALTER TABLE `clients` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `portalToken` varchar(64);--> statement-breakpoint
ALTER TABLE `company` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `company` ADD `agtEndpoint` varchar(255);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoice_items` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoice_series` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoice_series` ADD `agtRegistered` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invoice_series` ADD `agtRegisteredAt` datetime;--> statement-breakpoint
ALTER TABLE `invoices` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `clientEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `invoices` ADD `convertedInvoiceId` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `recurringRuleId` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `portalToken` varchar(64);--> statement-breakpoint
ALTER TABLE `invoices` ADD `emailedAt` datetime;--> statement-breakpoint
ALTER TABLE `product_categories` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `invoice_series` ADD CONSTRAINT `uq_series_tenant_code` UNIQUE(`tenantId`,`code`);--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `uq_invoice_tenant_fullnumber` UNIQUE(`tenantId`,`fullNumber`);