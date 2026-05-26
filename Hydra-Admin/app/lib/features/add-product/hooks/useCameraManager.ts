'use client';

import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CameraState {
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  zoomLevel: number;
  maxZoom: number;
  supportsZoom: boolean;
}

type CameraAction =
  | { type: 'SET_DEVICES'; devices: MediaDeviceInfo[]; selectedDeviceId: string }
  | { type: 'SET_STREAM'; stream: MediaStream }
  | { type: 'SET_STREAM_AND_ZOOM'; stream: MediaStream; supportsZoom: boolean; maxZoom: number }
  | { type: 'SET_ZOOM'; zoomLevel: number }
  | { type: 'SET_SELECTED_DEVICE_ID'; selectedDeviceId: string };

function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'SET_DEVICES':
      return { ...state, devices: action.devices, selectedDeviceId: action.selectedDeviceId };
    case 'SET_STREAM':
      return { ...state, stream: action.stream };
    case 'SET_STREAM_AND_ZOOM':
      return { ...state, stream: action.stream, supportsZoom: action.supportsZoom, maxZoom: action.maxZoom, zoomLevel: 1 };
    case 'SET_ZOOM':
      return { ...state, zoomLevel: action.zoomLevel };
    case 'SET_SELECTED_DEVICE_ID':
      return { ...state, selectedDeviceId: action.selectedDeviceId };
    default: return state;
  }
}

export function useCameraManager({
  onTextDetected,
  videoRef,
  canvasRef,
}: {
  onTextDetected: (text: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [camera, dispatch] = useReducer(cameraReducer, {
    stream: null,
    devices: [],
    selectedDeviceId: '',
    zoomLevel: 1,
    maxZoom: 1,
    supportsZoom: false,
  });

  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        const savedId = localStorage.getItem('hydra_camera_device_id');
        let selectedId = '';
        if (savedId && videoDevices.find((d) => d.deviceId === savedId)) {
          selectedId = savedId;
        } else if (videoDevices.length > 0) {
          const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          selectedId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;
        }
        dispatch({ type: 'SET_DEVICES', devices: videoDevices, selectedDeviceId: selectedId });
      } catch { /* Silent */ }
    };
    void loadDevices();
  }, []);

  const startCamera = useCallback(async () => {
    if (!camera.selectedDeviceId) return;
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: camera.selectedDeviceId }, width: { ideal: 2160 }, height: { ideal: 3840 } },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } };
      const hasZoom = !!(capabilities && capabilities.zoom);
      dispatch({
        type: 'SET_STREAM_AND_ZOOM',
        stream: mediaStream,
        supportsZoom: hasZoom,
        maxZoom: hasZoom ? (capabilities.zoom?.max ?? 3) : 1,
      });
    } catch {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: camera.selectedDeviceId ? { ideal: camera.selectedDeviceId } : undefined },
        });
        dispatch({ type: 'SET_STREAM', stream: fallbackStream });
        streamRef.current = fallbackStream;
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
      } catch { toast.error('Error cámara'); }
    }
  }, [camera.selectedDeviceId, videoRef]);

  useEffect(() => {
    if (camera.selectedDeviceId) {
      void startCamera();
      localStorage.setItem('hydra_camera_device_id', camera.selectedDeviceId);
    }
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop()); };
  }, [camera.selectedDeviceId, startCamera]);

  const toggleZoom = async () => {
    if (!streamRef.current || !camera.supportsZoom) return;
    const track = streamRef.current.getVideoTracks()[0];
    let newZoom = camera.zoomLevel >= 2 ? 1 : Math.min(2, camera.maxZoom);
    if (camera.maxZoom < 2 && camera.maxZoom > 1) newZoom = camera.zoomLevel === 1 ? camera.maxZoom : 1;
    try {
      await (track as MediaStreamTrack & { applyConstraints(constraints: MediaTrackConstraints & { advanced?: { zoom: number }[] }): Promise<void> }).applyConstraints({ advanced: [{ zoom: newZoom }] });
      dispatch({ type: 'SET_ZOOM', zoomLevel: newZoom });
    } catch { /* Silent */ }
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    if (videoRef.current.parentElement) {
      videoRef.current.parentElement.classList.add('ring-offset-2', 'ring-4', 'ring-primary');
      setTimeout(() => videoRef.current?.parentElement?.classList.remove('ring-offset-2', 'ring-4', 'ring-primary'), 200);
    }
    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (video.readyState !== 4 || !context) { setIsProcessing(false); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) { setIsProcessing(false); return; }
      const formData = new FormData();
      formData.append('image', blob, 'capture_mtg.jpg');
      try {
        toast.dismiss();
        toast('Analizando...', { duration: 1000 });
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        const response = await fetch(`${API_BASE_URL}/ocr/process`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('OCR request failed');
        const data = await response.json();
        if (data.text && data.text.trim().length > 0) onTextDetected(data.text.trim());
        else toast.warning('No se detectó texto.');
      } catch { toast.error('Error al procesar'); } finally { setIsProcessing(false); }
    }, 'image/jpeg', 1.0);
  };

  return {
    camera,
    dispatch,
    isProcessing,
    startCamera,
    toggleZoom,
    captureAndProcess,
  };
}
