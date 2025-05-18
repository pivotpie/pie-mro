import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, X, Check } from "lucide-react";

export const UniversalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Mock search functionality
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    
    // Parse the query to demonstrate the universal search capability
    const queryTerms = query.toLowerCase().split(",").map(term => term.trim());
    
    // Mock results based on query terms
    const mockResults = [];
    
    if (queryTerms.some(term => term.includes("b1") || term.includes("license"))) {
      mockResults.push({ id: 1, type: "employee", name: "James Wilson", role: "B1 Engineer", certifications: ["A320", "B777"] });
      mockResults.push({ id: 2, type: "employee", name: "Sarah Johnson", role: "B1 Engineer", certifications: ["B777", "B787"] });
    }
    
    if (queryTerms.some(term => term.includes("a350") || term.includes("a320"))) {
      mockResults.push({ id: 3, type: "aircraft", name: "Airbus A350", status: "Available", location: "Hangar 2A" });
      mockResults.push({ id: 4, type: "certification", name: "A350 Type Rating", holders: 12, expiringCount: 3 });
    }
    
    if (queryTerms.some(term => term.includes("trent") || term.includes("engine"))) {
      mockResults.push({ id: 5, type: "engine", name: "Trent 1000", aircraft: "Boeing 787", specialists: 8 });
      mockResults.push({ id: 6, type: "certification", name: "Trent 1000 Specialist", holders: 6, expiringCount: 1 });
    }

    if (queryTerms.some(term => term.includes("team") || term.includes("alpha"))) {
      mockResults.push({ id: 7, type: "team", name: "Team Alpha", members: 12, lead: "James Wilson" });
    }
    
    setSearchResults(mockResults);
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
    // Keep selected items at the top
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <>
      <div className="relative mb-6">
        <div className="flex items-center bg-white border rounded-lg shadow-sm">
          <input
            type="text"
            placeholder="Universal search (click to open advanced search)"
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="Search by skills, aircraft types, certifications (e.g. B1, A350, Trent 1000)"
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
                      className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200"
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          item.type === 'employee' ? 'bg-green-500' :
                          item.type === 'aircraft' ? 'bg-amber-500' :
                          item.type === 'certification' ? 'bg-purple-500' :
                          item.type === 'engine' ? 'bg-red-500' :
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
            {searchResults.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium mb-2">Search Results</h3>
                <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                  {searchResults
                    .filter(item => !selectedItems.some(selected => selected.id === item.id))
                    .map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleSelected(item)}
                      >
                        <div>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${
                              item.type === 'employee' ? 'bg-green-500' :
                              item.type === 'aircraft' ? 'bg-amber-500' :
                              item.type === 'certification' ? 'bg-purple-500' :
                              item.type === 'engine' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} />
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded ml-2">
                              {item.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 ml-4 mt-1">
                            {item.type === 'employee' && (
                              <>{item.role} • Certifications: {item.certifications.join(', ')}</>
                            )}
                            {item.type === 'aircraft' && (
                              <>{item.status} • {item.location}</>
                            )}
                            {item.type === 'certification' && (
                              <>{item.holders} holders • {item.expiringCount} expiring soon</>
                            )}
                            {item.type === 'engine' && (
                              <>{item.aircraft} • {item.specialists} specialists</>
                            )}
                            {item.type === 'team' && (
                              <>{item.members} members • Lead: {item.lead}</>
                            )}
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
              searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )
            )}

            {!searchQuery && (
              <div className="text-center py-8 text-gray-500">
                Start typing to search across employees, aircraft, certifications and more
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={clearFilter}
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
