
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: number;
  name: string;
  e_number: number;
  job_title_id: number | null;
  team_id: number | null;
  [key: string]: any;
}

interface User {
  id: number;
  username: string;
  employee: Employee | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session in localStorage
    const checkUserSession = () => {
      const storedUser = localStorage.getItem('mro_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('mro_user');
        }
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    
    try {
      console.log(`Attempting login with username: ${username}, password length: ${password.length}`);
      
      // First, let's check what users are actually in the database (for debugging)
      const { data: allUsers, error: usersError } = await supabase
        .from('user')
        .select('id, user_name, password');
      
      console.log('All users in database:', allUsers, usersError);
      
      // Now, perform the actual login query
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('user_name', username)
        .eq('password', password);
      
      console.log('Login query result:', data, error);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Check if any user was found
      if (data && data.length > 0) {
        // Get the first matching user
        const userData = data[0];
        console.log('User found:', userData);
        
        // Get the employee information based on the username
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('user', username)
          .maybeSingle();
        
        console.log('Employee data:', employeeData, employeeError);
        
        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('Employee fetch error:', employeeError);
          throw employeeError;
        }
        
        const userSessionData = {
          id: userData.id,
          username: userData.user_name,
          employee: employeeData || null
        };
        
        // Store user session in localStorage
        localStorage.setItem('mro_user', JSON.stringify(userSessionData));
        setUser(userSessionData);
        console.log('Login successful, user data stored:', userSessionData);
      } else {
        console.error('No matching user found');
        throw new Error('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('mro_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
