// Try every frame for an input field; fill and submit.
export async function findAndSendMessage(page, message) {
    const inputBox = page.locator("div[data-sierra-chat-container=\"\"] >> textarea").first();
    await inputBox.waitFor({ state: 'visible', timeout: 15000 });
    await inputBox.fill(message);
    await inputBox.press('Enter');
    return true;
}

// Strip noise around the bot's last reply and return clean text.
export function cleanBotResponse(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    let out = raw;
    // out = out.split(/\s*You\s+said\s*:\s*/i)[0];
    // out = out.split(/\b(End of chat|Connectivity Status)/i)[0];
    // out = out
    //     .replace(/\b(Shirley|You)\s+at\s+\d{1,2}\s+\w+\s*,?\s*\d{1,2}:\d{2}/gi, '')
    //     .trim();
    // out = out.replace(/^\s*Bot\s+said\s*:\s*/i, '').trim();
    // out = out.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    return out || null;
}

// Walk all frames and extract the last "Bot said: ..." block.
export async function extractLatestBotResponse(page) {
    const assistantChatBubbles = page.locator('div[data-sierra-chat-container=\"\"] >> div.bg-chatAssistantBubble');
    const bubbleCount = await assistantChatBubbles.count();
    if (bubbleCount === 0) return null;

    const lastBubble = assistantChatBubbles.nth(bubbleCount - 1);
    const message = (await lastBubble.textContent()) ?? '';

    // If the conversation has ended, tag the extracted message for downstream evaluators.
    const chatContainerText = await page.locator('div[data-sierra-chat-container] >> div.border-t-chatBorder').first().textContent();
    const chatEnded = (chatContainerText ?? '').includes('Chat ended');

    return chatEnded
        ? `${message}${message ? ' ' : ''}[Chat ended by agent]`
        : message;
}

// Navigate to casper.com and open the chat widget.
export async function openChatWidget(page, spin) {
    spin.update('Navigating to casper.com...');
    await page.goto('https://www.casper.com/', {
        waitUntil: 'networkidle',
        timeout: 60000,
    });

    spin.update('Waiting for page to settle...');
    //   await page.waitForTimeout(2000);

    spin.update('Opening chat widget...');
    const chatBtn = page.locator('div[data-sierra-chat-launcher=""] >> button').first();
    await chatBtn.waitFor({ state: 'visible', timeout: 15000 });
    await chatBtn.click();

    spin.update('Waiting for chat to load...');
    await page.waitForTimeout(8000);
}
