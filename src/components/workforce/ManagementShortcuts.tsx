
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Users, UserCog, UsersRound, CalendarClock, 
  ClipboardCheck, FileText, Import, ArrowUpRight, UserPlus
} from "lucide-react";

interface ShortcutItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ManagementShortcuts = () => {
  const [activeShortcut, setActiveShortcut] = useState<ShortcutItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const shortcuts: ShortcutItem[] = [
    { id: "employee-shifts", label: "Employee Shifts", icon: CalendarClock },
    { id: "employee-management", label: "Employee Management", icon: UserCog },
    { id: "team-management", label: "Team Management", icon: UsersRound },
    { id: "leave-management", label: "Leave Management", icon: ClipboardCheck },
    { id: "weekly-off", label: "Weekly Off", icon: CalendarClock },
    { id: "certifications", label: "Certifications", icon: FileText }
  ];

  const handleShortcutClick = (shortcut: ShortcutItem) => {
    setActiveShortcut(shortcut);
    setSheetOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4 dark:text-gray-100">Quick Access</h3>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map((shortcut) => (
            <Button
              key={shortcut.id}
              variant="outline"
              className="flex justify-start items-center h-12 px-4 hover:bg-gray-50 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400 transition-colors"
              onClick={() => handleShortcutClick(shortcut)}
            >
              <shortcut.icon className="mr-2 h-5 w-5" />
              <span className="text-sm">{shortcut.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Management Side Panel */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] md:w-[680px] lg:w-[860px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{activeShortcut?.label}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Showing records from database</div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <Import className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button variant="outline" size="sm" className="flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button size="sm" className="flex items-center bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </div>
            </div>

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
        </SheetContent>
      </Sheet>
    </div>
  );
};
