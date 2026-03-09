import { Netra, BaseTask } from 'netra-sdk';
import { log, spinner, bold, green, red, cyan, yellow } from './ui.js';
import {
  launchBrowser,
  newPage,
  openChatWidget,
  findAndSendMessage,
  extractLatestBotResponse,
} from './browser.js';

export async function runSimulate(opts) {
  log.blank();
  console.log(bold('  ▶  Netra Simulation'));
  log.blank();

  if (!opts.apiKey) {
    log.error(`${red('NETRA_API_KEY')} is not set. Add it to ${cyan('.env')} or pass ${cyan('--api-key')}.`);
    process.exit(1);
  }
  if (!opts.datasetId) {
    log.error(`${red('NETRA_DATASET_ID')} is not set. Add it to ${cyan('.env')} or pass ${cyan('--dataset-id')}.`);
    process.exit(1);
  }

  log.info(`Run name:   ${bold(opts.name)}`);
  log.info(`Dataset ID: ${bold(opts.datasetId)}`);
  log.info(`Browser:    ${bold(opts.headed ? 'headed (visible)' : 'headless')}`);
  log.blank();

  // Initialise SDK
  const sdkSpin = spinner('Initialising Netra SDK…');
  await Netra.init({
    appName: 'singtel-chatbot',
    headers: `x-api-key=${opts.apiKey}`,
  });
  sdkSpin.succeed('Netra SDK initialised');

  // Launch browser
  const browserSpin = spinner('Launching browser…');
  const browser = await launchBrowser(opts.headed);
  const page = await newPage(browser);
  browserSpin.succeed('Browser launched');

  // Open chatbot
  const widgetSpin = spinner('Opening Singtel chat widget…');
  try {
    await openChatWidget(page, widgetSpin);
    widgetSpin.succeed('Chat widget ready');
  } catch (err) {
    widgetSpin.fail(`Failed to open chat widget: ${err.message}`);
    await browser.close();
    process.exit(1);
  }

  log.blank();
  log.divider();
  console.log(`  ${cyan('TURNS')}`);
  log.divider();
  log.blank();

  // Task executed once per simulation item
  class SingtelChatbotTask extends BaseTask {
    constructor() { super(); }

    async run(message, sessionId) {
      log.userMsg(message);
      const sent = await findAndSendMessage(page, message);
      if (!sent) throw new Error('Could not locate chatbot input field');

      const waitSpin = spinner('Waiting for bot response…');
      await page.waitForTimeout(10000);

      const botResponse = await extractLatestBotResponse(page);
      if (!botResponse) {
        waitSpin.fail('No response extracted from bot');
        throw new Error('Could not extract bot response');
      }
      waitSpin.succeed('Response received');
      log.botMsg(botResponse);
      log.blank();

      return { message: botResponse, sessionId: sessionId ?? 'singtel-session' };
    }
  }

  // Run simulation
  const simSpin = spinner('Running simulation (this may take a while)…');
  let result;
  try {
    result = await Netra.simulation.runSimulation({
      name: opts.name,
      datasetId: opts.datasetId,
      task: new SingtelChatbotTask(),
      maxConcurrency: 1,
    });
    simSpin.succeed('Simulation complete');
  } catch (err) {
    simSpin.fail(`Simulation error: ${err.message}`);
    await browser.close();
    process.exit(1);
  } finally {
    await browser.close();
  }

  // Results summary
  log.blank();
  log.divider();
  console.log(`  ${cyan('RESULTS')}`);
  log.divider();

  if (result) {
    log.ok(`Total items : ${bold(String(result.totalItems))}`);
    log.ok(`Completed   : ${green(String(result.completed.length))}`);
    if (result.failed.length > 0) {
      log.warn(`Failed      : ${red(String(result.failed.length))}`);
      log.blank();
      for (const f of result.failed) {
        log.error(`Run item ${bold(f.runItemId)}: ${f.error}`);
      }
    } else {
      log.ok(`Failed      : ${green('0')}`);
    }
  } else {
    log.warn('Simulation returned no result object');
  }

  log.blank();
  log.ok('Done. View full results in the Netra dashboard.');
  log.blank();
}
