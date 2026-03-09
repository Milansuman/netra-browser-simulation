import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { log, spinner, bold, green, red, cyan, magenta, dim } from './ui.js';
import {
  launchBrowser,
  newPage,
  openChatWidget,
  findAndSendMessage,
  extractLatestBotResponse,
} from './browser.js';

// Default 8-turn iPhone purchase script (mirrors the recorded conversation).
const DEFAULT_MESSAGES = [
  "Hi, I need to buy an iPhone",
  "I'm looking to buy an iPhone 16 Pro Max. What plans do you have available?",
  "What's the monthly cost for the plan with the most data?",
  "Does it come with 5G?",
  "Can I trade in my old phone?",
  "What about the contract duration? Is it 12 or 24 months?",
  "Are there any ongoing promotions or discounts right now?",
  "Okay thank you for the help! I'll visit the store to check it out.",
];

export async function runChat(opts) {
  log.blank();
  console.log(bold('  ▶  Standalone Conversation'));
  log.blank();

  const messages = opts.messages.length > 0 ? opts.messages : DEFAULT_MESSAGES;
  if (opts.messages.length === 0) {
    log.info(`No ${cyan('--message')} flags supplied — using default ${bold(String(messages.length))}-turn iPhone script`);
  }

  log.info(`Messages:    ${bold(String(messages.length))}`);
  log.info(`Browser:     ${bold(opts.headed ? 'headed (visible)' : 'headless')}`);
  if (opts.screenshots) log.info(`Screenshots: ${bold(opts.screenshots)}`);
  if (opts.output)      log.info(`Output:      ${bold(opts.output)}`);
  log.blank();

  // Ensure screenshot directory exists
  if (opts.screenshots && !existsSync(opts.screenshots)) {
    mkdirSync(opts.screenshots, { recursive: true });
    log.ok(`Created screenshot directory: ${cyan(opts.screenshots)}`);
  }

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

  if (opts.screenshots) {
    await page.screenshot({ path: `${opts.screenshots}/00-chat-open.png` });
    log.step(`Screenshot saved: ${dim('00-chat-open.png')}`);
  }

  log.blank();
  log.divider();
  console.log(`  ${cyan('CONVERSATION')}`);
  log.divider();
  log.blank();

  const transcript = [];
  const startedAt = Date.now();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const tag = dim(`[${i + 1}/${messages.length}]`);

    console.log(`  ${tag} ${magenta('YOU')} › ${bold(msg)}`);

    const sent = await findAndSendMessage(page, msg);
    if (!sent) {
      log.warn('Could not find input field — skipping');
      transcript.push({ turn: i + 1, user: msg, bot: null, error: 'input not found' });
      log.blank();
      continue;
    }

    const waitSpin = spinner('Waiting for Shirley to respond…');
    await page.waitForTimeout(10000);

    if (opts.screenshots) {
      const file = `${String(i + 1).padStart(2, '0')}-msg.png`;
      await page.screenshot({ path: `${opts.screenshots}/${file}` });
    }

    const botResponse = await extractLatestBotResponse(page);
    if (botResponse) {
      waitSpin.succeed('Response received');
      log.botMsg(botResponse);
      transcript.push({ turn: i + 1, user: msg, bot: botResponse });
    } else {
      waitSpin.fail('No response extracted');
      log.warn('Shirley did not respond — continuing');
      transcript.push({ turn: i + 1, user: msg, bot: null, error: 'no response extracted' });
    }
    log.blank();
  }

  await browser.close();

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const successful = transcript.filter(t => t.bot).length;

  // Summary
  log.divider();
  console.log(`  ${cyan('SUMMARY')}`);
  log.divider();
  log.ok(`Turns sent      : ${bold(String(transcript.length))}`);
  log.ok(`Responses got   : ${green(String(successful))} / ${bold(String(transcript.length))}`);
  if (successful < transcript.length) {
    log.warn(`Missed responses: ${red(String(transcript.length - successful))}`);
  }
  log.ok(`Elapsed         : ${bold(elapsed + 's')}`);
  log.blank();

  // Write JSON transcript
  if (opts.output) {
    const payload = {
      timestamp: new Date().toISOString(),
      durationSeconds: parseFloat(elapsed),
      turns: transcript,
    };
    writeFileSync(opts.output, JSON.stringify(payload, null, 2), 'utf8');
    log.ok(`Transcript saved: ${cyan(opts.output)}`);
  }

  if (opts.screenshots) {
    log.ok(`Screenshots in:  ${cyan(opts.screenshots)}`);
  }

  log.blank();
}
