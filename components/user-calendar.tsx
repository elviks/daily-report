"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, XCircle, FileText, Clock, User } from "lucide-react"
import { isWorkingDay } from "@/lib/utils"
import { TextWithLinks } from "@/components/ui/text-with-links"
import { PhotoViewer } from "@/components/photo-viewer"

interface UserCalendarProps {
    userId: string
    userName: string
}

interface Report {
    id: string
    date: string
    content: string
    photos?: string[]
    createdAt: string
    updatedAt: string
}

export function UserCalendar({ userId = "1", userName = "Alex Morgan" }: UserCalendarProps) {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)

    useEffect(() => {
        fetchUserReports()
    }, [userId])

    const fetchUserReports = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found");
                setReports([]);
                return;
            }

            const response = await fetch(`/api/admin/reports/user/${userId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json()

            if (response.ok) {
                const reports = Array.isArray(data.reports) ? data.reports : []
                setReports(reports)
            } else {
                console.error("Failed to fetch user reports:", data.error);
                setReports([])
            }
        } catch (error) {
            console.error("Error fetching user reports:", error)
            setReports([])
        } finally {
            setLoading(false)
        }
    }

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        return { daysInMonth, startingDayOfWeek }
    }

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const hasReportForDate = (date: Date) => {
        const dateStr = formatDate(date)
        return reports.some(report => report.date === dateStr)
    }

    const getReportForDate = (date: Date) => {
        const dateStr = formatDate(date)
        return reports.find(report => report.date === dateStr)
    }

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        const report = getReportForDate(date)
        setSelectedReport(report || null)
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    const isPastDate = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        date.setHours(0, 0, 0, 0)
        return date < today
    }

    const isFutureDate = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        date.setHours(0, 0, 0, 0)
        return date > today
    }

    const isSaturday = (date: Date) => {
        return date.getDay() === 6 // Saturday is day 6
    }

    const getMonthName = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
        const days = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-12"></div>)
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const hasReport = hasReportForDate(date)
            const report = getReportForDate(date)
            const isCurrentDay = isToday(date)
            const isPast = isPastDate(date)
            const isFuture = isFutureDate(date)
            const isSat = isSaturday(date)
            const isWorkingDayDate = isWorkingDay(date)
            const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString()

            let statusClass = ""
            let statusIcon = null
            let statusText = ""

            if (isSat) {
                // Saturday - always highlighted as weekend
                statusClass = "bg-blue-50 text-blue-600 border border-blue-200"
                statusText = "Weekend"
            } else if (isFuture) {
                statusClass = "bg-white text-gray-300 border border-gray-100"
                statusText = "Future"
            } else if (hasReport) {
                statusClass = "bg-black text-white border-2 border-black"
                statusIcon = <CheckCircle className="h-3 w-3 text-white" />
                statusText = "Submitted"
            } else if (isPast && isWorkingDayDate) {
                // Past working day without report = missing
                statusClass = "bg-gray-50 text-gray-600 border border-gray-200"
                statusIcon = <XCircle className="h-3 w-3 text-gray-400" />
                statusText = "Missing"
            } else if (isCurrentDay) {
                statusClass = "bg-white text-black border-2 border-black shadow-lg"
                statusText = "Today"
            } else {
                // Past weekend or other non-working day
                statusClass = "bg-white text-gray-400 border border-gray-100"
                statusText = "Weekend"
            }

            // Add selection styling
            if (isSelected) {
                statusClass += " ring-2 ring-blue-500 ring-offset-2"
            }

            days.push(
                <div
                    key={day}
                    className={`h-12 p-2 cursor-pointer hover:shadow-md hover:border-black group ${statusClass} ${isCurrentDay ? 'ring-1 ring-black' : ''
                        }`}
                    title={`${date.toLocaleDateString()}: ${statusText}`}
                    onClick={() => handleDateClick(date)}
                >
                    <div className="flex items-center justify-between h-full">
                        <span className="text-sm font-medium">{day}</span>
                        {statusIcon}
                    </div>
                </div>
            )
        }

        return days
    }

    const getStats = () => {
        const totalDays = reports.length

        // Get all report dates for the current month
        const currentMonthReportDates = reports
            .filter(report => {
                const reportDate = new Date(report.date)
                return reportDate.getMonth() === currentMonth.getMonth() &&
                    reportDate.getFullYear() === currentMonth.getFullYear()
            })
            .map(report => report.date)

        // Count submitted reports for current month (weekdays only)
        const currentMonthSubmitted = currentMonthReportDates.filter(dateStr => {
            const reportDate = new Date(dateStr)
            return isWorkingDay(reportDate)
        }).length

        // Calculate missing working days for current month
        const { daysInMonth } = getDaysInMonth(currentMonth)
        const today = new Date()
        let missingCount = 0

        // Check if the month being viewed is in the past, current, or future
        const isCurrentMonth = currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        const isPastMonth = currentMonth < new Date(today.getFullYear(), today.getMonth(), 1)
        const isFutureMonth = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const isWorkingDayDate = isWorkingDay(date)

            // For past months: count all working days as potentially missing
            // For current month: only count working days that are in the past or today
            // For future months: don't count any as missing
            let shouldCountAsMissing = false

            if (isPastMonth && isWorkingDayDate) {
                shouldCountAsMissing = true
            } else if (isCurrentMonth && isWorkingDayDate && !isFutureDate(date)) {
                shouldCountAsMissing = true
            } else if (isFutureMonth) {
                shouldCountAsMissing = false
            }

            if (shouldCountAsMissing) {
                const dateStr = formatDate(date)
                const hasReport = currentMonthReportDates.includes(dateStr)

                if (!hasReport) {
                    missingCount++
                }
            }
        }

        return {
            totalDays,
            currentMonthSubmitted,
            currentMonthMissing: missingCount
        }
    }

    const stats = getStats()

    if (loading) {
        return (
            <Card className="border-0 shadow-none">
                <CardContent className="p-8">
                    <div className="text-center text-gray-400 font-light text-lg">Loading calendar...</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-none">
                <CardHeader className="border-b border-gray-100 pb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-2xl font-light tracking-tight text-black mb-2">
                                <Calendar className="h-6 w-6 text-black" />
                                {userName}'s Report Calendar
                            </CardTitle>
                            <div className="text-gray-500 font-light">
                                {stats.totalDays} total reports submitted
                            </div>
                        </div>

                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="px-4 py-2 hover:bg-gray-50 border border-gray-200 hover:border-black font-light text-gray-700 hover:text-black text-sm"
                        >
                            ← Previous
                        </button>
                        <h2 className="text-xl font-light tracking-wide text-black">{getMonthName(currentMonth)}</h2>
                        <button
                            onClick={() => navigateMonth('next')}
                            className="px-4 py-2 hover:bg-gray-50 border border-gray-200 hover:border-black font-light text-gray-700 hover:text-black text-sm"
                        >
                            Next →
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-6">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="h-8 flex items-center justify-center text-xs uppercase tracking-widest font-medium text-gray-500 bg-gray-50 border border-gray-100">
                                {day}
                            </div>
                        ))}
                        {renderCalendar()}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 text-xs font-light text-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-black border-2 border-black rounded-sm flex items-center justify-center">
                                <CheckCircle className="h-2 w-2 text-white" />
                            </div>
                            <span>Submitted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center">
                                <XCircle className="h-2 w-2 text-gray-400" />
                            </div>
                            <span>Missing</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded-sm"></div>
                            <span>Weekend</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border border-gray-100 rounded-sm"></div>
                            <span>Future</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Date Report */}
            {selectedDate && (
                <Card className="border-0 shadow-none">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <CardTitle className="flex items-center gap-3 text-xl font-light tracking-tight text-black">
                            <FileText className="h-5 w-5 text-black" />
                            Report for {selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {selectedReport ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{userName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Submitted: {new Date(selectedReport.createdAt).toLocaleString()}</span>
                                    </div>
                                    {selectedReport.updatedAt !== selectedReport.createdAt && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>Updated: {new Date(selectedReport.updatedAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-gray-800 font-light leading-relaxed">
                                        <TextWithLinks text={selectedReport.content} />
                                    </div>
                                </div>
                                
                                {/* Photos Section */}
                                {selectedReport.photos && selectedReport.photos.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Attached Photos
                                        </h4>
                                        <div className="flex justify-start">
                                            <PhotoViewer photos={selectedReport.photos} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 font-light text-lg mb-2">
                                    No report submitted for this date
                                </div>
                                <div className="text-gray-500 text-sm">
                                    {isWorkingDay(selectedDate) ?
                                        "This was a working day but no report was submitted." :
                                        "This was not a working day."
                                    }
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}