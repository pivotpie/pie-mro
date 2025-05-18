
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Plane, 
  CalendarCheck, 
  GraduationCap, 
  FileSpreadsheet,
  Settings,
  User2,
  Activity,
  BarChart4,
  AlertCircle,
  Calendar
} from "lucide-react";

interface WorkspaceSidebarProps {
  isOpen: boolean;
}

export const WorkspaceSidebar = ({ isOpen }: WorkspaceSidebarProps) => {
  const [activeSection, setActiveSection] = useState("workforce");

  const sidebarSections = [
    {
      title: "Workforce Management",
      id: "workforce",
      items: [
        { name: "Employees", icon: Users },
        { name: "Teams", icon: Users },
        { name: "Leave Management", icon: CalendarCheck },
        { name: "Training", icon: GraduationCap },
        { name: "Certifications", icon: FileSpreadsheet },
      ]
    },
    {
      title: "Aircraft Management",
      id: "aircraft",
      items: [
        { name: "Aircraft Fleet", icon: Plane },
        { name: "Maintenance Schedule", icon: Calendar },
        { name: "Availability", icon: Activity },
      ]
    },
    {
      title: "Reports & Analytics",
      id: "reports",
      items: [
        { name: "Dashboard", icon: BarChart4 },
        { name: "Workforce Reports", icon: FileSpreadsheet },
        { name: "Compliance", icon: AlertCircle },
      ]
    }
  ];

  if (!isOpen) {
    return (
      <div className="w-[60px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden md:block">
        <div className="flex flex-col items-center py-4">
          {sidebarSections.map((section) => (
            <div key={section.id} className="w-full mb-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                {section.items.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="icon"
                    className="w-full h-10 mb-1"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <Button variant="ghost" size="icon" className="mt-auto">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden md:block transition-all duration-300 overflow-y-auto`}>
      <div className="p-4">
        {sidebarSections.map((section) => (
          <div key={section.id} className="mb-6">
            <h3 className="text-sm text-gray-500 font-medium mb-2 px-2">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={`w-full justify-start text-sm ${
                    activeSection === section.id
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : ''
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
