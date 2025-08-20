"use client";

import { useState } from "react";
import { Bell, X, CheckCircle, Clock, AlertCircle, Info, Zap } from "lucide-react";
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
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'missed_report':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'converted_to_leave':
                return 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200/50 text-red-700';
            case 'missed_report':
                return 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-200/50 text-yellow-700';
            default:
                return 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200/50 text-blue-700';
        }
    };

    const getNotificationBadge = (type: string) => {
        switch (type) {
            case 'converted_to_leave':
                return 'bg-gradient-to-r from-red-500 to-red-600';
            case 'missed_report':
                return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
            default:
                return 'bg-gradient-to-r from-blue-500 to-blue-600';
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-12 w-12 rounded-2xl p-0 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                    <div className="relative">
                        <Bell className={`h-5 w-5 transition-all duration-300 ${unreadCount > 0 ? "text-red-500 group-hover:text-red-600" : "text-slate-500 group-hover:text-slate-600"
                            }`} />

                        {/* Beautiful notification indicator */}
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-bold text-white shadow-lg">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            </div>
                        )}
                    </div>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-96 glass border-0 shadow-2xl backdrop-blur-md p-0 overflow-hidden"
            >
                {/* Beautiful Header */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-b border-white/20 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                                <Bell className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg">Notifications</h4>
                        </div>

                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsSeen}
                                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 rounded-lg transition-all duration-300"
                            >
                                <Zap className="w-3 h-3 mr-1" />
                                Mark all seen
                            </Button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm">
                        <span className="text-slate-600">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-500">
                            {notifications.length} total
                        </span>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center animate-pulse-glow">
                                    <Bell className="w-6 h-6 text-black bg-black" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                            </div>
                            <p className="text-slate-600 font-medium">Loading notifications...</p>
                            <div className="flex space-x-2 mt-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-2">All Caught Up!</h4>
                            <p className="text-slate-600 text-sm">You're up to date with all notifications</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {notifications.map((notification, index) => (
                                <div
                                    key={notification._id}
                                    className={`group p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${getNotificationColor(notification.type)
                                        } ${notification.isSeen ? 'opacity-75' : 'opacity-100'}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            {/* Icon with background */}
                                            <div className={`p-2 rounded-xl ${getNotificationBadge(notification.type)} shadow-lg`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm leading-relaxed mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center space-x-2 text-xs opacity-70">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatDate(notification.date)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex items-center">
                                            {notification.isSeen ? (
                                                <div className="p-1 bg-green-100 rounded-lg">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                </div>
                                            ) : (
                                                notification._id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => markAsSeen(notification._id!)}
                                                        className="h-8 w-8 p-0 hover:bg-white/20 rounded-lg transition-all duration-300 group-hover:scale-110"
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-slate-500 group-hover:text-green-600 transition-colors duration-300" />
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="pt-4 border-t border-white/20">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                                <span className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>Real-time updates</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
