ALTER TABLE `agent_task_progress` ADD `input_tokens` integer;--> statement-breakpoint
ALTER TABLE `agent_task_progress` ADD `output_tokens` integer;--> statement-breakpoint
ALTER TABLE `agent_task_progress` ADD `cost_in_millicents` integer;