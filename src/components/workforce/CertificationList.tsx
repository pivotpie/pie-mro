
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";

export const CertificationList = () => {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Certification Status</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative w-full h-40 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray="75.4"
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="12"
                  strokeDasharray="75.4"
                  strokeDashoffset="25.1"
                  transform="rotate(-90 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="12"
                  strokeDasharray="75.4"
                  strokeDashoffset="50.2"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold">48</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-6">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                <span className="text-xs">Valid</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-orange-500 mr-2"></span>
                <span className="text-xs">Expiring soon</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-xs">Expired</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Certification</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valid until</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              <tr>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium">Composite Structures Specialist</div>
                  <div className="text-xs text-gray-500">Specialist Certification</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div className="font-medium">Thomas Clark</div>
                  <div className="text-xs text-gray-500">EMP001</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div>5/15/2023</div>
                  <div className="text-xs text-gray-500">over 2 years ago</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-3">Send for Training</Button>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium">Aircraft Systems Specialist</div>
                  <div className="text-xs text-gray-500">Standard Certification</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div className="font-medium">Ryan Cooper</div>
                  <div className="text-xs text-gray-500">EMP003</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div>7/10/2023</div>
                  <div className="text-xs text-gray-500">about 2 years ago</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-3">Send for Training</Button>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium">Airbus A320 Specialist</div>
                  <div className="text-xs text-gray-500">Type Specialist</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div className="font-medium">Sarah Williams</div>
                  <div className="text-xs text-gray-500">EMP002</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div>9/15/2023</div>
                  <div className="text-xs text-gray-500">over 1 year ago</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-3">Send for Training</Button>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium">Engine Overhaul Specialist</div>
                  <div className="text-xs text-gray-500">Standard Certification</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div className="font-medium">Robert Martinez</div>
                  <div className="text-xs text-gray-500">EMP007</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div>9/15/2023</div>
                  <div className="text-xs text-gray-500">over 1 year ago</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-3">Send for Training</Button>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium">Airframe and Powerplant Mechanic</div>
                  <div className="text-xs text-gray-500">A&P License</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div className="font-medium">James Davis</div>
                  <div className="text-xs text-gray-500">EMP005</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div>12/20/2023</div>
                  <div className="text-xs text-gray-500">over 1 year ago</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-3">Send for Training</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-right">
          <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-800">
            View All (48)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
