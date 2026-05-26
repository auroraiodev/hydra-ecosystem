import type { Meta, StoryObj } from '@storybook/react';
import { VaultBadge } from '.';

const meta: Meta<typeof VaultBadge> = {
  title: 'Components/VaultBadge',
  component: VaultBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Glassmorphic inline badge — uses semi-transparent backgrounds with matching borders to achieve the Arcane Vault frosted glass look.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'gold', 'purple', 'teal', 'blue', 'orange', 'red'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof VaultBadge>;

export const Default: Story = {
  args: { children: 'Near Mint', variant: 'default' },
};

export const Primary: Story = {
  args: { children: 'Foil', variant: 'primary' },
};

export const Gold: Story = {
  args: { children: 'Premium', variant: 'gold' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['default', 'primary', 'gold', 'purple', 'teal', 'blue', 'orange', 'red'] as const).map(
        (variant) => (
          <VaultBadge key={variant} variant={variant}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </VaultBadge>
        )
      )}
    </div>
  ),
};

export const Uppercase: Story = {
  args: { children: 'near mint', variant: 'teal', uppercase: true },
};

export const Capitalize: Story = {
  args: { children: 'LIGHT PLAY', variant: 'blue', capitalize: true },
};

export const NoOutline: Story = {
  args: { children: 'No Border', variant: 'purple', outline: false },
};
