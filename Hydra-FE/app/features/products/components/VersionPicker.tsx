'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { getAlternativeVersions } from '../utils';
import { ConditionChip, VaultBadge } from '@/features/shared/ui';
import { resolveLanguageName } from '@/lib/utils/transformers';
import type { AlternativeVersion } from '../types';
import type { VersionPickerProps } from '../types';

const PRICE_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export function VersionPicker({ productId, onSelect, className = '' }: VersionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (!loaded) {
      setLoading(true);
      try {
        const data = await getAlternativeVersions(productId);
        setAlternatives(data);
        setLoaded(true);
      } catch {
        setAlternatives([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatPrice = (price: number) => {
    if (price <= 0) return 'Consultar';
    return PRICE_FORMATTER.format(price);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <FlowButton
        onClick={handleOpen}
        variant="ghost"
        size="sm"
        simple
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <ArrowRightLeft className="size-3.5" />
        Cambiar version
      </FlowButton>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 bg-zinc-50">
            <span className="text-xs font-semibold text-zinc-700">Versiones disponibles</span>
            <FlowButton
              variant="ghost"
              size="icon"
              simple
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 size-auto"
            >
              <X className="size-4" />
            </FlowButton>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-6 text-xs text-zinc-400">
                Cargando alternativas…
              </div>
            )}

            {!loading && alternatives.length === 0 && (
              <div className="flex items-center justify-center py-6 text-xs text-zinc-400">
                No hay versiones alternativas disponibles
              </div>
            )}

            {!loading &&
              alternatives.map((alt) => (
                <FlowButton
                  key={alt.id}
                  variant="ghost"
                  simple
                  onClick={() => {
                    onSelect(alt);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-zinc-50 last:border-b-0 h-auto rounded-none justify-start"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 truncate">
                      {alt.expansion || alt.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {alt.condition && <ConditionChip condition={alt.condition} />}
                      {alt.language && <VaultBadge>{resolveLanguageName(alt.language)}</VaultBadge>}
                      {alt.foil && <VaultBadge variant="gold">Foil</VaultBadge>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-primary">{formatPrice(alt.price)}</p>
                    <p className="text-[10px] text-zinc-400">Stock: {alt.stock}</p>
                  </div>
                </FlowButton>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
