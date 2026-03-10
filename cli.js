#!/usr/bin/env node

// Load .env from the current working directory (no external dep needed in Node 20.6+).
try { process.loadEnvFile('.env'); } catch (_) {}

import { resolve } from 'path';
import { printBanner, printHelp, log, red, cyan, bold, yellow } from './src/ui.js';
import { runSimulate }     from './src/simulate.js';
import { runChat }         from './src/chat.js';
import { runAddScenarios } from './src/dataset.js';

// ─── Argument parser ──────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    command:   null,
    headed:    false,
    help:      false,
    // simulate
    name:      'Singtel Chatbot Simulation',
    datasetId: process.env.NETRA_DATASET_ID ?? null,
    apiKey:    process.env.NETRA_API_KEY    ?? null,
    // chat
    messages:    [],
    screenshots: null,
    output:      null,
    // add-scenarios
    authToken:    process.env.NETRA_AUTH_TOKEN    ?? null,
    orgId:        process.env.NETRA_ORG_ID        ?? null,
    endpoint:     process.env.NETRA_OTLP_ENDPOINT ?? null,
    scenarioFile: null,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case 'simulate':
      case 'chat':
      case 'add-scenarios': opts.command   = a;                        break;
      case '--help':
      case '-h':            opts.help      = true;                     break;
      case '--headed':      opts.headed    = true;                     break;
      case '--name':        opts.name      = args[++i];                break;
      case '--dataset-id':  opts.datasetId = args[++i];                break;
      case '--api-key':       opts.apiKey       = args[++i];           break;
      case '--message':       opts.messages.push(args[++i]);           break;
      case '--screenshots':   opts.screenshots  = resolve(args[++i]); break;
      case '--output':        opts.output       = resolve(args[++i]); break;
      case '--auth-token':    opts.authToken    = args[++i];           break;
      case '--org-id':        opts.orgId        = args[++i];           break;
      case '--endpoint':      opts.endpoint     = args[++i];           break;
      case '--scenario-file': opts.scenarioFile = resolve(args[++i]); break;
      default:
        log.warn(`Unknown argument: ${yellow(a)} — run with ${cyan('--help')} for usage`);
    }
  }
  return opts;
}

// ─── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help || !opts.command) {
    printHelp();
    process.exit(0);
  }

  printBanner();

  if (opts.command === 'simulate') {
    await runSimulate(opts);
  } else if (opts.command === 'chat') {
    await runChat(opts);
  } else if (opts.command === 'add-scenarios') {
    await runAddScenarios(opts);
  } else {
    log.error(`Unknown command: ${red(opts.command)}`);
    log.info(`Run ${cyan('node cli.js --help')} for usage.`);
    process.exit(1);
  }
}

main().catch(err => {
  log.blank();
  log.error(bold('Fatal error:'), err.message);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
