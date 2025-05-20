
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Menu, UserPlus, Settings, Search, 
  CalendarClock, FileText, Users, X
} from "lucide-react";

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
}

export const FloatingActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const actionItems: ActionItem[] = [
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

      {/* Action Modal - Center-oriented, 80% width and height */}
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
              {/* Content specific to each action */}
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
