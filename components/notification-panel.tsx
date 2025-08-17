"use client";

import { useState } from "react";
import { Bell, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";

interface NotificationPanelProps {
    userId: string;
}

export function NotificationPanel({ userId }: NotificationPanelProps) {
    const {
        notifications,
        loading,
        unreadCount,
        markAsSeen,
        markAllAsSeen,
    } = useNotifications(userId);
    const [isOpen, setIsOpen] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'converted_to_leave':
                return <X className="h-4 w-4 text-red-500" />;
            case 'missed_report':
                return <Bell className="h-4 w-4 text-yellow-500" />;
            default:
                return <Bell className="h-4 w-4 text-blue-500" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'converted_to_leave':
                return 'bg-red-50 border-red-200 text-red-700';
            case 'missed_report':
                return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-700';
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border-1 border-gray-600">
                    <Bell className={unreadCount > 0 ? "h-5 w-5 text-red-600" : "h-5 w-5 text-slate-500"} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex h-3 w-3 rounded-full bg-red-600">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsSeen}
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                Mark all as seen
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">You're all caught up!</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-3 rounded-md border text-sm ${getNotificationColor(notification.type)} ${notification.isSeen ? 'opacity-75' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 flex-1">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1">
                                                <p className="font-medium">{notification.message}</p>
                                                <p className="text-xs opacity-70 mt-1">
                                                    {formatDate(notification.date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {notification.isSeen && (
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                            )}
                                            {!notification.isSeen && notification._id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => markAsSeen(notification._id!)}
                                                    className="h-6 w-6 p-0 hover:bg-white/20"
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {notifications.length > 0 && (
                        <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
