import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Certification {
  id: number;
  name: string;
  type: string;
  employee: {
    name: string;
    id: string;
  };
  expiryDate: string;
  expiryStatus: "valid" | "expiring" | "expired";
}

interface CertificationData {
  id: number;
  certification_code: string;
  certification_description: string;
  [key: string]: any;
}

interface CertificationListProps {
  onCertificationClick?: (certification: CertificationData) => void;
}

export const CertificationList = ({ onCertificationClick }: CertificationListProps) => {
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const certifications: Certification[] = [
    {
      id: 1,
      name: "Composite Structures Specialist",
      type: "Specialist Certification",
      employee: { name: "Thomas Clark", id: "EMP001" },
      expiryDate: "5/15/2023",
      expiryStatus: "expired"
    },
    {
      id: 2,
      name: "Aircraft Systems Specialist",
      type: "Standard Certification",
      employee: { name: "Ryan Cooper", id: "EMP003" },
      expiryDate: "7/10/2023",
      expiryStatus: "expired"
    },
    {
      id: 3,
      name: "Airbus A320 Specialist",
      type: "Type Specialist",
      employee: { name: "Sarah Williams", id: "EMP002" },
      expiryDate: "9/15/2023",
      expiryStatus: "expired"
    },
    {
      id: 4,
      name: "Engine Overhaul Specialist",
      type: "Standard Certification",
      employee: { name: "Robert Martinez", id: "EMP007" },
      expiryDate: "9/15/2023",
      expiryStatus: "expired"
    },
    {
      id: 5,
      name: "Airframe and Powerplant Mechanic",
      type: "A&P License",
      employee: { name: "James Davis", id: "EMP005" },
      expiryDate: "12/20/2023",
      expiryStatus: "expired"
    }
  ];

  const handleCertificationClick = (certification: Certification) => {
    if (onCertificationClick) {
      // Convert to CertificationData format for the callback
      const certificationData: CertificationData = {
        id: certification.id,
        certification_code: certification.name,
        certification_description: certification.type
      };
      onCertificationClick(certificationData);
    } else {
      // Fallback to local modal
      setSelectedCertification(certification);
      setDetailsOpen(true);
    }
  };

  const handleSendForTraining = (id: number, employeeName: string) => {
    toast.success(`Training request sent for ${employeeName}`, {
      description: "The employee will be notified about the training requirements."
    });
  };

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
              {certifications.map(certification => (
                <tr 
                  key={certification.id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleCertificationClick(certification)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium">{certification.name}</div>
                    <div className="text-xs text-gray-500">{certification.type}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="font-medium">{certification.employee.name}</div>
                    <div className="text-xs text-gray-500">{certification.employee.id}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div>{certification.expiryDate}</div>
                    <div className="text-xs text-gray-500">over {Math.floor(Math.random() * 3) + 1} years ago</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      Expired
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 h-7 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendForTraining(certification.id, certification.employee.name);
                      }}
                    >
                      Send for Training
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-right">
          <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-800">
            View All (48)
          </Button>
        </div>
      </CardContent>

      {/* Certification Details Modal - Center-oriented, 80% width and height */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[80vw] h-[80vh] max-w-[80vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certification Details</DialogTitle>
          </DialogHeader>
          {selectedCertification && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Employee Information</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedCertification.employee.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <p className="font-medium">{selectedCertification.employee.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">Maintenance</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Position</p>
                      <p className="font-medium">Senior Technician</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Certification Information</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Certification</p>
                      <p className="font-medium">{selectedCertification.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{selectedCertification.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-medium">01/15/2021</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expiry Date</p>
                      <p className="font-medium">{selectedCertification.expiryDate}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium text-red-600">Expired</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Associated Aircraft</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Airbus A320</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Boeing 737</span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Secondary</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setDetailsOpen(false)}>
                  <X className="mr-1 h-4 w-4" /> Close
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleSendForTraining(selectedCertification.id, selectedCertification.employee.name)}
                >
                  Send for Training
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
