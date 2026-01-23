
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Edit, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EmployeeDetailPanelProps {
  employee: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmployeeDetailPanel = ({ employee, open, onOpenChange }: EmployeeDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("profile");

  // Get the appropriate badge for the employee status
  const getStatusBadge = () => {
    const status = employee?.employee_status?.toLowerCase() || '';
    
    if (status.includes('maintenance')) {
      return (
        <Badge className="bg-amber-400 hover:bg-amber-500 text-black border-amber-400">
          <span className="mr-1">●</span> Maintenance
        </Badge>
      );
    } else if (status.includes('training')) {
      return (
        <Badge className="bg-cyan-400 hover:bg-cyan-500 text-black border-cyan-400">
          <span className="mr-1">●</span> Training
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-400 hover:bg-green-500 text-black border-green-400">
          <span className="mr-1">●</span> Active
        </Badge>
      );
    }
  };

  // Format date if available
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch (error) {
      return dateStr;
    }
  };

  // Mock data for demo based on the provided images
  const certifications = [
    { name: 'B1 License', validUntil: '2026-10-10', status: 'valid' },
    { name: 'A350 Type Rating', validUntil: '2026-06-18', status: 'warning' },
  ];

  const aircraftTypes = ['A350', 'B787', 'GEnx'];

  const assignments = [
    { 
      aircraftCode: 'A6-FKM',
      aircraftType: 'Boeing 777-300ER',
      checkType: 'D-Check',
      dateRange: 'May 5, 2026 - June 10, 2026',
      progress: 15,
      status: 'maintenance'
    }
  ];

  const scheduleStats = {
    assignedDays: 37,
    leaveDays: 7,
    trainingDays: 9
  };

  const shiftInfo = {
    currentShift: 'Afternoon Shift',
    checkInTime: '08:00 AM',
    weeklyOffs: 'Saturday, Sunday'
  };

  const leaveHistory = [
    {
      type: 'Annual Leave',
      dateRange: 'March 15 - March 25, 2026',
      status: 'approved'
    },
    {
      type: 'Sick Leave',
      dateRange: 'January 10 - January 12, 2026',
      status: 'approved'
    }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-0">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl font-bold">Employee Details</SheetTitle>
            <SheetClose className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
              <X className="h-5 w-5" />
            </SheetClose>
          </div>
          
          <div className="mt-2">
            <h2 className="text-2xl font-bold">{employee?.name || 'Employee'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm">
                {employee?.e_number ? `EMP${employee.e_number.toString().padStart(3, '0')}` : 'N/A'}
              </span>
              <div className="ml-auto">{getStatusBadge()}</div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Team:</p>
                <p className="font-medium">{employee?.team?.team_name || 'Team Beta'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Date of Birth:</p>
                <p className="font-medium">1983-08-24</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Role:</p>
                <p className="font-medium">{employee?.job_title?.job_description || 'Senior Mechanic'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Join Date:</p>
                <p className="font-medium">{formatDate(employee?.date_of_joining) || '2011-06-22'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Experience:</p>
                <p className="font-medium">12 years</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Nationality:</p>
                <p className="font-medium">{employee?.nationality || 'American'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Contact:</p>
                <p className="font-medium">{employee?.mobile_number || '+971 50 234 5678'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Passport:</p>
                <p className="font-medium">US87654321</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Email:</p>
                <p className="font-medium">{`${employee?.key_name || 's.johnson'}@airline.com`}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Emergency Contact:</p>
                <p className="font-medium">+971 50 876 5432</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Address:</p>
                <p className="font-medium">Downtown Dubai, Burj Views, Apartment 2305</p>
              </div>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="mt-4 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Current Assignments</h3>
                <Badge className="bg-blue-500 hover:bg-blue-600">{assignments.length} Aircraft</Badge>
              </div>

              {assignments.map((assignment, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold">{assignment.aircraftCode}</span>
                      <span className="text-gray-500 dark:text-gray-400"> - {assignment.aircraftType}</span>
                    </div>
                    <Badge className="bg-amber-400 hover:bg-amber-500 text-black border-amber-400">
                      <span className="mr-1">●</span> Maintenance
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {assignment.checkType} | {assignment.dateRange}
                  </p>
                  <Progress value={assignment.progress} className="h-1.5" />
                  <p className="text-right text-sm mt-1 font-medium">{assignment.progress}% Complete</p>
                </div>
              ))}

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Schedule Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-3xl font-bold text-green-600">{scheduleStats.assignedDays}</p>
                    <p className="text-sm text-gray-500">Assigned Days</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-3xl font-bold text-red-500">{scheduleStats.leaveDays}</p>
                    <p className="text-sm text-gray-500">Leave Days</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-3xl font-bold text-cyan-500">{scheduleStats.trainingDays}</p>
                    <p className="text-sm text-gray-500">Training Days</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="mt-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">License & Certifications</h3>
              
              {certifications.map((cert, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between">
                    <h4 className="font-bold">{cert.name}</h4>
                    <Badge className={cert.status === 'valid' ? 'bg-green-500' : 'bg-amber-500'}>
                      {cert.status === 'valid' ? 'Valid' : 'Warning'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">Valid until: {cert.validUntil}</p>
                </div>
              ))}

              <h3 className="text-lg font-semibold mb-4 mt-6">Aircraft Type Ratings</h3>
              <div className="flex flex-wrap gap-2">
                {aircraftTypes.map((type, index) => (
                  <Badge key={index} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 text-sm">
                    {type}
                  </Badge>
                ))}
              </div>

              <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center">
                  <span className="text-amber-500 mr-2">⚠️</span>
                  <p className="text-amber-800 dark:text-amber-200">Some certifications require attention.</p>
                </div>
                <Button className="mt-3 bg-amber-400 hover:bg-amber-500 text-black border-amber-400">
                  <Calendar className="h-4 w-4 mr-2" /> Schedule Training
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Shift Information</h3>
              <div className="border rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Current Shift:</p>
                    <p className="font-medium">{shiftInfo.currentShift}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Check-in Time:</p>
                    <p className="font-medium">{shiftInfo.checkInTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Weekly Offs:</p>
                    <p className="font-medium">{shiftInfo.weeklyOffs}</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Leave History</h3>
              {leaveHistory.map((leave, index) => (
                <div key={index} className="border-b last:border-b-0 py-3">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold">{leave.type}</h4>
                      <p className="text-sm text-gray-500">{leave.dateRange}</p>
                    </div>
                    <Badge className="bg-green-500">Approved</Badge>
                  </div>
                </div>
              ))}

              <div className="mt-8 space-y-3">
                <h3 className="text-lg font-semibold">Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex items-center justify-center border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">
                    <Calendar className="h-4 w-4 mr-2" /> Manage Schedule
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
                    <Plus className="h-4 w-4 mr-2" /> Add Leave
                  </Button>
                </div>
                <Button variant="outline" className="w-full flex items-center justify-center border-cyan-500 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950">
                  <Edit className="h-4 w-4 mr-2" /> Change Shift
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
