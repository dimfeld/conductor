import { afterAll, afterEach, onTestFinished } from 'vitest';
import { initDb } from '.';
import { client } from './index.js';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function createTestDb() {
  const dbPath = join(tmpdir(), `test-${Math.random().toString(36).slice(2)}.db`);
  initDb(dbPath);

  onTestFinished(() => {
    client.close();
    fs.unlinkSync(dbPath);
  });

  return dbPath;
}
