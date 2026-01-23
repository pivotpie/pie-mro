
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, UserCog, UsersRound, CalendarClock,
  ClipboardCheck, FileText, ArrowUpRight, UserPlus, Calendar, AlertCircle,
  Briefcase, FileSpreadsheet, Download, Upload
} from "lucide-react";
import { EmployeeAuthorizationList } from "./certification/EmployeeAuthorizationList";
import TrainingManagementSystem from "./training/TrainingManagementSystem";

interface ShortcutItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ManagementShortcutsProps {
  initialShortcutId?: string;
}

export const ManagementShortcuts = ({ initialShortcutId }: ManagementShortcutsProps = {}) => {
  const [activeShortcut, setActiveShortcut] = useState<ShortcutItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const shortcuts: ShortcutItem[] = [
    { id: "certification-portal", label: "Certification Portal", icon: FileText, color: "bg-emerald-100 text-emerald-600" },
    { id: "training-management", label: "Training Management", icon: FileSpreadsheet, color: "bg-purple-100 text-purple-600" },
    { id: "employee-shifts", label: "Employee Shifts", icon: CalendarClock, color: "bg-blue-100 text-blue-600" },
    { id: "employee-management", label: "Employee Management", icon: UserCog, color: "bg-green-100 text-green-600" },
    { id: "team-management", label: "Team Management", icon: UsersRound, color: "bg-indigo-100 text-indigo-600" },
    { id: "leave-management", label: "Leave Management", icon: AlertCircle, color: "bg-red-100 text-red-600" },
    { id: "weekly-off", label: "Weekly Offs", icon: Calendar, color: "bg-yellow-100 text-yellow-600" },
    { id: "aircraft-management", label: "Aircraft Management", icon: Briefcase, color: "bg-cyan-100 text-cyan-600" },
  ];

  useEffect(() => {
    if (initialShortcutId) {
      const shortcut = shortcuts.find(s => s.id === initialShortcutId);
      if (shortcut) {
        setActiveShortcut(shortcut);
        setDialogOpen(true);
      }
    }
  }, [initialShortcutId]);

  const handleShortcutClick = (shortcut: ShortcutItem) => {
    setActiveShortcut(shortcut);
    setDialogOpen(true);
  };

  const renderShortcutContent = () => {
    if (!activeShortcut) return null;

    // Render the EmployeeAuthorizationList for Certification Portal
    if (activeShortcut.id === "certification-portal") {
      return (
        <div className="h-full">
          <EmployeeAuthorizationList />
        </div>
      );
    }

    // Render the TrainingManagementSystem for Training Management
    if (activeShortcut.id === "training-management") {
      return (
        <div className="h-full">
          <TrainingManagementSystem />
        </div>
      );
    }

    // Default content for other shortcuts
    return (
      <div className="mt-6 h-full flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Showing records from database</div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex items-center">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" className="flex items-center bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-1" />
              Add New
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="rounded-md border dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <th className="p-3 text-left font-medium dark:text-gray-200">ID</th>
                  <th className="p-3 text-left font-medium dark:text-gray-200">Name</th>
                  <th className="p-3 text-left font-medium dark:text-gray-200">Team</th>
                  <th className="p-3 text-left font-medium dark:text-gray-200">Status</th>
                  <th className="p-3 text-left font-medium dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    <td className="p-3 dark:text-gray-300">EMP00{i+1}</td>
                    <td className="p-3 dark:text-gray-300">{["James Wilson", "Sarah Johnson", "Michael Brown", "Emily Davis", "Robert Miller"][i % 5]}</td>
                    <td className="p-3 dark:text-gray-300">{["Team Alpha", "Team Beta", "Team Charlie"][i % 3]}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        i % 3 === 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                        i % 3 === 1 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" : 
                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      }`}>
                        {i % 3 === 0 ? "Active" : i % 3 === 1 ? "On Leave" : "In Training"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="h-8 px-2">View</Button>
                        <Button variant="outline" size="sm" className="h-8 px-2">Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing records from database
          </div>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-blue-50 dark:bg-blue-900">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Quick Access</h3>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {shortcuts.map((shortcut) => (
            <Button
              key={shortcut.id}
              variant="ghost"
              className="flex justify-start items-center h-12 px-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleShortcutClick(shortcut)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${shortcut.color}`}>
                <shortcut.icon className="h-4 w-4" />
              </div>
              <span className="text-sm">{shortcut.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>

      {/* Management Modal - Fixed sizing to prevent double scroll */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] h-[90vh] max-w-none p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle>{activeShortcut?.label}</DialogTitle>
            <DialogDescription>
              Manage and view {activeShortcut?.label.toLowerCase()} data
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 px-6 py-4 overflow-hidden">
            {renderShortcutContent()}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
