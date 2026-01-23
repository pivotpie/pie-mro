
import { useState } from 'react';
import { Plus, Calendar, Users, FileText, Settings, Clock, Upload, Menu, UserPlus, Search, CalendarClock, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SetDateModal } from "./SetDateModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<AttendanceRecord[]>([]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
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
      label: 'Set Date',
      action: () => setShowDateModal(true)
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
      icon: FileText,
      label: 'Import Data',
      action: () => {
        setActiveAction({ icon: FileText, label: "Import Data", action: () => console.log("Import Data action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    },
    {
      icon: Clock,
      label: 'Schedule Visit',
      action: () => {
        setActiveAction({ icon: Clock, label: "Schedule Visit", action: () => console.log("Schedule Visit action") });
        setDialogOpen(true);
        setIsOpen(false);
      }
    },
    {
      icon: Settings,
      label: 'Settings',
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
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      
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
        date: currentDate,
        check_in_time: `${currentDate} ${record.check_in_time}`,
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

      toast.success(`Successfully imported ${parsedData.length} attendance records for ${currentDate}!`);
      
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
          <strong>Note:</strong> Date will be automatically set to today's date ({new Date().toLocaleDateString()})
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
      <div className="fixed bottom-24 right-6 z-40">
        <div className="flex flex-col items-end space-y-3">
          {/* Menu Items */}
          {isOpen && (
            <div className="flex flex-col space-y-3 mb-3 animate-in slide-in-from-bottom-5">
              {actionItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 animate-in slide-in-from-right-5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-lg border border-gray-700">
                    {item.label}
                  </span>
                  <Button
                    size="sm"
                    className="bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-full w-12 h-12 p-0 shadow-xl transition-all duration-300 hover:scale-110"
                    onClick={item.action}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Main FAB - Enhanced Design */}
          <Button
            size="lg"
            className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white rounded-full w-16 h-16 p-0 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 border-2 border-blue-400/20"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Plus className={`h-7 w-7 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Set Date Modal */}
      <SetDateModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
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
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-2">
                    {activeAction.label} Panel
                  </h3>
                  <p className="text-gray-500">
                    This is the content area for the {activeAction.label.toLowerCase()} functionality. 
                    Specific UI elements would be built here based on the action selected.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
