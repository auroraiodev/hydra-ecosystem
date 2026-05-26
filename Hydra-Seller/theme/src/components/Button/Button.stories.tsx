import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '.';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'FlowButton — the primary CTA component. Features an animated circle expansion on hover and multiple visual variants.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link', 'white-static', 'vault'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'icon'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Add to Cart', variant: 'default', size: 'md' },
};

export const Vault: Story = {
  args: { children: 'Explore Vault', variant: 'vault', size: 'md' },
};

export const WithArrow: Story = {
  args: { children: 'Browse Singles', variant: 'default', size: 'md', showArrow: true },
};

export const Destructive: Story = {
  args: { children: 'Delete Listing', variant: 'destructive', size: 'md' },
};

export const Ghost: Story = {
  args: { children: 'Cancel', variant: 'ghost', size: 'md' },
};

export const Secondary: Story = {
  args: { children: 'Save Draft', variant: 'secondary', size: 'md' },
};

export const IconButton: Story = {
   args: { variant: 'ghost', size: 'icon', simple: true, children: <Trash2 className="size-4" /> },
 };

export const WithLeadingIcon: Story = {
   args: {
     variant: 'default',
     size: 'md',
     children: (
       <>
         <ShoppingCart className="size-4" />
         Add to Cart
       </>
     ),
   },
 };

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <Button key={size} size={size}>
          {size.toUpperCase()}
        </Button>
      ))}
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-start">
      {(['default', 'secondary', 'destructive', 'outline', 'ghost', 'vault'] as const).map(
        (variant) => (
          <Button key={variant} variant={variant}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Button>
        )
      )}
    </div>
  ),
};
