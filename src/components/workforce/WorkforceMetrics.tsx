
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  subtext?: string;
  color?: string;
  onClick?: () => void;
}

const MetricCard = ({ label, value, subtext, color = "bg-blue-50", onClick }: MetricCardProps) => (
  <Card 
    className={`${color} hover:shadow-md transition-all cursor-pointer`}
    onClick={onClick}
  >
    <CardContent className="flex flex-col items-center justify-center p-4 h-24">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium text-center">{label}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
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
        value={42} 
        color="bg-blue-50" 
        onClick={() => handleMetricClick('available')}
      />
      <MetricCard 
        label="On Leave" 
        value={8} 
        color="bg-red-50" 
        onClick={() => handleMetricClick('leave')}
      />
      <MetricCard 
        label="In Training" 
        value={12} 
        color="bg-purple-50" 
        onClick={() => handleMetricClick('training')}
      />
      <MetricCard 
        label="Grounded Aircraft" 
        value={6} 
        color="bg-amber-50" 
        onClick={() => handleMetricClick('grounded')}
      />
      <MetricCard 
        label="Aircraft w/ Teams" 
        value={4} 
        color="bg-green-50" 
        onClick={() => handleMetricClick('assigned')}
      />
      <MetricCard 
        label="Pending Assignment" 
        value={2} 
        color="bg-orange-50" 
        onClick={() => handleMetricClick('pending')}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <MetricCard 
                label="Productivity" 
                value={94} 
                subtext="%" 
                color="bg-cyan-50" 
                onClick={() => handleMetricClick('productivity')}
              />
              <InfoIcon className="w-4 h-4 text-gray-400 absolute top-2 right-2" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="w-64 text-sm">
              Productivity is calculated based on total scheduled hours vs. available hours
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
