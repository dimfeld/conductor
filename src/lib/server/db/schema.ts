import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, int } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  repoPath: text('repo_path').notNull()
});

type AgentStatus = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'TESTING';

export const agentInstances = sqliteTable('agent_instances', {
  id: int('id').primaryKey({ autoIncrement: true }),
  active: int('active', { mode: 'boolean' }).notNull().default(true),
  projectId: text('project_id').references(() => projects.id),
  lastCommit: text('last_commit'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`unixepoch()`)
    .$onUpdate(() => sql`unixepoch()`)
});

/** A history of tasks performed by the agent */
export const agentTasks = sqliteTable('agent_tasks', {
  id: int('id').primaryKey({ autoIncrement: true }),
  agentInstanceId: text('agent_instance_id').references(() => agentInstances.id),
  startVcsRef: text('start_vcs_ref').notNull(),
  endVcsRef: text('end_vcs_ref'),
  branch: text('branch').notNull(),
  task: text('task').notNull(),
  status: text('status').$type<AgentStatus>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`unixepoch()`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`unixepoch()`)
    .$onUpdate(() => sql`unixepoch()`)
});
