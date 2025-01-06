import { execaSync } from 'execa';
import { readFileSync } from 'fs';

let gitRef: string;
let gitBranch: string;

try {
  gitRef = readFileSync('/app/gitref', 'utf-8').trim();
  gitBranch = readFileSync('/app/gitbranch', 'utf-8').trim();
} catch (e) {
  const { stdout: sGitRef } = execaSync('git', ['rev-parse', 'HEAD']);
  const { stdout: sGitBranch } = execaSync('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

  gitRef = sGitRef.trim();
  gitBranch = sGitBranch.trim();
}

export { gitRef, gitBranch };
