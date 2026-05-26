'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface CameraScannerProps {
  onTextDetected: (text: string) => void;
  className?: string;
}

import { ScannerControls } from './components/scanner/ScannerControls';
import { ScannerViewport } from './components/scanner/ScannerViewport';

import { useCameraManager } from './hooks/useCameraManager';

export function CameraScanner({ onTextDetected, className }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    camera,
    dispatch,
    isProcessing,
    startCamera,
    toggleZoom,
    captureAndProcess,
  } = useCameraManager({
    onTextDetected,
    videoRef,
    canvasRef,
  });

  return (
    <div className={cn('bg-transparent', className)}>
      <ScannerControls
        selectedDeviceId={camera.selectedDeviceId}
        devices={camera.devices}
        onDeviceChange={(v) => dispatch({ type: 'SET_SELECTED_DEVICE_ID', selectedDeviceId: v })}
        onRestart={startCamera}
        supportsZoom={camera.supportsZoom}
        zoomLevel={camera.zoomLevel}
        onToggleZoom={toggleZoom}
      />

      <ScannerViewport
        videoRef={videoRef}
        canvasRef={canvasRef}
        isStreamActive={!!camera.stream}
        isProcessing={isProcessing}
        onCapture={captureAndProcess}
      />
    </div>
  );
}
