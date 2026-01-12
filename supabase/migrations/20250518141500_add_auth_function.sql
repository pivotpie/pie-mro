
-- Create a function to authenticate users directly
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username text, p_password text)
RETURNS TABLE (
  id bigint,
  user_name text,
  authenticated boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.user_name,
    true as authenticated
  FROM 
    public.user u
  WHERE 
    u.user_name = p_username 
    AND u.password = p_password;
END;
$$;
