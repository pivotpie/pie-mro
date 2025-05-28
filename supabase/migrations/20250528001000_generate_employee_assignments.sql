
-- Create function to generate synthetic employee core and support assignments
CREATE OR REPLACE FUNCTION public.generate_employee_assignments()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_employee record;
    v_visit record;
    v_date_ref record;
    v_assignment_date date;
    v_end_date date;
    v_total_assignments integer := 0;
    v_core_assignments integer := 0;
    v_support_assignments integer := 0;
    v_random_factor float;
    v_employee_workload integer;
    v_visit_priority integer;
    v_assignment_probability float;
    v_core_code_id integer;
    v_support_code_id integer;
BEGIN
    -- Find the actual end date based on latest "In Progress" maintenance visit
    SELECT MAX(date_out) INTO v_end_date
    FROM maintenance_visits
    WHERE status = 'In Progress';
    
    -- If no "In Progress" visits found, default to June 8, 2025
    IF v_end_date IS NULL THEN
        v_end_date := '2025-06-08'::date;
    END IF;
    
    RAISE NOTICE 'Generating employee assignments from 2025-05-01 to %', v_end_date;
    
    -- Clear existing assignments for the period
    DELETE FROM employee_cores ec
    WHERE ec.assignment_date BETWEEN '2025-05-01' AND v_end_date;
    
    DELETE FROM employee_supports es
    WHERE es.assignment_date BETWEEN '2025-05-01' AND v_end_date;
    
    -- Get core and support code IDs (create if they don't exist)
    INSERT INTO core_codes (core_code) VALUES ('CORE') ON CONFLICT (core_code) DO NOTHING;
    INSERT INTO support_codes (support_code) VALUES ('SUPP') ON CONFLICT (support_code) DO NOTHING;
    
    SELECT id INTO v_core_code_id FROM core_codes WHERE core_code = 'CORE';
    SELECT id INTO v_support_code_id FROM support_codes WHERE support_code = 'SUPP';
    
    -- Process each date in the period
    FOR v_date_ref IN 
        SELECT id, actual_date 
        FROM date_references 
        WHERE actual_date BETWEEN '2025-05-01' AND v_end_date
        ORDER BY actual_date
    LOOP
        v_assignment_date := v_date_ref.actual_date;
        
        -- Process each active maintenance visit for this date
        FOR v_visit IN
            SELECT 
                mv.id,
                mv.visit_number,
                mv.aircraft_id,
                mv.hangar_id,
                mv.check_type,
                mv.status,
                mv.date_in,
                mv.date_out,
                a.registration,
                a.aircraft_name
            FROM maintenance_visits mv
            JOIN aircraft a ON mv.aircraft_id = a.id
            WHERE v_assignment_date BETWEEN mv.date_in AND mv.date_out
            AND mv.status IN ('In Progress', 'Scheduled')
            ORDER BY mv.date_in
        LOOP
            -- Determine visit priority based on check type
            v_visit_priority := CASE 
                WHEN v_visit.check_type LIKE '%C%Check%' THEN 3  -- C-Check highest priority
                WHEN v_visit.check_type LIKE '%B%Check%' THEN 2  -- B-Check medium priority
                ELSE 1  -- A-Check and others lower priority
            END;
            
            -- Process employees who are available for work (not on leave, sick, etc.)
            FOR v_employee IN
                SELECT DISTINCT
                    e.id,
                    e.e_number,
                    e.name,
                    rc.roster_code
                FROM employees e
                JOIN roster_assignments ra ON e.id = ra.employee_id
                JOIN date_references dr ON ra.date_id = dr.id
                JOIN roster_codes rc ON ra.roster_id = rc.id
                WHERE dr.actual_date = v_assignment_date
                AND e.is_active = true
                AND rc.roster_code IN ('D', 'B1', 'DO')  -- Only working employees
                ORDER BY e.e_number
            LOOP
                v_random_factor := random();
                
                -- Calculate employee workload factor (how many assignments they already have)
                SELECT COUNT(*) INTO v_employee_workload
                FROM employee_cores ec
                WHERE ec.employee_id = v_employee.id
                AND ec.assignment_date = v_assignment_date;
                
                -- Add support assignments count
                SELECT COUNT(*) + v_employee_workload INTO v_employee_workload
                FROM employee_supports es
                WHERE es.employee_id = v_employee.id
                AND es.assignment_date = v_assignment_date;
                
                -- Calculate assignment probability based on visit priority and employee workload
                v_assignment_probability := (v_visit_priority * 0.25) - (v_employee_workload * 0.15);
                
                -- Core assignment logic (primary project assignment)
                IF v_random_factor < v_assignment_probability AND v_employee_workload = 0 THEN
                    -- Check if employee has relevant authorizations for this aircraft type
                    IF EXISTS (
                        SELECT 1 FROM employee_authorizations ea
                        JOIN aircraft_models am ON ea.aircraft_model_id = am.id
                        JOIN aircraft a ON am.aircraft_type_id = a.aircraft_type_id
                        WHERE ea.employee_id = v_employee.id
                        AND a.id = v_visit.aircraft_id
                        AND ea.is_active = true
                        AND ea.expiry_date > v_assignment_date
                    ) THEN
                        -- Insert core assignment
                        INSERT INTO employee_cores (employee_id, core_id, assignment_date)
                        VALUES (v_employee.id, v_core_code_id, v_assignment_date)
                        ON CONFLICT (employee_id, assignment_date) DO NOTHING;
                        
                        v_core_assignments := v_core_assignments + 1;
                        v_total_assignments := v_total_assignments + 1;
                    END IF;
                    
                -- Support assignment logic (secondary/helper assignments)
                ELSIF v_random_factor < (v_assignment_probability * 1.5) AND v_employee_workload <= 1 THEN
                    -- Support assignments are more flexible - don't require strict authorization match
                    INSERT INTO employee_supports (employee_id, support_id, assignment_date)
                    VALUES (v_employee.id, v_support_code_id, v_assignment_date)
                    ON CONFLICT (employee_id, assignment_date) DO NOTHING;
                    
                    v_support_assignments := v_support_assignments + 1;
                    v_total_assignments := v_total_assignments + 1;
                END IF;
            END LOOP;
        END LOOP;
        
        -- Log progress every 10 days
        IF EXTRACT(DAY FROM v_assignment_date) % 10 = 0 THEN
            RAISE NOTICE 'Processed assignments for %', v_assignment_date;
        END IF;
    END LOOP;
    
    -- Return summary
    RETURN format(
        'Employee assignments generated successfully! 
        Period: 2025-05-01 to %
        Total assignments: %
        Core assignments: %
        Support assignments: %',
        v_end_date,
        v_total_assignments,
        v_core_assignments,
        v_support_assignments
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_employee_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_employee_assignments() TO anon;

-- Create function to retrieve employee project assignments (cores and supports)
CREATE OR REPLACE FUNCTION public.get_employee_project_assignments(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    employee_id bigint,
    employee_number integer,
    employee_name text,
    assignment_type text,
    assignment_code text,
    assignment_date date,
    project_details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as employee_id,
        e.e_number as employee_number,
        e.name as employee_name,
        'CORE'::text as assignment_type,
        cc.core_code as assignment_code,
        ec.assignment_date,
        'Core project assignment'::text as project_details
    FROM employees e
    JOIN employee_cores ec ON e.id = ec.employee_id
    JOIN core_codes cc ON ec.core_id = cc.id
    WHERE ec.assignment_date = p_date
    AND e.is_active = true
    
    UNION ALL
    
    SELECT 
        e.id as employee_id,
        e.e_number as employee_number,
        e.name as employee_name,
        'SUPPORT'::text as assignment_type,
        sc.support_code as assignment_code,
        es.assignment_date,
        'Support project assignment'::text as project_details
    FROM employees e
    JOIN employee_supports es ON e.id = es.employee_id
    JOIN support_codes sc ON es.support_id = sc.id
    WHERE es.assignment_date = p_date
    AND e.is_active = true
    
    ORDER BY employee_number, assignment_type;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_employee_project_assignments(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_project_assignments(date) TO anon;

-- Create function to get project assignment summary by date range
CREATE OR REPLACE FUNCTION public.get_project_assignment_summary(
    p_start_date date DEFAULT '2025-05-01',
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    assignment_date date,
    total_employees integer,
    core_assignments integer,
    support_assignments integer,
    unassigned_employees integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH daily_stats AS (
        SELECT 
            dr.actual_date,
            COUNT(DISTINCT e.id) as working_employees,
            COUNT(DISTINCT ec.employee_id) as core_assigned,
            COUNT(DISTINCT es.employee_id) as support_assigned
        FROM date_references dr
        CROSS JOIN employees e
        LEFT JOIN roster_assignments ra ON e.id = ra.employee_id AND ra.date_id = dr.id
        LEFT JOIN roster_codes rc ON ra.roster_id = rc.id
        LEFT JOIN employee_cores ec ON e.id = ec.employee_id AND ec.assignment_date = dr.actual_date
        LEFT JOIN employee_supports es ON e.id = es.employee_id AND es.assignment_date = dr.actual_date
        WHERE dr.actual_date BETWEEN p_start_date AND p_end_date
        AND e.is_active = true
        AND (rc.roster_code IN ('D', 'B1', 'DO') OR rc.roster_code IS NULL)
        GROUP BY dr.actual_date
    )
    SELECT 
        ds.actual_date,
        ds.working_employees::integer,
        ds.core_assigned::integer,
        ds.support_assigned::integer,
        (ds.working_employees - GREATEST(ds.core_assigned, ds.support_assigned))::integer
    FROM daily_stats ds
    ORDER BY ds.actual_date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_project_assignment_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_assignment_summary(date, date) TO anon;
