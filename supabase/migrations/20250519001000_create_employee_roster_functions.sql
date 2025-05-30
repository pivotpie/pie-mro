
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
