import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'vault',
      values: [
        { name: 'vault', value: '#0a0c18' },
        { name: 'vault-surface', value: '#12161e' },
        { name: 'light', value: '#fafcfe' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
