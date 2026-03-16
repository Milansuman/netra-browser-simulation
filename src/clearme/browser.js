// Try every frame for an input field; fill and submit.
export async function findAndSendMessage(page, message) {
    const input = page.locator('div[data-sierra-chat-container=""] >> textarea');
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill(message);
    await input.press('Enter');
    return true;
}

// Strip noise around the bot's last reply and return clean text.
export function cleanBotResponse(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    let out = raw;
    return out || null;
}

export async function extractLatestBotResponse(page) {
    const assistantChatBubbles = page.locator('div[data-sierra-chat-container=\"\"] >> div.bg-chatAssistantBubble');
    const bubbleCount = await assistantChatBubbles.count();
    if (bubbleCount === 0) return null;

    const lastBubble = assistantChatBubbles.nth(bubbleCount - 1);
    await page.waitForTimeout(3000);
    const message = (await lastBubble.textContent()) ?? '';

    // If the conversation has ended, tag the extracted message for downstream evaluators.
    const chatContainerText = await page.locator('div[data-sierra-chat-container] >> div.border-t-chatBorder').first().textContent();
    const chatEnded = (chatContainerText ?? '').includes('Chat ended');

    return chatEnded
        ? `${message}${message ? ' ' : ''}[Chat ended by agent]`
        : message;
}

export async function openChatWidget(page, spin) {
    spin.update('Navigating to clearme.com...');
    await page.goto('https://www.clearme.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
    });

    const cookieBannerRejectButton = page.locator('button#onetrust-reject-all-handler');
    cookieBannerRejectButton.waitFor({ state: 'visible', timeout: 15000 }).then(() => cookieBannerRejectButton.click()).catch(() => {});

    const chatWidgetButton = page.locator('div[data-sierra-chat-launcher=""] >> button');
    await chatWidgetButton.waitFor({ state: 'visible', timeout: 15000 });
    await chatWidgetButton.click();
}
