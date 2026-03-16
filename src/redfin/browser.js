// Try every frame for an input field; fill and submit.
export async function findAndSendMessage(page, message) {
    const input = page.locator('input.InputWrapper__input');
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
    const botMessages = page.locator('div.text-only-message-bot div.sendbird-message-content__middle__body-container>span:nth-child(1)');
    const botSearchResultMessages = page.locator('div.SearchResultMessage');
    const count = await botMessages.count();
    if (count === 0) return null;

    const botSearchResultCount = await botSearchResultMessages.count();
    if (botSearchResultCount > 0) {
        const lastBotMessage = botMessages.nth(count - 1);
        const lastSearchResultMessage = botSearchResultMessages.nth(botSearchResultCount - 1);

        const botEl = await lastBotMessage.elementHandle();
        const searchEl = await lastSearchResultMessage.elementHandle();
        const isSearchResultLatest = await page.evaluate(([b, s]) => {
            return !!(b.compareDocumentPosition(s) & 4); // 4 = DOCUMENT_POSITION_FOLLOWING
        }, [botEl, searchEl]);

        if (!isSearchResultLatest) {
            const text = (await lastBotMessage.textContent()) ?? '';
            return text.trim() || null;
        }

        let text = '';

        const searchResultIntroSection = lastSearchResultMessage.locator('div.introSection div.sendbird-message-content__middle__body-container');
        const followUpSection = lastSearchResultMessage.locator('div.followUpSection div.sendbird-message-content__middle__body-container > span:nth-child(1)');
        const searchResults = lastSearchResultMessage.locator('div.bp-Homecard__Content');

        text += (await searchResultIntroSection.textContent()) ?? '';
        for(let i = 0; i < await searchResults.count(); i++) {
            text += "\n=========\n";
            text += (await searchResults.nth(i).textContent()) ?? '';
            text += "\n=========\n";
        }
        text += (await followUpSection.textContent()) ?? '';

        return text.trim() || null;
    }

    const lastMessage = botMessages.nth(count - 1);
    const text = (await lastMessage.textContent()) ?? '';
    return text.trim() || null;
}

export async function openChatWidget(page, spin) {
    spin.update('Navigating to redfin.com/chat...');
    await page.goto('https://www.redfin.com/chat', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
    });
}
