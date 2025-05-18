
import { Card, CardContent } from "@/components/ui/card";
import { Users, CalendarCheck, GraduationCap, PlaneTakeoff, Plane, FileCheck, Activity } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  percentage?: string;
  onClick?: () => void;
}

const MetricCard = ({ label, value, icon: Icon, color, percentage, onClick }: MetricCardProps) => (
  <Card 
    className={`${color} hover:shadow-md transition-all cursor-pointer border`}
    onClick={onClick}
  >
    <CardContent className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-white/70 dark:bg-gray-800/70`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
        </div>
      </div>
      {percentage && (
        <div className="text-xs bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 rounded-full">
          {percentage}
        </div>
      )}
    </CardContent>
  </Card>
);

export const WorkforceMetrics = () => {
  const handleMetricClick = (metric: string) => {
    console.log(`Clicked on ${metric} metric`);
    // This would open a modal with filtered data
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      <MetricCard 
        label="Available Employees" 
        value={21} 
        icon={Users}
        color="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800" 
        percentage="+3%"
        onClick={() => handleMetricClick('available')}
      />
      <MetricCard 
        label="On Leave" 
        value={3} 
        icon={CalendarCheck}
        color="bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800" 
        percentage="-2%"
        onClick={() => handleMetricClick('leave')}
      />
      <MetricCard 
        label="In Training" 
        value={6} 
        icon={GraduationCap}
        color="bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800" 
        percentage="+1%"
        onClick={() => handleMetricClick('training')}
      />
      <MetricCard 
        label="Grounded Aircraft" 
        value={18} 
        icon={Plane}
        color="bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800" 
        percentage="0%"
        onClick={() => handleMetricClick('grounded')}
      />
      <MetricCard 
        label="Aircraft w/ Teams" 
        value={12} 
        icon={PlaneTakeoff}
        color="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800" 
        percentage="+1%"
        onClick={() => handleMetricClick('assigned')}
      />
      <MetricCard 
        label="Pending Assignment" 
        value={6} 
        icon={FileCheck}
        color="bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800" 
        percentage="+3%"
        onClick={() => handleMetricClick('pending')}
      />
      <MetricCard 
        label="Productivity" 
        value={94} 
        icon={Activity}
        color="bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800" 
        percentage="+2%"
        onClick={() => handleMetricClick('productivity')}
      />
    </div>
  );
};
