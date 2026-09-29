CREATE TABLE `vat_exemption_reasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`code` varchar(10) NOT NULL,
	`description` varchar(255) NOT NULL,
	`legalBasis` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vat_exemption_reasons_id` PRIMARY KEY(`id`)
);
