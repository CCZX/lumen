import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

await esbuild.build({
  entryPoints: [join(projectRoot, 'src/debug/DebugPanelEntry.ts')],
  bundle: true,
  minify: false,
  sourcemap: true,
  outfile: join(projectRoot, 'dist/debug-panel.js'),
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  loader: {
    '.ts': 'ts',
  },
});

console.log('Debug panel built successfully');