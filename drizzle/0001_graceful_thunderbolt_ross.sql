ALTER TABLE `documents` ADD `tracked` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `document_path_idx` ON `documents` (`project_id`,`path`);