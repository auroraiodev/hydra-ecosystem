'use client';

import React, { RefObject } from 'react';
import { Camera24Regular, ArrowSync24Regular } from '@fluentui/react-icons';

interface ScannerViewportProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isStreamActive: boolean;
  isProcessing: boolean;
  onCapture: () => void;
}

export function ScannerViewport({
  videoRef,
  canvasRef,
  isStreamActive,
  isProcessing,
  onCapture,
}: ScannerViewportProps) {
  return (
    <div className="flex justify-center">
      <div
        role="button"
        tabIndex={0}
        className="relative bg-zinc-950 rounded-[9px] overflow-hidden cursor-pointer group shadow-2xl transition-all hover:scale-[1.01]"
        style={{ width: '100%', maxWidth: '280px', aspectRatio: '63/88' }}
        onClick={onCapture}
        onKeyDown={(e) => e.key === 'Enter' && onCapture()}
      >
        {/* Border MTG-like */}
        <div className="absolute inset-0 border-[8px] border-[#151515] rounded-[9px] z-20 pointer-events-none shadow-inner"></div>

        {!isStreamActive && (
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
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 backdrop-blur-sm">
            <ArrowSync24Regular className="size-12 text-primary animate-spin" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
