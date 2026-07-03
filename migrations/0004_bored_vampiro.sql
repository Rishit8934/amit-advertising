CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text,
	`client_name` text NOT NULL,
	`client_number` text,
	`client_address` text,
	`client_gst` text,
	`client_state` text,
	`items` text NOT NULL,
	`total_amount` integer NOT NULL,
	`cgst` integer,
	`sgst` integer,
	`grand_total` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `edition` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `city` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `subcategory` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `classification` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `payment_details` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `remarks` text;