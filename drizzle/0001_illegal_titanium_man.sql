ALTER TABLE `products` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('pending','active','suspended') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `activatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `suspendedAt` timestamp;