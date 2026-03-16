import {
  openChatWidget,
  findAndSendMessage,
  extractLatestBotResponse,
  cleanBotResponse,
} from './browser.js';
import { DEFAULT_ADAPTER_CONFIG } from '../adapters/interface.js';

export const redfinBrowserAdapter = {
  id: 'redfin',
  name: 'Redfin',
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