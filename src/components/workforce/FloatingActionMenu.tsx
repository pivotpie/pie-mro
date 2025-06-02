import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Menu, UserPlus, Settings, Search, 
  CalendarClock, FileText, Users, X, Upload, Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDate } from "@/contexts/DateContext";
import { SetDateModal } from "./SetDateModal";

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
}

interface AttendanceRecord {
  employee_number: number;
  check_in_time: string;
  status: string;
  comments?: string;
}

export const FloatingActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [setDateModalOpen, setSetDateModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<AttendanceRecord[]>([]);
  const { currentDate, formatDate } = useDate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSetDate = () => {
    setSetDateModalOpen(true);
    setIsOpen(false);
  };

  const handleImportAttendance = () => {
    setActiveAction({ 
      icon: Upload, 
      label: "Import Attendance", 
      action: () => console.log("Import Attendance action") 
    });
    setDialogOpen(true);
    setIsOpen(false);
  };

  const actionItems: ActionItem[] = [
    { 
      icon: Calendar, 
      label: "Set Date", 
      action: handleSetDate
    },
    { 
      icon: UserPlus, 
      label: "Add Employee", 
      action: () => {
        setActiveAction({ icon: UserPlus, label: "Add Employee", action: () => console.log("Add Employee action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    },
    { 
      icon: Upload, 
      label: "Import Attendance", 
      action: handleImportAttendance
    },
    { 
      icon: CalendarClock, 
      label: "Scheduling", 
      action: () => {
        setActiveAction({ icon: CalendarClock, label: "Scheduling", action: () => console.log("Scheduling action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    },
    { 
      icon: Search, 
      label: "Quick Search", 
      action: () => {
        setActiveAction({ icon: Search, label: "Quick Search", action: () => console.log("Quick Search action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    },
    { 
      icon: FileText, 
      label: "Reports", 
      action: () => {
        setActiveAction({ icon: FileText, label: "Reports", action: () => console.log("Reports action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    },
    { 
      icon: Users, 
      label: "Teams", 
      action: () => {
        setActiveAction({ icon: Users, label: "Teams", action: () => console.log("Teams action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    },
    { 
      icon: Settings, 
      label: "Settings", 
      action: () => {
        setActiveAction({ icon: Settings, label: "Settings", action: () => console.log("Settings action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    }
  ];

  const parseCsvFile = (file: File): Promise<AttendanceRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must contain headers and at least one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
          const data: AttendanceRecord[] = [];

          // Validate required headers
          const requiredHeaders = ['employee_number', 'check_in_time', 'status'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) continue;

            const record: any = {};
            headers.forEach((header, index) => {
              record[header] = values[index];
            });

            // Convert and validate data types
            const attendanceRecord: AttendanceRecord = {
              employee_number: parseInt(record.employee_number),
              check_in_time: record.check_in_time,
              status: record.status,
              comments: record.comments || undefined
            };

            // Basic validation
            if (isNaN(attendanceRecord.employee_number)) {
              reject(new Error(`Invalid employee_number on row ${i + 1}: ${record.employee_number}`));
              return;
            }

            if (!attendanceRecord.check_in_time || !attendanceRecord.status) {
              reject(new Error(`Missing required data on row ${i + 1}`));
              return;
            }

            data.push(attendanceRecord);
          }

          resolve(data);
        } catch (error) {
          reject(new Error(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setCsvFile(file);
    
    try {
      const parsedData = await parseCsvFile(file);
      setPreviewData(parsedData.slice(0, 5)); // Show first 5 records for preview
      toast.success(`CSV parsed successfully. Found ${parsedData.length} records.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error parsing CSV file');
      setCsvFile(null);
      setPreviewData([]);
    }
  };

  const handleUploadAttendance = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file first');
      return;
    }

    setIsUploading(true);

    try {
      const parsedData = await parseCsvFile(csvFile);
      const currentDateStr = formatDate(currentDate); // Use centralized date
      
      // First, get employee IDs from employee numbers
      const employeeNumbers = parsedData.map(record => record.employee_number);
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('id, e_number')
        .in('e_number', employeeNumbers);

      if (employeeError) {
        console.error('Employee lookup error:', employeeError);
        toast.error(`Error looking up employees: ${employeeError.message}`);
        return;
      }

      // Create a map of employee numbers to IDs
      const employeeMap = new Map();
      employees?.forEach(emp => employeeMap.set(emp.e_number, emp.id));

      // Validate that all employees exist
      const missingEmployees = employeeNumbers.filter(num => !employeeMap.has(num));
      if (missingEmployees.length > 0) {
        toast.error(`Employee numbers not found: ${missingEmployees.join(', ')}`);
        return;
      }

      // Prepare attendance records for insertion
      const attendanceRecords = parsedData.map(record => ({
        employee_id: employeeMap.get(record.employee_number),
        date: currentDateStr,
        check_in_time: `${currentDateStr} ${record.check_in_time}`,
        status: record.status,
        comments: record.comments || null
      }));

      // Insert data into attendance table
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) {
        console.error('Supabase error:', error);
        toast.error(`Database error: ${error.message}`);
        return;
      }

      toast.success(`Successfully imported ${parsedData.length} attendance records for ${formatDate(currentDate, 'MMMM d, yyyy')}!`);
      
      // Reset form
      setCsvFile(null);
      setPreviewData([]);
      setDialogOpen(false);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import attendance data');
    } finally {
      setIsUploading(false);
    }
  };

  const renderAttendanceImportContent = () => (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-medium mb-2">CSV Format Requirements</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Your CSV file must include these columns (case-insensitive):
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
          <li><strong>Employee Number</strong> - Employee's unique identifier number (required)</li>
          <li><strong>Check in time</strong> - Time in HH:MM format, e.g., 08:30 (required)</li>
          <li><strong>Status</strong> - Attendance status like Present, Absent, Late, etc. (required)</li>
          <li><strong>Comments</strong> - Additional notes or remarks (optional)</li>
        </ul>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          <strong>Note:</strong> Date will be automatically set to the current application date ({formatDate(currentDate, 'MMMM d, yyyy')})
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        {previewData.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b">
              <h4 className="font-medium">Preview (First 5 records)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee Number</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check In Time</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Comments</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {previewData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{record.employee_number}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{record.check_in_time}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{record.status}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{record.comments || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUploadAttendance}
            disabled={!csvFile || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? 'Importing...' : 'Import Attendance'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 mb-2 w-48">
            {actionItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start mb-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => item.action()}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        )}
        <Button
          className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          onClick={toggleMenu}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Set Date Modal */}
      <SetDateModal 
        isOpen={setDateModalOpen} 
        onClose={() => setSetDateModalOpen(false)} 
      />

      {/* Action Modal */}
      {activeAction && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[80vw] h-[80vh] max-w-[80vw] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <activeAction.icon className="h-5 w-5 mr-2" />
                {activeAction.label}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6">
              {activeAction.label === "Import Attendance" ? (
                renderAttendanceImportContent()
              ) : (
                <>
                  {/* ... keep existing code (default content for other actions) */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-2">
                      {activeAction.label} Panel
                    </h3>
                    <p className="text-gray-500">
                      This is the content area for the {activeAction.label.toLowerCase()} functionality. 
                      Specific UI elements would be built here based on the action selected.
                    </p>
                  </div>
                  
                  {/* Sample data table for all actions */}
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                        {[1, 2, 3, 4, 5].map(i => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{`ITEM-${i}00${i}`}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">Sample Item {i}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-md ${
                                i % 3 === 0 ? "bg-green-100 text-green-800" : 
                                i % 3 === 1 ? "bg-yellow-100 text-yellow-800" : 
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {i % 3 === 0 ? "Active" : i % 3 === 1 ? "Pending" : "Completed"}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm">Edit</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing 5 of 25 records
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm">Previous</Button>
                      <Button variant="outline" size="sm" className="bg-blue-50 dark:bg-blue-900">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">3</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDialogOpen(false)}
                    >
                      <X className="h-4 w-4 mr-1" /> Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
