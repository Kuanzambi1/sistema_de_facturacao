ALTER TABLE `company` MODIFY COLUMN `logoUrl` longtext;--> statement-breakpoint
ALTER TABLE `invoice_series` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP') NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP') NOT NULL;--> statement-breakpoint
ALTER TABLE `invoice_items` ADD `vatExemptReasonCode` varchar(10);--> statement-breakpoint
ALTER TABLE `invoices` ADD `printCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `billingCycle` enum('mensal','trimestral','semestral','anual') DEFAULT 'mensal' NOT NULL;