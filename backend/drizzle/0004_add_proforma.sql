ALTER TABLE `invoice_series` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP') NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `documentType` enum('FT','FR','FS','FA','NC','ND','RC','RG','OR','PP','FP') NOT NULL;
