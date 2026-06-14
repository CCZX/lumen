#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import { render } from 'ink';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigManager } from './config/ConfigManager.js';
import { configStore } from './store/configStore.js';
import { App } from './ui/App.js';
import { startDebugHttpServer } from './debug/httpServer.js';

const execAsync = promisify(exec);

interface CliArguments {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  print?: string;
  debug?: boolean;
}

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('lumen')
    .option('api-key', {
      type: 'string',
      description: 'API key. Defaults to OPENAI_API_KEY.',
    })
    .option('base-url', {
      type: 'string',
      description: 'OpenAI-compatible base URL. Defaults to OPENAI_BASE_URL.',
    })
    .option('model', {
      type: 'string',
      description: 'Model name. Defaults to OPENAI_MODEL or gpt-4o-mini.',
    })
    .option('print', {
      type: 'string',
      description: 'Run once without rendering the Ink UI.',
    })
    .option('debug', {
      type: 'boolean',
      description: 'Enable debug mode to log requests/responses.',
    })
    .help()
    .parse();

  const args = argv as CliArguments;

  const config = ConfigManager.fromEnvironment({
    apiKey: args.apiKey,
    baseURL: args.baseURL,
    model: args.model,
  });

  configStore.getState().setConfig(config);
  configStore.getState().patchConfig({ debug: args.debug ?? false });

  if (args.debug) {
    await execAsync('node scripts/build-debug.mjs');
    startDebugHttpServer(3001);
  }

  render(<App />);
}

main().catch((error: unknown) => {
  process.stderr.write(`Error: ${(error as Error).message}\n`);
  process.exitCode = 1;
});