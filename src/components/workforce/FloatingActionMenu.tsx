
import { useState } from 'react';
import { Plus, Calendar, Users, FileText, Settings, Clock, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SetDateModal } from "./SetDateModal";

export const FloatingActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const menuItems = [
    {
      icon: Calendar,
      label: 'Set Date',
      action: () => setShowDateModal(true)
    },
    {
      icon: Users,
      label: 'Add Employee',
      action: () => console.log('Add Employee clicked')
    },
    {
      icon: Upload,
      label: 'Import Attendance',
      action: () => console.log('Import Attendance clicked')
    },
    {
      icon: FileText,
      label: 'Import Data',
      action: () => console.log('Import Data clicked')
    },
    {
      icon: Clock,
      label: 'Schedule Visit',
      action: () => console.log('Schedule Visit clicked')
    },
    {
      icon: Settings,
      label: 'Settings',
      action: () => console.log('Settings clicked')
    }
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end space-y-3">
          {/* Menu Items */}
          {isOpen && (
            <div className="flex flex-col space-y-2 mb-2">
              {menuItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                    {item.label}
                  </span>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 p-0"
                    onClick={item.action}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Main FAB */}
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Plus className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Set Date Modal */}
      <SetDateModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
      />
    </>
  );
};
