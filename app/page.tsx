import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  // In a real app, check if user is already authenticated and redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Daily Report Tool</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to submit your daily reports</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
