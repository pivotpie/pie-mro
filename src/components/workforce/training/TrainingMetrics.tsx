
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Users, AlertTriangle, Clock } from "lucide-react";
import { TrainingSessionsManager } from "./TrainingSessionsData";

export const TrainingMetrics = () => {
  const [metrics, setMetrics] = useState({
    upcomingSessions: 0,
    totalAssignments: 0,
    expiringCertifications: 8,
    pendingSwaps: 3
  });

  useEffect(() => {
    calculateMetrics();
  }, []);

  const calculateMetrics = async () => {
    try {
      // Initialize training sessions manager if needed
      await TrainingSessionsManager.initialize();
      const sessions = TrainingSessionsManager.getSessions();
      
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Calculate upcoming sessions (next 7 days)
      const upcomingSessions = sessions.filter(session => {
        const sessionDate = new Date(session.session_date);
        return sessionDate >= now && sessionDate <= oneWeekFromNow;
      }).length;
      
      // Calculate total assignments (enrolled employees across all sessions)
      const totalAssignments = sessions.reduce((total, session) => {
        return total + (session.assigned_employees?.length || 0);
      }, 0);
      
      setMetrics({
        upcomingSessions,
        totalAssignments,
        expiringCertifications: 8, // Keep static for now
        pendingSwaps: 3 // Keep static for now
      });
      
      console.log("Training metrics calculated:", { upcomingSessions, totalAssignments });
    } catch (error) {
      console.error("Error calculating training metrics:", error);
    }
  };

  const metricCards = [
    {
      title: "Upcoming Sessions",
      value: metrics.upcomingSessions,
      icon: CalendarCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      subtitle: "Next 7 days"
    },
    {
      title: "Total Assignments",
      value: metrics.totalAssignments,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      subtitle: "Enrolled employees"
    },
    {
      title: "Expiring Soon",
      value: metrics.expiringCertifications,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      subtitle: "Within 30 days"
    },
    {
      title: "Pending Swaps",
      value: metrics.pendingSwaps,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      subtitle: "Requires action"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{metric.subtitle}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
