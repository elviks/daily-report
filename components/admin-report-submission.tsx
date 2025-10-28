"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Send, AlertCircle, CheckCircle, Calendar, User, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  department: string
  role: string
}

interface SubmittedReport {
  _id: string
  date: string
  content: string
  userName: string
  userEmail: string
  submittedAt: string
}

export function AdminReportSubmission() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [reportContent, setReportContent] = useState("")
  const [pincode, setPincode] = useState("")
  const [pincodeError, setPincodeError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(true)
  const [recentSubmissions, setRecentSubmissions] = useState<SubmittedReport[]>([])

  useEffect(() => {
    fetchUsers()
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [])

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true)
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        })
        return
      }

      const response = await fetch("/api/admin/users/non-admin", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUsers(data.users)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch users",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setFetchingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous PIN error
    setPincodeError("")

    if (!selectedUserId || !selectedDate || !reportContent.trim() || !pincode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including the PIN code",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        })
        return
      }

      const response = await fetch("/api/admin/reports/submit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: selectedUserId,
          date: selectedDate,
          content: reportContent.trim(),
          pincode: pincode.trim()
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        })

        // Add to recent submissions
        if (data.report) {
          setRecentSubmissions(prev => [data.report, ...prev.slice(0, 4)])
        }

        // Reset form
        setSelectedUserId("")
        setReportContent("")
        setPincode("")
        setPincodeError("")
        // Keep the same date for convenience
      } else {
        // Check if it's a PIN code error
        if (response.status === 403 || data.error?.toLowerCase().includes("pin")) {
          setPincodeError(data.error || "Invalid PIN code")
        }

        toast({
          title: "Error",
          description: data.error || "Failed to submit report",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = users.find(user => user.id === selectedUserId)

  return (
    <div className="space-y-6">
      {/* Main Form */}
      <Card className="glass border-0 shadow-xl overflow-hidden rounded-2xl">
        <CardHeader className="flex flex-row items-center space-x-3 pb-6">
          <div className="p-2 bg-[var(--primary)]/20 rounded-xl">
            <UserPlus className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">
              Submit Report for Employee
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Add daily reports on behalf of employees who cannot submit due to emergencies
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Select Employee *</span>
                </Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={fetchingUsers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={fetchingUsers ? "Loading employees..." : "Choose an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-slate-500">{user.email} • {user.department}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUser && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    <strong>{selectedUser.name}</strong> - {selectedUser.role} in {selectedUser.department}
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Report Date *</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
            </div>

            {/* Report Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Report Content *</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Enter the daily report content for the employee..."
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="text-xs text-slate-500">
                {reportContent.length}/1000 characters
              </div>
            </div>

            {/* PIN Code */}
            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>Admin PIN Code *</span>
              </Label>
              <Input
                id="pincode"
                type="password"
                placeholder="Enter the admin PIN code to authorize submission..."
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value)
                  setPincodeError("") // Clear error when user types
                }}
                className={`w-full ${pincodeError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                maxLength={10}
              />
              {pincodeError ? (
                <div className="text-xs text-red-600 flex items-center space-x-1 bg-red-50 p-2 rounded border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{pincodeError}</span>
                </div>
              ) : (
                <div className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>PIN code is required for security verification</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || !selectedUserId || !selectedDate || !reportContent.trim() || !pincode.trim()}
                className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6 py-2"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Submit Report</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <Card className="glass border-0 shadow-xl overflow-hidden rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Recent Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((report) => (
                <div key={report._id} className="bg-slate-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-slate-800">{report.userName}</h4>
                      <p className="text-sm text-slate-500">{report.userEmail}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <div>{report.date}</div>
                      <div>{new Date(report.submittedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">{report.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


