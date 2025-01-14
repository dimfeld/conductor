import { type ChildProcess, spawn } from 'child_process';
import { Readable } from 'stream';
import debugModule from 'debug';

const debug = debugModule('aider');

export interface AiderOptions {
  /** The working directory for Aider */
  cwd: string;
  /** Additional arguments to pass to Aider */
  args?: string[];
}

const PROMPT_PATTERNS = [
  /\(Y\)es\/\(N\)o\/\(A\)ll\/\(S\)kip all\/\(D\)on't ask again \[.*\]:$/,
  /\(Y\)es\/\(N\)o\/\(D\)on't ask again \[.*\]:$/,
  /\(y\/n\): $/,
  /> $/,
];

function isPrompt(text: string): boolean {
  return PROMPT_PATTERNS.some((pattern) => pattern.test(text));
}

export class AiderProcess {
  private process: ChildProcess;
  private _buffer = '';
  private promptResolve: ((value: string) => void) | null = null;

  private _sessionCost: number = 0;

  readFiles: Set<string> = new Set();
  editFiles: Set<string> = new Set();

  protected constructor(options: AiderOptions) {
    debug('Starting aider in %s', options.cwd);

    const args = [...(options.args ?? []), '--no-pretty', '--no-fancy-input'];

    this.process = spawn('aider', args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      this._buffer += text;

      // When we see a prompt, resolve the promise if one is waiting
      if (isPrompt(this._buffer)) {
        let tokenRegex = /^Tokens: \$(\d+\.\d+) session\.$/gm;
        for (let match of this._buffer.matchAll(tokenRegex)) {
          // We really just want the last match but this is easy and accomplishes the same thing.
          this._sessionCost = parseFloat(match[1]);
        }

        this.promptResolve?.(this._buffer);
        this.promptResolve = null;
      }
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      debug('stderr: %s', data.toString());
    });
  }

  static async start(options: AiderOptions) {
    const aider = new AiderProcess(options);
    await aider.init();
    return aider;
  }

  private async init() {
    await this.waitForPrompt();

    let lines = this.takeBuffer().split('\n');

    // See which files are loaded at first, if any
    if (lines[0].trim() === '') {
      lines.shift();
    }

    let emptyLineIndex = lines.findIndex((line) => line === '');
    if (emptyLineIndex === -1) {
      emptyLineIndex = lines.length;
    }

    let files = lines.slice(emptyLineIndex + 1);

    for (let line of files) {
      if (isPrompt(line)) {
        break;
      }

      line = line.trim();

      if (line.endsWith(' (read only)')) {
        this.readFiles.add(line.slice(0, -' (read only)'.length).trim());
      } else {
        this.editFiles.add(line);
      }
    }
  }

  get sessionCost() {
    return this._sessionCost;
  }

  get buffer() {
    return this._buffer;
  }

  /** Take the current buffer and clear it */
  takeBuffer(): string {
    const buffer = this._buffer;
    this._buffer = '';
    return buffer;
  }

  /** Send a message to Aider's stdin */
  send(message: string | string[]) {
    if (!this.process.stdin?.writable) {
      throw new Error('Aider process stdin is not writable');
    }

    debug('Sending message: %s', message);
    if (Array.isArray(message)) {
      const stdin = this.process.stdin;
      message.forEach((msg) => stdin.write(msg + '\n'));
    } else {
      this.process.stdin.write(message + '\n');
    }
  }

  /** Send a message to Aider's stdin and wait for the next prompt */
  async sendSync(message: string | string[]) {
    this.send(message);
    return this.waitForPrompt();
  }

  /** Wait for the next prompt from Aider. This will be either:
   * - A regular prompt ending in "> "
   * - A yes/no prompt ending in "(y/n): "
   * - A more complex prompt like "(Y)es/(N)o/(D)on't ask again [Yes]:"
   * - Or similar variations
   */
  async waitForPrompt(): Promise<string> {
    // If we already have a complete prompt in the buffer, return it immediately
    if (isPrompt(this._buffer)) {
      return this._buffer;
    }

    // Otherwise wait for the next prompt
    return new Promise<string>((resolve) => {
      this.promptResolve = resolve;
    });
  }

  /** Get a readable stream of Aider's stdout */
  getOutputStream(): Readable {
    if (!this.process.stdout) {
      throw new Error('Aider process stdout is not available');
    }

    return this.process.stdout;
  }

  /** Stop the Aider process */
  async stop() {
    if (!this.process.killed) {
      this.process.kill();
    }
  }
}
