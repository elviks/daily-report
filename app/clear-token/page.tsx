"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClearTokenPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all authentication data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("tenant");
    
    console.log("Cleared all authentication data from localStorage");
  }, []);

  const goToLogin = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Token Cleared</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your old JWT token has been cleared. This was necessary because the JWT secret was updated.
          </p>
          <p className="text-sm text-gray-500">
            Please log in again to get a new valid token.
          </p>
          <Button onClick={goToLogin} className="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
