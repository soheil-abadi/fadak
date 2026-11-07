import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  experimental: {
    // Use the installed compiler API; detached CLI output is unavailable in the sandbox.
    useTypeScriptCli: false,
  },
};

export default config;
