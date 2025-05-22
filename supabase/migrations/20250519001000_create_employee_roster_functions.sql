
-- Create function to retrieve employee roster data
CREATE OR REPLACE FUNCTION public.get_employee_roster()
RETURNS TABLE (
    id uuid,
    employee_id uuid,
    date date,
    status_code varchar(1),
    notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.id,
        er.employee_id::uuid,
        er.date,
        er.status_code,
        er.notes
    FROM 
        public.employee_roster er;
END;
$$;

-- Create policy for the function
GRANT EXECUTE ON FUNCTION public.get_employee_roster() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_roster() TO anon;
