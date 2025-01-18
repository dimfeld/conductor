#!/usr/bin/env bun
import { zodToJsonSchema } from 'zod-to-json-schema';
import { projectPlanSchema } from '../src/lib/project/plan';
import { projectConfigSchema } from '../src/lib/project/projectConfigSchema';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';

const planJsonSchema = zodToJsonSchema(projectPlanSchema);
await writeFile(
  path.join(import.meta.dir, '..', 'schema', 'project-plan-schema.json'),
  JSON.stringify(planJsonSchema, null, 2)
);

const projectConfigJsonSchema = zodToJsonSchema(projectConfigSchema);
await writeFile(
  path.join(import.meta.dir, '..', 'schema', 'project-config-schema.json'),
  JSON.stringify(projectConfigJsonSchema, null, 2)
);
