"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DebugPage() {
    const [user, setUser] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [testUserId, setTestUserId] = useState("");

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const testFetchReports = async () => {
        if (!testUserId) return;

        setLoading(true);
        try {
            console.log("Testing fetch for userId:", testUserId);
            const response = await fetch(`/api/reports/user/${testUserId}`);
            const data = await response.json();

            if (response.ok) {
                setReports(data.reports || []);
                console.log("Reports fetched:", data.reports);
            } else {
                console.error("Failed to fetch reports:", data);
                setReports([]);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const testCurrentUserReports = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            console.log("Testing fetch for current user:", user.id);
            const response = await fetch(`/api/reports/user/${user.id}`);
            const data = await response.json();

            if (response.ok) {
                setReports(data.reports || []);
                console.log("Current user reports:", data.reports);
            } else {
                console.error("Failed to fetch current user reports:", data);
                setReports([]);
            }
        } catch (error) {
            console.error("Error fetching current user reports:", error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const checkDatabase = async () => {
        try {
            const response = await fetch("/api/notifications/test");
            const data = await response.json();
            console.log("Database check:", data);
        } catch (error) {
            console.error("Database check failed:", error);
        }
    };

    const checkReportsDebug = async () => {
        try {
            const response = await fetch("/api/debug/reports");
            const data = await response.json();
            console.log("Reports debug:", data);
            alert(`Mock reports: ${data.mockData.count}, DB reports: ${data.database.count}`);
        } catch (error) {
            console.error("Reports debug failed:", error);
        }
    };

    const testSubmitReport = async () => {
        if (!user?.id) {
            alert("No user ID available");
            return;
        }

        try {
            const testReport = {
                userId: user.id,
                date: new Date().toISOString().split('T')[0],
                content: `Test report from user ${user.id} at ${new Date().toISOString()}`
            };

            console.log("Submitting test report:", testReport);
            const response = await fetch("/api/reports/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testReport)
            });

            const data = await response.json();
            console.log("Submit response:", data);

            if (response.ok) {
                alert("Test report submitted successfully!");
                // Refresh the reports
                await testCurrentUserReports();
            } else {
                alert(`Failed to submit: ${data.error}`);
            }
        } catch (error) {
            console.error("Submit test failed:", error);
            alert("Submit test failed");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Debug Page</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Current User Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Test Report Fetching</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="testUserId">Test User ID</Label>
                            <Input
                                id="testUserId"
                                value={testUserId}
                                onChange={(e) => setTestUserId(e.target.value)}
                                placeholder="Enter user ID to test"
                            />
                        </div>
                        <Button onClick={testFetchReports} disabled={loading || !testUserId}>
                            Test Fetch
                        </Button>
                    </div>

                    <Button onClick={testCurrentUserReports} disabled={loading || !user?.id}>
                        Test Current User Reports
                    </Button>

                    <Button onClick={checkDatabase} variant="outline">
                        Check Database Status
                    </Button>

                    <Button onClick={checkReportsDebug} variant="outline">
                        Check Reports Debug
                    </Button>

                    <Button onClick={testSubmitReport} variant="outline" className="bg-green-100 text-green-800">
                        Submit Test Report
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Reports Found ({reports.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {reports.length === 0 ? (
                        <p className="text-gray-500">No reports found</p>
                    ) : (
                        <div className="space-y-2">
                            {reports.map((report, index) => (
                                <div key={index} className="border p-3 rounded">
                                    <pre className="text-sm overflow-auto">
                                        {JSON.stringify(report, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Console Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600">
                        Check the browser console for detailed logging of API calls and responses.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
