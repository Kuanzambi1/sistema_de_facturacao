-- Adicionar printCount à tabela invoices (para controlar Original vs 2ª Via)
ALTER TABLE `invoices` ADD COLUMN `printCount` int NOT NULL DEFAULT 0;

-- Adicionar vatExemptReasonCode à tabela invoice_items (códigos AGT de isenção)
ALTER TABLE `invoice_items` ADD COLUMN `vatExemptReasonCode` varchar(10);
