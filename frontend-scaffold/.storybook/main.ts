import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    // Remove the SRI plugin — it fetches external URLs at build time which
    // fails in offline / CI environments and is not needed for Storybook.
    config.plugins = (config.plugins ?? []).filter(
      (p) => !(p && typeof p === 'object' && 'name' in p && p.name === 'vite-plugin-sri'),
    );
    return config;
  },
};

export default config;
