import { readFileSync } from 'fs';
import { log, spinner, bold, green, red, cyan, yellow } from './ui.js';

const DEFAULT_SCENARIOS = [
  {
    scenario:
      'The user wants to find a prepaid mobile plan under $35 and needs the Singtel agent to provide available options and pricing details.',
    behaviour_instructions:
      'Simulated user should start by asking about prepaid plans under $35, then follow up on specifics like data allowance, validity period, and how to sign up.',
    persona: 'neutral',
    max_turns: 5,
  },
  {
    scenario:
      'The user is travelling to Japan next week and wants the Singtel agent to recommend suitable roaming plans or travel add-ons.',
    behaviour_instructions:
      'Simulated user should ask about roaming options for Japan, then ask about pricing, data limits, and activation steps.',
    persona: 'neutral',
    max_turns: 5,
  },
];

function buildBaseUrl(endpoint) {
  let base = (endpoint || '').replace(/\/+$/, '');
  if (base.endsWith('/telemetry')) {
    base = base.slice(0, -'/telemetry'.length);
  }
  return base;
}

async function addDatasetItem(baseUrl, datasetId, headers, scenario) {
  const url = `${baseUrl}/datasets/${datasetId}/items`;
  const body = {
    metadata: {
      scenario: scenario.scenario,
      max_turns: scenario.max_turns,
      persona: scenario.persona,
      behaviour_instructions: scenario.behaviour_instructions,
      evaluatorConfigs: [],
    },
    userData: scenario.userData || {},
    providerConfig: scenario.providerConfig || { provider_id: '4b94e9d4-842a-4d40-9260-2af9badd6deb', model: 'gpt-5' },
    evaluators: scenario.evaluators || [],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function runAddScenarios(opts) {
  log.blank();
  console.log(bold('  ▶  Add Dataset Scenarios'));
  log.blank();

  const authToken = opts.authToken || process.env.NETRA_AUTH_TOKEN;
  const orgId     = opts.orgId     || process.env.NETRA_ORG_ID;
  const datasetId = opts.datasetId || process.env.NETRA_DATASET_ID;
  const endpoint  = opts.endpoint  || process.env.NETRA_OTLP_ENDPOINT || '';

  if (!authToken) {
    log.error(`${red('NETRA_AUTH_TOKEN')} is not set. Add it to ${cyan('.env')} or pass ${cyan('--auth-token')}.`);
    process.exit(1);
  }
  if (!orgId) {
    log.error(`${red('NETRA_ORG_ID')} is not set. Add it to ${cyan('.env')} or pass ${cyan('--org-id')}.`);
    process.exit(1);
  }
  if (!datasetId) {
    log.error(`${red('NETRA_DATASET_ID')} is not set. Add it to ${cyan('.env')} or pass ${cyan('--dataset-id')}.`);
    process.exit(1);
  }

  let scenarios = DEFAULT_SCENARIOS;
  if (opts.scenarioFile) {
    try {
      const raw = readFileSync(opts.scenarioFile, 'utf8');
      scenarios = JSON.parse(raw);
      if (!Array.isArray(scenarios)) scenarios = [scenarios];
    } catch (err) {
      log.error(`Could not read scenario file: ${err.message}`);
      process.exit(1);
    }
  }

  const baseUrl = buildBaseUrl(endpoint);

  const hostMatch = baseUrl.match(/api\.(\w+)\.getnetra/);
  const envSuffix = hostMatch ? hostMatch[1] : 'eu';
  const cookieName = `access_token_${envSuffix}`;

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `${cookieName}=${authToken}`,
    'x-org-id': orgId,
  };

  log.info(`Base URL:   ${bold(baseUrl)}`);
  log.info(`Dataset ID: ${bold(datasetId)}`);
  log.info(`Scenarios:  ${bold(scenarios.length)}`);
  log.blank();

  let added = 0;
  let failed = 0;

  for (const s of scenarios) {
    const spin = spinner(`Adding: ${s.scenario.substring(0, 60)}…`);
    try {
      const result = await addDatasetItem(baseUrl, datasetId, headers, s);
      if (result.ok) {
        const id = result.data?.data?.id || result.data?.id || '(created)';
        spin.succeed(`Added ${cyan(id)}: ${s.scenario.substring(0, 70)}…`);
        added++;
      } else {
        spin.fail(`Failed (${result.status}): ${s.scenario.substring(0, 60)}…`);
        log.error(JSON.stringify(result.data?.error || result.data));
        failed++;
      }
    } catch (err) {
      spin.fail(`Error: ${err.message}`);
      failed++;
    }
  }

  log.blank();
  log.info(`${green(added)} added, ${failed > 0 ? red(failed) : failed} failed.`);
  log.blank();
}
