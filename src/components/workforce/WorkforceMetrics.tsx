
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, CalendarDays, GraduationCap, Briefcase, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const WorkforceMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    availableEmployees: 0,
    onLeave: 0,
    inTraining: 0,
    certExpiring: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayFormatted = format(new Date(), 'M-d-yyyy');
        
        // Get total number of employees
        const { count: totalEmployees, error: employeesError } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
          
        if (employeesError) throw employeesError;
        
        // Get employees on leave today (Annual Leave AL or Sick Leave SK)
        const { data: leaveData, error: leaveError } = await supabase
          .from('roster_assignments')
          .select(`
            id,
            employee_id,
            date_references!inner(actual_date),
            roster_codes!inner(roster_code)
          `)
          .eq('date_references.actual_date', today)
          .in('roster_codes.roster_code', ['AL', 'SK']);
          
        if (leaveError) throw leaveError;
        
        // Get employees in training today (TR)
        const { data: trainingData, error: trainingError } = await supabase
          .from('roster_assignments')
          .select(`
            id,
            employee_id,
            date_references!inner(actual_date),
            roster_codes!inner(roster_code)
          `)
          .eq('date_references.actual_date', today)
          .eq('roster_codes.roster_code', 'TR');
          
        if (trainingError) throw trainingError;
        
        // Get employees who are available today (Duty - marked as D)
        const { data: availableData, error: availableError } = await supabase
          .from('roster_assignments')
          .select(`
            id,
            employee_id,
            date_references!inner(actual_date),
            roster_codes!inner(roster_code)
          `)
          .eq('date_references.actual_date', today)
          .eq('roster_codes.roster_code', 'D');
          
        if (availableError) throw availableError;
        
        // Get employees with certifications expiring in next 30 days
        const thirtyDaysLater = format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd');
        const { data: expiringCerts, error: certsError } = await supabase
          .from('certifications')
          .select('id, employee_id, expiry_date')
          .gte('expiry_date', today)
          .lte('expiry_date', thirtyDaysLater);
          
        if (certsError) throw certsError;
        
        // Set all metrics
        setMetrics({
          totalEmployees: totalEmployees || 0,
          availableEmployees: availableData?.length || 0,
          onLeave: leaveData?.length || 0,
          inTraining: trainingData?.length || 0,
          certExpiring: expiringCerts?.length || 0
        });
        
      } catch (error) {
        console.error("Error fetching workforce metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);

  const cards = [
    {
      title: "Total Employees",
      value: metrics.totalEmployees,
      description: "Active Workforce",
      icon: <Users className="h-4 w-4 text-gray-500" />,
      className: "bg-white dark:bg-gray-800",
    },
    {
      title: "Available Today",
      value: metrics.availableEmployees,
      description: "On Duty",
      icon: <Briefcase className="h-4 w-4 text-green-500" />,
      className: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "On Leave",
      value: metrics.onLeave,
      description: "Annual & Sick Leave",
      icon: <CalendarDays className="h-4 w-4 text-red-500" />,
      className: "bg-red-50 dark:bg-red-950",
    },
    {
      title: "In Training",
      value: metrics.inTraining,
      description: "Professional Development",
      icon: <GraduationCap className="h-4 w-4 text-purple-500" />,
      className: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Certifications Expiring",
      value: metrics.certExpiring,
      description: "Next 30 Days",
      icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
      className: "bg-orange-50 dark:bg-orange-950",
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <Card key={index} className={card.className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
