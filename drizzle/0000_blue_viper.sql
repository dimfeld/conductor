CREATE TABLE `agent_instances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`project_id` text,
	`last_commit` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_instance_id` text,
	`start_vcs_ref` text NOT NULL,
	`end_vcs_ref` text,
	`branch` text NOT NULL,
	`task` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_instance_id`) REFERENCES `agent_instances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_frameworks` (
	`project_id` integer NOT NULL,
	`framework` text NOT NULL,
	PRIMARY KEY(`project_id`, `framework`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_states` (
	`project_id` integer PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`last_accessed` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_technologies` (
	`project_id` integer NOT NULL,
	`technology` text NOT NULL,
	PRIMARY KEY(`project_id`, `technology`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_path_idx` ON `projects` (`path`);