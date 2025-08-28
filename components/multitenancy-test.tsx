"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MultitenancyTest() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, success, message, data, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // Test 1: Register a new company
      addResult("Company Registration", true, "Testing company registration...");
      
      const registerResponse = await fetch('/api/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Test Company',
          adminEmail: 'admin@testcompany.com',
          adminPassword: 'testpass123'
        })
      });

      const registerData = await registerResponse.json();
      
      if (registerResponse.ok) {
        addResult("Company Registration", true, "✅ Company registered successfully", registerData);
      } else {
        addResult("Company Registration", false, `❌ Registration failed: ${registerData.message}`);
        return;
      }

      // Test 2: Login with the new company
      addResult("Login", true, "Testing login...");
      
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyCode: registerData.slug,
          email: 'admin@testcompany.com',
          password: 'testpass123'
        })
      });

      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        addResult("Login", true, "✅ Login successful", { token: loginData.token ? "JWT Token received" : "No token", tenant: loginData.tenant });
      } else {
        addResult("Login", false, `❌ Login failed: ${loginData.message}`);
        return;
      }

      // Test 3: Create a report with authentication
      addResult("Report Creation", true, "Testing report creation...");
      
      const reportResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          content: 'This is a test report for multitenancy verification.'
        })
      });

      const reportData = await reportResponse.json();
      
      if (reportResponse.ok) {
        addResult("Report Creation", true, "✅ Report created successfully", reportData);
      } else {
        addResult("Report Creation", false, `❌ Report creation failed: ${reportData.error}`);
      }

      // Test 4: Fetch reports
      addResult("Report Fetching", true, "Testing report fetching...");
      
      const fetchResponse = await fetch('/api/reports', {
        headers: { 
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      const fetchData = await fetchResponse.json();
      
      if (fetchResponse.ok) {
        addResult("Report Fetching", true, `✅ Fetched ${fetchData.reports?.length || 0} reports`, fetchData);
      } else {
        addResult("Report Fetching", false, `❌ Report fetching failed: ${fetchData.error}`);
      }

    } catch (error) {
      addResult("General", false, `❌ Test failed with error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Multitenancy System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Running Tests..." : "Run Multitenancy Tests"}
        </Button>

        <div className="space-y-2">
          {results.map((result, index) => (
            <Alert key={index} variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <strong>{result.test}:</strong> {result.message}
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">View Details</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Summary:</h3>
            <ul className="text-sm space-y-1">
              {results.map((result, index) => (
                <li key={index} className={result.success ? "text-green-600" : "text-red-600"}>
                  {result.success ? "✅" : "❌"} {result.test} - {result.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
