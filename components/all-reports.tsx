"use client";

import { useState, useEffect } from "react";
import {
     Card,
     CardContent,
     CardDescription,
     CardHeader,
     CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
} from "@/components/ui/select";
import {
     Search,
     Download,
     Calendar,
     User,
} from "lucide-react";

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
     const [filteredReports, setFilteredReports] = useState<
          Report[]
     >([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [searchTerm, setSearchTerm] = useState("");
     const [dateFilter, setDateFilter] = useState("");
     const [departmentFilter, setDepartmentFilter] =
          useState("");
     const [departments, setDepartments] = useState<
          string[]
     >([]);

     useEffect(() => {
          fetchReports();
     }, []);

     useEffect(() => {
          filterReports();
     }, [
          reports,
          searchTerm,
          dateFilter,
          departmentFilter,
     ]);

     const fetchReports = async () => {
          try {
               // Get user info from localStorage to check role
               const userData = localStorage.getItem("user");
               if (!userData) {
                    setError("User not authenticated");
                    return;
               }

               const user = JSON.parse(userData);
               if (user.role !== "superadmin") {
                    setError("Access denied - admin only");
                    return;
               }

               const response = await fetch(
                    "/api/admin/reports",
                    {
                         headers: {
                              "x-user-role": user.role
                         }
                    }
               );
               const data = await response.json();

               if (response.ok && data.reports) {
                    setReports(data.reports);
                    // Extract unique departments
                    const uniqueDepartments = [
                         ...new Set(
                              data.reports.map(
                                   (r: Report) =>
                                        r.department
                              )
                         ),
                    ] as string[];
                    setDepartments(uniqueDepartments);
               } else {
                    setError(data.error || "Failed to fetch reports");
               }
          } catch (error) {
               console.error(
                    "Error fetching reports:",
                    error
               );
               // Set empty arrays to prevent undefined errors
               setReports([]);
               setDepartments([]);
          } finally {
               setLoading(false);
          }
     };

     const filterReports = () => {
          if (!reports) {
               setFilteredReports([]);
               return;
          }

          let filtered = reports;

          if (searchTerm) {
               filtered = filtered.filter(
                    (report) =>
                         report.userName
                              .toLowerCase()
                              .includes(
                                   searchTerm.toLowerCase()
                              ) ||
                         report.userEmail
                              .toLowerCase()
                              .includes(
                                   searchTerm.toLowerCase()
                              ) ||
                         report.content
                              .toLowerCase()
                              .includes(
                                   searchTerm.toLowerCase()
                              )
               );
          }

          if (dateFilter) {
               filtered = filtered.filter(
                    (report) => report.date === dateFilter
               );
          }

          if (departmentFilter) {
               filtered = filtered.filter(
                    (report) =>
                         report.department ===
                         departmentFilter
               );
          }

          setFilteredReports(filtered);
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

     return (
          <Card>
               <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                              <CardTitle>
                                   All Reports
                              </CardTitle>
                              <CardDescription>
                                   View and manage all
                                   submitted daily reports (
                                   {filteredReports?.length || 0}
                                   reports)
                              </CardDescription>
                         </div>
                    </div>
               </CardHeader>
               <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                         <div className="relative flex-1">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                   placeholder="Search by name, email, or content..."
                                   value={searchTerm}
                                   onChange={(e) =>
                                        setSearchTerm(
                                             e.target.value
                                        )
                                   }
                                   className="pl-10"
                              />
                         </div>
                         <Input
                              type="date"
                              value={dateFilter}
                              onChange={(e) =>
                                   setDateFilter(
                                        e.target.value
                                   )
                              }
                              className="w-full sm:w-auto"
                         />
                         <Select
                              value={departmentFilter}
                              onValueChange={
                                   setDepartmentFilter
                              }
                         >
                              <SelectTrigger className="w-full sm:w-[180px]">
                                   <SelectValue placeholder="All Departments" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">
                                        All Departments
                                   </SelectItem>
                                   {departments.map(
                                        (dept) => (
                                             <SelectItem
                                                  key={dept}
                                                  value={
                                                       dept
                                                  }
                                             >
                                                  {dept}
                                             </SelectItem>
                                        )
                                   )}
                              </SelectContent>
                         </Select>
                    </div>

                    {/* Reports List */}
                    <ScrollArea className="h-[600px]">
                         {filteredReports.length === 0 ? (
                              <div className="text-center text-muted-foreground py-8">
                                   No reports found matching
                                   your criteria
                              </div>
                         ) : (
                              <div className="space-y-4">
                                   {filteredReports?.map(
                                        (report) => (
                                             <div
                                                  key={
                                                       report.id
                                                  }
                                                  className="border p-4 space-y-3"
                                             >
                                                  <div className="flex items-center justify-between">
                                                       <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2">
                                                                 <User className="h-4 w-4 text-muted-foreground" />
                                                                 <span className="font-medium">
                                                                      {
                                                                           report.userName
                                                                      }
                                                                 </span>
                                                            </div>
                                                            <Badge variant="secondary">
                                                                 {
                                                                      report.department
                                                                 }
                                                            </Badge>
                                                       </div>
                                                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(
                                                                 report.date
                                                            )}
                                                       </div>
                                                  </div>

                                                  <div className="text-sm text-muted-foreground">
                                                       {
                                                            report.userEmail
                                                       }
                                                  </div>

                                                  <div className="text-sm">
                                                       <p className="line-clamp-3">
                                                            {
                                                                 report.content
                                                            }
                                                       </p>
                                                  </div>

                                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                       <div>
                                                            Submitted:{" "}
                                                            {new Date(
                                                                 report.createdAt
                                                            ).toLocaleString()}
                                                       </div>
                                                       {report.createdAt !==
                                                            report.updatedAt && (
                                                                 <Badge
                                                                      variant="outline"
                                                                      className="text-xs"
                                                                 >
                                                                      Updated:{" "}
                                                                      {new Date(
                                                                           report.updatedAt
                                                                      ).toLocaleString()}
                                                                 </Badge>
                                                            )}
                                                  </div>
                                             </div>
                                        )
                                   )}
                              </div>
                         )}
                    </ScrollArea>
               </CardContent>
          </Card>
     );
}
