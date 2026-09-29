ALTER TABLE `clients` MODIFY COLUMN `type` enum('empresa','singular','estado','outro') DEFAULT 'empresa';--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `type` enum('empresa','singular','estado','outro') DEFAULT 'empresa';--> statement-breakpoint
ALTER TABLE `suppliers` ADD `taxRegime` enum('geral','simplificado','exclusao') DEFAULT 'geral';