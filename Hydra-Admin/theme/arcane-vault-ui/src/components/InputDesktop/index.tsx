import { InputHTMLAttributes, useId } from 'react';
import { Mail, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '../Button';

export interface InputDesktopProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: 'email' | 'person';
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
  error?: string;
}

export const InputDesktop = (
  {
    label,
    icon,
    showPasswordToggle = false,
    isPasswordVisible = false,
    onTogglePassword,
    error,
    className = '',
    id,
    ref,
    ...props
  }: InputDesktopProps & { ref?: React.Ref<HTMLInputElement> }
) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  const isPassword = props.type === 'password';
  const inputType =
    isPassword && showPasswordToggle
      ? isPasswordVisible ? 'text' : 'password'
      : props.type;

  const IconComponent = icon === 'email' ? Mail : icon === 'person' ? User : null;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-zinc-700 ml-1" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative flex items-stretch border border-zinc-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all bg-white">
        <input
          ref={ref}
          id={inputId}
          {...props}
          type={inputType}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`w-full border-none bg-transparent px-4 py-3 focus:ring-0 text-sm placeholder-zinc-400 ${
            error ? 'border-red-500' : ''
          } ${className}`}
        />
        {IconComponent && !showPasswordToggle && (
          <div className="flex items-center justify-center px-3 bg-zinc-50 border-l border-zinc-300 text-zinc-400 pointer-events-none">
            <IconComponent className="size-5" />
          </div>
        )}
        {showPasswordToggle && onTogglePassword && (
          <div className="absolute right-0 top-0 bottom-0">
            <Button
              type="button"
              onClick={onTogglePassword}
              disabled={props.disabled}
              variant="ghost"
              size="icon"
              simple
              className="flex h-full items-center justify-center px-3 bg-zinc-50 border-l border-zinc-300 text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors rounded-none"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
            >
              {isPasswordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </Button>
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600 ml-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
