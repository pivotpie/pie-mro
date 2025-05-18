
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";

interface Certification {
  id: string;
  type: string;
  employeeName: string;
  employeeId: string;
  validUntil: string;
  isExpiring: boolean;
  isExpired: boolean;
}

// Mock certification data
const mockCertifications: Certification[] = [
  {
    id: "cert1",
    type: "B1 License",
    employeeName: "James Wilson",
    employeeId: "EMP001",
    validUntil: "December 9, 2025",
    isExpiring: false,
    isExpired: false
  },
  {
    id: "cert2",
    type: "A330 Type Rating",
    employeeName: "James Wilson",
    employeeId: "EMP001",
    validUntil: "August 30, 2025",
    isExpiring: false,
    isExpired: false
  },
  {
    id: "cert3",
    type: "B1 License",
    employeeName: "Sarah Johnson",
    employeeId: "EMP002",
    validUntil: "October 9, 2025",
    isExpiring: false,
    isExpired: false
  },
  {
    id: "cert4",
    type: "A350 Type Rating",
    employeeName: "Sarah Johnson",
    employeeId: "EMP002",
    validUntil: "June 18, 2025",
    isExpiring: true,
    isExpired: false
  },
  {
    id: "cert5",
    type: "B2 License",
    employeeName: "Michael Brown",
    employeeId: "EMP003",
    validUntil: "September 5, 2025",
    isExpiring: false,
    isExpired: false
  },
  {
    id: "cert6",
    type: "Trent XWB Certification",
    employeeName: "Michael Brown",
    employeeId: "EMP003",
    validUntil: "May 20, 2025",
    isExpiring: true,
    isExpired: false
  },
  {
    id: "cert7",
    type: "B1 License",
    employeeName: "Emily Davis",
    employeeId: "EMP004",
    validUntil: "November 12, 2025",
    isExpiring: false,
    isExpired: false
  },
  {
    id: "cert8",
    type: "B2 License",
    employeeName: "Robert Miller",
    employeeId: "EMP005",
    validUntil: "April 30, 2025",
    isExpiring: true,
    isExpired: false
  },
  {
    id: "cert9",
    type: "LEAP-1A Certification",
    employeeName: "Jennifer Clark",
    employeeId: "EMP006",
    validUntil: "July 16, 2025",
    isExpiring: false,
    isExpired: false
  },
  {
    id: "cert10",
    type: "A380 Type Rating",
    employeeName: "David Martinez",
    employeeId: "EMP007",
    validUntil: "May 25, 2025",
    isExpiring: true,
    isExpired: false
  }
];

export const CertificationList = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    certifications: Certification[];
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCertificationClick = (cert: Certification) => {
    const employeeCerts = mockCertifications.filter(c => c.employeeId === cert.employeeId);
    setSelectedEmployee({
      id: cert.employeeId,
      name: cert.employeeName,
      certifications: employeeCerts
    });
    setDrawerOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certification Status</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {mockCertifications.map((cert) => (
            <div 
              key={cert.id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCertificationClick(cert)}
            >
              <div className="flex justify-between mb-1">
                <div className="font-medium">{cert.type}</div>
                <div className={`text-sm ${cert.isExpiring ? 'text-amber-600' : 'text-green-600'}`}>
                  {cert.isExpiring ? 'Expiring Soon' : 'Valid'}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {cert.employeeName} ({cert.employeeId})
                </div>
                <div className="flex items-center">
                  <div className="text-sm mr-2">Valid until: {cert.validUntil}</div>
                  {cert.isExpiring && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="h-7 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                    >
                      Send for Training
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Employee Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[90vh]">
          <div className="mx-auto w-full max-w-3xl">
            <DrawerHeader>
              <DrawerTitle>Employee Details</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedEmployee && (
                <div className="space-y-6">
                  {/* Employee Info */}
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center font-medium text-blue-700 text-xl">
                      {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">{selectedEmployee.name}</h3>
                      <p className="text-gray-500">{selectedEmployee.id}</p>
                    </div>
                  </div>
                  
                  {/* Certifications */}
                  <div>
                    <h4 className="text-lg font-medium mb-3">Certifications</h4>
                    <div className="bg-gray-50 rounded-lg divide-y">
                      {selectedEmployee.certifications.map(cert => (
                        <div key={cert.id} className="p-4">
                          <div className="flex justify-between mb-1">
                            <div className="font-medium">{cert.type}</div>
                            <div className={`text-sm ${cert.isExpiring ? 'text-amber-600' : 'text-green-600'}`}>
                              {cert.isExpiring ? 'Expiring Soon' : 'Valid'}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              Valid until: {cert.validUntil}
                            </div>
                            {cert.isExpiring && (
                              <Button 
                                size="sm"
                                variant="outline"
                                className="h-7 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                              >
                                Send for Training
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Schedule */}
                  <div>
                    <h4 className="text-lg font-medium mb-3">Current Schedule</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="text-sm text-gray-500">Current Assignment</div>
                        <div className="font-medium">A32-C0522 (Airbus A320 Check)</div>
                      </div>
                      <div className="mb-3">
                        <div className="text-sm text-gray-500">Schedule</div>
                        <div className="font-medium">May 20 - May 25, 2025</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Team</div>
                        <div className="font-medium">Team Alpha</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Leave Status */}
                  <div>
                    <h4 className="text-lg font-medium mb-3">Leave Status</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="text-sm text-gray-500">Remaining Annual Leave</div>
                        <div className="font-medium">14 days</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Upcoming Leave</div>
                        <div className="font-medium">No upcoming leave requests</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Training History */}
                  <div>
                    <h4 className="text-lg font-medium mb-3">Recent Training</h4>
                    <div className="bg-gray-50 rounded-lg divide-y">
                      <div className="p-4">
                        <div className="font-medium">Safety Management System</div>
                        <div className="text-sm text-gray-500">Completed on: April 15, 2025</div>
                      </div>
                      <div className="p-4">
                        <div className="font-medium">A320 Recurrent Training</div>
                        <div className="text-sm text-gray-500">Completed on: March 10, 2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </Card>
  );
};
