import { useState, useEffect, useCallback } from 'react';
import { NotificationService, NotificationData } from '@/lib/notification-service';

export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const fetchedNotifications = await NotificationService.fetchNotifications(userId);
            setNotifications(fetchedNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const checkAndCreateNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            const newNotifications = await NotificationService.checkMissedReports(userId);
            if (newNotifications.length > 0) {
                await NotificationService.createNotifications(newNotifications);
                // Refresh the notifications list
                await fetchNotifications();
            }
            setLastChecked(new Date());
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }, [userId, fetchNotifications]);

    const markAsSeen = useCallback(async (notificationId: string) => {
        try {
            const success = await NotificationService.markAsSeen(notificationId);
            if (success) {
                setNotifications(prev =>
                    prev.map(n =>
                        n._id === notificationId ? { ...n, isSeen: true } : n
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as seen:', error);
        }
    }, []);

    const markAllAsSeen = useCallback(async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.isSeen);
            await Promise.all(
                unreadNotifications.map(n => NotificationService.markAsSeen(n._id))
            );
            setNotifications(prev =>
                prev.map(n => ({ ...n, isSeen: true }))
            );
        } catch (error) {
            console.error('Error marking all notifications as seen:', error);
        }
    }, [notifications]);

    // Initial load
    useEffect(() => {
        if (userId) {
            fetchNotifications();
            checkAndCreateNotifications();
        }
    }, [userId, fetchNotifications, checkAndCreateNotifications]);

    // Check for new notifications when the page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && userId) {
                // Only check if we haven't checked in the last hour
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                if (!lastChecked || lastChecked < oneHourAgo) {
                    checkAndCreateNotifications();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId, lastChecked, checkAndCreateNotifications]);

    // Listen for report submissions to refresh notifications
    useEffect(() => {
        const handleReportSubmitted = () => {
            if (userId) {
                // Wait a bit for the report to be saved, then check notifications
                setTimeout(() => {
                    checkAndCreateNotifications();
                }, 1000);
            }
        };

        window.addEventListener('reportSubmitted', handleReportSubmitted);
        return () => window.removeEventListener('reportSubmitted', handleReportSubmitted);
    }, [userId, checkAndCreateNotifications]);

    const unreadCount = notifications.filter(n => !n.isSeen).length;

    return {
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        checkAndCreateNotifications,
        markAsSeen,
        markAllAsSeen,
        lastChecked,
    };
}
