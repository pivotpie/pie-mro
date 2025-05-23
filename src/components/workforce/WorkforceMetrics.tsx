
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Award, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WorkforceMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    availableEmployees: 0,
    activeCertifications: 0,
    scheduledVisits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Total active employees
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Available employees (those with AV status in employee_supports)
      const { data: availableEmployeesData, error: availableError } = await supabase
        .from('employee_supports')
        .select(`
          employee_id,
          support_codes!inner(support_code)
        `)
        .eq('support_codes.support_code', 'AV');

      if (availableError) throw availableError;

      // Active certifications (not expired)
      const { count: activeCertifications } = await supabase
        .from('certifications')
        .select('*', { count: 'exact', head: true })
        .gte('expiry_date', new Date().toISOString().split('T')[0]);

      // Scheduled maintenance visits
      const { count: scheduledVisits } = await supabase
        .from('maintenance_visits')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'in-progress']);

      setMetrics({
        totalEmployees: totalEmployees || 0,
        availableEmployees: availableEmployeesData?.length || 0,
        activeCertifications: activeCertifications || 0,
        scheduledVisits: scheduledVisits || 0
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      title: "Total Employees",
      value: metrics.totalEmployees,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Available Employees",
      value: metrics.availableEmployees,
      icon: Calendar,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Active Certifications",
      value: metrics.activeCertifications,
      icon: Award,
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Scheduled Visits",
      value: metrics.scheduledVisits,
      icon: Plane,
      color: "text-orange-600 dark:text-orange-400"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-300 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default WorkforceMetrics;
