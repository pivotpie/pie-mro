
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
    -- This function is modified to return all rows without limits
    -- In PostgreSQL, there's a default limit of 1000 rows for result sets
    -- Setting a very high limit to ensure we get all records
    SET LOCAL statement_timeout = '60s'; -- Ensure query doesn't timeout
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
    LIMIT 1000000; -- Set a very high limit to effectively get all records
END;
$$;

-- Create policy for the function
GRANT EXECUTE ON FUNCTION public.get_employee_roster() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_roster() TO anon;
