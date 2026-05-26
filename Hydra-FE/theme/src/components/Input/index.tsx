import React from 'react';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode | 'email' | 'person';
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}

function InputIcon({ icon }: { icon: React.ReactNode | 'email' | 'person' }) {
  if (!icon) return null;
  if (icon === 'email') return <Mail className="size-5" />;
  if (icon === 'person') return <User className="size-5" />;
  return icon as React.ReactNode;
}

export const Input = (
  {
    label,
    error,
    icon,
    showPasswordToggle = false,
    isPasswordVisible = false,
    onTogglePassword,
    className = '',
    type,
    ref,
    ...props
  }: InputProps & { ref?: React.Ref<HTMLInputElement> }
) => {
  const isPassword = type === 'password';
  const inputType =
    isPassword && showPasswordToggle
      ? isPasswordVisible ? 'text' : 'password'
      : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-black text-text-muted px-1">{label}</label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
            <InputIcon icon={icon} />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'w-full h-12 bg-surface-container-low/50 border border-white/10 rounded-xl px-4',
            'text-text-body font-medium placeholder:text-text-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
            'transition-all duration-200',
            icon && 'pl-11',
            showPasswordToggle && 'pr-12',
            error && 'border-red-500/50 ring-red-500/10',
            className
          )}
          {...props}
        />
        {showPasswordToggle && onTogglePassword && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              type="button"
              onClick={onTogglePassword}
              variant="ghost"
              size="icon"
              simple
              className="size-9 text-text-muted hover:text-primary transition-colors"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        )}
      </div>
      {error && <span className="text-xs font-bold text-red-500 px-1">{error}</span>}
    </div>
  );
};
