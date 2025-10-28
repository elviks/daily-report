"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { RegisterCompanyForm } from "@/components/register-company-form";

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          {/* Form Section */}
          <div className="max-w-md mx-auto">
            {showLogin ? (
              <LoginForm />
            ) : (
              <RegisterCompanyForm />
            )}

            {/* Toggle Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm"
              >
                {showLogin
                  ? "Don't have a company account? Register here"
                  : "Already have an account? Sign in here"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
