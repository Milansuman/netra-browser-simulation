# netra-browser-simulation

A CLI tool that opens the Singtel chatbot in a real browser and talks to it automatically — either running a full AI-powered simulation via [Netra](https://netra.ai), replaying a conversation script, or seeding a Netra dataset with simulation scenarios.

---

## How it works

The tool launches a browser (invisibly by default), opens the Singtel chat widget, sends messages one by one, and captures the bot's replies.

There are three modes:

| Command | What it does |
|---|---|
| `simulate` | Pulls test messages from a Netra dataset, sends them to the chatbot, and reports results back to Netra |
| `chat` | Runs a plain conversation — useful for quick checks or capturing a transcript |
| `add-scenarios` | Adds multi-turn simulation scenarios to a Netra dataset via the Netra REST API |

---

## Setup

**1. Install dependencies**

```bash
npm install
npx playwright install chromium
```

**2. Create a `.env` file** in the project root:

```
# Required for simulate
NETRA_API_KEY=your_api_key_here
NETRA_DATASET_ID=your_dataset_id_here

# Required for add-scenarios
NETRA_AUTH_TOKEN=your_access_token_cookie_value
NETRA_ORG_ID=your_org_id
NETRA_DATASET_ID=your_dataset_id_here
NETRA_OTLP_ENDPOINT=https://api.eu.getnetra.ai/
```

---

## Usage

```bash
node cli.js <command> [options]
```

### `simulate` — run a Netra simulation

```bash
# Uses credentials from .env
node cli.js simulate

# With a visible browser window and a custom run label
node cli.js simulate --headed --name "Sprint-42 Regression"

# Pass credentials inline instead of .env
node cli.js simulate --api-key <key> --dataset-id <id>
```

### `chat` — run a conversation

```bash
# Uses the built-in 8-message iPhone purchase script
node cli.js chat

# Custom messages
node cli.js chat --message "Hi" --message "What are your 5G plans?"

# Save screenshots and a JSON transcript
node cli.js chat --screenshots ./screenshots --output transcript.json
```

### `add-scenarios` — seed a dataset with scenarios

Adds multi-turn simulation scenarios to a Netra dataset — the same way the Netra UI does it, so scenarios appear with Scenario, Behaviour, Persona, and Turns fields.

```bash
# Uses credentials from .env and the two built-in default scenarios
node cli.js add-scenarios

# Load scenarios from a JSON file instead
node cli.js add-scenarios --scenario-file ./scenarios.json

# Override .env values inline
node cli.js add-scenarios --auth-token <token> --org-id <id> --dataset-id <id> --endpoint https://api.eu.getnetra.ai/
```

The `--scenario-file` option accepts a JSON file containing an array of scenario objects:

```json
[
  {
    "scenario": "Description of what the user wants to achieve.",
    "behaviour_instructions": "How the simulated user should behave.",
    "persona": "neutral",
    "max_turns": 5
  }
]
```

#### `add-scenarios` options

| Flag | Description |
|---|---|
| `--dataset-id <id>` | Override `NETRA_DATASET_ID` from `.env` |
| `--auth-token <token>` | Override `NETRA_AUTH_TOKEN` from `.env` (the `access_token_*` cookie from browser DevTools) |
| `--org-id <id>` | Override `NETRA_ORG_ID` from `.env` (the `x-org-id` header in browser DevTools) |
| `--endpoint <url>` | Override `NETRA_OTLP_ENDPOINT` from `.env` |
| `--scenario-file <path>` | JSON file with scenario objects (uses built-in defaults if omitted) |

### Global options

| Flag | Description |
|---|---|
| `--headed` | Show the browser window (hidden by default) |
| `--help`, `-h` | Print usage |

---

## Output

- **`simulate`** — prints each turn to the terminal and uploads results to Netra.
- **`chat`** — prints the conversation to the terminal; optionally saves screenshots and a `transcript.json` file.
- **`add-scenarios`** — prints a success/failure line per scenario with the created item ID.

