import { Netra, BaseTask } from 'netra-sdk';
import { log, spinner, bold, green, red, cyan, yellow } from './ui.js';
import {
  launchBrowser,
  newPage,
  openChatWidget,
  findAndSendMessage,
  extractLatestBotResponse,
} from './browser.js';
import {randomUUID} from "crypto"
import { mkdir } from 'fs/promises'
import { join } from 'path'

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
    debugMode: true
  });
  sdkSpin.succeed('Netra SDK initialised');

  // Launch browser
  const browserSpin = spinner('Launching browser…');
  browserSpin.succeed('Browser ready (instances launched per simulation)');

  log.blank();
  log.divider();
  console.log(`  ${cyan('TURNS')}`);
  log.divider();
  log.blank();

  // Task executed once per simulation item — each sessionId gets its own browser
  class SingtelChatbotTask extends BaseTask {
    constructor() {
      super();
      this._sessions = new Map(); // sessionId → { browser, page, initialBotMessage, firstTurn }
    }

    async _screenshot(sessionId, page) {
      try {
        const dir = join(process.cwd(), 'screenshots');
        await mkdir(dir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const file = join(dir, `debug-${sessionId}-${ts}.png`);
        await page.screenshot({ path: file, fullPage: true });
        log.warn(`[${sessionId}] Screenshot saved: ${file}`);
      } catch (screenshotErr) {
        log.warn(`[${sessionId}] Could not save screenshot: ${screenshotErr.message}`);
      }
    }

    async _initSession(sessionId) {
      const browser = await launchBrowser(opts.headed);
      const page = await newPage(browser);
      const widgetSpin = spinner(`[${sessionId}] Opening Singtel chat widget…`);
      try {
        await openChatWidget(page, widgetSpin);
        widgetSpin.succeed(`[${sessionId}] Chat widget ready`);
      } catch (err) {
        widgetSpin.fail(`[${sessionId}] Failed to open chat widget: ${err.message}`);
        await this._screenshot(sessionId, page);
        await browser.close();
        throw err;
      }

      const initSpin = spinner(`[${sessionId}] Waiting for agent opening message…`);
      let initialBotMessage = null;
      const initDeadline = Date.now() + 30 * 1000;
      while (Date.now() < initDeadline) {
        await page.waitForTimeout(2000);
        const candidate = await extractLatestBotResponse(page);
        if (candidate) {
          initialBotMessage = candidate;
          break;
        }
      }
      if (initialBotMessage) {
        initSpin.succeed(`[${sessionId}] Opening message captured`);
        log.botMsg(initialBotMessage);
      } else {
        initSpin.fail(`[${sessionId}] Agent did not send an opening message within 30 s`);
        await this._screenshot(sessionId, page);
        await browser.close();
        throw new Error('Agent did not send an opening message');
      }
      log.blank();

      const session = { browser, page, initialBotMessage, firstTurn: true, history: [] };
      this._sessions.set(sessionId, session);
      return session;
    }

    async closeAll() {
      for (const session of this._sessions.values()) {
        await session.browser.close().catch(() => {});
      }
    }

    async run(message, sessionId) {
      const key = sessionId ?? randomUUID().toString();
      let session = this._sessions.get(key);
      if (!session) {
        session = await this._initSession(key);
      }

      // On the first turn, return the agent's opening message without sending anything
      if (session.firstTurn && session.initialBotMessage) {
        session.firstTurn = false;
        session.history.push({ role: 'agent', message: session.initialBotMessage });
        log.info(`[${key}] First turn: returning agent opening message`);
        log.blank();
        return { message: session.initialBotMessage, sessionId: key };
      }
      session.firstTurn = false;

      // Guard: skip if this exact user message was already sent in this session
      const alreadySent = session.history.some(e => e.role === 'user' && e.message === message);
      if (alreadySent) {
        log.warn(`[${key}] Duplicate message detected, skipping: "${message.substring(0, 60)}"`);
        const lastAgent = [...session.history].reverse().find(e => e.role === 'agent');
        return { message: lastAgent?.message ?? '', sessionId: key };
      }

      session.history.push({ role: 'user', message });
      log.userMsg(message);
      const sent = await findAndSendMessage(session.page, message);
      if (!sent) {
        await this._screenshot(key, session.page);
        throw new Error('Could not locate chatbot input field');
      }

      const waitSpin = spinner('Waiting for bot response…');
      const lastAgentMessage = [...session.history].reverse().find(e => e.role === 'agent')?.message ?? null;

      // Poll until the bot returns a response that differs from the previous one
      let botResponse = null;
      const deadline = Date.now() + 1000 * 60 * 5;
      while (Date.now() < deadline) {
        await session.page.waitForTimeout(2000);
        const candidate = await extractLatestBotResponse(session.page);
        if (candidate && candidate !== lastAgentMessage) {
          botResponse = candidate;
          break;
        }
      }
      if (!botResponse) {
        waitSpin.fail('No response extracted from bot');
        await this._screenshot(key, session.page);
        botResponse = "[Agent did not respond]";
      }
      waitSpin.succeed('Response received');
      log.botMsg(botResponse);
      log.blank();

      if(botResponse.length === 0) botResponse = "[Agent did not provide a response.]"

      session.history.push({ role: 'agent', message: botResponse ?? "[Agent did not provide a response.]" });
      return { message: botResponse ?? "[Agent did not provide a response.]", sessionId: key };
    }
  }

  // Run simulation
  const simSpin = spinner('Running simulation (this may take a while)…');
  const task = new SingtelChatbotTask();
  let result;
  try {
    result = await Netra.simulation.runSimulation({
      name: opts.name,
      datasetId: opts.datasetId,
      task,
      maxConcurrency: 5
    });
    console.log(result)
    simSpin.succeed('Simulation complete');
  } catch (err) {
    simSpin.fail(`Simulation error: ${err.message}`);
    await task.closeAll();
    process.exit(1);
  } finally {
    await task.closeAll();
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
