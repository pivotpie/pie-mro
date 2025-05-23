
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clipboard, Clock, Info, Plane, Search, User, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AircraftDetailsModalProps {
  aircraft: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AircraftDetailsModal: React.FC<AircraftDetailsModalProps> = ({ aircraft, open, onOpenChange }) => {
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (open && aircraft) {
      fetchAvailableEmployees();
    }
  }, [open, aircraft]);

  const fetchAvailableEmployees = async () => {
    if (!aircraft) return;

    setLoading(true);
    try {
      // Get employees with "AV" support code (available) - Fixed query
      const { data: employees, error } = await supabase
        .from('employee_supports')
        .select(`
          id,
          employee_id,
          support_id,
          assignment_date,
          employees (
            id, 
            name, 
            e_number,
            mobile_number,
            job_title_id,
            job_titles (
              id,
              job_code,
              job_description
            )
          ),
          support_codes (id, support_code)
        `)
        .eq('support_codes.support_code', 'AV');

      if (error) throw error;

      // Transform the data structure
      const transformedEmployees = employees?.map(item => ({
        id: item.employee_id,
        name: item.employees.name,
        e_number: item.employees.e_number,
        mobile: item.employees.mobile_number,
        job_title: item.employees.job_titles?.job_description,
        job_title_id: item.employees.job_title_id,
        support_id: item.id  // For updating this specific support record
      })) || [];

      setAvailableEmployees(transformedEmployees);
      setAllEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching available employees:', error);
      toast.error('Failed to load available employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEmployees = async () => {
    if (!aircraft || selectedEmployees.length === 0) return;

    try {
      // Get current date
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      // For each selected employee, update their support code to the aircraft's registration
      const updates = selectedEmployees.map(async (employee) => {
        // Get the support code ID for the aircraft registration
        const { data: supportCode, error: supportError } = await supabase
          .from('support_codes')
          .select('id')
          .eq('support_code', aircraft.registration)
          .single();

        if (supportError || !supportCode) {
          throw new Error(`Support code for ${aircraft.registration} not found`);
        }

        // Update the employee's support assignment
        return supabase
          .from('employee_supports')
          .update({ 
            support_id: supportCode.id,
            assignment_date: dateString
          })
          .eq('id', employee.support_id);
      });

      await Promise.all(updates);

      toast.success(`${selectedEmployees.length} employees assigned to ${aircraft.registration}`);
      setSelectedEmployees([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning employees:', error);
      toast.error('Failed to assign employees');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setAvailableEmployees(allEmployees);
      return;
    }
    
    // Include trade and job title in search as requested
    const filtered = allEmployees.filter(emp => 
      emp.name.toLowerCase().includes(query.toLowerCase()) || 
      emp.e_number.toString().includes(query) || 
      (emp.job_title && emp.job_title.toLowerCase().includes(query.toLowerCase()))
    );
    
    setAvailableEmployees(filtered);
  };

  const toggleEmployeeSelection = (employee: any) => {
    if (selectedEmployees.some(e => e.id === employee.id)) {
      setSelectedEmployees(selectedEmployees.filter(e => e.id !== employee.id));
    } else {
      setSelectedEmployees([...selectedEmployees, employee]);
    }
  };

  if (!aircraft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Aircraft Details - {aircraft.registration}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Aircraft Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <Plane className="mr-2 h-5 w-5" />
                Aircraft Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Registration:</span>
                  <span className="font-medium">{aircraft.registration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Aircraft Type:</span>
                  <span className="font-medium">{aircraft.aircraft_types?.type_name || aircraft.aircraft_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium">{aircraft.customer || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Serial Number:</span>
                  <span className="font-medium">{aircraft.serial_number || "N/A"}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <Calendar className="mr-2 h-5 w-5" />
                Maintenance Schedule
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Check:</span>
                  <span className="font-medium">C-Check</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Visit Number:</span>
                  <span className="font-medium">MV-2025-003</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="font-medium">May 5, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date:</span>
                  <span className="font-medium">May 18, 2025</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <Clipboard className="mr-2 h-5 w-5" />
                Maintenance Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-green-600">In Progress</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completion:</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tasks Open:</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tasks Completed:</span>
                  <span className="font-medium">42</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Available Employees */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <User className="mr-2 h-5 w-5" />
                Available Employees
              </h3>
              
              <div className="mb-3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search by name, number, or job title" 
                  className="pl-10 p-2 w-full border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              
              <div className="overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent border-blue-500"></div>
                  </div>
                ) : availableEmployees.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No available employees found</div>
                ) : (
                  <div className="space-y-2">
                    {availableEmployees.map((employee) => (
                      <div 
                        key={employee.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                          selectedEmployees.some(e => e.id === employee.id) 
                            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => toggleEmployeeSelection(employee)}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center">
                            {employee.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-gray-500">
                              #{employee.e_number} • {employee.job_title || 'No Title'}
                            </div>
                          </div>
                        </div>
                        <div>
                          {selectedEmployees.some(e => e.id === employee.id) && (
                            <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Selected Employees Summary */}
            {selectedEmployees.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-medium flex items-center mb-2">
                  <Info className="mr-2 h-4 w-4 text-blue-500" />
                  Selected Employees
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployees.map(employee => (
                    <div 
                      key={`selected-${employee.id}`}
                      className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs flex items-center"
                    >
                      {employee.name}
                      <button 
                        className="ml-1 text-gray-500 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployees(selectedEmployees.filter(e => e.id !== employee.id));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignEmployees}
            disabled={selectedEmployees.length === 0}
          >
            Assign {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
