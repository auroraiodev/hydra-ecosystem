import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from '.';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Search cards...' },
};

export const WithLabel: Story = {
  args: { label: 'Email', placeholder: 'you@example.com', icon: 'email' },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    error: 'Username is already taken',
    value: 'demis',
  },
};

export const PasswordField: Story = {
  render: function PasswordToggle() {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        showPasswordToggle
        isPasswordVisible={visible}
        onTogglePassword={() => setVisible((v) => !v)}
      />
    );
  },
};
