'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpinnerIos20Regular, Flag24Regular, Comment24Regular } from '@fluentui/react-icons';
import { featureFlagsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  label: string;
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white shadow-md transform transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export default function FeatureFlagsContent() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagToggling, setFlagToggling] = useState<string | null>(null);

  useEffect(() => {
    featureFlagsAPI
      .getAll()
      .then((data: unknown) => {
        const list = Array.isArray(data) ? data : ((data as { data?: FeatureFlag[] })?.data ?? []);
        setFlags(list as FeatureFlag[]);
      })
      .catch(() => toast.error('Error al cargar los feature flags'))
      .finally(() => setFlagsLoading(false));
  }, []);

  const handleFlagToggle = async (flag: FeatureFlag) => {
    setFlagToggling(flag.key);
    const newValue = !flag.enabled;
    try {
      await featureFlagsAPI.set(flag.key, newValue);
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: newValue } : f)));
      toast.success(`${flag.label} ${newValue ? 'activado' : 'desactivado'}`);
    } catch {
      toast.error(`Error al actualizar ${flag.label}`);
    } finally {
      setFlagToggling(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Flag24Regular className="size-7" />
          Feature Flags
        </h1>
        <p className="text-muted-foreground mt-1">
          Activa o desactiva funciones del marketplace en tiempo real. Los cambios se reflejan en la
          tienda de inmediato.
        </p>
      </div>

      {/* App Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Comment24Regular className="size-5" />
            Funciones de la aplicación
          </CardTitle>
          <CardDescription>
            Activa o desactiva funciones del marketplace en tiempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flagsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <SpinnerIos20Regular className="size-5 animate-spin" />
              <span>Cargando…</span>
            </div>
          ) : flags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay flags registrados.</p>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => {
                const isToggling = flagToggling === flag.key;
                return (
                  <div
                    key={flag.key}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border transition-colors',
                      flag.enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'
                    )}
                  >
                    <div>
                      <p className="font-semibold text-sm">{flag.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{flag.key}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          flag.enabled ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {flag.enabled ? 'Activo' : 'Inactivo'}
                      </span>
                      {isToggling ? (
                        <SpinnerIos20Regular className="size-5 animate-spin text-muted-foreground" />
                      ) : (
                        <ToggleSwitch
                          checked={flag.enabled}
                          onChange={() => handleFlagToggle(flag)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
