
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Clock, User, Briefcase, Award, AlertTriangle, CalendarDays, PlaneTakeoff, PlaneLanding, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type MetricType = {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
};

export default function WorkforceMetrics() {
  const [metrics, setMetrics] = useState<MetricType[]>([
    { title: "Available Employees", value: 0, icon: <User className="h-6 w-6" />, colorClass: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "On Leave", value: 0, icon: <CalendarDays className="h-6 w-6" />, colorClass: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
    { title: "In Training", value: 0, icon: <Award className="h-6 w-6" />, colorClass: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
    { title: "Grounded Aircrafts", value: 0, icon: <PlaneLanding className="h-6 w-6" />, colorClass: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
    { title: "Assigned Aircrafts", value: 0, icon: <PlaneTakeoff className="h-6 w-6" />, colorClass: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    { title: "Pending Assignment", value: 0, icon: <Timer className="h-6 w-6" />, colorClass: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
    { title: "On Time", value: 0, icon: <Clock className="h-6 w-6" />, colorClass: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400", change: 2, changeType: 'increase' },
    { title: "Late Arrivals", value: 0, icon: <AlertTriangle className="h-6 w-6" />, colorClass: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", change: 1, changeType: 'decrease' },
  ]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get today's date for queries
        const today = new Date();
        const todayString = format(today, 'yyyy-MM-dd');

        // Create a copy of metrics to update
        const updatedMetrics = [...metrics];

        // 1. Fetch available employees from "AV" records in employee_supports
        const { data: availableData, error: availableError } = await supabase
          .from('employee_supports')
          .select('id')
          .eq('support_id', 1); // Assuming 1 is the ID for "AV" (Available)
        
        if (!availableError && availableData) {
          // Find the "Available Employees" metric and update it
          const availableIndex = updatedMetrics.findIndex(m => m.title === "Available Employees");
          if (availableIndex !== -1) {
            updatedMetrics[availableIndex].value = availableData.length;
          }
        } else if (availableError) {
          console.error("Error fetching available employees:", availableError);
        }

        // 2. Fetch employees on leave (AL and SK) from roster_assignments
        const currentDate = format(today, 'yyyy-MM-dd');
        
        // Find the date ID for today
        const { data: dateData } = await supabase
          .from('date_references')
          .select('id')
          .eq('actual_date', currentDate)
          .single();
        
        if (dateData?.id) {
          // Get leave counts (AL and SK roster codes)
          const { data: leaveData, error: leaveError } = await supabase
            .from('roster_assignments')
            .select('id')
            .eq('date_id', dateData.id)
            .in('roster_id', [2, 7]); // Assuming 2 is AL and 7 is SK
          
          if (!leaveError && leaveData) {
            const onLeaveIndex = updatedMetrics.findIndex(m => m.title === "On Leave");
            if (onLeaveIndex !== -1) {
              updatedMetrics[onLeaveIndex].value = leaveData.length;
            }
          }

          // 3. Fetch employees in training (TR roster code)
          const { data: trainingData, error: trainingError } = await supabase
            .from('roster_assignments')
            .select('id')
            .eq('date_id', dateData.id)
            .eq('roster_id', 9); // Assuming 9 is TR
          
          if (!trainingError && trainingData) {
            const trainingIndex = updatedMetrics.findIndex(m => m.title === "In Training");
            if (trainingIndex !== -1) {
              updatedMetrics[trainingIndex].value = trainingData.length;
            }
          }
        }

        // 4. Fetch aircraft metrics
        // Grounded Aircrafts (status = "Grounded")
        const { data: groundedData, error: groundedError } = await supabase
          .from('maintenance_visits')
          .select('id')
          .eq('status', 'Grounded');
        
        if (!groundedError && groundedData) {
          const groundedIndex = updatedMetrics.findIndex(m => m.title === "Grounded Aircrafts");
          if (groundedIndex !== -1) {
            updatedMetrics[groundedIndex].value = groundedData.length;
          }
        }

        // Assigned Aircrafts (status = "In Service" or "Assigned")
        const { data: assignedData, error: assignedError } = await supabase
          .from('maintenance_visits')
          .select('id')
          .in('status', ['In Service', 'Assigned']);
        
        if (!assignedError && assignedData) {
          const assignedIndex = updatedMetrics.findIndex(m => m.title === "Assigned Aircrafts");
          if (assignedIndex !== -1) {
            updatedMetrics[assignedIndex].value = assignedData.length;
          }
        }

        // Pending Assignment (status = "Scheduled" or "Pending")
        const { data: pendingData, error: pendingError } = await supabase
          .from('maintenance_visits')
          .select('id')
          .in('status', ['Scheduled', 'Pending']);
        
        if (!pendingError && pendingData) {
          const pendingIndex = updatedMetrics.findIndex(m => m.title === "Pending Assignment");
          if (pendingIndex !== -1) {
            updatedMetrics[pendingIndex].value = pendingData.length;
          }
        }

        // 5. Fetch attendance metrics (on time and late)
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', todayString);
        
        if (!attendanceError && attendanceData) {
          const onTimeCount = attendanceData.filter(record => record.status === 'Present').length;
          const lateCount = attendanceData.filter(record => 
            record.status === 'Late' || 
            record.status === 'Left Early' || 
            record.status === 'Late & Left Early'
          ).length;
          
          const onTimeIndex = updatedMetrics.findIndex(m => m.title === "On Time");
          if (onTimeIndex !== -1) {
            updatedMetrics[onTimeIndex].value = onTimeCount;
          }
          
          const lateIndex = updatedMetrics.findIndex(m => m.title === "Late Arrivals");
          if (lateIndex !== -1) {
            updatedMetrics[lateIndex].value = lateCount;
          }
        }

        // Update the state with the new metrics
        setMetrics(updatedMetrics);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`${metric.colorClass} p-3 rounded-lg`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{metric.value}</h3>
                {metric.change && (
                  <span className={`text-xs font-medium ${metric.changeType === 'increase' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    {metric.changeType === 'increase' ? '+' : '-'}{metric.change}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
