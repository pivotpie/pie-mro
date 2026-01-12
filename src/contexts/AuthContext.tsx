
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
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
  isAuthenticated: boolean;
}

interface AuthResponse {
  id: number;
  user_name: string;
  authenticated: boolean;
}

// Define the RPC parameters type for authenticate_user
interface AuthParams {
  p_username: string;
  p_password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing user session in localStorage
    const checkUserSession = () => {
      const storedUser = localStorage.getItem('mro_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log("User session restored from localStorage:", parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('mro_user');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    
    try {
      console.log(`Attempting login for user: ${username}`);
      
      // Use the authenticate_user function through RPC with proper type handling
      const { data, error } = await supabase
        .rpc('authenticate_user', { 
          p_username: username, 
          p_password: password 
        });
      
      console.log('Authentication result:', data, error);
      
      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error('Authentication failed. Please try again.');
      }
      
      // Properly handle the response with type safety
      const authData = data as AuthResponse[];
      
      if (!authData || authData.length === 0) {
        // Log all users to help diagnose issues (for development only)
        const { data: allUsers, error: allUsersError } = await supabase
          .from('user')
          .select('*');
          
        console.log('All users in database:', allUsers, allUsersError);
        
        // Fallback to direct table query as a backup approach
        const { data: directData, error: directError } = await supabase
          .from('user')
          .select('*')
          .eq('user_name', username)
          .eq('password', password);
          
        console.log('Direct query result:', directData, directError);
        
        if (directError) {
          console.error('Direct query error:', directError);
          throw new Error('Authentication failed. Please try again.');
        }
        
        if (!directData || directData.length === 0) {
          console.error('No matching user found');
          throw new Error('Invalid username or password');
        }
        
        // Use the direct query result
        const userData = directData[0];
        
        // Get the employee information based on the username
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('user', username)
          .maybeSingle();
        
        console.log('Employee data:', employeeData, employeeError);
        
        const userSessionData = {
          id: userData.id,
          username: userData.user_name,
          employee: employeeData || null
        };
        
        // Store user session in localStorage
        localStorage.setItem('mro_user', JSON.stringify(userSessionData));
        setUser(userSessionData);
        setIsAuthenticated(true);
        console.log('Login successful via direct query:', userSessionData);
        
      } else {
        // Use the RPC result - we need the first item from the array
        const userData = authData[0];
        
        // Get the employee information based on the username
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('user', username)
          .maybeSingle();
        
        console.log('Employee data:', employeeData, employeeError);
        
        const userSessionData = {
          id: userData.id,
          username: userData.user_name,
          employee: employeeData || null
        };
        
        // Store user session in localStorage
        localStorage.setItem('mro_user', JSON.stringify(userSessionData));
        setUser(userSessionData);
        setIsAuthenticated(true);
        console.log('Login successful via RPC:', userSessionData);
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('mro_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
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
