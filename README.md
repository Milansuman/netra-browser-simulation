# netra-browser-simulation

A CLI tool that opens the Singtel chatbot in a real browser and talks to it automatically — either running a full AI-powered simulation via [Netra](https://netra.ai), or just replaying a conversation script.

---

## How it works

The tool launches a browser (invisibly by default), opens the Singtel chat widget, sends messages one by one, and captures the bot's replies.

There are two modes:

| Command | What it does |
|---|---|
| `simulate` | Pulls test messages from a Netra dataset, sends them to the chatbot, and reports results back to Netra |
| `chat` | Runs a plain conversation — useful for quick checks or capturing a transcript |

---

## Setup

**1. Install dependencies**

```bash
npm install
npx playwright install chromium
```

**2. Create a `.env` file** in the project root (only needed for `simulate`):

```
NETRA_API_KEY=your_api_key_here
NETRA_DATASET_ID=your_dataset_id_here
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

### Global options

| Flag | Description |
|---|---|
| `--headed` | Show the browser window (hidden by default) |
| `--help`, `-h` | Print usage |

---

## Output

- **`simulate`** — prints each turn to the terminal and uploads results to Netra.
- **`chat`** — prints the conversation to the terminal; optionally saves screenshots and a `transcript.json` file.

