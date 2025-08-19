import { DashboardLayout } from "@/components/dashboard-layout"
import { ReportSubmission } from "@/components/report-submission"
import { RecentReports } from "@/components/recent-reports"
import { Calendar, FileText, TrendingUp, Clock } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-gray-500/10 to-gray-500/10 rounded-2xl border border-gray-200/50 mb-6">
            <Calendar className="w-6 h-6 text-gray-600 mr-2" />
            <span className="text-gray-700 font-semibold">Today's Dashboard</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <ReportSubmission />
          </div>

          <div className="space-y-6">
            <RecentReports />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
