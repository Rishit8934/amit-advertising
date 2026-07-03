CREATE TABLE `newspaper_enchantment_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`newspaper_id` text NOT NULL,
	`enchantment_id` text NOT NULL,
	`price` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`newspaper_id`) REFERENCES `newspapers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enchantment_id`) REFERENCES `ad_enchantments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff_logins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `ro_number` integer;--> statement-breakpoint
ALTER TABLE `packages` ADD `category_id` text REFERENCES categories(id);