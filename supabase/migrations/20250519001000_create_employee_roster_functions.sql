
-- Create function to retrieve employee roster data
CREATE OR REPLACE FUNCTION public.get_employee_roster()
RETURNS TABLE (
    id bigint,
    employee_id bigint,
    date date,
    status_code varchar(1),
    notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function returns all roster data with no limits
    -- Set a more generous timeout to handle large result sets
    SET LOCAL statement_timeout = '120s';
    
    RETURN QUERY
    SELECT 
        ra.id,
        ra.employee_id,
        dr.actual_date as date,
        rc.roster_code as status_code,
        null::text as notes
    FROM 
        public.roster_assignments ra
    JOIN
        public.date_references dr ON ra.date_id = dr.id
    JOIN
        public.roster_codes rc ON ra.roster_id = rc.id
    ORDER BY ra.employee_id, dr.actual_date;
    -- No LIMIT clause to ensure all records are returned
END;
$$;

-- Create policy for the function
GRANT EXECUTE ON FUNCTION public.get_employee_roster() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_roster() TO anon;

-- Fix the generate_employee_assignments function
CREATE OR REPLACE FUNCTION public.generate_employee_assignments()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    result_text text := '';
    emp_record record;
    assignment_record record;
BEGIN
    result_text := 'Employee Assignment Report' || E'\n';
    result_text := result_text || '=========================' || E'\n\n';
    
    -- Loop through employees with their job titles (which contain trade information)
    FOR emp_record IN 
        SELECT 
            e.id,
            e.e_number,
            e.name,
            jt.job_code as trade_code,
            jt.job_description as trade_name
        FROM employees e
        LEFT JOIN job_titles jt ON e.job_title_id = jt.id
        WHERE e.is_active = true
        ORDER BY e.e_number
    LOOP
        result_text := result_text || 'Employee: ' || emp_record.name || 
                      ' (E#' || emp_record.e_number || ')' || E'\n';
        result_text := result_text || 'Trade: ' || COALESCE(emp_record.trade_name, 'Not Assigned') || 
                      ' (' || COALESCE(emp_record.trade_code, 'N/A') || ')' || E'\n';
        
        -- Get core assignments
        FOR assignment_record IN
            SELECT 
                cc.core_code,
                ec.assignment_date
            FROM employee_cores ec
            JOIN core_codes cc ON ec.core_id = cc.id
            WHERE ec.employee_id = emp_record.id
            ORDER BY ec.assignment_date DESC
        LOOP
            result_text := result_text || 'Core Assignment: ' || assignment_record.core_code;
            IF assignment_record.assignment_date IS NOT NULL THEN
                result_text := result_text || ' (Assigned: ' || assignment_record.assignment_date || ')';
            END IF;
            result_text := result_text || E'\n';
        END LOOP;
        
        -- Get support assignments
        FOR assignment_record IN
            SELECT 
                sc.support_code,
                es.assignment_date
            FROM employee_supports es
            JOIN support_codes sc ON es.support_id = sc.id
            WHERE es.employee_id = emp_record.id
            ORDER BY es.assignment_date DESC
        LOOP
            result_text := result_text || 'Support Assignment: ' || assignment_record.support_code;
            IF assignment_record.assignment_date IS NOT NULL THEN
                result_text := result_text || ' (Assigned: ' || assignment_record.assignment_date || ')';
            END IF;
            result_text := result_text || E'\n';
        END LOOP;
        
        result_text := result_text || E'\n';
    END LOOP;
    
    RETURN result_text;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_employee_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_employee_assignments() TO anon;
