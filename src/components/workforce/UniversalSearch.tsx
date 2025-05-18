
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, X, Check } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const UniversalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['universalSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const lowerQuery = searchQuery.toLowerCase();

      // Query employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, e_number, job_title_id')
        .or(`name.ilike.%${lowerQuery}%, e_number::text.ilike.%${lowerQuery}%`)
        .limit(5);

      if (employeesError) console.error('Employees search error:', employeesError);

      // Query aircraft
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('id, aircraft_name, registration, aircraft_code')
        .or(`aircraft_name.ilike.%${lowerQuery}%, registration.ilike.%${lowerQuery}%, aircraft_code.ilike.%${lowerQuery}%`)
        .limit(5);

      if (aircraftError) console.error('Aircraft search error:', aircraftError);

      // Query certifications
      const { data: certifications, error: certError } = await supabase
        .from('certifications')
        .select('id, employee_id, aircraft_id, issued_date, expiry_date, employees(name), aircraft(aircraft_name), certification_codes(certification_code, certification_description)')
        .or(`certification_codes.certification_code.ilike.%${lowerQuery}%, certification_codes.certification_description.ilike.%${lowerQuery}%`)
        .limit(5);

      if (certError) console.error('Certifications search error:', certError);

      // Format results
      const formattedResults = [
        ...(employees || []).map((emp: any) => ({
          id: `emp-${emp.id}`,
          type: 'employee',
          name: emp.name,
          subtitle: `Employee #${emp.e_number}`,
          rawData: emp
        })),
        ...(aircraft || []).map((ac: any) => ({
          id: `ac-${ac.id}`,
          type: 'aircraft',
          name: ac.aircraft_name,
          subtitle: ac.registration,
          rawData: ac
        })),
        ...(certifications || []).map((cert: any) => ({
          id: `cert-${cert.id}`,
          type: 'certification',
          name: cert.certification_codes?.certification_description || 'Certification',
          subtitle: `${cert.certification_codes?.certification_code || 'Unknown'} - ${cert.employees?.name || 'Unknown Employee'}`,
          rawData: cert
        }))
      ];

      return formattedResults;
    },
    enabled: isOpen && searchQuery.length >= 2,
  });

  const toggleSelected = (item: any) => {
    if (selectedItems.some(selected => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const clearFilter = () => {
    setSearchQuery("");
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="relative mb-6">
        <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
          <input
            type="text"
            placeholder="Universal search (click to open advanced search)"
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
            onClick={handleOpen}
            readOnly
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 absolute right-2"
            onClick={handleOpen}
          >
            <Search className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                placeholder="Search by name, ID, aircraft, certifications..."
                className="w-full p-3 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              >
                <Search className="h-5 w-5" />
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
                      className="flex items-center justify-between p-2 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          item.type === 'employee' ? 'bg-green-500' :
                          item.type === 'aircraft' ? 'bg-amber-500' :
                          item.type === 'certification' ? 'bg-purple-500' :
                          'bg-blue-500'
                        }`} />
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{item.type}</span>
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
            {searchQuery.length >= 2 && (
              isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                searchResults.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Search Results</h3>
                    <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                      {searchResults
                        .filter(item => !selectedItems.some(selected => selected.id === item.id))
                        .map(item => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => toggleSelected(item)}
                          >
                            <div>
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${
                                  item.type === 'employee' ? 'bg-green-500' :
                                  item.type === 'aircraft' ? 'bg-amber-500' :
                                  item.type === 'certification' ? 'bg-purple-500' :
                                  'bg-blue-500'
                                }`} />
                                <span className="font-medium">{item.name}</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded ml-2">
                                  {item.type}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 ml-4 mt-1">
                                {item.subtitle}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )
              )
            )}

            {searchQuery.length < 2 && (
              <div className="text-center py-8 text-gray-500">
                Start typing to search across employees, aircraft, certifications and more
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                clearFilter();
                setSelectedItems([]);
              }}
              disabled={!searchQuery && selectedItems.length === 0}
            >
              Clear All
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Apply Selection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
