import { describe, it, expect, afterEach, beforeEach, vi, beforeAll } from 'vitest';
import { AiderProcess } from './index.js';

// This is slightly slow so we skip it if not explicitly requested
describe.skipIf(!process.env.TEST_AIDER_INTERFACE && !process.env.CI)('AiderProcess', () => {
  let aider: AiderProcess;

  afterEach(async () => {
    // Clean up the process after each test
    if (aider) {
      await aider.stop();
    }
  });

  it('basic communication', async () => {
    aider = await AiderProcess.start({
      cwd: process.cwd(),
      args: ['--architect', '--map-refresh', 'manual'],
    });

    expect(aider.readFiles).toEqual(
      new Set(['.cursorrules', 'docs/guidelines.md', 'docs/overview.md', 'docs/svelte-llm.txt'])
    );

    expect(aider.editFiles).toEqual(new Set(['docs/lessons.md', 'docs/plan.md']));

    // Send the /help command
    aider.send('/help');

    // Wait for the next prompt after help output
    const helpPrompt = await aider.waitForPrompt();

    // The help command should have generated some output
    expect(aider.buffer).toContain(
      'Use `/help <question>` to ask questions about how to use aider.'
    );
    expect(helpPrompt).toContain('\narchitect>');
  }, 30000); // Increase timeout since process startup might be slow
});
