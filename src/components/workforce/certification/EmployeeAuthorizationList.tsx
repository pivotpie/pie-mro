import { useState, useEffect, useMemo } from 'react';
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
import { SortableTable } from '@/components/ui/sortable-table';
import { toast } from 'sonner';
import { Edit, Check, X, Plus, Search, Filter } from 'lucide-react';

interface EmployeeAuthorization {
  id: number;
  employee_id: number;
  aircraft_model_id: number;
  authorization_type_id: number;
  engine_model_id?: number;
  authorization_basis: string;
  authorization_category?: string;
  certificate_number?: string;
  issued_on?: string;
  expiry_date?: string;
  reissued_on?: string;
  is_active: boolean;
  kept: boolean;
  suspended: boolean;
  suspended_on?: string;
  suspension_reason?: string;
  limitation?: string;
  remarks?: string;
  pages?: number;
  gcaa_issued_flag: boolean;
  gcaa_issued_on?: string;
  gcaa_certificate_number?: string;
  gcaa_remarks?: string;
  easa_issued_flag: boolean;
  easa_issued_on?: string;
  easa_certificate_number?: string;
  easa_remarks?: string;
  faa_issued_flag: boolean;
  faa_issued_on?: string;
  faa_certificate_number?: string;
  faa_remarks?: string;
  icao_issued_flag: boolean;
  icao_issued_on?: string;
  icao_certificate_number?: string;
  icao_remarks?: string;
  p7_issued_flag: boolean;
  p7_issued_on?: string;
  p7_certificate_number?: string;
  p7_remarks?: string;
  manufacturer_issued_flag: boolean;
  manufacturer_issued_on?: string;
  manufacturer_certificate_number?: string;
  manufacturer_remarks?: string;
  other_issued_flag: boolean;
  other_issued_on?: string;
  other_certificate_number?: string;
  other_authority_name?: string;
  other_remarks?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  employee_name?: string;
  aircraft_model_name?: string;
  authorization_type_name?: string;
  engine_model_name?: string;
}

interface LookupData {
  employees: Array<{ id: number; name: string; e_number: number }>;
  aircraftModels: Array<{ id: number; model_name: string; model_code: string }>;
  authorizationTypes: Array<{ id: number; name: string }>;
  engineModels: Array<{ id: number; model_code: string; manufacturer: string }>;
}

export const EmployeeAuthorizationList = () => {
  const [authorizations, setAuthorizations] = useState<EmployeeAuthorization[]>([]);
  const [filteredData, setFilteredData] = useState<EmployeeAuthorization[]>([]);
  const [lookupData, setLookupData] = useState<LookupData>({
    employees: [],
    aircraftModels: [],
    authorizationTypes: [],
    engineModels: []
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<EmployeeAuthorization>>({});
  const [loading, setLoading] = useState(true);
  const [flexibleSearchTerm, setFlexibleSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [authorizations, flexibleSearchTerm, columnFilters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch authorizations with all joined data
      const { data: authData, error: authError } = await supabase
        .from('employee_authorizations')
        .select(`
          *,
          employees!inner(id, name, e_number),
          aircraft_models!inner(id, model_name, model_code),
          authorization_types!inner(id, name),
          engine_models(id, model_code, manufacturer)
        `)
        .order('id', { ascending: false });

      if (authError) throw authError;

      // Transform data to include lookup values
      const transformedData = authData?.map(auth => ({
        ...auth,
        employee_name: auth.employees?.name,
        aircraft_model_name: `${auth.aircraft_models?.model_code} - ${auth.aircraft_models?.model_name}`,
        authorization_type_name: auth.authorization_types?.name,
        engine_model_name: auth.engine_models ? `${auth.engine_models.manufacturer} ${auth.engine_models.model_code}` : undefined
      })) || [];

      setAuthorizations(transformedData);

      // Fetch lookup data for dropdowns
      const [employeesRes, aircraftModelsRes, authTypesRes, engineModelsRes] = await Promise.all([
        supabase.from('employees').select('id, name, e_number').eq('is_active', true).order('name'),
        supabase.from('aircraft_models').select('id, model_name, model_code').order('model_name'),
        supabase.from('authorization_types').select('id, name').order('name'),
        supabase.from('engine_models').select('id, model_code, manufacturer').order('manufacturer, model_code')
      ]);

      setLookupData({
        employees: employeesRes.data || [],
        aircraftModels: aircraftModelsRes.data || [],
        authorizationTypes: authTypesRes.data || [],
        engineModels: engineModelsRes.data || []
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch authorization data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...authorizations];

    // Apply flexible search with enhanced column-specific and boolean support
    if (flexibleSearchTerm.trim()) {
      const searchTerms = flexibleSearchTerm.split(',').map(term => term.trim()).filter(term => term);
      
      filtered = filtered.filter(auth => {
        return searchTerms.every(term => {
          // Check for column-specific search (column=value format)
          const columnSearchMatch = term.match(/^(.+?)=(.+)$/);
          if (columnSearchMatch) {
            const [, columnName, searchValue] = columnSearchMatch;
            const normalizedColumnName = columnName.trim().toLowerCase();
            const normalizedSearchValue = searchValue.trim().toLowerCase();
            
            // Map common column names to actual field names
            const columnMappings: Record<string, keyof EmployeeAuthorization> = {
              'employee': 'employee_name',
              'employee name': 'employee_name',
              'aircraft': 'aircraft_model_name',
              'aircraft model': 'aircraft_model_name',
              'authorization type': 'authorization_type_name',
              'type': 'authorization_type_name',
              'engine': 'engine_model_name',
              'engine model': 'engine_model_name',
              'basis': 'authorization_basis',
              'authorization basis': 'authorization_basis',
              'category': 'authorization_category',
              'certificate': 'certificate_number',
              'certificate number': 'certificate_number',
              'issued': 'issued_on',
              'issued date': 'issued_on',
              'expiry': 'expiry_date',
              'expiry date': 'expiry_date',
              'reissued': 'reissued_on',
              'active': 'is_active',
              'kept': 'kept',
              'suspended': 'suspended',
              'limitation': 'limitation',
              'remarks': 'remarks',
              'pages': 'pages',
              'gcaa issued': 'gcaa_issued_flag',
              'gcaa': 'gcaa_issued_flag',
              'easa issued': 'easa_issued_flag',
              'easa': 'easa_issued_flag',
              'faa issued': 'faa_issued_flag',
              'faa': 'faa_issued_flag',
              'icao issued': 'icao_issued_flag',
              'icao': 'icao_issued_flag',
              'p7 issued': 'p7_issued_flag',
              'p7': 'p7_issued_flag',
              'manufacturer issued': 'manufacturer_issued_flag',
              'manufacturer': 'manufacturer_issued_flag',
              'other issued': 'other_issued_flag',
              'other': 'other_issued_flag'
            };
            
            const actualColumnName = columnMappings[normalizedColumnName] || normalizedColumnName;
            const value = auth[actualColumnName as keyof EmployeeAuthorization];
            
            if (typeof value === 'boolean') {
              // Handle boolean values - support yes/no, true/false, 1/0
              const booleanValue = normalizedSearchValue === 'yes' || 
                                 normalizedSearchValue === 'true' || 
                                 normalizedSearchValue === '1';
              return value === booleanValue;
            } else if (typeof value === 'string') {
              return value.toLowerCase().includes(normalizedSearchValue);
            } else if (typeof value === 'number') {
              return String(value).includes(normalizedSearchValue);
            } else if (value === null || value === undefined) {
              return normalizedSearchValue === 'null' || normalizedSearchValue === 'empty' || normalizedSearchValue === '';
            }
            
            return String(value).toLowerCase().includes(normalizedSearchValue);
          }
          
          // Fall back to general search across all fields
          const termLower = term.toLowerCase();
          return (
            auth.employee_name?.toLowerCase().includes(termLower) ||
            auth.aircraft_model_name?.toLowerCase().includes(termLower) ||
            auth.authorization_type_name?.toLowerCase().includes(termLower) ||
            auth.engine_model_name?.toLowerCase().includes(termLower) ||
            auth.authorization_basis?.toLowerCase().includes(termLower) ||
            auth.authorization_category?.toLowerCase().includes(termLower) ||
            auth.certificate_number?.toLowerCase().includes(termLower) ||
            auth.gcaa_certificate_number?.toLowerCase().includes(termLower) ||
            auth.easa_certificate_number?.toLowerCase().includes(termLower) ||
            auth.faa_certificate_number?.toLowerCase().includes(termLower) ||
            auth.icao_certificate_number?.toLowerCase().includes(termLower) ||
            auth.p7_certificate_number?.toLowerCase().includes(termLower) ||
            auth.manufacturer_certificate_number?.toLowerCase().includes(termLower) ||
            auth.other_certificate_number?.toLowerCase().includes(termLower) ||
            auth.limitation?.toLowerCase().includes(termLower) ||
            auth.remarks?.toLowerCase().includes(termLower) ||
            auth.gcaa_remarks?.toLowerCase().includes(termLower) ||
            auth.easa_remarks?.toLowerCase().includes(termLower) ||
            auth.faa_remarks?.toLowerCase().includes(termLower) ||
            auth.icao_remarks?.toLowerCase().includes(termLower) ||
            auth.p7_remarks?.toLowerCase().includes(termLower) ||
            auth.manufacturer_remarks?.toLowerCase().includes(termLower) ||
            auth.other_remarks?.toLowerCase().includes(termLower) ||
            auth.suspension_reason?.toLowerCase().includes(termLower) ||
            auth.other_authority_name?.toLowerCase().includes(termLower) ||
            String(auth.pages || '').includes(termLower) ||
            // Boolean fields searchable as text
            (auth.is_active && (termLower.includes('active') || termLower.includes('yes'))) ||
            (!auth.is_active && (termLower.includes('inactive') || termLower.includes('no'))) ||
            (auth.suspended && termLower.includes('suspended')) ||
            (auth.kept && termLower.includes('kept')) ||
            (auth.gcaa_issued_flag && termLower.includes('gcaa')) ||
            (auth.easa_issued_flag && termLower.includes('easa')) ||
            (auth.faa_issued_flag && termLower.includes('faa')) ||
            (auth.icao_issued_flag && termLower.includes('icao')) ||
            (auth.p7_issued_flag && termLower.includes('p7')) ||
            (auth.manufacturer_issued_flag && termLower.includes('manufacturer')) ||
            (auth.other_issued_flag && termLower.includes('other'))
          );
        });
      });
    }

    // Apply column filters - ensure all columns are supported
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(auth => {
          const value = auth[column as keyof EmployeeAuthorization];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(filterValue.toLowerCase());
          }
          if (typeof value === 'boolean') {
            const boolFilterValue = filterValue.toLowerCase();
            if (boolFilterValue === 'true' || boolFilterValue === 'yes') {
              return value === true;
            } else if (boolFilterValue === 'false' || boolFilterValue === 'no') {
              return value === false;
            }
            return false;
          }
          if (typeof value === 'number') {
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
          }
          if (value === null || value === undefined) {
            return filterValue.toLowerCase() === 'null' || filterValue.toLowerCase() === 'empty';
          }
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    setFilteredData(filtered);
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearFilters = () => {
    setColumnFilters({});
    setFlexibleSearchTerm('');
  };

  const getUniqueColumnValues = (column: keyof EmployeeAuthorization) => {
    const values = authorizations
      .map(auth => auth[column])
      .filter((value, index, self) => value !== null && value !== undefined && self.indexOf(value) === index)
      .sort();
    return values.map(String);
  };

  const handleEdit = (authorization: EmployeeAuthorization) => {
    setEditingId(authorization.id);
    setEditingData({ ...authorization });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('employee_authorizations')
        .update({
          ...editingData,
          updated_at: new Date().toISOString(),
          updated_by: 'user' // You can replace this with actual user info
        })
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
      issued_on: new Date().toISOString().split('T')[0],
      is_active: true,
      kept: true,
      suspended: false,
      gcaa_issued_flag: false,
      easa_issued_flag: false,
      faa_issued_flag: false,
      icao_issued_flag: false,
      p7_issued_flag: false,
      manufacturer_issued_flag: false,
      other_issued_flag: false
    };
    
    setAuthorizations([newAuth as EmployeeAuthorization, ...authorizations]);
    setEditingId(0);
    setEditingData(newAuth);
  };

  const handleCreate = async () => {
    try {
      if (!editingData.employee_id || !editingData.aircraft_model_id || !editingData.authorization_type_id || !editingData.authorization_basis) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create clean insert data with only database fields
      const insertData = {
        employee_id: editingData.employee_id,
        aircraft_model_id: editingData.aircraft_model_id,
        authorization_type_id: editingData.authorization_type_id,
        engine_model_id: editingData.engine_model_id,
        authorization_basis: editingData.authorization_basis,
        authorization_category: editingData.authorization_category,
        certificate_number: editingData.certificate_number,
        issued_on: editingData.issued_on,
        expiry_date: editingData.expiry_date,
        reissued_on: editingData.reissued_on,
        is_active: editingData.is_active ?? true,
        kept: editingData.kept ?? true,
        suspended: editingData.suspended ?? false,
        suspended_on: editingData.suspended_on,
        suspension_reason: editingData.suspension_reason,
        limitation: editingData.limitation,
        remarks: editingData.remarks,
        pages: editingData.pages,
        gcaa_issued_flag: editingData.gcaa_issued_flag ?? false,
        gcaa_issued_on: editingData.gcaa_issued_on,
        gcaa_certificate_number: editingData.gcaa_certificate_number,
        gcaa_remarks: editingData.gcaa_remarks,
        easa_issued_flag: editingData.easa_issued_flag ?? false,
        easa_issued_on: editingData.easa_issued_on,
        easa_certificate_number: editingData.easa_certificate_number,
        easa_remarks: editingData.easa_remarks,
        faa_issued_flag: editingData.faa_issued_flag ?? false,
        faa_issued_on: editingData.faa_issued_on,
        faa_certificate_number: editingData.faa_certificate_number,
        faa_remarks: editingData.faa_remarks,
        icao_issued_flag: editingData.icao_issued_flag ?? false,
        icao_issued_on: editingData.icao_issued_on,
        icao_certificate_number: editingData.icao_certificate_number,
        icao_remarks: editingData.icao_remarks,
        p7_issued_flag: editingData.p7_issued_flag ?? false,
        p7_issued_on: editingData.p7_issued_on,
        p7_certificate_number: editingData.p7_certificate_number,
        p7_remarks: editingData.p7_remarks,
        manufacturer_issued_flag: editingData.manufacturer_issued_flag ?? false,
        manufacturer_issued_on: editingData.manufacturer_issued_on,
        manufacturer_certificate_number: editingData.manufacturer_certificate_number,
        manufacturer_remarks: editingData.manufacturer_remarks,
        other_issued_flag: editingData.other_issued_flag ?? false,
        other_issued_on: editingData.other_issued_on,
        other_certificate_number: editingData.other_certificate_number,
        other_authority_name: editingData.other_authority_name,
        other_remarks: editingData.other_remarks,
        created_at: new Date().toISOString(),
        created_by: 'user' // You can replace this with actual user info
      };

      const { error } = await supabase
        .from('employee_authorizations')
        .insert(insertData);

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

  const renderEditableCell = (auth: EmployeeAuthorization, column: keyof EmployeeAuthorization, type: 'text' | 'date' | 'select' | 'boolean' | 'number' = 'text') => {
    if (editingId !== auth.id) {
      const value = auth[column];
      if (type === 'boolean') {
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        );
      }
      return value || '—';
    }

    const value = editingData[column];

    switch (type) {
      case 'boolean':
        return (
          <Select 
            value={String(value || false)} 
            onValueChange={(val) => setEditingData({...editingData, [column]: val === 'true'})}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'date':
        return (
          <Input
            type="date"
            value={String(value || '')}
            onChange={(e) => setEditingData({...editingData, [column]: e.target.value})}
            className="w-full"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => setEditingData({...editingData, [column]: parseInt(e.target.value) || undefined})}
            className="w-full"
          />
        );
      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => setEditingData({...editingData, [column]: e.target.value})}
            className="w-full"
          />
        );
    }
  };

  const columns = [
    {
      id: 'employee_name',
      header: 'Employee',
      cell: (auth: EmployeeAuthorization) => (
        editingId === auth.id ? (
          <Select 
            value={editingData.employee_id?.toString() || "0"} 
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
        ) : auth.employee_name
      ),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('employee_name'),
      activeFilters: columnFilters.employee_name ? [columnFilters.employee_name] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('employee_name', value)
    },
    {
      id: 'aircraft_model_name',
      header: 'Aircraft Model',
      cell: (auth: EmployeeAuthorization) => (
        editingId === auth.id ? (
          <Select 
            value={editingData.aircraft_model_id?.toString() || "0"} 
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
        ) : auth.aircraft_model_name
      ),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('aircraft_model_name'),
      activeFilters: columnFilters.aircraft_model_name ? [columnFilters.aircraft_model_name] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('aircraft_model_name', value)
    },
    {
      id: 'authorization_type_name',
      header: 'Authorization Type',
      cell: (auth: EmployeeAuthorization) => (
        editingId === auth.id ? (
          <Select 
            value={editingData.authorization_type_id?.toString() || "0"} 
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
        ) : auth.authorization_type_name
      ),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('authorization_type_name'),
      activeFilters: columnFilters.authorization_type_name ? [columnFilters.authorization_type_name] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('authorization_type_name', value)
    },
    {
      id: 'engine_model_name',
      header: 'Engine Model',
      cell: (auth: EmployeeAuthorization) => (
        editingId === auth.id ? (
          <Select 
            value={editingData.engine_model_id?.toString() || "none"} 
            onValueChange={(value) => setEditingData({...editingData, engine_model_id: value === "none" ? undefined : parseInt(value)})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select engine model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Engine Model</SelectItem>
              {lookupData.engineModels.map(engine => (
                <SelectItem key={engine.id} value={engine.id.toString()}>
                  {engine.manufacturer} {engine.model_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : auth.engine_model_name || '—'
      ),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('engine_model_name'),
      activeFilters: columnFilters.engine_model_name ? [columnFilters.engine_model_name] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('engine_model_name', value)
    },
    {
      id: 'authorization_basis',
      header: 'Authorization Basis',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'authorization_basis'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('authorization_basis'),
      activeFilters: columnFilters.authorization_basis ? [columnFilters.authorization_basis] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('authorization_basis', value)
    },
    {
      id: 'authorization_category',
      header: 'Category',
      cell: (auth: EmployeeAuthorization) => (
        editingId === auth.id ? (
          <Select 
            value={editingData.authorization_category || "none"} 
            onValueChange={(value) => setEditingData({...editingData, authorization_category: value === "none" ? undefined : value})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              <SelectItem value="A">Category A</SelectItem>
              <SelectItem value="B">Category B</SelectItem>
              <SelectItem value="C">Category C</SelectItem>
            </SelectContent>
          </Select>
        ) : auth.authorization_category || '—'
      ),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('authorization_category'),
      activeFilters: columnFilters.authorization_category ? [columnFilters.authorization_category] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('authorization_category', value)
    },
    {
      id: 'certificate_number',
      header: 'Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('certificate_number'),
      activeFilters: columnFilters.certificate_number ? [columnFilters.certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('certificate_number', value)
    },
    {
      id: 'issued_on',
      header: 'Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('issued_on'),
      activeFilters: columnFilters.issued_on ? [columnFilters.issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('issued_on', value)
    },
    {
      id: 'expiry_date',
      header: 'Expiry Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'expiry_date', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('expiry_date'),
      activeFilters: columnFilters.expiry_date ? [columnFilters.expiry_date] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('expiry_date', value)
    },
    {
      id: 'reissued_on',
      header: 'Reissued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'reissued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('reissued_on'),
      activeFilters: columnFilters.reissued_on ? [columnFilters.reissued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('reissued_on', value)
    },
    {
      id: 'is_active',
      header: 'Active',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'is_active', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.is_active ? [columnFilters.is_active] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('is_active', value)
    },
    {
      id: 'kept',
      header: 'Kept',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'kept', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.kept ? [columnFilters.kept] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('kept', value)
    },
    {
      id: 'suspended',
      header: 'Suspended',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'suspended', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.suspended ? [columnFilters.suspended] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('suspended', value)
    },
    {
      id: 'suspended_on',
      header: 'Suspended Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'suspended_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('suspended_on'),
      activeFilters: columnFilters.suspended_on ? [columnFilters.suspended_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('suspended_on', value)
    },
    {
      id: 'suspension_reason',
      header: 'Suspension Reason',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'suspension_reason'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('suspension_reason'),
      activeFilters: columnFilters.suspension_reason ? [columnFilters.suspension_reason] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('suspension_reason', value)
    },
    {
      id: 'limitation',
      header: 'Limitation',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'limitation'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('limitation'),
      activeFilters: columnFilters.limitation ? [columnFilters.limitation] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('limitation', value)
    },
    {
      id: 'remarks',
      header: 'Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('remarks'),
      activeFilters: columnFilters.remarks ? [columnFilters.remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('remarks', value)
    },
    {
      id: 'pages',
      header: 'Pages',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'pages', 'number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('pages'),
      activeFilters: columnFilters.pages ? [columnFilters.pages] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('pages', value)
    },
    // GCAA columns
    {
      id: 'gcaa_issued_flag',
      header: 'GCAA Issued',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'gcaa_issued_flag', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.gcaa_issued_flag ? [columnFilters.gcaa_issued_flag] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('gcaa_issued_flag', value)
    },
    {
      id: 'gcaa_issued_on',
      header: 'GCAA Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'gcaa_issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('gcaa_issued_on'),
      activeFilters: columnFilters.gcaa_issued_on ? [columnFilters.gcaa_issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('gcaa_issued_on', value)
    },
    {
      id: 'gcaa_certificate_number',
      header: 'GCAA Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'gcaa_certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('gcaa_certificate_number'),
      activeFilters: columnFilters.gcaa_certificate_number ? [columnFilters.gcaa_certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('gcaa_certificate_number', value)
    },
    {
      id: 'gcaa_remarks',
      header: 'GCAA Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'gcaa_remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('gcaa_remarks'),
      activeFilters: columnFilters.gcaa_remarks ? [columnFilters.gcaa_remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('gcaa_remarks', value)
    },
    // EASA columns
    {
      id: 'easa_issued_flag',
      header: 'EASA Issued',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'easa_issued_flag', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.easa_issued_flag ? [columnFilters.easa_issued_flag] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('easa_issued_flag', value)
    },
    {
      id: 'easa_issued_on',
      header: 'EASA Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'easa_issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('easa_issued_on'),
      activeFilters: columnFilters.easa_issued_on ? [columnFilters.easa_issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('easa_issued_on', value)
    },
    {
      id: 'easa_certificate_number',
      header: 'EASA Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'easa_certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('easa_certificate_number'),
      activeFilters: columnFilters.easa_certificate_number ? [columnFilters.easa_certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('easa_certificate_number', value)
    },
    {
      id: 'easa_remarks',
      header: 'EASA Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'easa_remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('easa_remarks'),
      activeFilters: columnFilters.easa_remarks ? [columnFilters.easa_remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('easa_remarks', value)
    },
    // FAA columns
    {
      id: 'faa_issued_flag',
      header: 'FAA Issued',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'faa_issued_flag', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.faa_issued_flag ? [columnFilters.faa_issued_flag] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('faa_issued_flag', value)
    },
    {
      id: 'faa_issued_on',
      header: 'FAA Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'faa_issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('faa_issued_on'),
      activeFilters: columnFilters.faa_issued_on ? [columnFilters.faa_issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('faa_issued_on', value)
    },
    {
      id: 'faa_certificate_number',
      header: 'FAA Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'faa_certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('faa_certificate_number'),
      activeFilters: columnFilters.faa_certificate_number ? [columnFilters.faa_certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('faa_certificate_number', value)
    },
    {
      id: 'faa_remarks',
      header: 'FAA Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'faa_remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('faa_remarks'),
      activeFilters: columnFilters.faa_remarks ? [columnFilters.faa_remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('faa_remarks', value)
    },
    // ICAO columns
    {
      id: 'icao_issued_flag',
      header: 'ICAO Issued',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'icao_issued_flag', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.icao_issued_flag ? [columnFilters.icao_issued_flag] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('icao_issued_flag', value)
    },
    {
      id: 'icao_issued_on',
      header: 'ICAO Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'icao_issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('icao_issued_on'),
      activeFilters: columnFilters.icao_issued_on ? [columnFilters.icao_issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('icao_issued_on', value)
    },
    {
      id: 'icao_certificate_number',
      header: 'ICAO Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'icao_certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('icao_certificate_number'),
      activeFilters: columnFilters.icao_certificate_number ? [columnFilters.icao_certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('icao_certificate_number', value)
    },
    {
      id: 'icao_remarks',
      header: 'ICAO Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'icao_remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('icao_remarks'),
      activeFilters: columnFilters.icao_remarks ? [columnFilters.icao_remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('icao_remarks', value)
    },
    // P7 columns
    {
      id: 'p7_issued_flag',
      header: 'P7 Issued',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'p7_issued_flag', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.p7_issued_flag ? [columnFilters.p7_issued_flag] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('p7_issued_flag', value)
    },
    {
      id: 'p7_issued_on',
      header: 'P7 Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'p7_issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('p7_issued_on'),
      activeFilters: columnFilters.p7_issued_on ? [columnFilters.p7_issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('p7_issued_on', value)
    },
    {
      id: 'p7_certificate_number',
      header: 'P7 Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'p7_certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('p7_certificate_number'),
      activeFilters: columnFilters.p7_certificate_number ? [columnFilters.p7_certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('p7_certificate_number', value)
    },
    {
      id: 'p7_remarks',
      header: 'P7 Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'p7_remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('p7_remarks'),
      activeFilters: columnFilters.p7_remarks ? [columnFilters.p7_remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('p7_remarks', value)
    },
    // Manufacturer columns
    {
      id: 'manufacturer_issued_flag',
      header: 'Manufacturer Issued',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'manufacturer_issued_flag', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.manufacturer_issued_flag ? [columnFilters.manufacturer_issued_flag] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('manufacturer_issued_flag', value)
    },
    {
      id: 'manufacturer_issued_on',
      header: 'Manufacturer Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'manufacturer_issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('manufacturer_issued_on'),
      activeFilters: columnFilters.manufacturer_issued_on ? [columnFilters.manufacturer_issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('manufacturer_issued_on', value)
    },
    {
      id: 'manufacturer_certificate_number',
      header: 'Manufacturer Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'manufacturer_certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('manufacturer_certificate_number'),
      activeFilters: columnFilters.manufacturer_certificate_number ? [columnFilters.manufacturer_certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('manufacturer_certificate_number', value)
    },
    {
      id: 'manufacturer_remarks',
      header: 'Manufacturer Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'manufacturer_remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('manufacturer_remarks'),
      activeFilters: columnFilters.manufacturer_remarks ? [columnFilters.manufacturer_remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('manufacturer_remarks', value)
    },
    // Other columns
    {
      id: 'other_issued_flag',
      header: 'Other Issued',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'other_issued_flag', 'boolean'),
      sortable: true,
      hasFilter: true,
      filterValues: ['true', 'false'],
      activeFilters: columnFilters.other_issued_flag ? [columnFilters.other_issued_flag] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('other_issued_flag', value)
    },
    {
      id: 'other_issued_on',
      header: 'Other Issued Date',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'other_issued_on', 'date'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('other_issued_on'),
      activeFilters: columnFilters.other_issued_on ? [columnFilters.other_issued_on] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('other_issued_on', value)
    },
    {
      id: 'other_certificate_number',
      header: 'Other Certificate #',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'other_certificate_number'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('other_certificate_number'),
      activeFilters: columnFilters.other_certificate_number ? [columnFilters.other_certificate_number] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('other_certificate_number', value)
    },
    {
      id: 'other_authority_name',
      header: 'Other Authority',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'other_authority_name'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('other_authority_name'),
      activeFilters: columnFilters.other_authority_name ? [columnFilters.other_authority_name] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('other_authority_name', value)
    },
    {
      id: 'other_remarks',
      header: 'Other Remarks',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'other_remarks'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('other_remarks'),
      activeFilters: columnFilters.other_remarks ? [columnFilters.other_remarks] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('other_remarks', value)
    },
    // Audit columns
    {
      id: 'created_at',
      header: 'Created At',
      cell: (auth: EmployeeAuthorization) => auth.created_at ? new Date(auth.created_at).toLocaleDateString() : '—',
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('created_at'),
      activeFilters: columnFilters.created_at ? [columnFilters.created_at] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('created_at', value)
    },
    {
      id: 'created_by',
      header: 'Created By',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'created_by'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('created_by'),
      activeFilters: columnFilters.created_by ? [columnFilters.created_by] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('created_by', value)
    },
    {
      id: 'updated_at',
      header: 'Updated At',
      cell: (auth: EmployeeAuthorization) => auth.updated_at ? new Date(auth.updated_at).toLocaleDateString() : '—',
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('updated_at'),
      activeFilters: columnFilters.updated_at ? [columnFilters.updated_at] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('updated_at', value)
    },
    {
      id: 'updated_by',
      header: 'Updated By',
      cell: (auth: EmployeeAuthorization) => renderEditableCell(auth, 'updated_by'),
      sortable: true,
      hasFilter: true,
      filterValues: getUniqueColumnValues('updated_by'),
      activeFilters: columnFilters.updated_by ? [columnFilters.updated_by] : [],
      onFilterValueSelect: (value: string) => handleColumnFilter('updated_by', value)
    },
    // Actions column
    {
      id: 'actions',
      header: 'Actions',
      cell: (auth: EmployeeAuthorization) => (
        editingId === auth.id ? (
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
        )
      ),
      sortable: false
    }
  ];

  if (loading) {
    return <div className="p-6">Loading authorization data...</div>;
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Flexible Search Bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search: 'B1, A350' or 'employee=John Doe' or 'active=yes' or 'gcaa issued=yes'"
            value={flexibleSearchTerm}
            onChange={(e) => setFlexibleSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
        <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2 flex-shrink-0">
          <Filter className="h-4 w-4" />
          Clear Filters
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
        Showing {filteredData.length} of {authorizations.length} authorizations
        {Object.keys(columnFilters).length > 0 && (
          <span className="ml-2">
            (Filtered by: {Object.entries(columnFilters).filter(([_, value]) => value).map(([key, _]) => key).join(', ')})
          </span>
        )}
      </div>

      {/* Table with controlled width and single scroll */}
      <div className="flex-1 border rounded-md overflow-hidden">
        <div className="h-full overflow-auto">
          <SortableTable
            data={filteredData}
            columns={columns}
            defaultSortColumn="employee_name"
            className="w-full"
            isLoading={loading}
            emptyMessage="No authorizations found matching your criteria"
          />
        </div>
      </div>
    </div>
  );
};
