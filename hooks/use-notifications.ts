import { useState, useEffect, useCallback } from 'react';
import { isWorkingDay } from '@/lib/utils';

export interface NotificationData {
    id: string;
    userId: string;
    message: string;
    type: 'missed_report' | 'converted_to_leave';
    date: string;
    isSeen: boolean;
}

export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(false);

    // Check if a date is a Saturday
    const isSaturday = (date: Date): boolean => {
        return date.getDay() === 6; // 6 = Saturday
    };

    // Get the previous working day (excluding Saturdays)
    const getPreviousWorkingDay = (date: Date): Date => {
        const prevDay = new Date(date);
        prevDay.setDate(date.getDate() - 1);

        // If it's Saturday, go back one more day to Friday
        if (isSaturday(prevDay)) {
            prevDay.setDate(prevDay.getDate() - 1);
        }

        return prevDay;
    };

    // Get the date from two working days ago (excluding Saturdays)
    const getTwoWorkingDaysAgo = (date: Date): Date => {
        let workingDaysCount = 0;
        let currentDate = new Date(date);

        while (workingDaysCount < 2) {
            currentDate.setDate(currentDate.getDate() - 1);
            if (!isSaturday(currentDate)) {
                workingDaysCount++;
            }
        }

        return currentDate;
    };

    // Format date to YYYY-MM-DD string
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Check if a report exists for a given date
    const checkReportExists = async (date: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/reports/check?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`);
            const data = await response.json();
            return data?.exists || false;
        } catch (error) {
            console.error('Error checking report:', error);
            return false;
        }
    };

    // Generate notifications based on dates
    const generateNotifications = useCallback(async (): Promise<NotificationData[]> => {
        if (!userId) return [];

        const today = new Date();
        const yesterday = getPreviousWorkingDay(today);
        const twoDaysAgo = getTwoWorkingDaysAgo(today);
        const notifications: NotificationData[] = [];

        // Skip if today is not a working day
        if (!isWorkingDay(today)) {
            return [];
        }

        try {
            // Check two days ago
            const twoDaysAgoStr = formatDate(twoDaysAgo);
            const twoDaysAgoExists = await checkReportExists(twoDaysAgoStr);

            if (!twoDaysAgoExists) {
                notifications.push({
                    id: `two-days-ago-${twoDaysAgoStr}`,
                    userId,
                    message: `Report for ${twoDaysAgoStr} has been converted to leave. Submit today to avoid more leaves.`,
                    type: 'converted_to_leave',
                    date: twoDaysAgoStr,
                    isSeen: false,
                });
            }

            // Check yesterday (only if it's a working day)
            if (isWorkingDay(yesterday)) {
                const yesterdayStr = formatDate(yesterday);
                const yesterdayExists = await checkReportExists(yesterdayStr);

                if (!yesterdayExists) {
                    notifications.push({
                        id: `yesterday-${yesterdayStr}`,
                        userId,
                        message: `Missed report for ${yesterdayStr}. If not submitted today, it will be marked as leave.`,
                        type: 'missed_report',
                        date: yesterdayStr,
                        isSeen: false,
                    });
                }
            }
        } catch (error) {
            console.error('Error generating notifications:', error);
        }

        return notifications;
    }, [userId]);

    // Fetch notifications (now just generates them based on dates)
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const generatedNotifications = await generateNotifications();
            setNotifications(generatedNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, generateNotifications]);

    // Mark notification as seen (now just updates local state)
    const markAsSeen = useCallback((notificationId: string) => {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, isSeen: true } : n
            )
        );
    }, []);

    // Mark all notifications as seen
    const markAllAsSeen = useCallback(() => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, isSeen: true }))
        );
    }, []);

    // Initial load
    useEffect(() => {
        if (userId) {
            fetchNotifications();
        }
    }, [userId, fetchNotifications]);

    // Check for new notifications when the page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && userId) {
                fetchNotifications();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId, fetchNotifications]);

    // Listen for report submissions to refresh notifications
    useEffect(() => {
        const handleReportSubmitted = () => {
            if (userId) {
                // Wait a bit for the report to be saved, then check notifications
                setTimeout(() => {
                    fetchNotifications();
                }, 1000);
            }
        };

        window.addEventListener('reportSubmitted', handleReportSubmitted);
        return () => window.removeEventListener('reportSubmitted', handleReportSubmitted);
    }, [userId, fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.isSeen).length;

    return {
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        markAsSeen,
        markAllAsSeen,
    };
}
