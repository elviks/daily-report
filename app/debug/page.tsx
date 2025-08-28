"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DebugPage() {
  const [dbState, setDbState] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [authTestResult, setAuthTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testCredentials, setTestCredentials] = useState({
    companyCode: "",
    email: "",
    password: ""
  });
  const [registrationData, setRegistrationData] = useState({
    companyName: "",
    adminEmail: "",
    adminPassword: ""
  });

  const checkDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/tenants');
      const data = await response.json();
      setDbState(data);
    } catch (error) {
      setDbState({ error: "Failed to fetch database state" });
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCredentials)
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: "Failed to test login" });
    } finally {
      setIsLoading(false);
    }
  };

  const testRegistration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/test-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      const data = await response.json();
      setRegistrationResult(data);
    } catch (error) {
      setRegistrationResult({ error: "Failed to test registration" });
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthTestResult({ error: "No token found in localStorage" });
        return;
      }

      const response = await fetch('/api/debug/auth-test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAuthTestResult(data);
    } catch (error) {
      setAuthTestResult({ error: "Failed to test authentication" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login Debug Tool
          </h1>
          <p className="text-gray-600">
            Use this tool to troubleshoot login issues
          </p>
        </div>

        {/* Database State */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Database State</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={checkDatabase} disabled={isLoading} className="mb-4">
              {isLoading ? "Checking..." : "Check Database State"}
            </Button>
            
            {dbState && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <strong>Total Tenants:</strong> {dbState.totalTenants || 0}
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <strong>Total Users:</strong> {dbState.totalUsers || 0}
                  </div>
                </div>
                
                {dbState.tenants && dbState.tenants.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tenants:</h3>
                    <div className="space-y-2">
                      {dbState.tenants.map((tenant: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                          <strong>Name:</strong> {tenant.name} | <strong>Slug:</strong> {tenant.slug} | <strong>ID:</strong> {tenant.id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {dbState.users && dbState.users.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Users:</h3>
                    <div className="space-y-2">
                      {dbState.users.map((user: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                          <strong>Email:</strong> {user.email} | <strong>Name:</strong> {user.name} | <strong>Tenant:</strong> {user.tenantId} | <strong>Admin:</strong> {user.isAdmin ? "Yes" : "No"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {dbState.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{dbState.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Registration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="regCompanyName">Company Name</Label>
                <Input
                  id="regCompanyName"
                  value={registrationData.companyName}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <Label htmlFor="regAdminEmail">Admin Email</Label>
                <Input
                  id="regAdminEmail"
                  type="email"
                  value={registrationData.adminEmail}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="Enter admin email"
                />
              </div>
              
              <div>
                <Label htmlFor="regAdminPassword">Admin Password</Label>
                <Input
                  id="regAdminPassword"
                  type="password"
                  value={registrationData.adminPassword}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, adminPassword: e.target.value }))}
                  placeholder="Enter admin password"
                />
              </div>
              
              <Button onClick={testRegistration} disabled={isLoading} className="w-full">
                {isLoading ? "Testing..." : "Test Registration"}
              </Button>
            </div>
            
            {registrationResult && (
              <div className="mt-4">
                <Alert variant={registrationResult.success ? "default" : "destructive"}>
                  <AlertDescription>
                    <strong>Result:</strong> {registrationResult.message || registrationResult.error}
                    {registrationResult.details && <br />}
                    {registrationResult.details && <strong>Details:</strong> {registrationResult.details}
                    {registrationResult.user && <br />}
                    {registrationResult.user && <strong>User Role:</strong> {registrationResult.user.role}
                    {registrationResult.user && <br />}
                    {registrationResult.user && <strong>User isAdmin:</strong> {registrationResult.user.isAdmin ? 'true' : 'false'}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Login */}
        <Card>
          <CardHeader>
            <CardTitle>Test Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyCode">Company Code</Label>
                <Input
                  id="companyCode"
                  value={testCredentials.companyCode}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, companyCode: e.target.value }))}
                  placeholder="Enter company code (e.g., mockco)"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={testCredentials.email}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={testCredentials.password}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              
              <Button onClick={testLogin} disabled={isLoading} className="w-full">
                {isLoading ? "Testing..." : "Test Login"}
              </Button>
            </div>
            
            {testResult && (
              <div className="mt-4">
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  <AlertDescription>
                    <strong>Result:</strong> {testResult.message || testResult.error}
                    {testResult.step && <br />}
                    {testResult.step && <strong>Step:</strong> {testResult.step}
                    {testResult.details && <br />}
                    {testResult.details && <strong>Details:</strong> {testResult.details}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication Test */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Test your current JWT token authentication:
            </p>
            <Button onClick={testAuth} disabled={isLoading} className="w-full mb-4">
              {isLoading ? "Testing..." : "Test Current Token"}
            </Button>
            
            {authTestResult && (
              <div className="mt-4">
                <Alert variant={authTestResult.success ? "default" : "destructive"}>
                  <AlertDescription>
                    <strong>Result:</strong> {authTestResult.success ? "Authentication successful" : authTestResult.error}
                    {authTestResult.payload && <br />}
                    {authTestResult.payload && <strong>User ID:</strong> {authTestResult.payload.uid}
                    {authTestResult.payload && <br />}
                    {authTestResult.payload && <strong>Email:</strong> {authTestResult.payload.email}
                    {authTestResult.payload && <br />}
                    {authTestResult.payload && <strong>Role:</strong> {authTestResult.payload.role}
                    {authTestResult.payload && <br />}
                    {authTestResult.payload && <strong>isAdmin:</strong> {authTestResult.payload.isAdmin ? 'true' : 'false'}
                    {authTestResult.adminCheck && <br />}
                    {authTestResult.adminCheck && <strong>Admin Check:</strong> {authTestResult.adminCheck.isAdmin ? 'PASS' : 'FAIL'}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Test with Default Credentials */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Test with Default Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              If you haven't registered a company yet, you can test with the default credentials:
            </p>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p><strong>Company Code:</strong> mockco</p>
              <p><strong>Email:</strong> admin@mockco.com</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
            <Button 
              onClick={() => setTestCredentials({
                companyCode: "mockco",
                email: "admin@mockco.com",
                password: "admin123"
              })}
              className="mt-4"
            >
              Load Default Credentials
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
