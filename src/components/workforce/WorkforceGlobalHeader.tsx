import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, Moon, Search, Settings, Sun, User, Home, Calendar, Command as CommandIcon, Award, BookOpen, Loader2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { Link, useLocation } from "react-router-dom";
import { SetDateModal } from "./SetDateModal";
import { useDate } from "@/contexts/DateContext";
import { format } from "date-fns";
import { useOmniSearch, SearchResult } from "@/hooks/use-omni-search";

interface WorkforceGlobalHeaderProps {
  user: {
    id: number;
    username: string;
    employee: any;
  };
  onLogout: () => void;
  onItemSelect?: (type: 'employee' | 'aircraft' | 'certification' | 'training', item: any) => void;
}

export const WorkforceGlobalHeader = ({ user, onLogout, onItemSelect }: WorkforceGlobalHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results, isLoading } = useOmniSearch(query);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const { currentDate, isManuallySet } = useDate();
  const location = useLocation();
  const isOnDashboard = location.pathname === "/dashboard" || location.pathname === "/manager-dashboard";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Support both CMD/CTRL+K (standard) and CMD/CTRL+G for search
      if ((e.key === "k" || e.key === "g") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setQuery(""); // Clear query on selection
    if (onItemSelect) {
      // For aircraft, pass the entire item so we have access to metadata
      // For other types, pass originalData as before
      onItemSelect(item.type, item.type === 'aircraft' ? item : item.originalData);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery(""); // Clear query when closing
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm w-full">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/aed00a77-af60-4ad8-82d2-0d69f8b70a11.png" 
            alt="Pie-MRO Logo" 
            className="h-8 w-auto mr-2" 
          />
          <span className="text-xl font-semibold">Pie-MRO</span>
        </div>
        
        {/* Center Search Button */}
        <div className="flex-grow max-w-2xl mx-4">
          <Button 
            variant="outline" 
            className="w-full flex justify-between items-center h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => setOpen(true)}
          >
            <span className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Search employees, aircraft, certifications...
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Date Picker Section */}
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

          {/* Navigation Button */}
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
              <Link to="/manager-dashboard">
                <Home className="h-4 w-4 mr-1" />
                <span>Dashboard</span>
              </Link>
            </Button>
          )}
          
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-gray-500">
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="rounded-full text-gray-500 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="icon" className="rounded-full text-gray-500">
            <Settings className="h-5 w-5" />
          </Button>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(user.employee?.name || user.username)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
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

      {/* Omni-Search Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-3xl p-4 gap-0 border-0 shadow-2xl bg-transparent data-[state=open]:bg-transparent"
          style={{
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          <div className="w-full mx-auto">
            {/* Search Bar - Centered, 50% width of dialog */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-4">
              <div className="flex items-center px-4 py-3">
                <Search className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
                <Input
                  placeholder="Search employees, aircraft, certifications, training..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {isLoading && (
                  <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                )}

                {!isLoading && results.length === 0 && query.length >= 2 && (
                  <div className="py-12 text-center bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-gray-500 dark:text-gray-400">No results found for "{query}"</div>
                    <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try different keywords</div>
                  </div>
                )}

                {!isLoading && query.length < 2 && (
                  <div className="py-12 text-center bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-gray-500 dark:text-gray-400">Type at least 2 characters to search</div>
                    <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">Search for employees, aircraft, certifications, or training</div>
                  </div>
                )}

                {!isLoading && results.length > 0 && (
                  <div className="space-y-4">
                    {/* Group: Employees */}
                    {results.some(r => r.type === 'employee') && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Employees</div>
                        <div className="space-y-2">
                          {results.filter(r => r.type === 'employee').map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md cursor-pointer transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                  <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Row 1: Name with Roster Status Badge */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                      {item.title}
                                    </div>
                                    {item.metadata?.currentAssignment?.type && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        item.metadata.currentAssignment.type === 'On Duty' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700' :
                                        item.metadata.currentAssignment.type === 'Half Day' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700' :
                                        item.metadata.currentAssignment.type === 'Off Duty' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700' :
                                        item.metadata.currentAssignment.type === 'Annual Leave' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700' :
                                        item.metadata.currentAssignment.type === 'Sick Leave' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-700' :
                                        item.metadata.currentAssignment.type === 'Training' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700' :
                                        item.metadata.currentAssignment.type === 'Over Time' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700' :
                                        item.metadata.currentAssignment.type === 'Evening Shift' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700' :
                                        item.metadata.currentAssignment.type === 'Special Shift' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700' :
                                        item.metadata.currentAssignment.type === 'UnAssigned' ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-400 dark:border-gray-600' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
                                      }`}>
                                        {item.metadata.currentAssignment.type}
                                      </span>
                                    )}
                                  </div>

                                  {/* Row 2: Trade/Job Role, Certifications */}
                                  <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">{item.metadata?.jobTitle}</span>
                                    {item.metadata?.certifications && item.metadata.certifications.length > 0 && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <div className="flex gap-1 flex-wrap">
                                          {item.metadata.certifications.map((cert, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                              {cert}
                                            </span>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Row 3: Core, Support */}
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    {item.metadata?.cores && item.metadata.cores.length > 0 && (
                                      <>
                                        <span className="text-gray-500 dark:text-gray-400">Core:</span>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">{item.metadata.cores.join(', ')}</span>
                                      </>
                                    )}
                                    {item.metadata?.supports && item.metadata.supports.length > 0 && (
                                      <>
                                        {item.metadata?.cores && item.metadata.cores.length > 0 && <span className="text-gray-400">•</span>}
                                        <span className="text-gray-500 dark:text-gray-400">Support:</span>
                                        <span className="font-medium text-purple-600 dark:text-purple-400">{item.metadata.supports.join(', ')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group: Aircraft */}
                    {results.some(r => r.type === 'aircraft') && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aircraft</div>
                        <div className="space-y-2">
                          {results.filter(r => r.type === 'aircraft').map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md cursor-pointer transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                                  <CommandIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Row 1: Registration */}
                                  <div className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {item.title}
                                  </div>

                                  {/* Row 2: Schedule Status and Maintenance Dates */}
                                  {item.metadata?.maintenance ? (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                          item.metadata.maintenance.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                          item.metadata.maintenance.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                          item.metadata.maintenance.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                        }`}>
                                          {item.metadata.maintenance.status}
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{item.metadata.maintenance.type}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                                          {item.metadata.maintenance.visitNumber}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        📅 {new Date(item.metadata.maintenance.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(item.metadata.maintenance.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      No current maintenance
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group: Certifications */}
                    {results.some(r => r.type === 'certification') && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Certifications</div>
                        <div className="space-y-2">
                          {results.filter(r => r.type === 'certification').map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md cursor-pointer transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Row 1: Certification Code */}
                                  <div className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {item.title}
                                  </div>

                                  {/* Description */}
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {item.subtitle}
                                  </div>

                                  {/* Row 2: Authorities */}
                                  {item.metadata?.authorities && item.metadata.authorities.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
                                      <span className="text-gray-600 dark:text-gray-400 text-xs">Authorities:</span>
                                      {item.metadata.authorities.map((auth, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                          {auth}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">No authorities data</div>
                                  )}

                                  {/* Row 3: Top Employees with current certifications */}
                                  {item.metadata?.topEmployees && item.metadata.topEmployees.length > 0 ? (
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-500 dark:text-gray-400">Currently Certified:</span>
                                      {' '}
                                      {item.metadata.topEmployees.map((emp, idx) => (
                                        <span key={emp.id} className="font-medium">
                                          {emp.name}
                                          {idx < item.metadata.topEmployees.length - 1 && ', '}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">No currently certified employees</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group: Training */}
                    {results.some(r => r.type === 'training') && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Training Sessions</div>
                        <div className="space-y-2">
                          {results.filter(r => r.type === 'training').map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md cursor-pointer transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {item.title}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.subtitle}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Modal */}
      <SetDateModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
      />

      {/* Custom styling for darker backdrop */}
      {open && (
        <style dangerouslySetInnerHTML={{
          __html: `
            [data-radix-portal] [data-radix-dialog-overlay] {
              background-color: rgba(0, 0, 0, 0.85) !important;
            }
          `
        }} />
      )}
    </header>
  );
};