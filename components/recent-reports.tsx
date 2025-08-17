"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, FileText, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Report {
  id: string
  date: string
  content: string
  createdAt: string
}

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  useEffect(() => {
    fetchReports()

    // Listen for new report submissions
    const handleReportSubmitted = () => {
      fetchReports()
    }

    window.addEventListener("reportSubmitted", handleReportSubmitted)
    return () => window.removeEventListener("reportSubmitted", handleReportSubmitted)
  }, [])

  const fetchReports = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      console.log("Fetching reports for user:", user.id, "User object:", user)

      if (!user.id) {
        console.error("No user ID found in localStorage")
        setReports([])
        return
      }

      const response = await fetch(`/api/reports/user/${user.id}`)
      const data = await response.json()

      if (response.ok) {
        console.log("Reports fetched successfully:", data.reports)
        setReports(data.reports)
      } else {
        console.error("Failed to fetch reports:", data)
        setReports([])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const openReport = (report: Report) => {
    setSelectedReport(report)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-3xl mx-auto">
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                <FileText className="h-6 w-6 text-gray-600" />
                Your Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-600">Loading reports...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Your Recent Reports
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="">
            <ScrollArea className="h-[500px] rounded-lg border border-slate-200">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No reports submitted yet</h3>
                  <p className="text-slate-500 text-sm">Your daily reports will appear here once you start submitting them.</p>
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  {reports.map((report) => {
                    const isLong = (report.content?.length || 0) > 220
                    return (
                      <div
                        key={report.id}
                        className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium text-slate-900">{formatDate(report.date)}</span>
                            </div>
                          </div>
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                            Submitted
                          </Badge>
                        </div>
                        <p className="text-slate-700 leading-relaxed mb-3 line-clamp-3">
                          {report.content}
                        </p>
                        {isLong && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200"
                            onClick={() => openReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View full report
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-2xl bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {selectedReport ? `Report for ${formatDate(selectedReport.date)}` : "Report"}
                </DialogTitle>
                {selectedReport?.createdAt && (
                  <DialogDescription className="text-slate-600">
                    Submitted on {new Date(selectedReport.createdAt).toLocaleString()}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-[60vh] overflow-y-auto">
                <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {selectedReport?.content}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  )
}