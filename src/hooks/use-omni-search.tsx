import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SearchResultType = 'employee' | 'aircraft' | 'certification' | 'training';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  metadata?: any;
  originalData: any;
}

export const useOmniSearch = (query: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true; // Flag to track if this effect is still current

    const fetchResults = async () => {
      if (!query || query.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const searchTerm = `%${query}%`;
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      try {
        // Build employee query dynamically with current date filtering
        let employeeQuery = supabase
          .from('employees')
          .select(`
            id,
            name,
            e_number,
            job_titles(job_description)
          `);

        // Search by name or by exact e_number if query is numeric
        if (!isNaN(Number(query)) && query.trim() !== '') {
          employeeQuery = employeeQuery.or(`name.ilike.${searchTerm},e_number.eq.${query}`);
        } else {
          employeeQuery = employeeQuery.ilike('name', searchTerm);
        }

        const [empRes, aircraftRes, certRes, trainRes] = await Promise.all([
          // Employees with basic info
          employeeQuery.limit(5),

          // Aircraft - fetch all matching, then filter maintenance separately
          supabase
            .from('aircraft')
            .select(`
              id,
              registration,
              aircraft_name,
              aircraft_types(type_name)
            `)
            .or(`registration.ilike.${searchTerm},aircraft_name.ilike.${searchTerm}`)
            .limit(5),

          // Certifications - fetch all matching
          supabase
            .from('certification_codes')
            .select(`
              id,
              certification_code,
              certification_description
            `)
            .or(`certification_code.ilike.${searchTerm},certification_description.ilike.${searchTerm}`)
            .limit(5),

          // Training Sessions - upcoming or in progress
          supabase
            .from('training_sessions')
            .select('id, session_name, session_code, start_date, end_date')
            .or(`session_name.ilike.${searchTerm},session_code.ilike.${searchTerm}`)
            .gte('end_date', today)
            .limit(5)
        ]);

        // Log any errors from queries
        if (empRes.error) console.error('Employee search error:', empRes.error);
        if (aircraftRes.error) console.error('Aircraft search error:', aircraftRes.error);
        if (certRes.error) console.error('Certification search error:', certRes.error);
        if (trainRes.error) console.error('Training search error:', trainRes.error);

        // Only update results if this effect is still current
        if (!isCurrent) return;

        const newResults: SearchResult[] = [];

        // Fetch real-time data for employees
        for (const emp of empRes.data || []) {
          // Fetch today's core and support assignments
          const [coresRes, supportsRes, rosterRes, certsRes] = await Promise.all([
            supabase
              .from('employee_cores')
              .select('core_codes(core_code)')
              .eq('employee_id', emp.id)
              .eq('assignment_date', today)
              .limit(10),

            supabase
              .from('employee_supports')
              .select('support_codes(support_code)')
              .eq('employee_id', emp.id)
              .eq('assignment_date', today)
              .limit(10),

            supabase
              .from('roster_assignments')
              .select(`
                roster_codes(roster_code, description, frontend_name),
                date_references!inner(actual_date)
              `)
              .eq('employee_id', emp.id)
              .eq('date_references.actual_date', today)
              .limit(1),

            supabase
              .from('certifications')
              .select('certification_codes(certification_code)')
              .eq('employee_id', emp.id)
              .gte('expiry_date', today)
              .limit(3)
          ]);

          // Log any errors from employee detail queries
          if (coresRes.error) console.error('Cores query error for', emp.name, ':', coresRes.error);
          if (supportsRes.error) console.error('Supports query error for', emp.name, ':', supportsRes.error);
          if (rosterRes.error) console.error('Roster query error for', emp.name, ':', rosterRes.error);
          if (certsRes.error) console.error('Certifications query error for', emp.name, ':', certsRes.error);

          const cores = coresRes.data?.map(ec => ec.core_codes?.core_code).filter(Boolean) || [];
          const supports = supportsRes.data?.map(es => es.support_codes?.support_code).filter(Boolean) || [];
          const rosterData = rosterRes.data?.[0];
          const rosterFrontendName = rosterData?.roster_codes?.frontend_name;
          const certs = certsRes.data?.map(c => c.certification_codes?.certification_code).filter(Boolean) || [];

          // Debug: Log roster assignment data
          console.log('Roster data for', emp.name, ':', {
            today,
            rawData: rosterRes.data,
            rosterData: rosterData,
            rosterFrontendName: rosterFrontendName
          });

          newResults.push({
            id: `emp-${emp.id}`,
            type: 'employee',
            title: emp.name,
            subtitle: `${emp.job_titles?.job_description || 'Employee'} • #${emp.e_number}`,
            metadata: {
              jobTitle: emp.job_titles?.job_description || 'Employee',
              certifications: certs,
              currentAssignment: rosterFrontendName ? {
                type: rosterFrontendName,
                date: today
              } : null,
              cores: cores,
              supports: supports
            },
            originalData: emp
          });
        }

        // Fetch real-time data for aircraft
        for (const ac of aircraftRes.data || []) {
          // Fetch current maintenance visit for today
          const maintenanceRes = await supabase
            .from('maintenance_visits')
            .select('check_type, visit_number, date_in, date_out, status')
            .eq('aircraft_id', ac.id)
            .lte('date_in', today)
            .gte('date_out', today)
            .limit(1);

          if (maintenanceRes.error) {
            console.error('Error fetching maintenance for', ac.registration, ':', maintenanceRes.error);
          }

          console.log('Maintenance data for', ac.registration, ':', {
            today,
            data: maintenanceRes.data,
            count: maintenanceRes.data?.length || 0
          });

          const currentMaintenance = maintenanceRes.data?.[0];

          newResults.push({
            id: `ac-${ac.id}`,
            type: 'aircraft',
            title: ac.registration || 'Unknown Reg',
            subtitle: `${ac.aircraft_name} • ${ac.aircraft_types?.type_name || ''}`,
            metadata: {
              aircraftType: ac.aircraft_types?.type_name,
              maintenance: currentMaintenance ? {
                type: currentMaintenance.check_type,
                visitNumber: currentMaintenance.visit_number,
                start: currentMaintenance.date_in,
                end: currentMaintenance.date_out,
                status: currentMaintenance.status
              } : null
            },
            originalData: ac
          });
        }

        // Fetch real-time data for certifications
        for (const cert of certRes.data || []) {
          // Fetch currently valid certifications with authorities and employees
          const validCertsRes = await supabase
            .from('certifications')
            .select(`
              authorities(authority_code, authority_name),
              employees!inner(id, name, e_number)
            `)
            .eq('certification_code_id', cert.id)
            .gte('expiry_date', today)
            .limit(10);

          if (validCertsRes.error) {
            console.error('Error fetching certification data for', cert.certification_code, ':', validCertsRes.error);
          }

          console.log('Certification data for', cert.certification_code, ':', {
            rawData: validCertsRes.data,
            count: validCertsRes.data?.length || 0
          });

          // Get unique authorities
          const authoritiesMap = new Map();
          validCertsRes.data?.forEach(c => {
            if (c.authorities) {
              authoritiesMap.set(c.authorities.authority_code, c.authorities.authority_code);
            }
          });
          const authorities = Array.from(authoritiesMap.values());

          // Get top employees (unique by id)
          const employeesMap = new Map();
          validCertsRes.data?.forEach(c => {
            if (c.employees && !employeesMap.has(c.employees.id)) {
              employeesMap.set(c.employees.id, c.employees);
            }
          });
          const topEmployees = Array.from(employeesMap.values()).slice(0, 3);

          console.log('Processed certification data:', {
            code: cert.certification_code,
            authorities,
            topEmployees
          });

          newResults.push({
            id: `cert-${cert.id}`,
            type: 'certification',
            title: cert.certification_code,
            subtitle: cert.certification_description,
            metadata: {
              authorities: authorities,
              topEmployees: topEmployees.map(e => ({
                id: e.id,
                name: e.name,
                eNumber: e.e_number
              }))
            },
            originalData: cert
          });
        }

        trainRes.data?.forEach(train => {
          newResults.push({
            id: `train-${train.id}`,
            type: 'training',
            title: train.session_name,
            subtitle: `${train.session_code} • ${train.start_date} to ${train.end_date}`,
            originalData: train
          });
        });

        setResults(newResults);
      } catch (error) {
        console.error("Omni-search error:", error);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => {
      isCurrent = false; // Mark this effect as stale
      clearTimeout(debounce);
    };
  }, [query]);

  return { results, isLoading };
};
