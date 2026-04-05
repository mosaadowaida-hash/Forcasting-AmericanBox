ALTER TABLE `users` ADD `paymentMethod` enum('instapay','paypal');--> statement-breakpoint
ALTER TABLE `users` ADD `paymentProofImage` text;--> statement-breakpoint
ALTER TABLE `users` ADD `paymentStatus` enum('pending','verified','rejected');--> statement-breakpoint
ALTER TABLE `users` ADD `paymentSubmittedAt` timestamp;