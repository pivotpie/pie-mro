
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Users, User, BookOpen } from "lucide-react";

interface TrainingSession {
  id: number;
  training_type: string;
  authority: string;
  session_date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  available_seats: number;
  location: string;
  instructor: string;
  status: string;
}

interface TrainingSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: TrainingSession | null;
  onSessionUpdate: () => void;
}

export const TrainingSessionModal = ({ 
  open, 
  onOpenChange, 
  session, 
  onSessionUpdate 
}: TrainingSessionModalProps) => {
  if (!session) return null;

  // Mock assigned employees data
  const assignedEmployees = [
    { id: 1, name: "John Doe", e_number: "E001", certification_expiry: "2024-08-15" },
    { id: 2, name: "Jane Smith", e_number: "E002", certification_expiry: "2024-09-10" },
    { id: 3, name: "Mike Johnson", e_number: "E003", certification_expiry: "2024-07-30" },
  ];

  // Mock available employees data
  const availableEmployees = [
    { id: 4, name: "Sarah Wilson", e_number: "E004", certification_expiry: "2024-08-20", priority: "high" },
    { id: 5, name: "Tom Brown", e_number: "E005", certification_expiry: "2024-09-15", priority: "medium" },
    { id: 6, name: "Lisa Davis", e_number: "E006", certification_expiry: "2024-10-01", priority: "low" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[90vh] max-w-none p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{session.training_type}</span>
            <Badge variant="outline">{session.authority}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Session Details */}
          <div className="w-2/5 border-r dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Session Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CalendarDays className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{session.session_date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{session.start_time} - {session.end_time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{session.instructor}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{session.available_seats} / {session.total_seats} available</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Training Requirements</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This training session covers the latest regulations and best practices 
                  for aviation safety and operations management.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Prerequisites</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Valid aviation license</li>
                  <li>• Current medical certificate</li>
                  <li>• Previous safety training completion</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Employee Management */}
          <div className="w-3/5 flex flex-col">
            {/* Assigned Employees */}
            <div className="flex-1 p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Assigned Employees ({assignedEmployees.length})</h3>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Assignments
                </Button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {assignedEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center mr-3">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">#{employee.e_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Expires: {employee.certification_expiry}
                      </div>
                      <Button variant="outline" size="sm" className="mt-1">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Employees */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Available Employees</h3>
                <Button size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Auto Assign
                </Button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center justify-center mr-3">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">#{employee.e_number}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(employee.priority)}>
                        {employee.priority}
                      </Badge>
                      <Button size="sm">
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
