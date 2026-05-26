'use client';

import { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import {
  Camera24Regular,
  ArrowSync24Regular,
  ArrowCounterclockwise24Regular,
} from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CameraScannerProps {
  onTextDetected: (text: string) => void;
  className?: string;
}

type DeviceState = {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
};

export function CameraScanner({ onTextDetected, className }: CameraScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceState, dispatchDeviceState] = useReducer(
    (s: DeviceState, a: Partial<DeviceState>): DeviceState => ({ ...s, ...a }),
    { devices: [], selectedDeviceId: '' }
  );
  type ZoomState = { zoomLevel: number; maxZoom: number; supportsZoom: boolean };
  const [zoomState, dispatchZoom] = useReducer(
    (s: ZoomState, a: Partial<ZoomState>): ZoomState => ({ ...s, ...a }),
    { zoomLevel: 1, maxZoom: 1, supportsZoom: false }
  );
  const { zoomLevel, maxZoom, supportsZoom } = zoomState;

  const streamRef = useRef<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        const savedId = localStorage.getItem('hydra_camera_device_id');
        let resolvedId = '';
        if (savedId && videoDevices.find((d) => d.deviceId === savedId)) {
          resolvedId = savedId;
        } else if (videoDevices.length > 0) {
          const backCamera = videoDevices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('environment')
          );
          resolvedId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;
        }

        dispatchDeviceState({ devices: videoDevices, selectedDeviceId: resolvedId });
      } catch {
        // Silent error
      }
    };
    loadDevices();
  }, []);

  const { devices, selectedDeviceId } = deviceState;

  const startCamera = useCallback(async () => {
    if (!selectedDeviceId) return;
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());

    const getStream = async (constraints: MediaTrackConstraints) => {
      return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId }, ...constraints },
      });
    };

    try {
      const mediaStream = await getStream({ width: { ideal: 2160 }, height: { ideal: 3840 } });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      // Check Zoom Capabilities
      const videoTrack = mediaStream.getVideoTracks()[0];
      type ZoomCapabilities = MediaTrackCapabilities & { zoom?: { max?: number } };
      const capabilities = videoTrack.getCapabilities() as ZoomCapabilities;
      if (capabilities && capabilities.zoom) {
        dispatchZoom({ supportsZoom: true, maxZoom: capabilities.zoom.max ?? 3, zoomLevel: 1 });
      } else {
        dispatchZoom({ supportsZoom: false });
      }
    } catch {
      // Fallbacks logic...
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedDeviceId ? { ideal: selectedDeviceId } : undefined },
        });
        setStream(fallbackStream);
        streamRef.current = fallbackStream;
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
      } catch {
        toast.error('Error cámara');
      }
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      startCamera();
      localStorage.setItem('hydra_camera_device_id', selectedDeviceId);
    }
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, [selectedDeviceId, startCamera]);

  const toggleZoom = async () => {
    if (!streamRef.current || !supportsZoom) return;
    const track = streamRef.current.getVideoTracks()[0];

    // Cycle: 1 -> 2 -> 3 (if max >= 3) -> 1
    // Simple Toggle 1x -> 2x -> 1x
    let newZoom = zoomLevel >= 2 ? 1 : Math.min(2, maxZoom);
    // If maxZoom is small (e.g. 1.5), stick to max
    if (maxZoom < 2 && maxZoom > 1) newZoom = zoomLevel === 1 ? maxZoom : 1;

    try {
      type ZoomTrack = MediaStreamTrack & {
        applyConstraints(c: { advanced: Array<{ zoom: number }> }): Promise<void>;
      };
      await (track as ZoomTrack).applyConstraints({ advanced: [{ zoom: newZoom }] });
      dispatchZoom({ zoomLevel: newZoom });
    } catch {
      // Silent error
    }
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    if (videoRef.current.parentElement) {
      videoRef.current.parentElement.classList.add('ring-offset-2', 'ring-4', 'ring-primary');
      setTimeout(
        () =>
          videoRef.current?.parentElement?.classList.remove(
            'ring-offset-2',
            'ring-4',
            'ring-primary'
          ),
        200
      );
    }

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState !== 4) {
      setIsProcessing(false);
      return;
    }

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const formData = new FormData();
          formData.append('image', blob, 'capture_mtg.jpg');

          try {
            toast.dismiss();
            toast('Analizando...', { duration: 1000 });

            const API_BASE_URL =
              process.env.NEXT_PUBLIC_BACKEND_API_URL ||
              process.env.NEXT_PUBLIC_API_URL ||
              'http://localhost:3002/api';
            const response = await fetch(`${API_BASE_URL}/ocr/process`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) throw new Error('OCR request failed');

            const data = await response.json();
            if (data.text && data.text.trim().length > 0) {
              onTextDetected(data.text.trim());
            } else {
              toast.warning('No se detectó texto.');
            }
          } catch {
            toast.error('Error al procesar');
          } finally {
            setIsProcessing(false);
          }
        },
        'image/jpeg',
        1.0
      );
    }
  };

  return (
    <div className={cn('bg-transparent', className)}>
      <div className="flex items-center justify-between mb-2 px-1">
        <Select
          value={selectedDeviceId}
          onValueChange={(id) => dispatchDeviceState({ selectedDeviceId: id })}
        >
          <SelectTrigger className="h-7 text-xs w-[180px] bg-background/50 border-muted-foreground/20">
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
          {/* Botón Zoom (Solo si está soportado o simulamos? Por ahora solo nativo para no complicar crop) */}
          {supportsZoom && (
            <Button
              variant={zoomLevel > 1 ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7 rounded-full"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                toggleZoom();
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
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              startCamera();
            }}
            title="Reiniciar"
          >
            <ArrowCounterclockwise24Regular className="size-3" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="relative bg-zinc-950 rounded-[9px] overflow-hidden cursor-pointer group shadow-2xl transition-all hover:scale-[1.01]"
          style={{ width: '100%', maxWidth: '280px', aspectRatio: '63/88' }}
          role="button"
          tabIndex={0}
          onClick={captureAndProcess}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') captureAndProcess();
          }}
        >
          {/* Border MTG-like */}
          <div className="absolute inset-0 border-[8px] border-[#151515] rounded-[9px] z-20 pointer-events-none shadow-inner"></div>

          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 z-10">
              <Camera24Regular className="size-10 mb-2 opacity-50" />
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover bg-zinc-950"
            onLoadedMetadata={() => videoRef.current?.play()}
          />

          {/* Title Guide */}
          <div className="absolute top-[4%] left-[5%] right-[5%] h-[8%] border-2 border-yellow-400/70 rounded-[2px] shadow-[0_0_10px_rgba(250,204,21,0.4)] pointer-events-none bg-yellow-400/5 z-20">
            {/* Small corner indicators */}
            <div className="absolute top-0 left-0 size-1 bg-yellow-400"></div>
            <div className="absolute top-0 right-0 size-1 bg-yellow-400"></div>
            <div className="absolute bottom-0 left-0 size-1 bg-yellow-400"></div>
            <div className="absolute bottom-0 right-0 size-1 bg-yellow-400"></div>
          </div>

          {/* Art Guide (Reference) */}
          <div className="absolute top-[13%] left-[7%] right-[7%] h-[45%] border border-white/20 rounded-[1px] pointer-events-none z-10 border-dashed"></div>

          {/* Type Line Guide (Reference - faint) */}
          <div className="absolute top-[59%] left-[5%] right-[5%] h-[6%] border border-white/10 rounded-[2px] pointer-events-none z-10"></div>

          {/* Text Box Guide (Reference - faint) */}
          <div className="absolute top-[66%] left-[7%] right-[7%] h-[28%] border border-white/10 pointer-events-none z-10 border-dotted"></div>

          {/* Tap icon hint/action */}
          <div className="absolute bottom-6 right-6 z-30 opacity-80 pointer-events-none group-hover:scale-110 transition-transform">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/30">
              <div className="size-8 rounded-full border-2 border-white bg-white/10"></div>
            </div>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center z-30 backdrop-blur-sm">
              <ArrowSync24Regular className="size-12 text-primary animate-spin" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
