"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bell, AlertTriangle } from "lucide-react";
import { TextWithLinks } from "@/components/ui/text-with-links";

export default function NotificationsAdminPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await fetch("/api/notifications/test");
            const data = await response.json();

            if (response.ok) {
                setNotifications(data.notifications || []);
                setReports(data.reports || []);
            } else {
                setError(data.error || "Failed to fetch data");
            }
        } catch (error) {
            setError("Failed to fetch data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getNotificationTypeColor = (type: string) => {
        switch (type) {
            case 'converted_to_leave':
                return 'bg-red-100 text-red-800';
            case 'missed_report':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Notifications Admin</h1>
                <Button onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications ({notifications.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {notifications.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No notifications found</p>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="p-3 border rounded-lg space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Badge className={getNotificationTypeColor(notification.type)}>
                                                {notification.type}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium">{notification.message}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>User ID: {notification.userId}</span>
                                            <span>Date: {notification.date}</span>
                                            <span className={notification.isSeen ? 'text-green-600' : 'text-orange-600'}>
                                                {notification.isSeen ? 'Seen' : 'Unread'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Recent Reports ({reports.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reports.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No reports found</p>
                        ) : (
                            <div className="space-y-3">
                                {reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="p-3 border rounded-lg space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Report</span>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(report.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            <TextWithLinks text={report.content} />
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>User ID: {report.userId}</span>
                                            <span>Date: {report.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Test Notification Creation */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Notification System</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            This page shows the current state of notifications and reports in the system.
                            Use it to verify that the notification system is working correctly.
                        </p>
                        <div className="text-sm text-gray-600">
                            <h4 className="font-medium mb-2">How it works:</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Notifications are automatically created when reports are missed</li>
                                <li>Saturdays are excluded from working days</li>
                                <li>Reports from 2 working days ago are converted to leave</li>
                                <li>Reports from yesterday show a warning if not submitted</li>
                                <li>Users can mark notifications as seen</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
