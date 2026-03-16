const REQUIRED_METHODS = ['openChatWidget', 'sendMessage', 'extractLatestBotResponse'];

export function validateBrowserAdapter(adapter, agentId) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error(`Invalid adapter for agent "${agentId}": adapter object is missing`);
  }

  for (const method of REQUIRED_METHODS) {
    if (typeof adapter[method] !== 'function') {
      throw new Error(`Invalid adapter for agent "${agentId}": missing method ${method}()`);
    }
  }

  return adapter;
}

export const DEFAULT_ADAPTER_CONFIG = {
  initialMessageTimeoutMs: 30_000,
  responsePollIntervalMs: 2_000,
  responseTimeoutMs: 5 * 60_000,
};
