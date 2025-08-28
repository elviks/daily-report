"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdminTest() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load user and tenant info from localStorage
    const userStr = localStorage.getItem('user');
    const tenantStr = localStorage.getItem('tenant');
    const token = localStorage.getItem('token');

    if (userStr) {
      setUserInfo(JSON.parse(userStr));
    }
    if (tenantStr) {
      setTenantInfo(JSON.parse(tenantStr));
    }

    // Test admin APIs if we have a token
    if (token) {
      testAdminAPIs(token);
    }
  }, []);

  const testAdminAPIs = async (token: string) => {
    setIsLoading(true);
    try {
      // Test users API
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      } else {
        console.error('Users API failed:', await usersResponse.text());
      }

      // Test reports API
      const reportsResponse = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      } else {
        console.error('Reports API failed:', await reportsResponse.text());
      }

    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Information</CardTitle>
        </CardHeader>
        <CardContent>
          {userInfo ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {userInfo.name}</p>
              <p><strong>Email:</strong> {userInfo.email}</p>
              <p><strong>Role:</strong> {userInfo.role}</p>
              <p><strong>Is Admin:</strong> {userInfo.isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>Department:</strong> {userInfo.department}</p>
            </div>
          ) : (
            <p className="text-gray-500">No user information found</p>
          )}
        </CardContent>
      </Card>

      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Tenant Information</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantInfo ? (
            <div className="space-y-2">
              <p><strong>Company Name:</strong> {tenantInfo.name}</p>
              <p><strong>Company Code:</strong> {tenantInfo.slug}</p>
              <p><strong>Tenant ID:</strong> {tenantInfo.id}</p>
            </div>
          ) : (
            <p className="text-gray-500">No tenant information found</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Access Test */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Access Test</CardTitle>
        </CardHeader>
        <CardContent>
          {userInfo && (userInfo.isAdmin || userInfo.role === 'admin' || userInfo.role === 'superadmin') ? (
            <Alert>
              <AlertDescription>
                ✅ You have admin access! You should be able to see users and reports below.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                ❌ You don't have admin access. You should be redirected to the dashboard.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users in Your Company ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading users...</p>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Department:</strong> {user.department}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No users found or API access denied</p>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reports in Your Company ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading reports...</p>
          ) : reports.length > 0 ? (
            <div className="space-y-2">
              {reports.map((report: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <p><strong>Date:</strong> {report.date}</p>
                  <p><strong>Content:</strong> {report.content}</p>
                  <p><strong>User ID:</strong> {report.userId}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reports found or API access denied</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button onClick={() => testAdminAPIs(localStorage.getItem('token') || '')} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test Admin APIs'}
            </Button>
            <Button onClick={logout} variant="outline" className="ml-2">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
