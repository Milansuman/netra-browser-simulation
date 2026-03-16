// ─── ANSI colour primitives ──────────────────────────────────────────────────
const R = '\x1b[0m';
const paint = (code, s) => `${code}${s}${R}`;

export const bold    = s => paint('\x1b[1m', s);
export const dim     = s => paint('\x1b[2m', s);
export const red     = s => paint('\x1b[1;31m', s);
export const green   = s => paint('\x1b[1;32m', s);
export const yellow  = s => paint('\x1b[33m', s);
export const cyan    = s => paint('\x1b[36m', s);
export const magenta = s => paint('\x1b[1;35m', s);
export const blue    = s => paint('\x1b[34m', s);
export const white   = s => paint('\x1b[37m', s);

// ─── Structured logger ───────────────────────────────────────────────────────
export const log = {
  info:    (...a) => console.log(` ${blue('ℹ')}  ${a.join(' ')}`),
  ok:      (...a) => console.log(` ${green('✔')}  ${a.join(' ')}`),
  warn:    (...a) => console.log(` ${yellow('⚠')}  ${a.join(' ')}`),
  error:   (...a) => console.error(` ${red('✖')}  ${a.join(' ')}`),
  step:    (...a) => console.log(` ${cyan('›')}  ${a.join(' ')}`),
  blank:   ()     => console.log(),
  divider: ()     => console.log(dim('  ' + '─'.repeat(60))),

  userMsg: msg => {
    console.log(`  ${magenta('YOU')}  ${bold(msg)}`);
  },

  botMsg: msg => {
    const lines = String(msg).split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    console.log(`  ${green('BOT')}  ${lines[0]}`);
    for (let i = 1; i < lines.length; i++) {
      console.log(`       ${dim(lines[i])}`);
    }
  },
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function spinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let label = text;
  const id = setInterval(() => {
    process.stdout.write(`\r ${cyan(frames[i++ % frames.length])}  ${label}   `);
  }, 80);
  return {
    succeed: msg => { clearInterval(id); process.stdout.write(`\r ${green('✔')}  ${msg}\n`); },
    fail:    msg => { clearInterval(id); process.stdout.write(`\r ${red('✖')}  ${msg}\n`); },
    update:  msg => { label = msg; },
  };
}

// ─── Banner ───────────────────────────────────────────────────────────────────
export function printBanner() {
  console.log();
  console.log(magenta('  ╔══════════════════════════════════════════════════╗'));
  console.log(magenta('  ║') + bold('   Browser Chatbot · Netra Simulation CLI         ') + magenta('║'));
  console.log(magenta('  ╚══════════════════════════════════════════════════╝'));
  console.log();
}

// ─── Help text ───────────────────────────────────────────────────────────────
export function printHelp() {
  printBanner();
  console.log(bold('  USAGE'));
  console.log(`    ${cyan('node cli.js')} ${yellow('<command>')} ${dim('[options]')}`);
  log.blank();

  console.log(bold('  COMMANDS'));
  console.log(`    ${yellow('simulate')}       Run Netra simulation against a configured chatbot agent`);
  console.log(`    ${yellow('chat')}           Run a standalone multi-turn conversation`);
  console.log(`    ${yellow('add-scenarios')}  Add multi-turn simulation scenarios to a Netra dataset`);
  log.blank();

  console.log(bold('  GLOBAL OPTIONS'));
  console.log(`    ${green('--headed')}           Open a visible browser window ${dim('(default: headless)')}`);
  console.log(`    ${green('--help, -h')}         Show this help message`);
  log.blank();

  console.log(bold('  SIMULATE OPTIONS'));
  console.log(`    ${green('--agent')} ${dim('<id>')}     Agent adapter to run ${dim('(default: singtel)')}`);
  console.log(`    ${green('--name')} ${dim('<text>')}     Label for this simulation run`);
  console.log(`    ${green('--dataset-id')} ${dim('<id>')} Override NETRA_DATASET_ID from .env`);
  console.log(`    ${green('--api-key')} ${dim('<key>')}   Override NETRA_API_KEY from .env`);
  log.blank();

  console.log(bold('  CHAT OPTIONS'));
  console.log(`    ${green('--message')} ${dim('<text>')}        Add a message ${dim('(repeatable, uses default 8-turn script if omitted)')}`);
  console.log(`    ${green('--screenshots')} ${dim('<dir>')}     Save screenshots to directory`);
  console.log(`    ${green('--output')} ${dim('<file>')}         Write JSON transcript to file`);
  log.blank();

  console.log(bold('  ADD-SCENARIOS OPTIONS'));
  console.log(`    ${green('--dataset-id')} ${dim('<id>')}       Override NETRA_DATASET_ID from .env`);
  console.log(`    ${green('--auth-token')} ${dim('<token>')}    Override NETRA_AUTH_TOKEN from .env`);
  console.log(`    ${green('--org-id')} ${dim('<id>')}           Override NETRA_ORG_ID from .env`);
  console.log(`    ${green('--endpoint')} ${dim('<url>')}        Override NETRA_OTLP_ENDPOINT from .env`);
  console.log(`    ${green('--scenario-file')} ${dim('<path>')}  JSON file with scenario objects ${dim('(uses built-in defaults if omitted)')}`);
  log.blank();

  console.log(bold('  EXAMPLES'));
  console.log(`    ${dim('# Run Netra simulation using .env credentials')}`);
  console.log(`    ${cyan('node cli.js simulate')}`);
  log.blank();
  console.log(`    ${dim('# Run simulation against a specific agent adapter')}`);
  console.log(`    ${cyan('node cli.js simulate --agent singtel')}`);
  log.blank();
  console.log(`    ${dim('# Simulation with visible browser and custom run name')}`);
  console.log(`    ${cyan('node cli.js simulate --agent singtel --headed --name "Sprint-42 Regression"')}`);
  log.blank();
  console.log(`    ${dim('# Quick 2-message chat')}`);
  console.log(`    ${cyan('node cli.js chat --message "Hi" --message "What are your 5G plans?"')}`);
  log.blank();
  console.log(`    ${dim('# Default 8-turn script, save screenshots + JSON transcript')}`);
  console.log(`    ${cyan('node cli.js chat --screenshots ./screenshots --output transcript.json')}`);
  log.blank();
  console.log(`    ${dim('# Add built-in default scenarios to a dataset')}`);
  console.log(`    ${cyan('node cli.js add-scenarios')}`);
  log.blank();
  console.log(`    ${dim('# Add scenarios from a JSON file')}`);
  console.log(`    ${cyan('node cli.js add-scenarios --scenario-file ./scenarios.json')}`);
  log.blank();
}
