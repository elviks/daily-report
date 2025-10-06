"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

interface MissedReportsData {
  missedDates: string[];
  totalWorkingDays: number;
  totalSubmittedDays: number;
  totalMissedDays: number;
}

export function NotificationBell() {
  const [missedReports, setMissedReports] = useState<MissedReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchMissedReports();
    
    // Listen for report submission events to refresh the notification
    const handleReportSubmitted = () => {
      fetchMissedReports();
    };

    window.addEventListener("reportSubmitted", handleReportSubmitted);
    
    return () => {
      window.removeEventListener("reportSubmitted", handleReportSubmitted);
    };
  }, []);

  const fetchMissedReports = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/notifications/missed-reports?days=30", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMissedReports(data);
      } else {
        setError(data.error || "Failed to fetch missed reports");
      }
    } catch (error) {
      console.error("Error fetching missed reports:", error);
      setError("Failed to load notification data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const hasNotifications = missedReports && missedReports.totalMissedDays > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 rounded-xl hover:bg-white/20 transition-all duration-300"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {hasNotifications && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-xs rounded-full"
            >
              {missedReports.totalMissedDays}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-96 glass shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md p-0"
        align="end"
        forceMount
      >
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-600" />
              Notifications
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : !hasNotifications ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">All caught up!</p>
                <p className="text-slate-500 text-sm">No missed reports in the past 30 days</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 mb-1">
                        Missed Reports
                      </h3>
                      <p className="text-sm text-orange-800">
                        You have <strong>{missedReports.totalMissedDays}</strong> missed {missedReports.totalMissedDays === 1 ? 'report' : 'reports'} in the past 30 days
                      </p>
                      
                    </div>
                  </div>
                </div>

                {/* Recent missed dates */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 text-sm">Recent missed dates:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {missedReports.missedDates.map((date) => (
                      <div
                        key={date}
                        className="flex items-center justify-between p-3 bg-white/60 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-900 text-sm">
                            {formatDate(date)}
                          </span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="text-orange-700 bg-orange-50 text-xs"
                        >
                          {getDaysAgo(date)} {getDaysAgo(date) === 1 ? 'day' : 'days'} ago
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
