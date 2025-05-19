
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UniversalSearch } from "./UniversalSearch";
import { ManagementShortcuts } from "./ManagementShortcuts";
import { FloatingActionMenu } from "./FloatingActionMenu";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { Menu, Bell, Plus, Search, User as UserIcon, MessageSquare, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNotification } from '@/contexts/NotificationContext';
import { Badge } from '@/components/ui/badge';

interface WorkforceGlobalHeaderProps {
  user: any;
  onLogout: () => void;
  onOpenEmployeeDetails?: (id: string) => void;
  onOpenAircraftDetails?: (id: string) => void;
}

export const WorkforceGlobalHeader = ({ 
  user, 
  onLogout,
  onOpenEmployeeDetails,
  onOpenAircraftDetails
}: WorkforceGlobalHeaderProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { showToast } = useNotification();
  
  const handleNotificationsClick = () => {
    showToast({
      title: "Notifications",
      message: "You have 3 unread notifications",
      type: "info",
      action: {
        label: "View All",
        onClick: () => console.log("View all notifications clicked")
      }
    });
  };

  const handleQuickAction = (action: string) => {
    if (action === 'employee' && onOpenEmployeeDetails) {
      // In a real app, you might show a selector first
      onOpenEmployeeDetails("emp123");
      showToast({
        title: "Employee Selected",
        message: "Viewing details for Jane Smith",
        type: "success"
      });
    } else if (action === 'aircraft' && onOpenAircraftDetails) {
      onOpenAircraftDetails("air456");
      showToast({
        title: "Aircraft Selected",
        message: "Viewing details for aircraft N12345",
        type: "success"
      });
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center">
          {/* Mobile sidebar trigger */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <WorkspaceSidebar isOpen={true} />
            </SheetContent>
          </Sheet>
          
          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <WorkspaceSidebar isOpen={true} />
          </div>

          <div className="ml-4">
            <h1 className="text-lg font-semibold">Workforce Manager</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search button (mobile) */}
          <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top">
              <UniversalSearch onClose={() => setIsSearchOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Desktop search */}
          <div className="hidden md:block w-96">
            <UniversalSearch />
          </div>
          
          {/* Quick actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleQuickAction('employee')}>
                <UserIcon className="h-4 w-4 mr-2" />
                View Employee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('aircraft')}>
                <Bell className="h-4 w-4 mr-2" />
                View Aircraft
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                New Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" onClick={handleNotificationsClick} className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 px-1 h-4 min-w-4 text-xs">3</Badge>
          </Button>
          
          {/* Theme toggle */}
          <ThemeToggle />
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Management shortcuts */}
      <div className="hidden md:block px-4 mt-4">
        <ManagementShortcuts />
      </div>
      
      {/* Floating action button (mobile only) */}
      <div className="md:hidden">
        <FloatingActionMenu />
      </div>
    </header>
  );
};
