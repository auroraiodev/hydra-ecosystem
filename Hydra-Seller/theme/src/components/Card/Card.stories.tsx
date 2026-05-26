import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '.';
import { Button } from '../Button';
import { VaultBadge } from '../VaultBadge';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Black Lotus</CardTitle>
        <CardDescription>Alpha · Near Mint</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-muted">
          The most iconic Magic: The Gathering card ever printed.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Add to Cart</Button>
        <Button size="sm" variant="ghost">Wishlist</Button>
      </CardFooter>
    </Card>
  ),
};

export const VaultCard: Story = {
  render: () => (
    <Card vault hoverable className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Mox Sapphire</CardTitle>
          <VaultBadge variant="primary">Foil</VaultBadge>
        </div>
        <CardDescription className="text-vault-text-muted">Beta · Light Play</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-vault-text-muted">
          One of the powerful Moxen from the Power Nine.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="vault" size="sm" fullWidth>Add to Cart</Button>
      </CardFooter>
    </Card>
  ),
};
