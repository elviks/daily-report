"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, AlertCircle, TrendingUp, Calendar } from "lucide-react"

interface ChartData {
  date: string
  count: number
  dayName: string
  dayNumber: number
}

interface AnalyticsData {
  chartData: ChartData[]
  totalReports: number
  averageReports: number
  period: string
  daysCount: number
  dateRange: {
    start: string
    end: string
  }
}

interface ReportAnalyticsProps {
  className?: string
  onError?: (error: string) => void
}

export function ReportAnalytics({ className = "", onError }: ReportAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    onError?.(errorMessage)
    console.error("Analytics error:", errorMessage)
  }, [onError])

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch("/api/admin/analytics", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch analytics")
      }

      setAnalytics(data.analytics)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch analytics"
      handleError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const getMaxCount = useCallback(() => {
    if (!analytics?.chartData || analytics.chartData.length === 0) return 0
    return Math.max(...analytics.chartData.map(day => day.count))
  }, [analytics])

  const getBarHeight = useCallback((count: number) => {
    const maxCount = getMaxCount()
    if (maxCount === 0) return 8 // Minimum height for empty bars
    // Use a larger multiplier to make bars take more height
    return Math.max((count / maxCount) * 200, count > 0 ? 12 : 6) // Increased from 100 to 200, and minimum heights
  }, [getMaxCount])

  const getBarColor = useCallback((count: number) => {
    if (count === 0) return "bg-slate-200 dark:bg-slate-700"
    if (count <= getMaxCount() * 0.3) return "bg-blue-400 hover:bg-blue-500"
    if (count <= getMaxCount() * 0.7) return "bg-blue-500 hover:bg-blue-600"
    return "bg-blue-600 hover:bg-blue-700"
  }, [getMaxCount])

  const formatDateRange = useCallback(() => {
    if (!analytics) return ""
    
    try {
      const start = new Date(analytics.dateRange.start)
      const end = new Date(analytics.dateRange.end)
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid date range"
      }
      
      if (analytics.period === "This Month") {
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
      
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } catch (error) {
      console.error("Error formatting date range:", error)
      return "Date range unavailable"
    }
  }, [analytics])

  const formatTooltipDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch (error) {
      console.error("Error formatting tooltip date:", error)
      return "Date unavailable"
    }
  }, [])

  const retryFetch = useCallback(() => {
    setError(null)
    fetchAnalytics()
  }, [fetchAnalytics])

  // Loading state
  if (loading) {
    return (
      <Card className={`glass border-0 shadow-xl overflow-hidden rounded-2xl ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Report Analytics
          </CardTitle>
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="text-slate-500 dark:text-slate-400">Loading analytics...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={`glass border-0 shadow-xl overflow-hidden rounded-2xl ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Report Analytics
          </CardTitle>
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center">
          <div className="space-y-3 text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div className="text-slate-800 dark:text-slate-200 font-medium">
              Unable to load analytics
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              {error}
            </div>
            <button
              onClick={retryFetch}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main component
  return (
    <Card className={`glass border-0 shadow-xl overflow-hidden rounded-2xl ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Report Analytics
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange()}</span>
          </div>
        </div>
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="h-full flex flex-col">
        {analytics && (
          <div className="flex flex-col h-full space-y-6">
            {/* Chart */}
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex-1 flex items-end justify-between px-2 gap-1 h-full">
                {analytics.chartData.map((day, index) => (
                  <div key={`${day.date}-${index}`} className="flex flex-col items-center space-y-2 flex-1 group">
                    <div className="flex flex-col items-center space-y-1 w-full">
                      <div
                        className={`w-full max-w-8 rounded-t-sm transition-all duration-300 cursor-pointer transform hover:scale-105 ${getBarColor(day.count)}`}
                        style={{ 
                          height: `${getBarHeight(day.count)}px`,
                          minHeight: "6px"
                        }}
                        title={`${day.count} reports submitted on ${formatTooltipDate(day.date)}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            // Handle keyboard interaction if needed
                          }
                        }}
                      />
                      {/* Count label on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-lg border border-slate-200 dark:border-slate-700 absolute -mt-8">
                        {day.count}
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                        {analytics.period === "This Month" ? day.dayNumber : day.dayName}
                      </span>
                      {analytics.period === "This Month" && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {day.dayName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <div className="text-center space-y-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {analytics.totalReports.toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Reports</div>
              </div>
              <div className="text-center space-y-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {typeof analytics.averageReports === 'number' ? analytics.averageReports.toFixed(1) : '0.0'}
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Average</div>
              </div>
            </div>

            {/* Additional insights */}
            {analytics.chartData.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  {analytics.chartData.filter(day => day.count > 0).length} active days out of {analytics.chartData.length} total days
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}