
import { useState, useEffect } from 'react';
import { User, CalendarDays, Award, PlaneLanding, UsersRound, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type MetricType = {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  borderColor: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'nochange';
};

export default function WorkforceMetrics() {
  const [metrics, setMetrics] = useState<MetricType[]>([
    { 
      title: "Available Employees", 
      value: 0, 
      icon: <User className="h-6 w-6" />, 
      colorClass: "text-blue-600", 
      borderColor: "border-l-blue-600",
      change: 5, 
      changeType: 'increase' 
    },
    { 
      title: "On Leave", 
      value: 0, 
      icon: <CalendarDays className="h-6 w-6" />, 
      colorClass: "text-pink-600", 
      borderColor: "border-l-pink-600",
      change: 2, 
      changeType: 'decrease' 
    },
    { 
      title: "In Training", 
      value: 0, 
      icon: <Award className="h-6 w-6" />, 
      colorClass: "text-cyan-600", 
      borderColor: "border-l-cyan-600",
      change: 3, 
      changeType: 'increase' 
    },
    { 
      title: "Grounded Aircraft", 
      value: 0, 
      icon: <PlaneLanding className="h-6 w-6" />, 
      colorClass: "text-amber-500", 
      borderColor: "border-l-amber-500",
      changeType: 'nochange' 
    },
    { 
      title: "Aircraft w/ Teams", 
      value: 0, 
      icon: <UsersRound className="h-6 w-6" />, 
      colorClass: "text-emerald-500", 
      borderColor: "border-l-emerald-500",
      change: 33, 
      changeType: 'increase' 
    },
    { 
      title: "Pending Assignment", 
      value: 0, 
      icon: <Timer className="h-6 w-6" />, 
      colorClass: "text-indigo-600", 
      borderColor: "border-l-indigo-600",
      change: 33, 
      changeType: 'decrease' 
    },
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
          .select('id, support_codes!inner(support_code)')
          .eq('support_codes.support_code', 'AV');
        
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
        
        // Aircraft with Teams - Aircraft where there are employee cores assigned to them
        const { data: aircraftWithTeamsData, error: aircraftWithTeamsError } = await supabase
          .from('maintenance_visits')
          .select('id, aircraft_id, aircraft!inner(id, registration)')
          .in('status', ['In Service', 'Assigned']);
        
        // Get the list of aircraft registrations that have teams assigned
        const assignedAircraft = aircraftWithTeamsData ? aircraftWithTeamsData.length : 0;
        
        if (!aircraftWithTeamsError) {
          const assignedIndex = updatedMetrics.findIndex(m => m.title === "Aircraft w/ Teams");
          if (assignedIndex !== -1) {
            updatedMetrics[assignedIndex].value = assignedAircraft;
          }
        } else {
          console.error("Error fetching assigned aircraft:", aircraftWithTeamsError);
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

        // Calculate Grounded Aircraft as the sum of aircraft with teams and pending assignments
        const groundedIndex = updatedMetrics.findIndex(m => m.title === "Grounded Aircraft");
        const withTeamsIndex = updatedMetrics.findIndex(m => m.title === "Aircraft w/ Teams");
        const pendingIndex = updatedMetrics.findIndex(m => m.title === "Pending Assignment");
        
        if (groundedIndex !== -1 && withTeamsIndex !== -1 && pendingIndex !== -1) {
          updatedMetrics[groundedIndex].value = 
            updatedMetrics[withTeamsIndex].value + updatedMetrics[pendingIndex].value;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div 
          key={index} 
          className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${metric.borderColor} shadow-sm`}
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
              <div className={`${metric.colorClass}`}>
                {metric.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <h3 className={`text-3xl font-bold ${metric.colorClass}`}>{metric.value}</h3>
              {metric.change !== undefined && (
                <div className="mt-1.5">
                  {metric.changeType === 'increase' && (
                    <span className="text-xs text-green-600 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                      </svg>
                      {metric.change}% from last week
                    </span>
                  )}
                  {metric.changeType === 'decrease' && (
                    <span className="text-xs text-red-600 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                      </svg>
                      {metric.change}% from last week
                    </span>
                  )}
                  {metric.changeType === 'nochange' && (
                    <span className="text-xs text-gray-600 flex items-center">
                      <span className="mr-1">=</span>
                      No change
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
