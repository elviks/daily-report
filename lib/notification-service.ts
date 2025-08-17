export interface NotificationData {
    _id?: string;
    userId: string;
    message: string;
    type: 'missed_report' | 'converted_to_leave';
    date: string;
    isSeen: boolean;
}

export class NotificationService {
    /**
     * Check if a date is a Saturday
     */
    static isSaturday(date: Date): boolean {
        return date.getDay() === 6; // 6 = Saturday
    }

    /**
     * Get the previous working day (excluding Saturdays)
     */
    static getPreviousWorkingDay(date: Date): Date {
        const prevDay = new Date(date);
        prevDay.setDate(date.getDate() - 1);

        // If it's Saturday, go back one more day
        if (this.isSaturday(prevDay)) {
            prevDay.setDate(prevDay.getDate() - 1);
        }

        return prevDay;
    }

    /**
     * Get the date from two working days ago (excluding Saturdays)
     */
    static getTwoWorkingDaysAgo(date: Date): Date {
        let workingDaysCount = 0;
        let currentDate = new Date(date);

        while (workingDaysCount < 2) {
            currentDate.setDate(currentDate.getDate() - 1);
            if (!this.isSaturday(currentDate)) {
                workingDaysCount++;
            }
        }

        return currentDate;
    }

    /**
     * Format date to YYYY-MM-DD string
     */
    static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Check for missed reports and generate notifications
     */
    static async checkMissedReports(userId: string): Promise<NotificationData[]> {
        const today = new Date();
        const yesterday = this.getPreviousWorkingDay(today);
        const twoDaysAgo = this.getTwoWorkingDaysAgo(today);

        // Skip if today is Saturday
        if (this.isSaturday(today)) {
            return [];
        }

        const notifications: NotificationData[] = [];

        try {
            // Check two days ago
            const twoDaysAgoStr = this.formatDate(twoDaysAgo);
            const twoDaysAgoResponse = await fetch(
                `/api/reports/check?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(twoDaysAgoStr)}`
            );
            const twoDaysAgoData = await twoDaysAgoResponse.json();

            if (!twoDaysAgoData?.exists) {
                notifications.push({
                    userId,
                    message: `Report for ${twoDaysAgoStr} has been converted to leave. Submit today to avoid more leaves.`,
                    type: 'converted_to_leave',
                    date: twoDaysAgoStr,
                    isSeen: false,
                });
            }

            // Check yesterday (only if it's not Saturday)
            if (!this.isSaturday(yesterday)) {
                const yesterdayStr = this.formatDate(yesterday);
                const yesterdayResponse = await fetch(
                    `/api/reports/check?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(yesterdayStr)}`
                );
                const yesterdayData = await yesterdayResponse.json();

                if (!yesterdayData?.exists) {
                    notifications.push({
                        userId,
                        message: `Missed report for ${yesterdayStr}. If not submitted today, it will be marked as leave.`,
                        type: 'missed_report',
                        date: yesterdayStr,
                        isSeen: false,
                    });
                }
            }
        } catch (error) {
            console.error('Error checking missed reports:', error);
        }

        return notifications;
    }

    /**
     * Create or update notifications in the database
     */
    static async createNotifications(notifications: NotificationData[]): Promise<void> {
        try {
            await Promise.all(
                notifications.map(notification =>
                    fetch('/api/notifications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(notification),
                    })
                )
            );
        } catch (error) {
            console.error('Error creating notifications:', error);
        }
    }

    /**
     * Mark notification as seen
     */
    static async markAsSeen(notificationId: string): Promise<boolean> {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notificationId,
                    isSeen: true,
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error marking notification as seen:', error);
            return false;
        }
    }

    /**
     * Fetch user notifications
     */
    static async fetchNotifications(userId: string): Promise<any[]> {
        try {
            const response = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`);
            const data = await response.json();
            return data.notifications || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }
}
