"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, FileText, Eye, Clock, TrendingUp, CheckCircle, Search } from "lucide-react"
import { TextWithLinks } from "@/components/ui/text-with-links"
import { PhotoViewer } from "@/components/photo-viewer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Report {
  id: string
  date: string
  content: string
  photos?: string[]
  createdAt: string
}

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchReports()

    // Listen for new report submissions
    const handleReportSubmitted = () => {
      fetchReports()
    }

    window.addEventListener("reportSubmitted", handleReportSubmitted)
    return () => window.removeEventListener("reportSubmitted", handleReportSubmitted)
  }, [])

  // Filter reports based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReports(reports)
    } else {
      const filtered = reports.filter(report => 
        report.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDate(report.date).toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredReports(filtered)
    }
  }, [reports, searchQuery])

  const fetchReports = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      console.log("Fetching reports for user:", user._id || user.id, "User object:", user)

      const userId = user._id || user.id;
      if (!userId) {
        console.error("No user ID found in localStorage")
        setReports([])
        return
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/reports/user/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
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
      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-500 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-800">
              Recent Reports
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gray-500 rounded-2xl flex items-center justify-center animate-pulse-glow">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
              <div className="text-center">
                <p className="text-slate-600 font-medium">Loading your reports...</p>
                <p className="text-slate-500 text-sm">Please wait while we fetch your data</p>
              </div>
              {/* Beautiful Loading Animation */}
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-0 shadow-sm transition-all duration-500 overflow-hidden">
      {/* Beautiful Header */}
      <CardHeader className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 border-b border-white/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-400/10 to-gray-400/10 rounded-full blur-2xl"></div>

        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-500 rounded-xl shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">
                Recent Reports
              </CardTitle>
              <p className="text-slate-600 text-sm mt-1">
                Track your daily progress and achievements
              </p>
            </div>
          </div>

          
        </div>
      </CardHeader>

      <CardContent className="p-0">
      <div className="flex items-center justify-center space-x-3 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>

            {/* Stats Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-100 rounded-full border border-gray-200/50">
              <CheckCircle className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}
                {searchQuery && filteredReports.length !== reports.length && (
                  <span className="text-gray-500"> of {reports.length}</span>
                )}
              </span>
            </div>
          </div>
        <ScrollArea className="h-[500px]">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 rounded-full"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No reports submitted yet</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Start your journey by submitting your first daily report. Track your progress and build consistent habits.
              </p>

            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 rounded-full"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No reports found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                No reports match your search criteria. Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {filteredReports.map((report, index) => {
                const isLong = (report.content?.length || 0) > 220
                const isRecent = new Date(report.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

                return (
                  <div
                    key={report.id}
                    className="group border border-white/30 rounded-2xl p-6 shadow-sm transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:border-gray-200/50"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Report Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 ">
                        <div className="p-2 bg-gradient-to-r from-gray-100 to-gray-100 rounded-xl group-hover:from-gray-200 group-hover:to-gray-200 transition-colors duration-300">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">{formatDate(report.date)}</span>
                          {isRecent && (
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-xs text-gray-600 font-medium">Recent</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-100 border-gray-200/50 rounded-xl hover:from-gray-200 hover:to-gray-200 text-green-700 transition-all duration-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Submitted
                        </Badge>

                        {isLong && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200/50 hover:border-gray-300 transition-all duration-300 group-hover:scale-105"
                            onClick={() => openReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Report Content Preview */}
                    <div className="relative">
                      <div className="text-slate-700 leading-relaxed mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                        <TextWithLinks text={report.content} />
                      </div>

                      {/* Content Stats and Actions */}
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{report.content.length} characters</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{report.content.split(' ').length} words</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {report.photos && report.photos.length > 0 && (
                            <PhotoViewer photos={report.photos} />
                          )}
                          {isLong && (
                            <span className="text-blue-600 font-medium">
                              Click "View Full" to read more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Enhanced Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl glass border-0 shadow-2xl backdrop-blur-md">
          <DialogHeader className="border-b border-white/20 pb-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {selectedReport ? `Report for ${formatDate(selectedReport.date)}` : "Report"}
                </DialogTitle>
                {selectedReport?.createdAt && (
                  <DialogDescription className="text-slate-600 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Submitted on {new Date(selectedReport.createdAt).toLocaleString()}</span>
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="mt-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/50 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-slate max-w-none">
              <div className="text-slate-800 leading-relaxed text-base font-mono">
                {selectedReport ? <TextWithLinks text={selectedReport.content} /> : ''}
              </div>
            </div>

            {/* Photos Section */}
            {selectedReport?.photos && selectedReport.photos.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-center">
                  <PhotoViewer photos={selectedReport.photos} className="bg-white hover:bg-gray-50" />
                </div>
              </div>
            )}
          </div>

          {/* Report Stats */}
          {selectedReport && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-600">{selectedReport.content.length}</div>
                  <div className="text-sm text-gray-700">Characters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{selectedReport.content.split(' ').length}</div>
                  <div className="text-sm text-indigo-700">Words</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{selectedReport.content.split('\n').length}</div>
                  <div className="text-sm text-purple-700">Lines</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}