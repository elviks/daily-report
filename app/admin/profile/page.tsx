"use client"

import { AdminLayout } from "@/components/admin-layout"
import { ProfileForm } from "@/components/profile-form"

export default function AdminProfilePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">Manage your personal information and account settings</p>
          </div>
        </div>
        <ProfileForm />
      </div>
    </AdminLayout>
  )
}
