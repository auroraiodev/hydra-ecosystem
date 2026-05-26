// Re-exports from NotificationsContext for backwards compatibility.
// The actual subscription lives in NotificationsProvider (singleton) to
// prevent duplicate Supabase channel subscriptions when multiple components
// mount NotificationDropdown simultaneously (e.g. desktop + mobile navbars).
export { useNotificationsContext as useNotifications } from '@/features/notifications/contexts/NotificationsContext';
