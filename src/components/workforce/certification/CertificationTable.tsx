
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose 
} from "@/components/ui/dialog";
import { 
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListFilter, X, Search, Download, MoreHorizontal, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CertificationWithDetails {
  id: number;
  employee?: {
    name: string;
    e_number: number;
    mobile_number?: string;
  };
  certification_code?: {
    certification_code: string;
    certification_description: string;
  };
  issued_date: string;
  expiry_date: string;
  validity_status?: {
    status: string;
  };
  authority?: {
    authority_name: string;
  };
}

export const CertificationTable = () => {
  const [certifications, setCertifications] = useState<CertificationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Sorting states
  const [sortField, setSortField] = useState<string>("expiry_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Filtering states
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Detail view state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<CertificationWithDetails | null>(null);

  useEffect(() => {
    fetchCertifications();
  }, [sortField, sortDirection, filters]);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('certifications')
        .select(`
          id,
          issued_date,
          expiry_date,
          employee:employee_id(name, e_number, mobile_number),
          certification_code:certification_code_id(certification_code, certification_description),
          validity_status:validity_status_id(status),
          authority:authority_id(authority_name)
        `);
      
      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value) {
          if (field === 'employee') {
            query = query.filter('employee.name', 'ilike', `%${value}%`);
          } else if (field === 'certification') {
            query = query.filter('certification_code.certification_description', 'ilike', `%${value}%`);
          } else if (field === 'authority') {
            query = query.filter('authority.authority_name', 'ilike', `%${value}%`);
          } else if (field === 'status') {
            const days = parseInt(value);
            if (!isNaN(days)) {
              // Filter based on days until expiry
              const futureDate = new Date();
              futureDate.setDate(futureDate.getDate() + days);
              if (days < 0) {
                // Expired
                query = query.lt('expiry_date', new Date().toISOString().split('T')[0]);
              } else {
                // Will expire in specified days
                query = query.lt('expiry_date', futureDate.toISOString().split('T')[0]);
                query = query.gte('expiry_date', new Date().toISOString().split('T')[0]);
              }
            }
          }
        }
      });
      
      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
      
      const { data, error } = await query.limit(20);
      
      if (error) {
        throw error;
      }

      setCertifications(data || []);
    } catch (error: any) {
      toast.error(`Error loading certifications: ${error.message}`);
      console.error("Error fetching certifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const daysUntilExpiry = (dateString: string) => {
    if (!dateString) return 0;
    
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getExpiryStatus = (dateString: string) => {
    const days = daysUntilExpiry(dateString);
    
    if (days < 0) {
      return { status: "Expired", class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
    } else if (days <= 30) {
      return { status: "Expiring Soon", class: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" };
    } else {
      return { status: "Valid", class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
    }
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };
  
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(filterCertifications().map(cert => cert.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleSelectRow = (id: number, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleExport = () => {
    // Create CSV from selected rows or all rows if none selected
    const dataToExport = selectedIds.length > 0 
      ? filterCertifications().filter(cert => selectedIds.includes(cert.id))
      : filterCertifications();
      
    if (dataToExport.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    // Create CSV content
    const headers = ["Employee", "ID", "Certification", "Authority", "Issued Date", "Expiry Date", "Status", "Contact"];
    let csvContent = headers.join(',') + '\n';
    
    csvContent += dataToExport.map(cert => {
      const expiryStatus = getExpiryStatus(cert.expiry_date);
      return [
        cert.employee?.name || 'Unknown',
        `E${cert.employee?.e_number || 'N/A'}`,
        cert.certification_code?.certification_description || 'Unknown',
        cert.authority?.authority_name || 'Unknown',
        formatDate(cert.issued_date),
        formatDate(cert.expiry_date),
        expiryStatus.status,
        cert.employee?.mobile_number || 'N/A'
      ].map(val => `"${val}"`).join(',');
    }).join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'certifications.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${dataToExport.length} certifications`);
  };
  
  const viewDetails = (certification: CertificationWithDetails) => {
    setSelectedCertification(certification);
    setDetailOpen(true);
  };

  // Filter certifications with search term
  const filterCertifications = () => {
    if (!searchTerm) return certifications;
    
    const term = searchTerm.toLowerCase();
    return certifications.filter(cert => {
      return (
        (cert.employee?.name && cert.employee.name.toLowerCase().includes(term)) || 
        (cert.certification_code?.certification_description && cert.certification_code.certification_description.toLowerCase().includes(term)) ||
        (cert.authority?.authority_name && cert.authority.authority_name.toLowerCase().includes(term)) ||
        (`e${cert.employee?.e_number}`.toLowerCase().includes(term))
      );
    });
  };

  const isAllSelected = selectedIds.length === filterCertifications().length && filterCertifications().length > 0;

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : certifications.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No certifications found
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
                  </label>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search certifications..." 
                    className="pl-8 w-[250px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(Object.keys(filters).length > 0 || searchTerm) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleExport}
                  disabled={filterCertifications().length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ChevronDown className="h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem disabled={selectedIds.length === 0}>
                      Renew Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={selectedIds.length === 0}>
                      Mark as Reviewed
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={selectedIds.length === 0}>
                      Send Reminder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow selectable={false}>
                    <TableHead 
                      sortable
                      sorted={sortField === "certification_code.certification_description" ? sortDirection : null}
                      onSortChange={() => handleSort("certification_code.certification_description")}
                      hasFilter
                      onFilterClick={() => setActiveFilter("certification")}
                    >
                      Certification
                    </TableHead>
                    <TableHead 
                      sortable
                      sorted={sortField === "employee.name" ? sortDirection : null}
                      onSortChange={() => handleSort("employee.name")}
                      hasFilter
                      onFilterClick={() => setActiveFilter("employee")}
                    >
                      Employee
                    </TableHead>
                    <TableHead 
                      sortable
                      sorted={sortField === "issued_date" ? sortDirection : null}
                      onSortChange={() => handleSort("issued_date")}
                    >
                      Issued
                    </TableHead>
                    <TableHead 
                      sortable
                      sorted={sortField === "expiry_date" ? sortDirection : null}
                      onSortChange={() => handleSort("expiry_date")}
                      hasFilter
                      onFilterClick={() => setActiveFilter("status")}
                    >
                      Expires
                    </TableHead>
                    <TableHead 
                      sortable
                      sorted={sortField === "authority.authority_name" ? sortDirection : null}
                      onSortChange={() => handleSort("authority.authority_name")}
                      hasFilter
                      onFilterClick={() => setActiveFilter("authority")}
                    >
                      Authority
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterCertifications().map((cert) => {
                    const expiryStatus = getExpiryStatus(cert.expiry_date);
                    
                    return (
                      <TableRow 
                        key={cert.id}
                        selected={selectedIds.includes(cert.id)}
                        onSelectChange={(selected) => handleSelectRow(cert.id, selected)}
                        selectable
                      >
                        <TableCell>
                          <div className="font-medium">
                            {cert.certification_code?.certification_description || 'Unknown Certification'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cert.certification_code?.certification_code || 'No Code'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{cert.employee?.name || 'Unknown Employee'}</div>
                          <div className="text-xs text-gray-500">E{cert.employee?.e_number || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(cert.issued_date)}</div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(cert.expiry_date)}</div>
                          <div className="text-xs text-gray-500">
                            {daysUntilExpiry(cert.expiry_date) < 0
                              ? `${Math.abs(daysUntilExpiry(cert.expiry_date))} days ago`
                              : daysUntilExpiry(cert.expiry_date) === 0
                              ? 'Today'
                              : `in ${daysUntilExpiry(cert.expiry_date)} days`}
                          </div>
                        </TableCell>
                        <TableCell>
                          {cert.authority?.authority_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-md ${expiryStatus.class}`}>
                            {expiryStatus.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 h-7 px-3"
                            onClick={() => viewDetails(cert)}
                          >
                            {daysUntilExpiry(cert.expiry_date) < 30 ? 'Renew' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
      
      {/* Filter Popover */}
      <Popover open={activeFilter !== null} onOpenChange={(open) => !open && setActiveFilter(null)}>
        <PopoverContent className="w-80" align="start">
          {activeFilter === "employee" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Employee</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search employee name..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.employee || ''}
                  onChange={(e) => handleFilterChange('employee', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "certification" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Certification</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search certification..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.certification || ''}
                  onChange={(e) => handleFilterChange('certification', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "authority" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Authority</h3>
              <div className="flex items-center border rounded-md">
                <Search className="h-4 w-4 ml-2 text-gray-500" />
                <Input 
                  placeholder="Search authority..." 
                  className="border-0 focus-visible:ring-0"
                  value={filters.authority || ''}
                  onChange={(e) => handleFilterChange('authority', e.target.value)}
                />
              </div>
            </div>
          )}
          {activeFilter === "status" && (
            <div className="space-y-2">
              <h3 className="font-medium">Filter by Expiry Status</h3>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={filters.status === "-1"}
                    onCheckedChange={(checked) => {
                      handleFilterChange('status', checked ? '-1' : '');
                    }}
                  />
                  <span>Expired</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={filters.status === "30"}
                    onCheckedChange={(checked) => {
                      handleFilterChange('status', checked ? '30' : '');
                    }}
                  />
                  <span>Expires within 30 days</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={filters.status === "90"}
                    onCheckedChange={(checked) => {
                      handleFilterChange('status', checked ? '90' : '');
                    }}
                  />
                  <span>Expires within 90 days</span>
                </label>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      {/* Detail View Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-4/5 sm:max-w-[80%] h-4/5 max-h-[80vh]">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle>Certification Details</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          <ScrollArea className="h-[calc(100%-4rem)]">
            {selectedCertification && (
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Employee Details</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Employee</h4>
                        <p className="text-lg font-medium">{selectedCertification.employee?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">E{selectedCertification.employee?.e_number || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Contact</h4>
                        <p className="font-medium">{selectedCertification.employee?.mobile_number || 'No contact info'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Certification Details</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Certification</h4>
                        <p className="text-lg font-medium">{selectedCertification.certification_code?.certification_description || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">
                          Code: {selectedCertification.certification_code?.certification_code || 'N/A'}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Authority</h4>
                          <p>{selectedCertification.authority?.authority_name || 'Unknown'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Issued Date</h4>
                          <p>{formatDate(selectedCertification.issued_date)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Expiry Date</h4>
                          <p>{formatDate(selectedCertification.expiry_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Status Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Current Status</h4>
                        {(() => {
                          const status = getExpiryStatus(selectedCertification.expiry_date);
                          return (
                            <div className="flex flex-col gap-2 mt-2">
                              <span className={`px-2 py-1 text-sm rounded-md w-fit ${status.class}`}>
                                {status.status}
                              </span>
                              <p className="text-sm text-gray-500">
                                {daysUntilExpiry(selectedCertification.expiry_date) < 0
                                  ? `Expired ${Math.abs(daysUntilExpiry(selectedCertification.expiry_date))} days ago`
                                  : daysUntilExpiry(selectedCertification.expiry_date) === 0
                                  ? 'Expires today'
                                  : `Expires in ${daysUntilExpiry(selectedCertification.expiry_date)} days`}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Renewal Information</h4>
                        <p className="text-sm text-gray-500 mt-2">
                          {daysUntilExpiry(selectedCertification.expiry_date) < 30 
                            ? "Renewal required soon. Please initiate the renewal process."
                            : "No immediate renewal needed. Check back closer to expiry date."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Certification History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{formatDate(selectedCertification.issued_date)}</TableCell>
                        <TableCell>Certificate Issued</TableCell>
                        <TableCell>System</TableCell>
                        <TableCell>Initial certification</TableCell>
                      </TableRow>
                      {/* Sample history entries */}
                      <TableRow>
                        <TableCell>{new Date(new Date(selectedCertification.issued_date).getTime() + 7*24*60*60*1000).toLocaleDateString()}</TableCell>
                        <TableCell>Record Updated</TableCell>
                        <TableCell>Admin</TableCell>
                        <TableCell>Documentation verified</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline">Print Certificate</Button>
                  <Button variant="outline">Edit Details</Button>
                  <Button 
                    className={
                      daysUntilExpiry(selectedCertification.expiry_date) < 30 
                        ? "bg-amber-600 hover:bg-amber-700" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }
                  >
                    {daysUntilExpiry(selectedCertification.expiry_date) < 30 ? 'Start Renewal Process' : 'View Full Record'}
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
