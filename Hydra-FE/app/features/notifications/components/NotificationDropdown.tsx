'use client';

import { useState, useRef, useEffect, createElement } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks';
import { LazyMotion, domAnimation, m as motion, AnimatePresence } from 'framer-motion';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { NOTIFICATION_ICONS, NOTIFICATION_ANIMATIONS } from '../constants';
import { NotificationList } from './NotificationList';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setMounted(true));
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    const config = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.DEFAULT;
    return createElement(config.icon, { className: `size-4 ${config.color}` });
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <div className="relative">
          <FlowButton
            variant="ghost"
            size="icon"
            simple={true}
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-zinc-500 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg"
            aria-label="Notificaciones"
          >
            <Bell className="size-5" />
          </FlowButton>
          {mounted && unreadCount > 0 && (
            <span className="pointer-events-none absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold rounded-full min-size-4 px-1 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={NOTIFICATION_ANIMATIONS.container}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-zinc-100 z-[100] overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <h3 className="font-semibold text-zinc-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {/* List Container */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <NotificationList
                  notifications={notifications}
                  isLoading={isLoading}
                  markAsRead={markAsRead}
                  getIcon={getIcon}
                />
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50/50 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
