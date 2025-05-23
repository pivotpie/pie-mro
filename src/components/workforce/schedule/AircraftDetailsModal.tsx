
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AircraftDetailsModalProps {
  aircraft: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AircraftDetailsModal = ({ aircraft, open, onOpenChange }: AircraftDetailsModalProps) => {
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (aircraft && open) {
      fetchAvailableEmployees();
      fetchAssignedTeams();
    }
  }, [aircraft, open]);

  useEffect(() => {
    filterEmployees();
  }, [availableEmployees, searchQuery]);

  const fetchAvailableEmployees = async () => {
    setLoading(true);
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          *,
          job_titles (job_description),
          teams (team_name),
          trades (trade_name, skill_category),
          employee_authorizations (
            id,
            authorization_basis,
            aircraft_model_id,
            engine_model_id,
            aircraft_models (model_name),
            engine_models (model_code, manufacturer)
          ),
          employee_supports (
            id,
            support_codes (support_code)
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Filter employees based on aircraft requirements and availability
      const filtered = employees.filter(emp => {
        // Check if employee has AV (Available) status in employee_supports
        const hasAvailableStatus = emp.employee_supports?.some((support: any) => 
          support.support_codes?.support_code === 'AV'
        );
        
        // Check if employee has relevant authorization for this aircraft type
        const hasRelevantAuth = emp.employee_authorizations?.some((auth: any) => {
          // For G-FVWF, check if they have authorization for relevant aircraft models
          if (aircraft.registration === 'G-FVWF') {
            return auth.aircraft_models?.model_name?.includes('A350') || 
                   auth.aircraft_models?.model_name?.includes('787') ||
                   auth.engine_models?.model_code?.includes('Trent');
          }
          return true; // For other aircraft, include all authorized employees
        });

        return hasAvailableStatus && (hasRelevantAuth || emp.employee_authorizations?.length === 0);
      });

      setAvailableEmployees(filtered);
    } catch (error) {
      console.error('Error fetching available employees:', error);
      toast.error('Failed to fetch available employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedTeams = async () => {
    try {
      // Fetch visits for this aircraft
      const { data: visits, error } = await supabase
        .from('maintenance_visits')
        .select(`
          *,
          personnel_requirements (
            *,
            trades (trade_name)
          )
        `)
        .eq('aircraft_id', aircraft.id)
        .in('status', ['in-progress', 'completed']);

      if (error) throw error;

      const teams: any[] = [];
      visits?.forEach(visit => {
        visit.personnel_requirements?.forEach((req: any) => {
          teams.push({
            visit_number: visit.visit_number,
            check_type: visit.check_type,
            status: visit.status,
            trade: req.trades?.trade_name,
            day_shift: req.day_shift_count,
            night_shift: req.night_shift_count,
            date: req.date
          });
        });
      });

      setAssignedTeams(teams);
    } catch (error) {
      console.error('Error fetching assigned teams:', error);
    }
  };

  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(availableEmployees);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchTerms = query.split(/[,\s]+/).filter(term => term.length > 0);

    const filtered = availableEmployees.filter(employee => {
      const searchableText = [
        employee.name,
        employee.e_number?.toString(),
        employee.job_titles?.job_description,
        employee.teams?.team_name,
        employee.trades?.trade_name,
        employee.trades?.skill_category,
        ...employee.employee_authorizations?.map((auth: any) => [
          auth.aircraft_models?.model_name,
          auth.engine_models?.model_code,
          auth.engine_models?.manufacturer,
          auth.authorization_basis
        ]).flat().filter(Boolean) || []
      ].filter(Boolean).join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });

    setFilteredEmployees(filtered);
  };

  const handleEmployeeSelect = (employee: any, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmployees(prev => [...prev, employee]);
    } else {
      setSelectedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select employees to assign');
      return;
    }

    setIsAssigning(true);
    try {
      // Remove AV status and add aircraft-specific support code for selected employees
      const updates = selectedEmployees.map(async (employee) => {
        // Remove AV support code
        const { error: deleteError } = await supabase
          .from('employee_supports')
          .delete()
          .eq('employee_id', employee.id)
          .eq('support_id', 1); // Assuming AV has ID 1

        if (deleteError) throw deleteError;

        // Add aircraft-specific support code (e.g., G-FVWF)
        let supportCodeId = 2; // Default
        if (aircraft.registration === 'G-FVWF') {
          // Find or create support code for this aircraft
          const { data: supportCode, error: supportError } = await supabase
            .from('support_codes')
            .select('id')
            .eq('support_code', aircraft.registration)
            .single();

          if (supportError && supportError.code !== 'PGRST116') {
            // Create new support code if it doesn't exist
            const { data: newSupportCode, error: createError } = await supabase
              .from('support_codes')
              .insert({ support_code: aircraft.registration })
              .select('id')
              .single();

            if (createError) throw createError;
            supportCodeId = newSupportCode.id;
          } else if (supportCode) {
            supportCodeId = supportCode.id;
          }
        }

        // Add new assignment
        const { error: insertError } = await supabase
          .from('employee_supports')
          .insert({
            employee_id: employee.id,
            support_id: supportCodeId,
            assignment_date: new Date().toISOString().split('T')[0]
          });

        if (insertError) throw insertError;
      });

      await Promise.all(updates);

      toast.success(`Successfully assigned ${selectedEmployees.length} employees to ${aircraft.registration}`);
      setSelectedEmployees([]);
      fetchAvailableEmployees(); // Refresh the list
      
    } catch (error) {
      console.error('Error assigning employees:', error);
      toast.error('Failed to assign employees');
    } finally {
      setIsAssigning(false);
    }
  };

  const clearFilter = () => {
    setSearchQuery("");
  };

  if (!aircraft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Aircraft Details - {aircraft.aircraft_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
          {/* Left Column - Aircraft Info and Assigned Teams */}
          <div className="space-y-4 overflow-y-auto">
            {/* Aircraft Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Aircraft Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Registration:</span> {aircraft.registration}</div>
                <div><span className="font-medium">Customer:</span> {aircraft.customer}</div>
                <div><span className="font-medium">Serial Number:</span> {aircraft.serial_number}</div>
                <div><span className="font-medium">Total Hours:</span> {aircraft.total_hours?.toLocaleString()}</div>
                <div><span className="font-medium">Total Cycles:</span> {aircraft.total_cycles?.toLocaleString()}</div>
              </div>
            </div>

            {/* Assigned Teams */}
            <div>
              <h3 className="font-semibold mb-3">Assigned Teams</h3>
              {assignedTeams.length > 0 ? (
                <div className="space-y-2">
                  {assignedTeams.map((team, index) => (
                    <div key={index} className="border rounded-lg p-3 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{team.visit_number}</span>
                          <Badge className="ml-2" variant={
                            team.status === 'completed' ? 'default' : 'secondary'
                          }>
                            {team.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{team.check_type}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Trade: {team.trade}</div>
                        <div>Day Shift: {team.day_shift} | Night Shift: {team.night_shift}</div>
                        <div>Date: {new Date(team.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No assigned teams found.</p>
              )}
            </div>
          </div>

          {/* Right Column - Available Employees */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Available Employees ({filteredEmployees.length})</h3>
              {selectedEmployees.length > 0 && (
                <Button 
                  onClick={handleBulkAssign}
                  disabled={isAssigning}
                  className="ml-auto"
                >
                  {isAssigning ? 'Assigning...' : `Assign Selected (${selectedEmployees.length})`}
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, B1, A350, Trent 1000, trade, job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilter}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Selected Employees Display */}
            {selectedEmployees.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Selected Employees ({selectedEmployees.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedEmployees.map(emp => (
                    <Badge key={emp.id} variant="secondary" className="text-xs">
                      {emp.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:text-red-500"
                        onClick={() => handleEmployeeSelect(emp, false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredEmployees.length > 0 ? (
                <div className="space-y-2">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedEmployees.some(emp => emp.id === employee.id)}
                          onCheckedChange={(checked) => handleEmployeeSelect(employee, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-gray-500">
                                ID: {employee.e_number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {employee.job_titles?.job_description && (
                                <Badge variant="outline" className="text-xs">
                                  {employee.job_titles.job_description}
                                </Badge>
                              )}
                              {employee.teams?.team_name && (
                                <Badge variant="outline" className="text-xs">
                                  Team: {employee.teams.team_name}
                                </Badge>
                              )}
                              {employee.trades?.trade_name && (
                                <Badge variant="outline" className="text-xs">
                                  {employee.trades.trade_name}
                                </Badge>
                              )}
                            </div>
                            
                            {employee.employee_authorizations?.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <div className="font-medium">Authorizations:</div>
                                {employee.employee_authorizations.slice(0, 3).map((auth: any, idx: number) => (
                                  <div key={idx} className="ml-2">
                                    • {auth.authorization_basis}
                                    {auth.aircraft_models?.model_name && ` - ${auth.aircraft_models.model_name}`}
                                    {auth.engine_models?.model_code && ` - ${auth.engine_models.model_code}`}
                                  </div>
                                ))}
                                {employee.employee_authorizations.length > 3 && (
                                  <div className="ml-2 text-gray-500">
                                    +{employee.employee_authorizations.length - 3} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No employees found matching your search.' : 'No available employees found.'}
                </div>
              )}
            </div>

            {searchQuery && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={clearFilter}
                  className="w-full"
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
