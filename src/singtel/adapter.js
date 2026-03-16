import {
  openChatWidget,
  findAndSendMessage,
  extractLatestBotResponse,
  cleanBotResponse,
} from './browser.js';
import { DEFAULT_ADAPTER_CONFIG } from '../adapters/interface.js';

export const singtelBrowserAdapter = {
  id: 'singtel',
  name: 'Singtel',
  config: {
    ...DEFAULT_ADAPTER_CONFIG,
  },
  async openChatWidget(page, spin) {
    return openChatWidget(page, spin);
  },
  async sendMessage(page, message) {
    return findAndSendMessage(page, message);
  },
  async extractLatestBotResponse(page) {
    return extractLatestBotResponse(page);
  },
  cleanBotResponse,
};
