
import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { MetricType } from "./types";

export const getColumnsForMetric = (selectedMetric: MetricType | null) => {
  if (selectedMetric === 'available' || selectedMetric === 'total-employees') {
    return [
      {
        id: 'name',
        header: 'Name',
        cell: (item: any) => (
          <span className="font-medium">{item.name}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.name,
      },
      {
        id: 'id',
        header: 'ID',
        cell: (item: any) => (
          <span>E{item.e_number}</span>
        ),
      },
      {
        id: 'position',
        header: 'Position',
        cell: (item: any) => (
          <span>{item.job_title_description || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.job_title_description,
      },
      {
        id: 'team',
        header: 'Team',
        cell: (item: any) => (
          <span>{item.team_name || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.team_name,
      },
      {
        id: 'mobile',
        header: 'Mobile',
        cell: (item: any) => (
          <span>{item.mobile_number || 'N/A'}</span>
        ),
      },
      {
        id: 'joinDate',
        header: 'Join Date',
        cell: (item: any) => (
          <span>{item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.date_of_joining,
      },
      {
        id: 'certifications',
        header: 'Certifications',
        cell: (item: any) => (
          <span>{item.certification_count || '0'}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (item: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Contact</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  } 
  else if (selectedMetric === 'leave' || selectedMetric === 'training') {
    return [
      {
        id: 'name',
        header: 'Name',
        cell: (item: any) => (
          <span className="font-medium">{item.employee_name || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.employee_name,
      },
      {
        id: 'id',
        header: 'ID',
        cell: (item: any) => (
          <span>E{item.employee_number || 'N/A'}</span>
        ),
      },
      {
        id: 'position',
        header: 'Position',
        cell: (item: any) => (
          <span>{item.employee_position || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.employee_position,
      },
      {
        id: 'team',
        header: 'Team',
        cell: (item: any) => (
          <span>{item.employee_team || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.employee_team,
      },
      {
        id: 'mobile',
        header: 'Mobile',
        cell: (item: any) => (
          <span>{item.employee_mobile || 'N/A'}</span>
        ),
      },
      {
        id: 'date',
        header: selectedMetric === 'leave' ? 'Leave Date' : 'Training Date',
        cell: (item: any) => (
          <span>{item.date_value ? new Date(item.date_value).toLocaleDateString() : 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.date_value,
      },
      ...(selectedMetric === 'leave' ? [
        {
          id: 'leaveType',
          header: 'Leave Type',
          cell: (item: any) => (
            <span>{item.roster_id === 2 ? 'Annual Leave' : 'Sick Leave'}</span>
          ),
        },
      ] : []),
      {
        id: 'actions',
        header: 'Actions',
        cell: (item: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Contact</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  } 
  else if (selectedMetric === 'productivity') {
    return [
      {
        id: 'aircraft',
        header: 'Aircraft',
        cell: (item: any) => (
          <span className="font-medium">{item.aircraft_name || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.aircraft_name,
      },
      {
        id: 'registration',
        header: 'Registration',
        cell: (item: any) => (
          <span>{item.registration || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.registration,
      },
      {
        id: 'type',
        header: 'Type',
        cell: (item: any) => (
          <span>{item.type_name || 'N/A'}</span>
        ),
      },
      {
        id: 'manufacturer',
        header: 'Manufacturer',
        cell: (item: any) => (
          <span>{item.manufacturer || 'N/A'}</span>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: (item: any) => (
          <span>{item.customer || 'N/A'}</span>
        ),
      },
      {
        id: 'totalHours',
        header: 'Total Hours',
        cell: (item: any) => (
          <span>{item.total_hours || '0'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.total_hours,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (item: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Schedule Maintenance</DropdownMenuItem>
              <DropdownMenuItem>View History</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }
  else {
    return [
      {
        id: 'aircraft',
        header: 'Aircraft',
        cell: (item: any) => (
          <span className="font-medium">{item.aircraft_name || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.aircraft_name,
      },
      {
        id: 'registration',
        header: 'Registration',
        cell: (item: any) => (
          <span>{item.aircraft_registration || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.aircraft_registration,
      },
      {
        id: 'type',
        header: 'Type',
        cell: (item: any) => (
          <span>{item.aircraft_type || 'N/A'}</span>
        ),
      },
      {
        id: 'checkType',
        header: 'Check Type',
        cell: (item: any) => (
          <span>{item.check_type || 'N/A'}</span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.check_type,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (item: any) => (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            item.status === 'In Progress' ? 
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
            item.status === 'Completed' ? 
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
          }`}>
            {item.status || 'N/A'}
          </span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.status,
      },
      {
        id: 'dateRange',
        header: 'Date Range',
        cell: (item: any) => (
          <span>
            {item.date_in ? new Date(item.date_in).toLocaleDateString() : 'N/A'} - 
            {item.date_out ? new Date(item.date_out).toLocaleDateString() : 'N/A'}
          </span>
        ),
        sortable: true,
        accessorFn: (item: any) => item.date_in,
      },
      {
        id: 'totalHours',
        header: 'Total Hours',
        cell: (item: any) => (
          <span>{item.total_hours || 'N/A'}</span>
        ),
      },
      {
        id: 'hangar',
        header: 'Hangar',
        cell: (item: any) => (
          <span>{item.hangar_name || 'Not Assigned'}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (item: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
              <DropdownMenuItem>Assign Team</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }
};

export const getDetailTitle = (selectedMetric: MetricType | null) => {
  switch (selectedMetric) {
    case 'total-employees': return 'Total Employees';
    case 'available': return 'Available Employees';
    case 'leave': return 'Employees on Leave';
    case 'training': return 'Employees in Training';
    case 'grounded': return 'Grounded Aircraft';
    case 'assigned': return 'Aircraft with Assigned Teams';
    case 'pending': return 'Aircraft Pending Assignment';
    case 'productivity': return 'Available Aircraft';
    default: return 'Details';
  }
};
