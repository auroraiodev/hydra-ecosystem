'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  ArrowCounterclockwise24Regular,
} from '@fluentui/react-icons';

interface ScannerControlsProps {
  selectedDeviceId: string;
  devices: MediaDeviceInfo[];
  onDeviceChange: (id: string) => void;
  onRestart: () => void;
  supportsZoom: boolean;
  zoomLevel: number;
  onToggleZoom: () => void;
}

export function ScannerControls({
  selectedDeviceId,
  devices,
  onDeviceChange,
  onRestart,
  supportsZoom,
  zoomLevel,
  onToggleZoom,
}: ScannerControlsProps) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <Select value={selectedDeviceId} onValueChange={onDeviceChange}>
        <SelectTrigger className="h-7 text-xs w-[180px] bg-background border-muted-foreground/20">
          <span className="truncate">
            {devices.find((d) => d.deviceId === selectedDeviceId)?.label || 'Cámara'}
          </span>
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
              {device.label || `Cámara ${device.deviceId.slice(0, 5)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1">
        {supportsZoom && (
          <Button
            variant={zoomLevel > 1 ? 'secondary' : 'ghost'}
            size="icon"
            className="size-7 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onToggleZoom();
            }}
            title="Zoom"
          >
            <span className="text-[10px] font-bold">{zoomLevel}x</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-full hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onRestart();
          }}
          title="Reiniciar"
        >
          <ArrowCounterclockwise24Regular className="size-3" />
        </Button>
      </div>
    </div>
  );
}
