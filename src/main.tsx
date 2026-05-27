#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import { render } from 'ink';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { SimpleAgent } from './agent/SimpleAgent.js';
import { ConfigManager } from './config/ConfigManager.js';
import { configStore } from './store/configStore.js';
import { App } from './ui/App.js';

interface CliArguments {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  print?: string;
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
    .help()
    .parse();

  const args = argv as CliArguments;

  const config = ConfigManager.fromEnvironment({
    apiKey: args.apiKey,
    baseURL: args.baseURL,
    model: args.model,
  });

  configStore.getState().setConfig(config);

  if (args.print) {
    const agent = new SimpleAgent();
    const response = await agent.chat(args.print);
    process.stdout.write(`${response}\n`);
    return;
  }

  render(<App />);
}

main().catch((error: unknown) => {
  process.stderr.write(`Error: ${(error as Error).message}\n`);
  process.exitCode = 1;
});
