#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const [command, ...args] = process.argv.slice(2);
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  process.stderr.write('Circle requires Node.js 22.13 or newer.\n');
  process.exit(1);
}

function compose(...parameters) {
  const result = spawnSync('docker', ['compose', ...parameters], { cwd: projectDirectory, stdio: 'inherit', shell: false });
  if (result.error) {
    process.stderr.write(`Could not run Docker Compose: ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

switch (command) {
  case 'start':
    // Running the migration explicitly on every start also applies newly added
    // migrations when a previous one-shot Compose container already succeeded.
    compose('build', 'api');
    compose('up', '-d', 'db');
    compose('run', '--rm', 'migrate');
    compose('up', '-d', '--no-deps', 'api');
    process.stdout.write('Local API started. Run bootstrap with your operator email, then start Expo separately.\n');
    break;
  case 'bootstrap':
    if (args.length !== 2 || args[0] !== '--email' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args[1])) {
      process.stderr.write('Usage: node scripts/live-local.mjs bootstrap --email YOUR_OPERATOR_EMAIL\n');
      process.exit(1);
    }
    compose('run', '--rm', '--no-deps', 'api', 'npm', 'run', 'bootstrap', '--', '--email', args[1]);
    break;
  case 'stop':
    compose('down'); // Deliberately retain the database volume.
    break;
  case 'logs':
    compose('logs', '--tail', '100', '-f', 'api');
    break;
  default:
    process.stdout.write('Usage: node scripts/live-local.mjs start|stop|logs\n       node scripts/live-local.mjs bootstrap --email YOUR_OPERATOR_EMAIL\n');
    if (command && command !== '--help' && command !== '-h') process.exitCode = 1;
}
