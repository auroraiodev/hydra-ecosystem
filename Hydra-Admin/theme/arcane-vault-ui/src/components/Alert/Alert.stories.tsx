import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '.';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['error', 'success', 'info', 'warning', 'vault'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Error: Story = {
  args: { message: 'Your session has expired. Please log in again.', type: 'error' },
};

export const Success: Story = {
  args: { message: 'Order placed successfully!', type: 'success' },
};

export const Info: Story = {
  args: { message: 'Your listing will be reviewed within 24 hours.', type: 'info' },
};

export const Warning: Story = {
  args: { message: 'Low stock — only 2 copies remaining.', type: 'warning' },
};

export const Vault: Story = {
  args: { message: 'Vault mode active. Premium cards are now visible.', type: 'vault' },
};
