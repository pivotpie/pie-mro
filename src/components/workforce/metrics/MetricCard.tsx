
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  percentage?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export const MetricCard = React.memo(({ label, value, icon: Icon, color, percentage, onClick, isLoading }: MetricCardProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
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
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-7 w-12 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    value
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
              </div>
            </div>
            {percentage && !isLoading && (
              <div className="text-xs bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 rounded-full">
                {percentage}
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <p>View {label} details</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

