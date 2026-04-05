CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('product','bundle') NOT NULL DEFAULT 'product',
	`originalPrice` double NOT NULL,
	`discountTwoItems` double DEFAULT 10,
	`discountThreeItems` double DEFAULT 15,
	`bundleDiscount` double DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`cpm` double NOT NULL,
	`cpmLabel` varchar(64) NOT NULL,
	`ctr` double NOT NULL,
	`ctrLabel` varchar(64) NOT NULL,
	`cvr` double NOT NULL,
	`cvrLabel` varchar(64) NOT NULL,
	`basketSize` double NOT NULL,
	`basketLabel` varchar(64) NOT NULL,
	`cpc` double NOT NULL,
	`cpaDashboard` double NOT NULL,
	`cpaDelivered` double NOT NULL,
	`aov` double NOT NULL,
	`revenuePerOrder` double NOT NULL,
	`cogs` double NOT NULL,
	`shipping` double NOT NULL DEFAULT 30,
	`roas` double NOT NULL,
	`deliveredRoas` double NOT NULL,
	`breakEvenCpa` double NOT NULL,
	`netProfitPerOrder` double NOT NULL,
	`profitMargin` double NOT NULL,
	`status` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
