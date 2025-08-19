import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          {/* Login Form Section */}
          <div className="max-w-md mx-auto">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
