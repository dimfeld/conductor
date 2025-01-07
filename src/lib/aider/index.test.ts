import { describe, it, expect, afterEach, beforeEach, vi, beforeAll } from 'vitest';
import { AiderProcess } from './index.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, writeFileSync } from 'fs';

describe('AiderProcess', () => {
  let aider: AiderProcess;
  let tempDir: string;

  beforeAll(() => {
    // Create a temporary directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'aider-test-'));
    writeFileSync(
      tempDir + '/aider.yaml',
      `
chat-mode: architect
map-refresh: manual
`
    );
  });

  afterEach(async () => {
    // Clean up the process after each test
    if (aider) {
      await aider.stop();
    }
  });

  it('should start and handle /help command', async () => {
    aider = new AiderProcess({
      cwd: process.cwd(),
      args: ['--architect', '--config', tempDir + '/aider.yaml']
    });

    // Get the output stream to verify we're getting output
    const output = aider.getOutputStream();
    const chunks: string[] = [];
    output.on('data', (chunk: Buffer) => {
      chunks.push(chunk.toString());
    });

    // Wait for the initial prompt
    const initialPrompt = await aider.waitForPrompt();
    expect(initialPrompt).toContain('>');

    aider.takeBuffer();

    // Send the /help command
    await aider.send('/help');

    // Wait for the next prompt after help output
    const helpPrompt = await aider.waitForPrompt();

    // The help command should have generated some output
    expect(chunks.join('')).toContain(
      'Use `/help <question>` to ask questions about how to use aider.'
    );
    expect(helpPrompt).toContain('\narchitect>');
  }, 30000); // Increase timeout since process startup might be slow
});
