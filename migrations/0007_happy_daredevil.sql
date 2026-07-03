CREATE TABLE `manual_ros` (
	`id` text PRIMARY KEY NOT NULL,
	`ro_number` text NOT NULL,
	`newspaper_id` text NOT NULL,
	`client_name` text NOT NULL,
	`client_phone` text,
	`amount` integer NOT NULL,
	`publish_dates` text NOT NULL,
	`description` text,
	`ro_status` text DEFAULT 'pending' NOT NULL,
	`linked_booking_id` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`newspaper_id`) REFERENCES `newspapers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linked_booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manual_ros_ro_number_unique` ON `manual_ros` (`ro_number`);--> statement-breakpoint
ALTER TABLE `ad_matters` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `bills` ADD `discount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `packages` ADD `package_type` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `packages` ADD `buy_quantity` integer;--> statement-breakpoint
ALTER TABLE `packages` ADD `get_quantity` integer;--> statement-breakpoint
ALTER TABLE `rates` ADD `name` text;