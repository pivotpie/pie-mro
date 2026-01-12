
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Search, Menu, Bell, Settings, Home, Calendar } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "react-router-dom";
import { SetDateModal } from "./SetDateModal";
import { useDate } from "@/contexts/DateContext";
import { format } from "date-fns";

interface WorkforceHeaderProps {
  user: {
    id: number;
    username: string;
    employee: any;
  };
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const WorkforceHeader = ({ user, onToggleSidebar, onLogout }: WorkforceHeaderProps) => {
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const { currentDate, isManuallySet } = useDate();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Use username from our custom user object
  const displayName = user.username || 'User';
  const initials = getInitials(displayName);
  const location = useLocation();
  const isOnDashboard = location.pathname === "/dashboard";

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/aed00a77-af60-4ad8-82d2-0d69f8b70a11.png" 
              alt="Pie-MRO Logo" 
              className="h-8 w-auto mr-2" 
            />
            <span className="text-xl font-semibold">Pie-MRO</span>
            <span className="text-xs text-gray-500 font-normal hidden md:inline-block">
              Aircraft Maintenance Management System
            </span>
          </div>
        </div>

        {/* Date Picker Section */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">
              {format(currentDate, 'MMM d, yyyy')}
            </span>
            <span className="sm:hidden">
              {format(currentDate, 'M/d')}
            </span>
            {isManuallySet && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded">
                Set
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {isOnDashboard ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin-workforce">
                <span className="flex items-center gap-1">
                  Go to Workforce Manager
                </span>
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">
                <Home className="h-4 w-4 mr-1" />
                <span>Dashboard</span>
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="text-gray-500 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Settings className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.employee?.name || user.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date Modal */}
      <SetDateModal 
        isOpen={isDateModalOpen} 
        onClose={() => setIsDateModalOpen(false)} 
      />
    </header>
  );
};
