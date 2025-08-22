"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllReports } from "@/components/all-reports"
import { UserManagement } from "@/components/user-management"
import { WorkCalendar } from "@/components/work-calendar"
import { Users, FileText, TrendingUp, Calendar, BarChart3, Activity, Zap, Target, Settings } from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalReports: number
  reportsToday: number
  activeUsers: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReports: 0,
    reportsToday: 0,
    activeUsers: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-0 shadow-xl hoverflow-hidden group">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-medium text-slate-700">Total Users</CardTitle>
            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl shadow-lg duration-300">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-800 mb-2">{stats.totalUsers}</div>
            <div className="flex items-center text-sm text-slate-600">
              <TrendingUp className="w-4 h-4 text-gray-500 mr-1" />
              <span>Active platform users</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-xl overflow-hidden group">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-medium text-slate-700">Total Reports</CardTitle>
            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl shadow-lg duration-300">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-800 mb-2">{stats.totalReports}</div>
            <div className="flex items-center text-sm text-slate-600">
              <Activity className="w-4 h-4 text-gray-500 mr-1" />
              <span>Reports submitted</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-xl overflow-hidden group">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-medium text-slate-700">Reports Today</CardTitle>
            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl shadow-lg duration-300">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-800 mb-2">{stats.reportsToday}</div>
            <div className="flex items-center text-sm text-slate-600">
              <Zap className="w-4 h-4 text-gray-500 mr-1" />
              <span>Today's activity</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-xl overflow-hidden group">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <CardTitle className="text-sm font-medium text-slate-700">Active Users</CardTitle>
            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl shadow-lg duration-300">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-800 mb-2">{stats.activeUsers}</div>
            <div className="flex items-center text-sm text-slate-600">
              <Target className="w-4 h-4 text-gray-500 mr-1" />
              <span>Currently online</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="glass border-0 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50/50 to-blue-50/30 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-500 rounded-xl">
              <Target className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-slate-800 bg-clip-text text-transparent">
              Management Tools
            </CardTitle>
          </div>
          <p className="text-slate-600 mt-2">
            Manage reports, users, and system configurations
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="reports" className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="flex w-full bg-slate-100/50 rounded-xl p-1">
                <TabsTrigger
                  value="reports"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 rounded-lg transition-all duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  All Reports
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 rounded-lg transition-all duration-200"
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </TabsTrigger>
                <TabsTrigger
                  value="calender"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 rounded-lg transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Work Calender
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="reports" className="p-6 space-y-4">
              <AllReports />
            </TabsContent>

            <TabsContent value="users" className="p-6 space-y-4">
              <UserManagement />
            </TabsContent>

            <TabsContent value="calender" className="p-6 space-y-4">
              <WorkCalendar />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
