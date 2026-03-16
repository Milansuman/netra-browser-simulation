import { validateBrowserAdapter } from './interface.js';
import { singtelBrowserAdapter } from '../singtel/adapter.js';
import { casperBrowserAdapter } from '../casper/adapter.js';
import { redfinBrowserAdapter } from '../redfin/adapter.js';

const ADAPTERS = {
    singtel: singtelBrowserAdapter,
    casper: casperBrowserAdapter,
    redfin: redfinBrowserAdapter,
};

export function listSupportedAgents() {
    return Object.keys(ADAPTERS);
}

export function resolveBrowserAdapter(agentId = 'singtel') {
    const key = String(agentId || 'singtel').toLowerCase();
    const adapter = ADAPTERS[key];

    if (!adapter) {
        const supported = listSupportedAgents().join(', ');
        throw new Error(`Unknown agent "${agentId}". Supported agents: ${supported}`);
    }

    return validateBrowserAdapter(adapter, key);
}
