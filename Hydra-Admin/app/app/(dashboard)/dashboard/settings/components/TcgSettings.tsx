'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Add24Regular, Delete24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';

interface Tcg {
  id: string;
  name: string;
  display_name: string;
}

interface TcgSettingsProps {
  tcgs: Tcg[];
  loading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function TcgSettings({ tcgs, loading, onAdd, onDelete }: TcgSettingsProps) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Add24Regular className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Juegos Soportados (TCGs)</CardTitle>
              <CardDescription>Gestionar los juegos activos en la plataforma</CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" className="rounded-lg h-9" onClick={onAdd}>
            <Add24Regular className="size-4 mr-2" />
            Nuevo TCG
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <SpinnerIos20Regular className="size-8 animate-spin text-primary/40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tcgs.map((tcg) => (
              <div
                key={tcg.id}
                className="p-4 rounded-xl border bg-card/50 flex items-center justify-between group hover:border-primary/30 transition-all"
              >
                <div>
                  <p className="font-bold text-sm uppercase tracking-wider">{tcg.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">
                    {tcg.display_name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(tcg.id)}
                >
                  <Delete24Regular className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
