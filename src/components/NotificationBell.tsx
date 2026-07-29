import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { Notification } from '@/lib/notification-types';

export function NotificationBell() {
  const { organization } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!organization) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data ?? []);
      loadedRef.current = true;
    };

    load();

    channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
          if (loadedRef.current) {
            showToast(n.message, 'celebrate');
          }
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
      loadedRef.current = false;
    };
  }, [organization, showToast]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true })),
    );
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
  };

  if (!organization) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-8 w-8 rounded-btn text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-card border border-edge bg-surface shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
            <span className="text-sm font-semibold text-text-primary">
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-safe hover:text-safe/80 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={15} />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-secondary">
                No notifications yet. You'll see renewal alerts here.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-edge/50 transition-colors hover:bg-surface-hover ${
                    !n.read ? 'bg-safe/5' : ''
                  }`}
                >
                  <div
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? 'bg-text-secondary/30' : 'bg-safe'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary leading-snug">
                      {n.message}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 font-mono">
                      {new Date(n.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
