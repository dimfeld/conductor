import { describe, it, expect, afterEach, beforeEach, vi, beforeAll } from 'vitest';
import { AiderProcess } from './index.js';

describe('AiderProcess', () => {
  let aider: AiderProcess;

  afterEach(async () => {
    // Clean up the process after each test
    if (aider) {
      await aider.stop();
    }
  });

  it('should start and handle /help command', async () => {
    aider = new AiderProcess({
      cwd: process.cwd(),
      args: ['--architect', '--map-refresh', 'manual']
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

    expect(aider.buffer).toBe('');

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
