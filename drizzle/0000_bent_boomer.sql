CREATE TABLE `agent_instances` (
	`id` integer PRIMARY KEY NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`project_id` text,
	`last_commit` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_task_progress` (
	`id` integer PRIMARY KEY NOT NULL,
	`agent_task_id` integer,
	`agent_task_step_id` integer,
	`logs` text NOT NULL,
	`model` text NOT NULL,
	`operation` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_task_id`) REFERENCES `agent_tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_task_step_id`) REFERENCES `agent_task_steps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_task_steps` (
	`id` integer PRIMARY KEY NOT NULL,
	`agent_task_id` integer,
	`title` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_task_id`) REFERENCES `agent_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_tasks` (
	`id` integer PRIMARY KEY NOT NULL,
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
CREATE TABLE `document_parents` (
	`project_id` integer,
	`child_document_id` integer NOT NULL,
	`parent_document_id` integer NOT NULL,
	PRIMARY KEY(`project_id`, `child_document_id`, `parent_document_id`),
	FOREIGN KEY (`child_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`path` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`canvas_location_x` integer,
	`canvas_location_y` integer,
	`canvas_location_width` integer,
	`canvas_location_height` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_path_idx` ON `projects` (`path`);--> statement-breakpoint
CREATE TABLE `scanned_files` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`path` text NOT NULL,
	`area` text,
	`short_description` text,
	`long_description` text,
	`file_timestamp` integer NOT NULL,
	`analyzed_minhash` blob,
	`current_minhash` blob,
	`needs_analysis` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
