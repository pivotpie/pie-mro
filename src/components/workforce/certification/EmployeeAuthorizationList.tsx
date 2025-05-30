
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Edit, Check, X, Plus, Search, Filter } from 'lucide-react';

interface EmployeeAuthorization {
  id: number;
  employee_id: number;
  aircraft_model_id: number;
  authorization_type_id: number;
  authorization_basis: string;
  authorization_category: string;
  certificate_number: string;
  issued_on: string;
  expiry_date: string;
  is_active: boolean;
  employee_name?: string;
  aircraft_model_name?: string;
  authorization_type_name?: string;
}

interface LookupData {
  employees: Array<{ id: number; name: string; e_number: number }>;
  aircraftModels: Array<{ id: number; model_name: string; model_code: string }>;
  authorizationTypes: Array<{ id: number; name: string }>;
}

export const EmployeeAuthorizationList = () => {
  const [authorizations, setAuthorizations] = useState<EmployeeAuthorization[]>([]);
  const [lookupData, setLookupData] = useState<LookupData>({
    employees: [],
    aircraftModels: [],
    authorizationTypes: []
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<EmployeeAuthorization>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    employee: '',
    aircraftModel: '',
    authorizationType: '',
    isActive: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch authorizations with joined data
      const { data: authData, error: authError } = await supabase
        .from('employee_authorizations')
        .select(`
          *,
          employees!inner(id, name, e_number),
          aircraft_models!inner(id, model_name, model_code),
          authorization_types!inner(id, name)
        `)
        .order('id', { ascending: false });

      if (authError) throw authError;

      // Transform data to include lookup values
      const transformedData = authData?.map(auth => ({
        id: auth.id,
        employee_id: auth.employee_id,
        aircraft_model_id: auth.aircraft_model_id,
        authorization_type_id: auth.authorization_type_id,
        authorization_basis: auth.authorization_basis,
        authorization_category: auth.authorization_category,
        certificate_number: auth.certificate_number,
        issued_on: auth.issued_on,
        expiry_date: auth.expiry_date,
        is_active: auth.is_active,
        employee_name: auth.employees?.name,
        aircraft_model_name: `${auth.aircraft_models?.model_code} - ${auth.aircraft_models?.model_name}`,
        authorization_type_name: auth.authorization_types?.name
      })) || [];

      setAuthorizations(transformedData);

      // Fetch lookup data for dropdowns
      const [employeesRes, aircraftModelsRes, authTypesRes] = await Promise.all([
        supabase.from('employees').select('id, name, e_number').eq('is_active', true).order('name'),
        supabase.from('aircraft_models').select('id, model_name, model_code').order('model_name'),
        supabase.from('authorization_types').select('id, name').order('name')
      ]);

      setLookupData({
        employees: employeesRes.data || [],
        aircraftModels: aircraftModelsRes.data || [],
        authorizationTypes: authTypesRes.data || []
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch authorization data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (authorization: EmployeeAuthorization) => {
    setEditingId(authorization.id);
    setEditingData({
      employee_id: authorization.employee_id,
      aircraft_model_id: authorization.aircraft_model_id,
      authorization_type_id: authorization.authorization_type_id,
      authorization_basis: authorization.authorization_basis,
      authorization_category: authorization.authorization_category,
      certificate_number: authorization.certificate_number,
      issued_on: authorization.issued_on,
      expiry_date: authorization.expiry_date,
      is_active: authorization.is_active
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('employee_authorizations')
        .update(editingData)
        .eq('id', editingId);

      if (error) throw error;

      toast.success('Authorization updated successfully');
      setEditingId(null);
      setEditingData({});
      fetchData();
    } catch (error) {
      console.error('Error updating authorization:', error);
      toast.error('Failed to update authorization');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleAddNew = () => {
    const newAuth = {
      id: 0,
      employee_id: 0,
      aircraft_model_id: 0,
      authorization_type_id: 0,
      authorization_basis: '',
      authorization_category: '',
      certificate_number: '',
      issued_on: new Date().toISOString().split('T')[0],
      expiry_date: '',
      is_active: true,
      employee_name: '',
      aircraft_model_name: '',
      authorization_type_name: ''
    };
    
    setAuthorizations([newAuth, ...authorizations]);
    setEditingId(0);
    setEditingData({
      employee_id: 0,
      aircraft_model_id: 0,
      authorization_type_id: 0,
      authorization_basis: '',
      authorization_category: '',
      certificate_number: '',
      issued_on: new Date().toISOString().split('T')[0],
      expiry_date: '',
      is_active: true
    });
  };

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!editingData.employee_id || !editingData.aircraft_model_id || !editingData.authorization_type_id || !editingData.authorization_basis) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create the insert data with all required fields
      const insertData = {
        employee_id: editingData.employee_id,
        aircraft_model_id: editingData.aircraft_model_id,
        authorization_type_id: editingData.authorization_type_id,
        authorization_basis: editingData.authorization_basis,
        authorization_category: editingData.authorization_category || '',
        certificate_number: editingData.certificate_number || '',
        issued_on: editingData.issued_on || new Date().toISOString().split('T')[0],
        expiry_date: editingData.expiry_date || '',
        is_active: editingData.is_active ?? true
      };

      const { error } = await supabase
        .from('employee_authorizations')
        .insert([insertData]);

      if (error) throw error;

      toast.success('Authorization created successfully');
      setEditingId(null);
      setEditingData({});
      fetchData();
    } catch (error) {
      console.error('Error creating authorization:', error);
      toast.error('Failed to create authorization');
    }
  };

  // Filter data based on search term and filters
  const filteredData = authorizations.filter(auth => {
    const matchesSearch = !searchTerm || 
      auth.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.aircraft_model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.authorization_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.certificate_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmployeeFilter = !filters.employee || auth.employee_id.toString() === filters.employee;
    const matchesAircraftFilter = !filters.aircraftModel || auth.aircraft_model_id.toString() === filters.aircraftModel;
    const matchesAuthTypeFilter = !filters.authorizationType || auth.authorization_type_id.toString() === filters.authorizationType;
    const matchesActiveFilter = filters.isActive === '' || auth.is_active.toString() === filters.isActive;

    return matchesSearch && matchesEmployeeFilter && matchesAircraftFilter && matchesAuthTypeFilter && matchesActiveFilter;
  });

  if (loading) {
    return <div className="p-6">Loading authorization data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search authorizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <Select value={filters.employee} onValueChange={(value) => setFilters({...filters, employee: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Employees</SelectItem>
              {lookupData.employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.aircraftModel} onValueChange={(value) => setFilters({...filters, aircraftModel: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by aircraft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Aircraft</SelectItem>
              {lookupData.aircraftModels.map(model => (
                <SelectItem key={model.id} value={model.id.toString()}>
                  {model.model_code} - {model.model_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.authorizationType} onValueChange={(value) => setFilters({...filters, authorizationType: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {lookupData.authorizationTypes.map(type => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.isActive} onValueChange={(value) => setFilters({...filters, isActive: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Aircraft Model</TableHead>
              <TableHead>Authorization Type</TableHead>
              <TableHead>Basis</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Certificate #</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((auth) => (
              <TableRow key={auth.id}>
                <TableCell>
                  {editingId === auth.id ? (
                    <Select 
                      value={editingData.employee_id?.toString()} 
                      onValueChange={(value) => setEditingData({...editingData, employee_id: parseInt(value)})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookupData.employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name} (#{emp.e_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    auth.employee_name
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Select 
                      value={editingData.aircraft_model_id?.toString()} 
                      onValueChange={(value) => setEditingData({...editingData, aircraft_model_id: parseInt(value)})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select aircraft model" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookupData.aircraftModels.map(model => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            {model.model_code} - {model.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    auth.aircraft_model_name
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Select 
                      value={editingData.authorization_type_id?.toString()} 
                      onValueChange={(value) => setEditingData({...editingData, authorization_type_id: parseInt(value)})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookupData.authorizationTypes.map(type => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    auth.authorization_type_name
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Input
                      value={editingData.authorization_basis || ''}
                      onChange={(e) => setEditingData({...editingData, authorization_basis: e.target.value})}
                      className="w-full"
                    />
                  ) : (
                    auth.authorization_basis
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Select 
                      value={editingData.authorization_category || ''} 
                      onValueChange={(value) => setEditingData({...editingData, authorization_category: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Category A</SelectItem>
                        <SelectItem value="B">Category B</SelectItem>
                        <SelectItem value="C">Category C</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    auth.authorization_category
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Input
                      value={editingData.certificate_number || ''}
                      onChange={(e) => setEditingData({...editingData, certificate_number: e.target.value})}
                      className="w-full"
                    />
                  ) : (
                    auth.certificate_number
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Input
                      type="date"
                      value={editingData.issued_on || ''}
                      onChange={(e) => setEditingData({...editingData, issued_on: e.target.value})}
                      className="w-full"
                    />
                  ) : (
                    auth.issued_on
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Input
                      type="date"
                      value={editingData.expiry_date || ''}
                      onChange={(e) => setEditingData({...editingData, expiry_date: e.target.value})}
                      className="w-full"
                    />
                  ) : (
                    auth.expiry_date
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <Select 
                      value={editingData.is_active?.toString()} 
                      onValueChange={(value) => setEditingData({...editingData, is_active: value === 'true'})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      auth.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {auth.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </TableCell>
                
                <TableCell>
                  {editingId === auth.id ? (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        onClick={auth.id === 0 ? handleCreate : handleSave}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancel}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(auth)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredData.length} of {authorizations.length} authorizations
      </div>
    </div>
  );
};
