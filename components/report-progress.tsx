"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Users, AlertCircle, TrendingUp, RefreshCw, Calendar } from "lucide-react"

interface RecentSubmission {
  _id: string
  date: string
  content: string
  createdAt: string
  userName: string
  userEmail: string
}

interface ProgressData {
  totalUsers: number
  submittedCount: number
  pendingCount: number
  progressPercentage: number
  status: string
  recentSubmissions: RecentSubmission[]
  lastUpdated?: string
  targetDeadline?: string
}

interface ReportProgressProps {
  className?: string
  onError?: (error: string) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ReportProgress({
  className = "",
  onError,
  autoRefresh = false,
  refreshInterval = 30000
}: ReportProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    onError?.(errorMessage)
    console.error("Progress error:", errorMessage)
  }, [onError])

  const fetchProgress = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch("/api/admin/progress", {
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
        throw new Error(data.error || "Failed to fetch progress")
      }

      setProgress(data.progress)
      setLastRefresh(new Date())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch progress"
      handleError(errorMessage)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [handleError])

  // Auto-refresh functionality
  useEffect(() => {
    fetchProgress()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchProgress()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [fetchProgress, autoRefresh, refreshInterval])

  const progressMetrics = useMemo(() => {
    if (!progress) return null

    const percentage = progress.progressPercentage

    const getStatusConfig = (percentage: number) => {
      if (percentage >= 90) return {
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        text: "Excellent",
        icon: CheckCircle,
        progressColor: "stroke-green-500",
        circleColor: "text-green-500"
      }
      if (percentage >= 75) return {
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        text: "Good Progress",
        icon: TrendingUp,
        progressColor: "stroke-blue-500",
        circleColor: "text-blue-500"
      }
      if (percentage >= 50) return {
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        text: "Moderate",
        icon: Clock,
        progressColor: "stroke-yellow-500",
        circleColor: "text-yellow-500"
      }
      return {
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        text: "Needs Attention",
        icon: AlertCircle,
        progressColor: "stroke-red-500",
        circleColor: "text-red-500"
      }
    }

    return getStatusConfig(percentage)
  }, [progress])

  const formatTimeAgo = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`

      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return "Unknown"
    }
  }, [])

  const formatDeadline = useCallback((deadline: string) => {
    try {
      const date = new Date(deadline)
      const now = new Date()
      const diffMs = date.getTime() - now.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

      if (diffHours < 0) return "Overdue"
      if (diffHours < 24) return `${diffHours}h remaining`

      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d remaining`
    } catch {
      return "No deadline set"
    }
  }, [])

  const retryFetch = useCallback(() => {
    setError(null)
    fetchProgress()
  }, [fetchProgress])

  const handleManualRefresh = useCallback(() => {
    fetchProgress(true)
  }, [fetchProgress])

  // Loading state
  if (loading) {
    return (
      <Card className={`glass border-0 shadow-xl overflow-hidden rounded-2xl ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Report Progress
          </CardTitle>
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <CheckCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="space-y-3 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <div className="text-slate-500 dark:text-slate-400">Loading progress...</div>
            </div>
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
            Report Progress
          </CardTitle>
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="space-y-3 text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div className="text-slate-800 dark:text-slate-200 font-medium">
                Unable to load progress
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
            Report Progress
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>Today's submission status</span>
            {progress?.targetDeadline && (
              <>
                <span>•</span>
                <span className="font-medium">{formatDeadline(progress.targetDeadline)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {lastRefresh && (
            <div className="text-xs text-slate-400 dark:text-slate-500">
              {formatTimeAgo(lastRefresh.toISOString())}
            </div>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <CheckCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {progress && progressMetrics && (
          <div className="space-y-8">
            {/* Semi-Circular Progress */}
            <div className="flex flex-col items-center">
              <div className="relative w-56 h-32 mb-6">
                {/* Background semi-circle */}
                <svg className="w-56 h-32" viewBox="0 0 120 70" style={{ transform: 'rotate(0deg)' }}>
                  <path
                    d="M 15 60 A 45 45 0 0 1 105 60"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  {/* Progress semi-circle */}
                  <path
                    d="M 15 60 A 45 45 0 0 1 105 60"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${Math.PI * 45}`}
                    strokeDashoffset={`${Math.PI * 45 * (1 - progress.progressPercentage / 100)}`}
                    className={`${progressMetrics.circleColor} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center mt-10">
                    <div className={`text-4xl font-bold ${progressMetrics.color} transition-colors duration-300`}>
                      {progress.progressPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div className={`px-4 py-2 rounded-full border ${progressMetrics.borderColor} ${progressMetrics.bgColor} transition-all duration-300`}>
                <div className="flex items-center space-x-2">
                  <progressMetrics.icon className={`h-4 w-4 ${progressMetrics.color}`} />
                  <span className={`text-sm font-semibold ${progressMetrics.color}`}>
                    {progressMetrics.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Total Users */}
              <div className="text-center space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center">
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {progress.totalUsers.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total Users
                </div>
              </div>

              {/* Submitted */}
              <div className="text-center space-y-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-center">
                  <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {progress.submittedCount.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Submitted
                </div>
              </div>

              {/* Pending */}
              <div className="text-center space-y-2 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center justify-center">
                  <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {progress.pendingCount.toLocaleString()}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Pending
                </div>
              </div>
            </div>

            {/* Recent Submissions */}
            {progress.recentSubmissions && progress.recentSubmissions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Recent Submissions
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Last {progress.recentSubmissions.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {progress.recentSubmissions.slice(0, 3).map((submission) => (
                    <div
                      key={submission._id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {submission.userName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {submission.content}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 ml-2 flex-shrink-0">
                        {formatTimeAgo(submission.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Summary */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                {progress.submittedCount} of {progress.totalUsers} users have submitted their reports
                {progress.lastUpdated && (
                  <span className="block mt-1">
                    Last updated: {formatTimeAgo(progress.lastUpdated)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}