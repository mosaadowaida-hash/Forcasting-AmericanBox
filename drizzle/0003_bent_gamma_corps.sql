CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paymentMethod` enum('instapay','paypal') NOT NULL,
	`proofImageUrl` text,
	`paymentStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','expired','pending') DEFAULT 'pending';