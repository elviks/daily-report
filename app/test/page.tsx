import { MultitenancyTest } from "@/components/multitenancy-test";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multitenancy System Test
          </h1>
          <p className="text-gray-600">
            This page tests the multitenancy functionality of the Daily Report application.
          </p>
        </div>
        
        <MultitenancyTest />
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">What This Test Does:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li><strong>Company Registration:</strong> Creates a new test company</li>
            <li><strong>User Login:</strong> Logs in with the newly created company credentials</li>
            <li><strong>Report Creation:</strong> Creates a test report using JWT authentication</li>
            <li><strong>Report Fetching:</strong> Retrieves reports for the tenant</li>
          </ol>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Expected Results:</h3>
            <ul className="text-blue-800 space-y-1">
              <li>✅ All tests should pass if multitenancy is working correctly</li>
              <li>✅ Each company should have isolated data</li>
              <li>✅ JWT tokens should include tenant information</li>
              <li>✅ Reports should be scoped to the correct tenant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
