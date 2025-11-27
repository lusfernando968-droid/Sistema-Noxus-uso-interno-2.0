import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
    id: string;
    type: 'appointment' | 'payment' | 'client' | 'project' | 'system';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    link?: string;
    priority: 'high' | 'medium' | 'low';
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Fetch initial notifications
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
                return;
            }

            const formattedNotifications: Notification[] = data.map(n => ({
                id: n.id,
                type: n.type as any,
                title: n.title,
                message: n.message,
                timestamp: new Date(n.created_at),
                read: n.read,
                link: n.link,
                priority: n.priority as any
            }));

            setNotifications(formattedNotifications);
            setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        };

        fetchNotifications();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new;
                        const formattedNotification: Notification = {
                            id: newNotification.id,
                            type: newNotification.type as any,
                            title: newNotification.title,
                            message: newNotification.message,
                            timestamp: new Date(newNotification.created_at),
                            read: newNotification.read,
                            link: newNotification.link,
                            priority: newNotification.priority as any
                        };

                        setNotifications(prev => [formattedNotification, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        // Show toast for new high priority notifications
                        if (formattedNotification.priority === 'high') {
                            toast(formattedNotification.title, {
                                description: formattedNotification.message,
                            });
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev => prev.map(n =>
                            n.id === payload.new.id
                                ? { ...n, read: payload.new.read }
                                : n
                        ));
                        // Recalculate unread count
                        setUnreadCount(prev => {
                            // This is a bit complex to do perfectly without refetching, 
                            // but for read status toggle it's fine.
                            // A safer way is to just re-fetch or check the specific change.
                            if (payload.old.read === false && payload.new.read === true) {
                                return Math.max(0, prev - 1);
                            }
                            return prev;
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => {
                            const filtered = prev.filter(n => n.id !== payload.old.id);
                            const wasUnread = prev.find(n => n.id === payload.old.id)?.read === false;
                            if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
                            return filtered;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification as read:', error);
            // Revert optimistic update if needed (omitted for simplicity)
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user?.id)
            .eq('read', false);

        if (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const removeNotification = async (id: string) => {
        // Optimistic update
        const notification = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification
    };
}
