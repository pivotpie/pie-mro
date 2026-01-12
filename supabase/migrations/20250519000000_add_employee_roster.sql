
-- Create employee_roster table to store employee schedule data
CREATE TABLE IF NOT EXISTS public.employee_roster (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status_code VARCHAR(1) NOT NULL, -- D (Duty), L (Leave), T (Training), O (Off)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS employee_roster_employee_id_idx ON public.employee_roster(employee_id);
CREATE INDEX IF NOT EXISTS employee_roster_date_idx ON public.employee_roster(date);

-- Sample data for demonstration
INSERT INTO public.employee_roster (employee_id, date, status_code, notes)
SELECT 
    e.id,
    (CURRENT_DATE + (i * INTERVAL '1 day'))::DATE,
    CASE 
        WHEN random() < 0.6 THEN 'D' -- 60% Duty
        WHEN random() < 0.3 THEN 'L' -- 10% Leave (0.6 + 0.1)
        WHEN random() < 0.2 THEN 'T' -- 10% Training
        ELSE 'O' -- 20% Off
    END,
    CASE 
        WHEN random() < 0.2 THEN 'Note for ' || e.name || ' on ' || (CURRENT_DATE + (i * INTERVAL '1 day'))::DATE
        ELSE NULL
    END
FROM 
    public.employees e
CROSS JOIN 
    generate_series(0, 60) AS i
ON CONFLICT (employee_id, date) DO NOTHING;

-- Enable row level security
ALTER TABLE public.employee_roster ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for employee_roster
CREATE POLICY "Employee roster is viewable by authenticated users"
    ON public.employee_roster
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Employee roster is editable by authenticated users"
    ON public.employee_roster
    FOR ALL
    TO authenticated
    USING (true);
