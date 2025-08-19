"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Calendar, CheckCircle, FileText, Clock, Target, TrendingUp } from "lucide-react"
import { getAllowedReportDates, isDateAllowedForReport, getAllowedDatesMessage } from "@/lib/utils"

export function ReportSubmission() {
  const [date, setDate] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Get allowed dates for report submission (considering weekends)
  const allowedDates = getAllowedReportDates()

  useEffect(() => {
    // Set today's date as default and check
    setDate(allowedDates.today)
    checkTodaySubmission(allowedDates.today)
  }, [allowedDates.today])

  const checkTodaySubmission = async (selectedDate: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch(`/api/reports/check?date=${selectedDate}&userId=${user.id}`)
      const data = await response.json()

      if (data.exists) {
        setContent(data.report.content)
        setSubmitted(true)
      } else {
        setSubmitted(false)
        setContent("")
      }
    } catch (error) {
      console.error("Error checking submission:", error)
    }
  }

  const handleDateChange = (newDate: string) => {
    // Check if the selected date is allowed
    if (!isDateAllowedForReport(newDate)) {
      setError("You can only submit reports for allowed dates. " + getAllowedDatesMessage())
      return
    }
    setError("")
    setDate(newDate)
    checkTodaySubmission(newDate)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch("/api/reports/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          date,
          content,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        // Trigger a refresh of recent reports
        window.dispatchEvent(new CustomEvent("reportSubmitted"))
      } else {
        setError(data.message || data.error || "Failed to submit report")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <div>
              <CardTitle className="text-xl font-medium text-gray-900">
                {submitted ? "Update Your Report" : "Submit Daily Report"}
              </CardTitle>
              <p className="text-gray-500 text-sm mt-1">
                {submitted ? "Modify your existing report for today" : "Share your daily progress and achievements"}
              </p>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-gray-700 text-sm">
                    <span className="font-medium">Submission Guidelines:</span> {getAllowedDatesMessage()}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Reports can be submitted and edited until the end of each allowed day.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {submitted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-green-700 text-sm font-medium">
                    Report submitted successfully! You can edit it until the end of the day.
                  </p>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-gray-700 font-medium text-sm flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Report Date</span>
              </Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
            </div>

            {/* Content Input */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-gray-700 font-medium text-sm flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span>Daily Activities & Progress</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Describe your daily activities, tasks completed, challenges faced, and any important updates. Be specific about your achievements and what you learned today..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
                className="border-gray-300 focus:border-gray-400 focus:ring-gray-400 resize-none"
              />

              {/* Character Counter */}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{content.length} characters written</span>

              </div>
            </div>


          </CardContent>

          {/* Footer with Submit Button */}
          <CardFooter className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {submitted ? "Update Report" : "Submit Report"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}