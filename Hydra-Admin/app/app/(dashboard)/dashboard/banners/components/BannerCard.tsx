'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit24Regular,
  Delete24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Image24Regular,
} from '@fluentui/react-icons';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { Banner } from '../types';

interface BannerCardProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (banner: Banner) => void;
}

export function BannerCard({
  banner,
  onEdit,
  onDelete,
  onToggleStatus,
}: BannerCardProps) {
  return (
    <Card className="overflow-hidden group border-muted hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex flex-col md:flex-row h-full">
        <div className="relative w-full md:w-80 h-48 md:h-auto bg-muted overflow-hidden">
          {banner.desktop_image ? (
            <Image
              src={resolveImageUrl(banner.desktop_image)}
              alt={banner.title}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={banner.desktop_image.startsWith('data:')}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Image24Regular className="size-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              variant={banner.is_active ? 'default' : 'secondary'}
              className="shadow-sm"
            >
              {banner.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p className="text-sm font-medium text-primary uppercase tracking-wider">
                    {banner.subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                Order: {banner.order}
              </div>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm mb-4">
              {banner.description || 'No description provided.'}
            </p>

            {banner.button_text && (
              <div className="flex items-center gap-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 pointer-events-none"
                >
                  {banner.button_text}
                </Button>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {banner.button_link}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-muted/50">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(banner)}
                className={
                  banner.is_active
                    ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                    : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                }
              >
                {banner.is_active ? (
                  <EyeOff24Regular className="size-4 mr-2" />
                ) : (
                  <Eye24Regular className="size-4 mr-2" />
                )}
                {banner.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(banner)}
              >
                <Edit24Regular className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(banner.id)}
              >
                <Delete24Regular className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
