import { DashboardLayout } from "@/components/dashboard-layout"
import { ReportSubmission } from "@/components/report-submission"
import { RecentReports } from "@/components/recent-reports"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Submit Today's Report</h2>
            <ReportSubmission />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Reports</h2>
            <RecentReports />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
