// Try every frame for an input field; fill and submit.
export async function findAndSendMessage(page, message) {
    const input = page.locator('textarea');
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
    const assistantChatBubbles = page.locator('div.bg-chatAssistantBubble');
    const bubbleCount = await assistantChatBubbles.count();
    if (bubbleCount === 0) return null;

    await page.waitForTimeout(10000);
    const lastBubble = assistantChatBubbles.nth(bubbleCount - 1);
    const message = (await lastBubble.textContent()) ?? '';

    // // If the conversation has ended, tag the extracted message for downstream evaluators.
    // const chatEndedMessages = page.locator('div[data-sierra-chat-container] >> li[part="chat-ended-message"]');
    // let chatEnded = false;
    // if (await chatEndedMessages.count()) {
    //     const chatContainerText = await chatEndedMessages.first().textContent();
    //     chatEnded = (chatContainerText ?? '').includes('Chat ended');
    // }
    let chatEnded = false;

    return chatEnded
        ? `${message}${message ? ' ' : ''}[Chat ended by agent]`
        : message;
}

export async function openChatWidget(page, spin) {
    spin.update('Navigating to wilson...');
    await page.goto('https://sierra.chat/agent/eeIowHABloVL6AQBloVL6DtRB7zfgLIW3QqQ34mZ7Kg/chat', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
    });
}
