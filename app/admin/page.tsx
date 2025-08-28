import { AdminLayout } from "@/components/admin-layout"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminTest } from "@/components/admin-test"

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <AdminDashboard />

      </div>
    </AdminLayout>
  )
}
