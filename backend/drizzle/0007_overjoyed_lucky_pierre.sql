ALTER TABLE `invoice_series` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP','CM') NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP','CM') NOT NULL;--> statement-breakpoint
ALTER TABLE `company` ADD `rsaPrivateKey` text;--> statement-breakpoint
ALTER TABLE `company` ADD `rsaPublicKey` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `cancelReason` varchar(255);--> statement-breakpoint
ALTER TABLE `invoices` ADD `rectificationType` enum('anulacao_total','rectificacao_parcial');