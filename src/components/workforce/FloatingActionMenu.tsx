
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Menu, UserPlus, Settings, Search, 
  CalendarClock, FileText, Users
} from "lucide-react";

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
}

export const FloatingActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const actionItems: ActionItem[] = [
    { 
      icon: UserPlus, 
      label: "Add Employee", 
      action: () => console.log("Add Employee clicked") 
    },
    { 
      icon: CalendarClock, 
      label: "Scheduling", 
      action: () => console.log("Scheduling clicked") 
    },
    { 
      icon: Search, 
      label: "Quick Search", 
      action: () => console.log("Quick Search clicked") 
    },
    { 
      icon: FileText, 
      label: "Reports", 
      action: () => console.log("Reports clicked") 
    },
    { 
      icon: Users, 
      label: "Teams", 
      action: () => console.log("Teams clicked") 
    },
    { 
      icon: Settings, 
      label: "Settings", 
      action: () => console.log("Settings clicked") 
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-2 mb-2 w-48">
          {actionItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start mb-1 hover:bg-gray-100"
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
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
  );
};
