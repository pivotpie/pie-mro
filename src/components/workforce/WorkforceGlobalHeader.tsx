
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, Moon, Search, Settings, Sun, User, X, Home, Calendar } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SetDateModal } from "./SetDateModal";
import { useDate } from "@/contexts/DateContext";
import { format } from "date-fns";

interface WorkforceGlobalHeaderProps {
  user: {
    id: number;
    username: string;
    employee: any;
  };
  onLogout: () => void;
  onItemSelect?: (type: 'employee' | 'aircraft' | 'certification', item: any) => void;
}

export const WorkforceGlobalHeader = ({ user, onLogout, onItemSelect }: WorkforceGlobalHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const { currentDate, isManuallySet } = useDate();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnDashboard = location.pathname === "/dashboard" || location.pathname === "/manager-dashboard";

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

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Search employees - Fixed query to not include trades relation
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          job_titles (job_description),
          teams (team_name)
        `)
        .or(`name.ilike.%${query}%,e_number.eq.${!isNaN(Number(query)) ? query : 0}`)
        .limit(5);
        
      if (employeesError) throw employeesError;
      
      // Search aircraft
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select(`
          *,
          aircraft_types (type_name)
        `)
        .or(`aircraft_name.ilike.%${query}%, registration.ilike.%${query}%, customer.ilike.%${query}%`)
        .limit(5);
        
      if (aircraftError) throw aircraftError;
      
      // Search certifications
      const { data: certifications, error: certificationsError } = await supabase
        .from('certification_codes')
        .select('*')
        .or(`certification_code.ilike.%${query}%, certification_description.ilike.%${query}%`)
        .limit(5);
        
      if (certificationsError) throw certificationsError;
      
      // Format results
      const formattedResults = [
        ...employees.map((employee) => ({
          id: `employee_${employee.id}`,
          type: 'employee',
          name: employee.name,
          subtitle: employee.job_titles?.job_description || 'Unknown Position',
          metadata: {
            employeeId: employee.e_number,
            team: employee.teams?.team_name,
          },
          rawData: employee,
        })),
        ...aircraft.map((ac) => ({
          id: `aircraft_${ac.id}`,
          type: 'aircraft',  
          name: ac.aircraft_name,
          subtitle: ac.registration || 'Unregistered',
          metadata: {
            customer: ac.customer,
            type: ac.aircraft_types?.type_name,
          },
          rawData: ac,
        })),
        ...certifications.map((cert) => ({
          id: `cert_${cert.id}`,
          type: 'certification',
          name: cert.certification_code,
          subtitle: cert.certification_description,
          metadata: {},
          rawData: cert,
        }))
      ];
      
      setSearchResults(formattedResults);
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleItemClick = (item: any) => {
    if (!onItemSelect) {
      console.log("No item select handler defined");
      return;
    }

    // Close the dialog
    setIsSearchOpen(false);
    
    // Process the selection based on the item type
    switch (item.type) {
      case 'employee':
        onItemSelect('employee', item.rawData);
        break;
      case 'aircraft':
        onItemSelect('aircraft', item.rawData);
        break;
      case 'certification':
        onItemSelect('certification', item.rawData);
        break;
      default:
        console.warn("Unknown item type:", item.type);
    }
  };

  const toggleSelected = (item: any) => {
    if (selectedItems.some(selected => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const clearFilter = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // Add keyboard shortcut listener for Ctrl+G
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            className="w-full flex justify-between items-center h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            onClick={() => setIsSearchOpen(true)}
          >
            <span className="flex items-center text-gray-500">
              <Search className="h-4 w-4 mr-2" />
              Universal search...
            </span>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
              Ctrl+G
            </span>
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

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Universal Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by employee name, aircraft registration, or certification"
                className="w-full p-3 pr-20 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={clearFilter}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>

          <div className="mt-4">
            {/* Selected Items Section */}
            {selectedItems.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Selected Items</h3>
                <div className="space-y-1">
                  {selectedItems.map(item => (
                    <div 
                      key={`selected-${item.id}`}
                      className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          item.type === 'employee' ? 'bg-green-500' :
                          item.type === 'aircraft' ? 'bg-amber-500' :
                          'bg-purple-500'
                        }`} />
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{item.subtitle}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:text-red-500"
                        onClick={() => toggleSelected(item)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {isSearching ? (
              <div className="h-40 flex items-center justify-center">
                <div className="h-8 w-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium mb-2">Search Results</h3>
                <div className="border dark:border-gray-700 rounded-lg divide-y dark:divide-gray-700 max-h-[300px] overflow-y-auto">
                  {searchResults
                    .filter(item => !selectedItems.some(selected => selected.id === item.id))
                    .map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleItemClick(item)}
                      >
                        <div>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${
                              item.type === 'employee' ? 'bg-green-500' :
                              item.type === 'aircraft' ? 'bg-amber-500' :
                              'bg-purple-500'
                            }`} />
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded ml-2">
                              {item.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 ml-4 mt-1">
                            {item.subtitle}
                            {item.type === 'employee' && item.metadata.team && (
                              <span className="ml-2">• Team: {item.metadata.team}</span>
                            )}
                            {item.type === 'aircraft' && item.metadata.customer && (
                              <span className="ml-2">• {item.metadata.customer}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No results found
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Modal */}
      <SetDateModal 
        isOpen={isDateModalOpen} 
        onClose={() => setIsDateModalOpen(false)} 
      />
    </header>
  );
};
