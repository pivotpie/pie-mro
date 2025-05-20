
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  PlaneTakeoff, 
  Plane, 
  FileCheck, 
  Activity,
  UserCheck
} from "lucide-react";
import { MetricType, DetailDataType, MetricInfo } from "./types";
import {
  fetchTotalEmployees,
  fetchEmployeeSupports,
  fetchDateReference,
  fetchRosterAssignments,
  fetchAircraft,
  fetchMaintenanceVisits
} from "./dataFetchers";
import {
  processAvailableEmployees,
  processLeaveEmployees,
  processTrainingEmployees,
  processAircraftMetrics,
  filterAndSortData
} from "./dataProcessors";
import { handleExport } from "./exportHelpers";
import { getColumnsForMetric, getDetailTitle } from "./columnGenerators";

export const useMetricData = (selectedMetric: MetricType | null, isDialogOpen: boolean) => {
  const [detailData, setDetailData] = useState<DetailDataType[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // Get current date for roster data
  const currentDate = new Date().toISOString().split('T')[0];

  // Data fetching queries
  const { data: totalEmployees, isLoading: loadingTotalEmployees } = useQuery({
    queryKey: ['totalEmployees'],
    queryFn: fetchTotalEmployees
  });

  const { data: employeeSupports, isLoading: loadingEmployeeSupports } = useQuery({
    queryKey: ['employeeSupports', currentDate],
    queryFn: () => fetchEmployeeSupports(currentDate)
  });

  const { data: dateReference, isLoading: loadingDateReference } = useQuery({
    queryKey: ['dateReference', currentDate],
    queryFn: () => fetchDateReference(currentDate)
  });

  const { data: rosterAssignments, isLoading: loadingRosterAssignments } = useQuery({
    queryKey: ['rosterAssignments', currentDate, dateReference?.id],
    queryFn: () => fetchRosterAssignments(dateReference?.id || 0),
    enabled: !!dateReference?.id
  });

  const { data: aircraft, isLoading: loadingAircraft } = useQuery({
    queryKey: ['allAircraft'],
    queryFn: fetchAircraft
  });

  const { data: maintenanceVisits, isLoading: loadingMaintenanceVisits } = useQuery({
    queryKey: ['maintenanceVisits', currentDate],
    queryFn: () => fetchMaintenanceVisits(currentDate)
  });

  // Derived state
  const availableEmployees = processAvailableEmployees(
    totalEmployees,
    employeeSupports,
    rosterAssignments
  );

  const onLeaveEmployees = processLeaveEmployees(rosterAssignments);
  const inTrainingEmployees = processTrainingEmployees(rosterAssignments);
  
  const aircraftMetrics = processAircraftMetrics(aircraft, maintenanceVisits);

  const isLoading = loadingTotalEmployees || loadingEmployeeSupports || loadingDateReference || 
                   loadingRosterAssignments || loadingAircraft || loadingMaintenanceVisits;

  // Set detail data when selecting a metric
  useEffect(() => {
    if (!selectedMetric || !isDialogOpen) return;
    
    let data: DetailDataType[] = [];
    
    switch (selectedMetric) {
      case 'total-employees':
        data = totalEmployees || [];
        break;
      case 'available':
        data = availableEmployees || [];
        break;
      case 'leave':
        data = onLeaveEmployees || [];
        break;
      case 'training':
        data = inTrainingEmployees || [];
        break;
      case 'grounded':
        data = maintenanceVisits?.filter(v => v.status === 'In Progress') || [];
        break;
      case 'assigned':
        data = maintenanceVisits?.filter(v => 
          v.status === 'In Progress' && v.has_personnel_requirements
        ) || [];
        break;
      case 'pending':
        data = maintenanceVisits?.filter(v => v.status === 'Scheduled') || [];
        break;
      case 'productivity':
        if (aircraft && maintenanceVisits) {
          const inMaintenanceIds = new Set(
            maintenanceVisits
              .filter(v => v.status === 'In Progress')
              .map(v => v.aircraft_id)
          );
          data = aircraft.filter(a => !inMaintenanceIds.has(a.id)) || [];
        }
        break;
      default:
        data = [];
    }
    
    setDetailData(data);
  }, [selectedMetric, isDialogOpen, totalEmployees, availableEmployees, onLeaveEmployees, inTrainingEmployees, aircraft, maintenanceVisits]);

  // Export with our helper function
  const handleExportData = () => {
    handleExport(selectedMetric, detailData);
  };

  // Filter data using our helper function
  const filterData = () => 
    filterAndSortData(detailData, searchTerm, filters, sortField, sortDirection);

  // Generate metrics data
  const metrics: MetricInfo[] = [
    { 
      id: 'total-employees', 
      label: 'Total Employees', 
      value: isLoading ? '-' : (totalEmployees?.length || 0), 
      icon: Users, 
      color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800',
    },
    { 
      id: 'available', 
      label: 'Available Today', 
      value: isLoading ? '-' : (availableEmployees?.length || 0), 
      icon: UserCheck, 
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
    },
    { 
      id: 'leave', 
      label: 'On Leave Today', 
      value: isLoading ? '-' : onLeaveEmployees?.length || 0, 
      icon: CalendarCheck, 
      color: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    },
    { 
      id: 'training', 
      label: 'In Training Today', 
      value: isLoading ? '-' : inTrainingEmployees?.length || 0, 
      icon: GraduationCap, 
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800',
    },
    { 
      id: 'grounded', 
      label: 'Grounded Aircraft', 
      value: isLoading ? '-' : aircraftMetrics?.inMaintenance || 0, 
      icon: Plane, 
      color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
    },
    { 
      id: 'assigned', 
      label: 'Aircraft w/ Teams', 
      value: isLoading ? '-' : aircraftMetrics?.withTeams || 0, 
      icon: PlaneTakeoff, 
      color: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
    },
    { 
      id: 'pending', 
      label: 'Pending Assignment', 
      value: isLoading ? '-' : aircraftMetrics?.scheduled || 0, 
      icon: FileCheck, 
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800',
    },
    { 
      id: 'productivity', 
      label: 'Available Aircraft', 
      value: isLoading ? '-' : aircraftMetrics?.available || 0, 
      icon: Activity, 
      color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800',
    }
  ];
  
  return {
    metrics,
    detailData,
    setDetailData,
    getDetailTitle: () => getDetailTitle(selectedMetric),
    filterData,
    getColumnsForMetric: () => getColumnsForMetric(selectedMetric),
    handleExport: handleExportData,
    isLoading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    activeFilter: null,
    setActiveFilter: () => {},
  };
};
