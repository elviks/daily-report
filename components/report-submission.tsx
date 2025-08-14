"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Calendar, CheckCircle, FileText } from "lucide-react"

export function ReportSubmission() {
  const [date, setDate] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Allow reports for today and yesterday only
  const todayStr = new Date().toISOString().split("T")[0]
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0]

  useEffect(() => {
    // Set today's date as default and check
    setDate(todayStr)
    checkTodaySubmission(todayStr)
  }, [todayStr])

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
    // Only allow today or yesterday
    if (newDate !== todayStr && newDate !== yesterdayStr) {
      setError("You can only submit reports for today or yesterday")
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

    <div className="max-w-3xl mx-auto">
      <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 ">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="flex items-center text-red-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {submitted && (
              <Alert className="bg-gray-100 border-gray-200 animate-pulse">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <AlertDescription className="flex items-center text-gray-700 ml-2">
                  Report submitted successfully! You can edit it until the end of the day.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700 font-medium">
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={yesterdayStr}
                  max={todayStr}
                  required
                  className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                />
              </div>
              <p className="text-sm text-slate-500">You can submit reports for today or yesterday</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-slate-700 font-medium">
                What did you work on today?
              </Label>
              <Textarea
                id="content"
                placeholder="Describe your daily activities, tasks completed, challenges faced, and any important updates..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
                className="resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 p-6">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
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