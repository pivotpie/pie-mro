
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Users, AlertTriangle, Clock } from "lucide-react";

export const TrainingMetrics = () => {
  const [metrics, setMetrics] = useState({
    upcomingSessions: 5,
    totalAssignments: 45,
    expiringCertifications: 8,
    pendingSwaps: 3
  });

  useEffect(() => {
    // TODO: Fetch real metrics from database
    console.log("Training metrics loaded");
  }, []);

  const metricCards = [
    {
      title: "Upcoming Sessions",
      value: metrics.upcomingSessions,
      icon: CalendarCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900"
    },
    {
      title: "Total Assignments",
      value: metrics.totalAssignments,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900"
    },
    {
      title: "Expiring Soon",
      value: metrics.expiringCertifications,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900"
    },
    {
      title: "Pending Swaps",
      value: metrics.pendingSwaps,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900"
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
