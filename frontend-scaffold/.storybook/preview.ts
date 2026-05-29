import type { Preview } from '@storybook/react-vite';
import '../src/index.scss';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FFFFFF' },
        { name: 'off-white', value: '#FAFAFA' },
        { name: 'dark', value: '#000000' },
      ],
    },
  },
};

export default preview;
