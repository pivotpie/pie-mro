
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Plus } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface AircraftSchedule {
  id: string;
  aircraft: string;
  aircraft_id: number;
  hangar_id: number;
  start: Date;
  end: Date;
  team: string | null;
  status: string;
  registration: string;
  customer: string;
  color: string;
  borderColor: string;
  visit_number: string;
  check_type: string;
}

interface AircraftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aircraft: AircraftSchedule | null;
}

export const AircraftDetailsModal = ({ isOpen, onClose, aircraft }: AircraftDetailsModalProps) => {
  if (!aircraft) return null;

  const duration = differenceInDays(aircraft.end, aircraft.start) + 1;

  // Mock personnel requirements based on aircraft type
  const getPersonnelRequirements = (aircraftType: string) => {
    const requirements = [
      { skill: "Avionics Technician", required: 2, assigned: 1 },
      { skill: "Airframe Mechanic", required: 3, assigned: 2 },
      { skill: "Engine Specialist", required: 1, assigned: aircraft.status === 'Scheduled' ? 0 : 1 },
      { skill: "Inspector", required: 1, assigned: aircraft.status === 'Completed' ? 1 : 0 },
    ];
    return requirements;
  };

  // Mock assigned employees
  const assignedEmployees = aircraft.team ? [
    { id: 1, name: "Michael Johnson", role: "Lead Technician", avatar: "MJ" },
    { id: 2, name: "Sarah Williams", role: "Avionics Tech", avatar: "SW" },
    { id: 3, name: "David Brown", role: "Mechanic", avatar: "DB" },
  ] : [];

  // Mock available employees
  const availableEmployees = [
    { id: 4, name: "Emily Chen", skill: "Avionics", certification: "A320, B777", availability: "Available", avatar: "EC" },
    { id: 5, name: "Robert Garcia", skill: "Airframe", certification: "B777, B787", availability: "Available", avatar: "RG" },
    { id: 6, name: "Lisa Anderson", skill: "Engines", certification: "A350, B787", availability: "Training until May 25", avatar: "LA" },
    { id: 7, name: "James Wilson", skill: "Inspector", certification: "All Types", availability: "Available", avatar: "JW" },
    { id: 8, name: "Maria Rodriguez", skill: "Avionics", certification: "A320, A350", availability: "Available", avatar: "MR" },
  ];

  const personnelRequirements = getPersonnelRequirements(aircraft.aircraft);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] w-[80vw] h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Aircraft Details - {aircraft.registration}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* First Row - Aircraft Details & Personnel Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Aircraft Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Aircraft Information</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.aircraft}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Registration</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.registration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className={`font-medium ${
                      aircraft.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                      aircraft.status === 'In Progress' ? 'text-amber-600 dark:text-amber-400' :
                      'text-slate-600 dark:text-slate-400'
                    }`}>{aircraft.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
                    <p className="font-medium dark:text-gray-200">
                      {format(aircraft.start, 'dd MMM yyyy')} - {format(aircraft.end, 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-medium dark:text-gray-200">{duration} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visit Number</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.visit_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Check Type</p>
                    <p className="font-medium dark:text-gray-200">{aircraft.check_type}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Personnel Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personnel Requirements</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="space-y-3">
                  {personnelRequirements.map((req, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium dark:text-gray-200">{req.skill}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {req.assigned}/{req.required} assigned
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-sm ${
                        req.assigned >= req.required 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      }`}>
                        {req.assigned >= req.required ? 'Complete' : 'Needs Staff'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Assigned Employees & Available Employees */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Column (30%) - Assigned Employees */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-lg font-semibold">Assigned Team</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg min-h-[300px]">
                {assignedEmployees.length > 0 ? (
                  <div className="space-y-3">
                    {assignedEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{employee.avatar}</span>
                        </div>
                        <div>
                          <p className="font-medium dark:text-gray-200">{employee.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{employee.role}</p>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Staff
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <User className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No team assigned</p>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Team
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (70%) - Available Employees */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-semibold">Available Employees</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search by name, skill, certification..."
                    className="pl-10"
                  />
                </div>

                {/* Employee List */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {availableEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{employee.avatar}</span>
                        </div>
                        <div>
                          <p className="font-medium dark:text-gray-200">{employee.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{employee.skill} • {employee.certification}</p>
                          <p className="text-xs text-gray-400">{employee.availability}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
