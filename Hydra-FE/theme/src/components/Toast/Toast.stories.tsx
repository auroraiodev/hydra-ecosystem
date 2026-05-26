import type { Meta, StoryObj } from '@storybook/react';
import { Toaster, useToast } from '.';
import { Button } from '../Button';

const meta: Meta = {
  title: 'Components/Toast',
  tags: ['autodocs'],
};
export default meta;

export const Interactive: StoryObj = {
  render: function ToastDemo() {
    const { toasts, addToast, removeToast } = useToast();
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => addToast('Order placed successfully!', 'success')}>
            Success
          </Button>
          <Button size="sm" variant="destructive" onClick={() => addToast('Payment failed. Please retry.', 'error')}>
            Error
          </Button>
          <Button size="sm" variant="secondary" onClick={() => addToast('Your listing is under review.', 'info')}>
            Info
          </Button>
          <Button size="sm" variant="outline" onClick={() => addToast('Low stock — only 2 left.', 'warning')}>
            Warning
          </Button>
        </div>
        <Toaster toasts={toasts} onClose={removeToast} />
      </div>
    );
  },
};
