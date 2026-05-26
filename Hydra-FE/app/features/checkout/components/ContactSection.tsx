'use client';

import { Input } from '@/features/shared/ui/Input';
import { User } from 'lucide-react';

interface ContactSectionProps {
  emailOrUsername: string;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  stepNumber?: number;
  /** When true, hides the outer card wrapper and email row (used when inlined into a custom mobile card) */
  mobileInlined?: boolean;
}

export function ContactSection({
  emailOrUsername,
  phoneNumber,
  setPhoneNumber,
  stepNumber = 1,
  mobileInlined = false,
}: ContactSectionProps) {
  const phoneInput = (
    <Input
      label="Número de Teléfono (opcional)"
      placeholder="(55) 1234 5678"
      value={phoneNumber}
      onChange={(e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const truncated = rawValue.slice(0, 10);
        let formatted = truncated;
        if (truncated.length > 0) {
          formatted = `(${truncated.slice(0, 2)}`;
          if (truncated.length > 2) {
            formatted += `) ${truncated.slice(2, 6)}`;
          }
          if (truncated.length > 6) {
            formatted += ` ${truncated.slice(6, 10)}`;
          }
        }
        setPhoneNumber(formatted);
      }}
      type="tel"
      maxLength={14}
    />
  );

  if (mobileInlined) {
    return phoneInput;
  }

  return (
    <div className="vault-glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="p-5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-teal/20 flex items-center justify-center border border-teal/30 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.2)]">
            <span className="text-sm font-black text-teal">{stepNumber}</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-body tracking-tight uppercase">
              Información de Contacto
            </h2>
            <p className="text-[11px] font-medium text-text-muted/80 uppercase tracking-wider">
              Datos para tu pedido
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 gap-y-5">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-teal/30 transition-colors group">
          <div className="size-10 rounded-lg bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
            <User className="size-5 text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">
              Sesión iniciada como
            </p>
            <p className="text-sm font-semibold text-text-body truncate">{emailOrUsername}</p>
          </div>
        </div>
        <div className="pt-2">{phoneInput}</div>
      </div>
    </div>
  );
}
