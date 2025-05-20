
import React, { useState } from "react";
import { MetricCard } from "./metrics/MetricCard";
import { MetricDetailDialog } from "./metrics/MetricDetailDialog";
import { useMetricData } from "./metrics/useMetricData";
import { MetricType } from "./metrics/types";

export const WorkforceMetrics = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use custom hook for data fetching and processing
  const {
    metrics,
    detailData,
    setDetailData,
    getDetailTitle,
    filterData,
    getColumnsForMetric,
    handleExport,
    isLoading
  } = useMetricData(selectedMetric, isDialogOpen);

  const handleMetricClick = (metricId: MetricType) => {
    console.log(`Metric clicked: ${metricId}`);
    setSelectedMetric(metricId);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-6">
        {metrics.map((metric) => (
          <MetricCard 
            key={metric.id}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            isLoading={isLoading}
            onClick={() => handleMetricClick(metric.id)}
          />
        ))}
      </div>

      {/* Metric Detail Dialog */}
      {selectedMetric && (
        <MetricDetailDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          title={getDetailTitle()}
          data={detailData}
          filterData={filterData}
          getColumnsForMetric={getColumnsForMetric}
          handleExport={handleExport}
          metric={selectedMetric}
        />
      )}
    </>
  );
};
