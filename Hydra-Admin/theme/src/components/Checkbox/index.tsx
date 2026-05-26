"use client";

import { useRef, useEffect, type ReactNode } from 'react';

export interface CheckboxProps {
  label?: ReactNode;
  checked: boolean | 'indeterminate';
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  onCheckedChange,
  className = '',
  disabled,
  id,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === 'indeterminate';
    }
  }, [checked]);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    onChange?.(next);
    onCheckedChange?.(next);
  };

  return (
    <label className={`flex items-center gap-3 cursor-pointer select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className="peer appearance-none size-5 border-2 border-primary/20 rounded-md bg-transparent checked:bg-primary checked:border-primary indeterminate:bg-primary/50 indeterminate:border-primary/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          checked={checked === true}
          onChange={handleToggle}
          disabled={disabled}
        />
        <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none transition-opacity duration-200">
          <svg
            className="size-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="4"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {checked === 'indeterminate' && (
          <div className="absolute w-2.5 h-0.5 bg-white pointer-events-none rounded-full" />
        )}
      </div>
      {label && <span className="text-sm font-medium text-text-muted">{label}</span>}
    </label>
  );
}
