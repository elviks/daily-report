"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Check, X, Calendar, Users, FileText, Clock, User } from "lucide-react"
import { TextWithLinks } from "@/components/ui/text-with-links"
import { PhotoViewer } from "@/components/photo-viewer"

interface User {
    id: string
    _id?: string
    name: string
    email: string
    role: string
    department: string
    isAdmin?: boolean
    isActive?: boolean
}

interface Report {
    id: string
    userId: string
    date: string
    content: string
    photos?: string[]
    createdAt: string
}

export function WorkCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [users, setUsers] = useState<User[]>([])
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loadingReport, setLoadingReport] = useState(false)

    useEffect(() => {
        fetchData()
    }, [currentMonth])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found");
                return;
            }

            // Fetch users for current tenant
            const usersResponse = await fetch('/api/admin/users/tenant', {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const usersData = await usersResponse.json();

            // Fetch reports for current tenant
            const reportsResponse = await fetch('/api/reports/tenant', {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const reportsData = await reportsResponse.json();

            if (usersData.users) {
                // Filter out admin users and disabled users, only show active regular users
                const regularUsers = usersData.users.filter((user: User) =>
                    (user.role === 'user' || (!user.role && !user.isAdmin)) &&
                    user.isActive !== false
                );
                setUsers(regularUsers);
            }

            if (reportsData.reports) {
                setReports(reportsData.reports);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const fetchReportForDate = async (userId: string, date: string) => {
        setLoadingReport(true)
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/reports/user/${userId}/date/${date}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            const data = await response.json()

            if (data.report) {
                setSelectedReport(data.report)
                setIsDialogOpen(true)
            } else {
                // No report found for this date
                setSelectedReport(null)
                setIsDialogOpen(true)
            }
        } catch (error) {
            console.error('Error fetching report:', error)
        } finally {
            setLoadingReport(false)
        }
    }

    const handleDayClick = (user: User, date: Date, day: number) => {
        const dateStr = formatDate(date, day)
        setSelectedUser(user)
        setSelectedDate(dateStr)
        fetchReportForDate(user._id || user.id, dateStr)
    }

    const closeDialog = () => {
        setIsDialogOpen(false)
        setSelectedReport(null)
        setSelectedUser(null)
        setSelectedDate("")
    }

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const lastDay = new Date(year, month + 1, 0)
        return lastDay.getDate()
    }

    const formatDate = (date: Date, day: number) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const dayStr = String(day).padStart(2, '0')
        return `${year}-${month}-${dayStr}`
    }

    const hasReportForDate = (userId: string, date: Date, day: number) => {
        const dateStr = formatDate(date, day)
        return reports.some(report => report.userId === userId && report.date === dateStr)
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev)
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1)
            } else {
                newDate.setMonth(prev.getMonth() + 1)
            }
            return newDate
        })
    }

    const getMonthName = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
    }

    const getYear = (date: Date) => {
        return date.getFullYear()
    }

    // Generate visible days (all days of the month)
    const getVisibleDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth)
        const visibleDays = []

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            visibleDays.push(i)
        }

        return visibleDays
    }

    const isPastDate = (date: Date, day: number) => {
        const today = new Date()
        const checkDate = new Date(date.getFullYear(), date.getMonth(), day)
        today.setHours(0, 0, 0, 0)
        checkDate.setHours(0, 0, 0, 0)
        return checkDate < today
    }

    const isFutureDate = (date: Date, day: number) => {
        const today = new Date()
        const checkDate = new Date(date.getFullYear(), date.getMonth(), day)
        today.setHours(0, 0, 0, 0)
        checkDate.setHours(0, 0, 0, 0)
        return checkDate > today
    }

    const getStatusForDate = (userId: string, date: Date, day: number) => {
        const hasReport = hasReportForDate(userId, date, day)
        const isPast = isPastDate(date, day)
        const isFuture = isFutureDate(date, day)

        if (isFuture) {
            return null // No status for future dates
        } else if (hasReport) {
            return 'present' // Tick for submitted reports
        } else {
            return 'absent' // Cross for past days and today without reports
        }
    }

    const getWorkingDaysCount = (userId: string, month: Date) => {
        const daysInMonth = getDaysInMonth(month)
        let count = 0

        for (let day = 1; day <= daysInMonth; day++) {
            const status = getStatusForDate(userId, month, day)
            if (status === 'present') {
                count++
            }
        }

        return count
    }

    const getTotalWorkingDays = () => {
        return users.reduce((total, user) => {
            return total + getWorkingDaysCount(user.id, currentMonth)
        }, 0)
    }

    if (loading) {
        return (
            <Card className="border-0 shadow-none">
                <CardContent className="p-8">
                    <div className="text-center text-gray-400 font-light text-lg">Loading calendar...</div>
                </CardContent>
            </Card>
        )
    }

    const visibleDays = getVisibleDays()

    return (
        <div className="space-y-6">
            <Card className="border-1 shadow-lg bg-white">
                <CardHeader className="border-b-1  pb-6">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-gray-800 flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-gray-600" />
                        Work Calendar
                    </CardTitle>
                    <p className="text-gray-600 mt-2">Track daily report submissions across your team</p>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Navigation Header */}
                    <div className="flex items-center justify-center mb-8">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-blue-600 transition-all duration-200"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="mx-6 text-center">
                            <div className="text-2xl font-bold text-gray-800">
                                {getYear(currentMonth)} | {getMonthName(currentMonth)}
                            </div>
                        </div>
                        <button
                            onClick={() => navigateMonth('next')}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-blue-600 transition-all duration-200"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Calendar Table */}
                    <div className="overflow-x-auto overflow-y-auto rounded-lg border border-gray-200" style={{ maxHeight: '600px' }}>
                        <table className="w-full border-collapse bg-white">
                            {/* Date Header Row */}
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left font-semibold text-gray-700 p-4 min-w-[150px] border-r border-gray-200 bg-gray-50 sticky top-0 left-0 z-30 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-600" />
                                            Team Members
                                        </div>
                                    </th>
                                    {visibleDays.map((day, index) => {
                                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                        const shortMonthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        return (
                                            <th key={index} className="text-center font-semibold text-gray-700 p-3 min-w-[50px] border-r border-gray-200 last:border-r-0 bg-gray-50">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-bold text-gray-700">{shortMonthDay}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            {/* User Rows */}
                            <tbody>
                                {users.map((user, userIndex) => (
                                    <tr key={user.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${userIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className={`font-semibold text-gray-800 p-4 border-r border-gray-200 sticky left-0 z-20 ${userIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-600 font-semibold text-sm">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.department}</div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                                                            <Check className="h-2 w-2 text-green-600" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-green-600">
                                                            {getWorkingDaysCount(user.id, currentMonth)} days
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {visibleDays.map((day, index) => (
                                            <td
                                                key={index}
                                                className="text-center p-3 border-r border-gray-200 last:border-r-0 hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                                                onClick={() => handleDayClick(user, currentMonth, day)}
                                            >
                                                {(() => {
                                                    const status = getStatusForDate(user.id, currentMonth, day)
                                                    if (status === 'present') {
                                                        return (
                                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            </div>
                                                        )
                                                    } else if (status === 'absent') {
                                                        return (
                                                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                                                <X className="h-4 w-4 text-red-600" />
                                                            </div>
                                                        )
                                                    } else {
                                                        return (
                                                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                                                <span className="text-gray-400 text-xs">—</span>
                                                            </div>
                                                        )
                                                    }
                                                })()}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 border-gray-200">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span>💡 Click on any day cell to view the detailed report</span>
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm font-semibold text-gray-700 mb-3">Legend</div>
                        <div className="flex items-center gap-8 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="h-3 w-3 text-green-600" />
                                </div>
                                <span>Report Submitted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                                    <X className="h-3 w-3 text-red-600" />
                                </div>
                                <span>No Report</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">—</span>
                                </div>
                                <span>Future Date</span>
                            </div>
                        </div>

                    </div>

                    {/* Summary Stats */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-800">Total Team Members</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{users.length}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-800">Total Reports</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                {reports.filter(report => {
                                    const reportDate = new Date(report.date)
                                    return reportDate.getMonth() === currentMonth.getMonth() &&
                                        reportDate.getFullYear() === currentMonth.getFullYear()
                                }).length}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="h-2 w-2 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-800">Total Working Days</span>
                            </div>
                            <div className="text-2xl font-bold text-green-600 mt-1">{getTotalWorkingDays()}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-800">Days in Month</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{visibleDays.length}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <h4 className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />

                            {selectedUser ? `${selectedUser.name}'s Report for ${new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}` : 'Report Details'}
                        </h4>
                    </DialogHeader>
                    {loadingReport ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading report...</p>
                        </div>
                    ) : selectedReport ? (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <User className="h-4 w-4" />
                                        <span><strong>User:</strong> {selectedUser?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        <span><strong>Submitted:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span><strong>Date:</strong> {new Date(selectedReport.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Users className="h-4 w-4" />
                                        <span><strong>Department:</strong> {selectedUser?.department}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Daily Report Content
                                </h3>
                                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                                    <TextWithLinks text={selectedReport.content} />
                                </div>

                                {/* Photos Section */}
                                {selectedReport.photos && selectedReport.photos.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Attached Photos
                                        </h3>
                                        <div className="flex justify-start">
                                            <PhotoViewer photos={selectedReport.photos} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Report Found</h3>
                            <p className="text-gray-600">
                                {selectedUser?.name} has not submitted a report for {new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}.
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
