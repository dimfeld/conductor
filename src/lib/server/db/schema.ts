import { relations, sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  int,
  primaryKey,
  uniqueIndex,
  blob,
} from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    path: text('path').notNull(),
  },
  (table) => [uniqueIndex('project_path_idx').on(table.path)]
);

export const projectRelations = relations(projects, ({ many }) => ({
  documents: many(documents),
}));

export const documents = sqliteTable(
  'documents',
  {
    id: int('id').primaryKey(),
    projectId: int('project_id')
      .notNull()
      .references(() => projects.id),
    path: text('path').notNull(),
    type: text('type').notNull(),
    description: text('description'),
    canvas_location_x: int('canvas_location_x'),
    canvas_location_y: int('canvas_location_y'),
    canvas_location_width: int('canvas_location_width'),
    canvas_location_height: int('canvas_location_height'),
    tracked: int('tracked', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [uniqueIndex('document_path_idx').on(table.projectId, table.path)]
);

export const documentRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
}));

export const documentParents = sqliteTable(
  'document_parents',
  {
    projectId: int('project_id'),
    childDocumentId: int('child_document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    parentDocumentId: int('parent_document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.childDocumentId, table.parentDocumentId] }),
  ]
);

type AgentStatus = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'TESTING';

export const agentInstances = sqliteTable('agent_instances', {
  id: int('id').primaryKey(),
  active: int('active', { mode: 'boolean' }).notNull().default(true),
  projectId: text('project_id').references(() => projects.id),
  lastCommit: text('last_commit'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`unixepoch()`),
});

/** A history of tasks performed by the agent */
export const agentTasks = sqliteTable('agent_tasks', {
  id: int('id').primaryKey(),
  agentInstanceId: text('agent_instance_id').references(() => agentInstances.id),
  startVcsRef: text('start_vcs_ref').notNull(),
  endVcsRef: text('end_vcs_ref'),
  branch: text('branch').notNull(),
  task: text('task').notNull(),
  status: text('status').$type<AgentStatus>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`unixepoch()`),
});

export const agentTaskSteps = sqliteTable('agent_task_steps', {
  id: int('id').primaryKey(),
  agentTaskId: int('agent_task_id').references(() => agentTasks.id),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`unixepoch()`),
});

export const agentTaskProgress = sqliteTable('agent_task_progress', {
  id: int('id').primaryKey(),
  agentTaskId: int('agent_task_id').references(() => agentTasks.id),
  agentTaskStepId: int('agent_task_step_id').references(() => agentTaskSteps.id),
  logs: text('logs').notNull(),
  model: text('model').notNull(),
  operation: text('operation').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`unixepoch()`),
});

export const scannedFiles = sqliteTable('scanned_files', {
  id: int('id').primaryKey(),
  projectId: int('project_id')
    .notNull()
    .references(() => projects.id),
  /** Path relative to the project root */
  path: text('path').notNull(),

  area: text('area'),
  short_description: text('short_description'),
  long_description: text('long_description'),

  file_timestamp: integer('file_timestamp', { mode: 'timestamp' }).notNull(),
  analyzed_minhash: blob('analyzed_minhash', { mode: 'buffer' }),
  current_minhash: blob('current_minhash', { mode: 'buffer' }),
  needsAnalysis: int('needs_analysis', { mode: 'boolean' }).notNull().default(true),
});

export type Project = typeof projects.$inferSelect;
export type AgentInstance = typeof agentInstances.$inferSelect;
export type AgentTask = typeof agentTasks.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ScannedFile = typeof scannedFiles.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentParent = typeof documentParents.$inferSelect;
