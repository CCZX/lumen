import { chmod } from 'node:fs/promises';
import { resolve } from 'node:path';

const entry = resolve('dist/main.js');

await chmod(entry, 0o755);
