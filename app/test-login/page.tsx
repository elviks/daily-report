"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TestLoginPage() {
  const [credentials, setCredentials] = useState({
    companyCode: "",
    email: "",
    password: ""
  });
  const [result, setResult] = useState<any>(null);
  const [inspection, setInspection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setInspection(null);

    try {
      console.log("Attempting login with:", credentials);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        // Store data
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        localStorage.setItem("tenant", JSON.stringify(data.tenant));

        // Analyze the data
        const user = data.user;
        const isAdmin = user.isAdmin || user.role === "superadmin" || user.role === "admin";
        
        console.log("User data:", user);
        console.log("User role:", user.role);
        console.log("User isAdmin:", user.isAdmin);
        console.log("Calculated isAdmin:", isAdmin);

        setResult({
          success: true,
          message: `Login successful! User role: ${user.role}, isAdmin: ${user.isAdmin}`,
          shouldRedirectToAdmin: isAdmin,
          user: user,
          tenant: data.tenant
        });

        // Also inspect the user in the database
        try {
          const inspectResponse = await fetch('/api/debug/inspect-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyCode: credentials.companyCode,
              email: credentials.email
            })
          });
          
          if (inspectResponse.ok) {
            const inspectData = await inspectResponse.json();
            setInspection(inspectData);
            console.log("Database inspection:", inspectData);
          }
        } catch (inspectError) {
          console.error("Inspection failed:", inspectError);
        }

        // Simulate redirect decision
        setTimeout(() => {
          if (isAdmin) {
            console.log("Would redirect to /admin");
            alert("✅ SUCCESS: Would redirect to /admin\n\nUser role: " + user.role + "\nUser isAdmin: " + user.isAdmin);
          } else {
            console.log("Would redirect to /dashboard");
            alert("❌ ISSUE: Would redirect to /dashboard\n\nUser role: " + user.role + "\nUser isAdmin: " + user.isAdmin);
          }
        }, 1000);

      } else {
        setResult({
          success: false,
          message: data.message || "Login failed",
          error: data
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setResult({
        success: false,
        message: "Network error",
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login Test Page
          </h1>
          <p className="text-gray-600">
            This page tests the login process step by step
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="companyCode">Company Code</Label>
                <Input
                  id="companyCode"
                  value={credentials.companyCode}
                  onChange={(e) => setCredentials(prev => ({ ...prev, companyCode: e.target.value }))}
                  placeholder="Enter company code"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Logging in..." : "Test Login"}
              </Button>
            </form>

            {result && (
              <div className="mt-6">
                <Alert variant={result.success ? "default" : "destructive"}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Result:</strong> {result.message}</p>
                      {result.success && (
                        <>
                          <p><strong>Should redirect to admin:</strong> {result.shouldRedirectToAdmin ? "Yes" : "No"}</p>
                          <p><strong>User role:</strong> {result.user?.role}</p>
                          <p><strong>User isAdmin:</strong> {result.user?.isAdmin ? "true" : "false"}</p>
                          <p><strong>Company:</strong> {result.tenant?.name} ({result.tenant?.slug})</p>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {inspection && (
              <div className="mt-6">
                <Alert variant="default">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Database Inspection:</strong></p>
                      <p><strong>User role (from DB):</strong> {inspection.user?.role}</p>
                      <p><strong>User isAdmin (from DB):</strong> {inspection.user?.isAdmin ? "true" : "false"}</p>
                      <p><strong>Analysis - isAdminUser:</strong> {inspection.analysis?.isAdminUser ? "true" : "false"}</p>
                      <p><strong>Analysis - shouldRedirectToAdmin:</strong> {inspection.analysis?.shouldRedirectToAdmin ? "true" : "false"}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Test Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                onClick={() => setCredentials({
                  companyCode: "mockco",
                  email: "admin@mockco.com",
                  password: "admin123"
                })}
                variant="outline"
                className="w-full"
              >
                Load Default Credentials (mockco)
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Use these to test with the default tenant
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
