"use client";

import { useState, useEffect } from "react";
import {
     Card,
     CardContent,
     CardDescription,
     CardHeader,
     CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
     Calendar,
     User,
     ChevronDown,
     ChevronUp,
     Clock,
} from "lucide-react";
import { TextWithLinks } from "@/components/ui/text-with-links";

interface Report {
     id: string;
     userId: string;
     userName: string;
     userEmail: string;
     department: string;
     date: string;
     content: string;
     createdAt: string;
     updatedAt: string;
}

export function AllReports() {
     const [reports, setReports] = useState<Report[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

     useEffect(() => {
          fetchReports();
     }, []);

     const fetchReports = async () => {
          try {
               // Get user info from localStorage to check role
               const userData = localStorage.getItem("user");
               if (!userData) {
                    setError("User not authenticated");
                    return;
               }

               const user = JSON.parse(userData);
               if (user.role !== "superadmin" && user.role !== "admin") {
                    setError("Access denied - admin only");
                    return;
               }

               const token = localStorage.getItem("token");
               const response = await fetch(
                    "/api/admin/reports",
                    {
                         headers: {
                              "Authorization": `Bearer ${token}`,
                              "Content-Type": "application/json"
                         }
                    }
               );
               const data = await response.json();

               if (response.ok && data.reports) {
                    setReports(data.reports);
               } else {
                    setError(data.error || "Failed to fetch reports");
               }
          } catch (error) {
               console.error("Error fetching reports:", error);
               setReports([]);
          } finally {
               setLoading(false);
          }
     };

     const toggleReportExpansion = (reportId: string) => {
          setExpandedReports(prev => {
               const newSet = new Set(prev);
               if (newSet.has(reportId)) {
                    newSet.delete(reportId);
               } else {
                    newSet.add(reportId);
               }
               return newSet;
          });
     };

     const isReportLong = (content: string) => {
          if (!content) return false;
          return content.length > 150 || (content.match(/\n/g) || []).length > 2;
     };

     const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleDateString(
               "en-US",
               {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
               }
          );
     };

     const formatTime = (dateString: string) => {
          return new Date(dateString).toLocaleTimeString(
               "en-US",
               {
                    hour: "2-digit",
                    minute: "2-digit",
               }
          );
     };

     // Get today's and yesterday's dates
     const today = new Date();
     const yesterday = new Date(today);
     yesterday.setDate(yesterday.getDate() - 1);

     const todayStr = today.toISOString().split('T')[0];
     const yesterdayStr = yesterday.toISOString().split('T')[0];

     // Filter reports for today and yesterday
     const todayReports = reports.filter(report => report.date === todayStr);
     const yesterdayReports = reports.filter(report => report.date === yesterdayStr);

     if (loading) {
          return (
               <Card>
                    <CardContent className="p-6">
                         <div className="text-center text-muted-foreground">
                              Loading reports...
                         </div>
                    </CardContent>
               </Card>
          );
     }

     if (error) {
          return (
               <Card>
                    <CardContent className="p-6">
                         <div className="text-center text-red-600">
                              <p className="font-medium">Error Loading Reports</p>
                              <p className="text-sm mt-1">{error}</p>
                         </div>
                    </CardContent>
               </Card>
          );
     }

     const ReportCard = ({ report }: { report: Report }) => (
          <div className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors">
               <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                   {report.userName}
                              </span>
                         </div>
                         <Badge variant="secondary">
                              {report.department}
                         </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Clock className="h-4 w-4" />
                         {formatTime(report.createdAt)}
                    </div>
               </div>

               <div className="text-sm text-muted-foreground">
                    {report.userEmail}
               </div>

               <div className="text-sm">
                    <div>
                         {expandedReports.has(report.id) ? (
                              <div>
                                   <TextWithLinks text={report.content} />
                              </div>
                         ) : (
                              <div className="line-clamp-3">
                                   <TextWithLinks text={report.content} />
                              </div>
                         )}
                    </div>
                    {isReportLong(report.content) && (
                         <button
                              onClick={() => toggleReportExpansion(report.id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2 transition-colors cursor-pointer"
                         >
                              {expandedReports.has(report.id) ? (
                                   <>
                                        <ChevronUp className="h-3 w-3" />
                                        <span>See Less</span>
                                   </>
                              ) : (
                                   <>
                                        <ChevronDown className="h-3 w-3" />
                                        <span>See More</span>
                                   </>
                              )}
                         </button>
                    )}
               </div>

               <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                         Submitted: {new Date(report.createdAt).toLocaleString()}
                    </div>
                    {report.createdAt !== report.updatedAt && (
                         <Badge variant="outline" className="text-xs">
                              Updated: {new Date(report.updatedAt).toLocaleString()}
                         </Badge>
                    )}
               </div>
          </div>
     );

     return (
          <Card>
               <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                              <CardTitle>All Reports</CardTitle>
                              <CardDescription>
                                   View today's and yesterday's daily reports
                              </CardDescription>
                         </div>
                    </div>
               </CardHeader>
               <CardContent>
                    <Tabs defaultValue="today" className="w-full">
                         <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="today" className="flex items-center gap-2">
                                   <Calendar className="h-4 w-4" />
                                   Today ({todayReports.length})
                              </TabsTrigger>
                              <TabsTrigger value="yesterday" className="flex items-center gap-2">
                                   <Calendar className="h-4 w-4" />
                                   Yesterday ({yesterdayReports.length})
                              </TabsTrigger>
                         </TabsList>

                         <TabsContent value="today" className="mt-6">
                              <div className="space-y-4">
                                   <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                             <Badge variant="outline" className="text-green-600 border-green-600">
                                                  {formatDate(todayStr)}
                                             </Badge>
                                             <span className="text-sm text-muted-foreground">
                                                  {todayReports.length} report{todayReports.length !== 1 ? 's' : ''} submitted
                                             </span>
                                        </div>
                                   </div>

                                   {todayReports.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">
                                             No reports submitted today
                                        </div>
                                   ) : (
                                        <ScrollArea className="h-[500px]">
                                             <div className="space-y-4">
                                                  {todayReports.map((report) => (
                                                       <ReportCard key={report.id} report={report} />
                                                  ))}
                                             </div>
                                        </ScrollArea>
                                   )}
                              </div>
                         </TabsContent>

                         <TabsContent value="yesterday" className="mt-6">
                              <div className="space-y-4">
                                   <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                             <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                  {formatDate(yesterdayStr)}
                                             </Badge>
                                             <span className="text-sm text-muted-foreground">
                                                  {yesterdayReports.length} report{yesterdayReports.length !== 1 ? 's' : ''} submitted
                                             </span>
                                        </div>
                                   </div>

                                   {yesterdayReports.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">
                                             No reports submitted yesterday
                                        </div>
                                   ) : (
                                        <ScrollArea className="h-[500px]">
                                             <div className="space-y-4">
                                                  {yesterdayReports.map((report) => (
                                                       <ReportCard key={report.id} report={report} />
                                                  ))}
                                             </div>
                                        </ScrollArea>
                                   )}
                              </div>
                         </TabsContent>
                    </Tabs>
               </CardContent>
          </Card>
     );
}