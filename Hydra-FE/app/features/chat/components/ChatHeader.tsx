import { Bell, BellOff, Loader2, ChevronDown, X } from 'lucide-react';
import type { ChatHeaderProps } from '../types';

export function ChatHeader({
  isConnected,
  isAuthenticated,
  pushSupported,
  pushSubscribed,
  pushLoading,
  onPushToggle,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0 bg-white/5 backdrop-blur-xl border-b border-white/10">
      <div className="relative flex-shrink-0">
        <div className="size-10 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.3)] bg-teal">
          H
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-vault-bg transition-colors duration-500 shadow-sm"
          style={{ background: isConnected ? 'oklch(0.7 0.2 150)' : 'oklch(0.6 0 0)' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-vault-text font-bold text-sm leading-tight tracking-tight">
          Soporte Hydra
        </p>
        <p className="text-vault-text-muted text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
          {isConnected ? (
            <>
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" /> En línea
            </>
          ) : (
            <>
              <Loader2 className="size-3 animate-spin" /> Conectandoâ€¦
            </>
          )}
        </p>
      </div>
      {isAuthenticated && pushSupported && (
        <button
          onClick={onPushToggle}
          disabled={pushLoading}
          className={`p-2.5 rounded-xl transition-all duration-300 ${pushSubscribed ? 'text-teal bg-teal/10 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.1)]' : 'text-vault-text-muted hover:text-vault-text hover:bg-white/5 active:scale-95'}`}
          title={pushSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        >
          {pushLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : pushSubscribed ? (
            <Bell className="size-4" />
          ) : (
            <BellOff className="size-4" />
          )}
        </button>
      )}
      <button
        onClick={onClose}
        className="text-vault-text-muted hover:text-vault-text transition-all duration-300 p-2.5 rounded-xl hover:bg-white/10 active:scale-90"
        aria-label="Cerrar chat"
      >
        <ChevronDown className="size-5 sm:hidden" />
        <X className="size-4 hidden sm:block" />
      </button>
    </div>
  );
}
