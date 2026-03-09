import { chromium } from 'playwright';

export async function launchBrowser(headed = false) {
  return chromium.launch({
    headless: !headed,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export async function newPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  return context.newPage();
}

// Try every frame for an input field; fill and submit.
export async function findAndSendMessage(page, message) {
  for (const frame of page.frames()) {
    try {
      const input = frame
        .locator('input[type="text"], textarea, [contenteditable="true"]')
        .first();
      if ((await input.count()) > 0 && (await input.isVisible())) {
        await input.fill(message);
        await input.press('Enter');
        return true;
      }
    } catch (_) {}
  }
  return false;
}

// Strip noise around the bot's last reply and return clean text.
export function cleanBotResponse(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  let out = raw;
  out = out.split(/\s*You\s+said\s*:\s*/i)[0];
  out = out.split(/\b(End of chat|Connectivity Status)/i)[0];
  out = out
    .replace(/\b(Shirley|You)\s+at\s+\d{1,2}\s+\w+\s*,?\s*\d{1,2}:\d{2}/gi, '')
    .trim();
  out = out.replace(/^\s*Bot\s+said\s*:\s*/i, '').trim();
  out = out.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  return out || null;
}

// Walk all frames and extract the last "Bot said: …" block.
export async function extractLatestBotResponse(page) {
  const allText = [];
  for (const frame of page.frames()) {
    try {
      const body = frame.locator('body').first();
      if ((await body.count()) > 0) {
        const text = await body.textContent();
        if (text) allText.push(text);
      }
    } catch (_) {}
  }
  const full = allText.join('\n');
  const re = /Bot\s+said\s*:\s*/gi;
  let lastIndex = -1, labelLen = 0, m;
  while ((m = re.exec(full)) !== null) {
    lastIndex = m.index;
    labelLen = m[0].length;
  }
  if (lastIndex === -1) return null;
  const rest = full.slice(lastIndex + labelLen);
  const boundary =
    /(\n|^)\s*(You\s+said\s*:|(?:Shirley|You)\s+at\s+\d|End\s+of\s+chat|Connectivity\s+Status)/i;
  const bm = rest.match(boundary);
  const block = bm ? rest.slice(0, bm.index).trim() : rest.trim();
  return block ? cleanBotResponse(block) : null;
}

// Navigate to singtel.com and open the chat widget.
export async function openChatWidget(page, spin) {
  spin.update('Navigating to singtel.com…');
  await page.goto('https://www.singtel.com/', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  spin.update('Waiting for page to settle…');
  await page.waitForTimeout(10000);

  // Dismiss cookie banner if present.
  try {
    const cookieClose = page
      .locator('[aria-label="Close"], button:has-text("×"), [class*="cookie"] button')
      .first();
    if (await cookieClose.isVisible()) {
      await cookieClose.click();
      await page.waitForTimeout(1000);
    }
  } catch (_) {}

  spin.update('Opening chat widget…');
  let clicked = false;

  // 1 — text link
  try {
    const chatLink = page.getByText(/Live chat|^Chat$/i).first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      clicked = true;
    }
  } catch (_) {}

  // 2 — bottom-right clickable element
  if (!clicked) {
    const els = await page
      .locator('button, a, [role="button"], div[tabindex="0"]')
      .all();
    for (const el of els) {
      try {
        const box = await el.boundingBox();
        if (box && box.x > 1100 && box.y > 600) {
          const text = (await el.textContent()) || '';
          if (
            text.toLowerCase().includes('chat') ||
            text.toLowerCase().includes('live') ||
            text.length < 30
          ) {
            await el.click();
            clicked = true;
            break;
          }
        }
      } catch (_) {}
    }
  }

  // 3 — LivePerson iframe button
  if (!clicked) {
    for (const frame of page.frames()) {
      try {
        if (
          frame.url().includes('liveperson') ||
          frame.url().includes('lp')
        ) {
          const btn = frame
            .locator('button, [role="button"], a, div[tabindex="0"], img')
            .first();
          if ((await btn.count()) > 0 && (await btn.isVisible())) {
            await btn.click();
            clicked = true;
            break;
          }
        }
      } catch (_) {}
    }
  }

  // 4 — last resort: click known coordinates
  if (!clicked) {
    await page.mouse.click(1220, 720);
  }

  spin.update('Waiting for chat to load…');
  await page.waitForTimeout(8000);
}
