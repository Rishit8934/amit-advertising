CREATE TABLE `ad_enchantments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`preview_html` text,
	`price` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preferred_classifications` (
	`id` text PRIMARY KEY NOT NULL,
	`subcategory_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sub_classifications` (
	`id` text PRIMARY KEY NOT NULL,
	`preferred_classification_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`preferred_classification_id`) REFERENCES `preferred_classifications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subcategories` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `ad_matters` ADD `subcategory_id` text REFERENCES subcategories(id);--> statement-breakpoint
ALTER TABLE `ad_matters` ADD `preferred_classification_id` text REFERENCES preferred_classifications(id);--> statement-breakpoint
ALTER TABLE `ad_matters` ADD `sub_classification_id` text REFERENCES sub_classifications(id);--> statement-breakpoint
ALTER TABLE `ad_matters` ADD `enchantments` text;