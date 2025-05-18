
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  PlaneTakeoff, 
  Plane, 
  FileCheck, 
  Activity 
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

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
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const metrics = [
    { 
      id: 'available', 
      label: 'Available Employees', 
      value: 21, 
      icon: Users, 
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
      percentage: '+3%'
    },
    { 
      id: 'leave', 
      label: 'On Leave', 
      value: 3, 
      icon: CalendarCheck, 
      color: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
      percentage: '-2%'
    },
    { 
      id: 'training', 
      label: 'In Training', 
      value: 6, 
      icon: GraduationCap, 
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800',
      percentage: '+1%'
    },
    { 
      id: 'grounded', 
      label: 'Grounded Aircraft', 
      value: 18, 
      icon: Plane, 
      color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
      percentage: '0%'
    },
    { 
      id: 'assigned', 
      label: 'Aircraft w/ Teams', 
      value: 12, 
      icon: PlaneTakeoff, 
      color: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
      percentage: '+1%'
    },
    { 
      id: 'pending', 
      label: 'Pending Assignment', 
      value: 6, 
      icon: FileCheck, 
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800',
      percentage: '+3%'
    },
    { 
      id: 'productivity', 
      label: 'Productivity', 
      value: 94, 
      icon: Activity, 
      color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800',
      percentage: '+2%'
    }
  ];

  const handleMetricClick = (metricId: string) => {
    setSelectedMetric(metricId);
    setIsSheetOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {metrics.map((metric) => (
          <MetricCard 
            key={metric.id}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            percentage={metric.percentage}
            onClick={() => handleMetricClick(metric.id)}
          />
        ))}
      </div>

      {/* Metric Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full md:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>
              {metrics.find(m => m.id === selectedMetric)?.label} Details
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedMetric === 'available' && (
              <div className="space-y-4">
                <p>Detailed information about available employees would appear here.</p>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Available Employee List</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Michael Johnson</span>
                      <span className="text-blue-600">Available</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sarah Williams</span>
                      <span className="text-blue-600">Available</span>
                    </li>
                    <li className="flex justify-between">
                      <span>David Brown</span>
                      <span className="text-blue-600">Available</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {selectedMetric === 'leave' && (
              <div className="space-y-4">
                <p>Detailed information about employees on leave would appear here.</p>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Employees on Leave</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Emily Taylor</span>
                      <span className="text-red-600">Vacation (Until Jun 25)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>James Wilson</span>
                      <span className="text-red-600">Sick Leave (Until Jun 22)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Robert Miller</span>
                      <span className="text-red-600">Personal (Until Jun 30)</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Placeholder for other metrics */}
            {!['available', 'leave'].includes(selectedMetric || '') && (
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <p className="text-gray-500">Detailed information for this metric would appear here.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
