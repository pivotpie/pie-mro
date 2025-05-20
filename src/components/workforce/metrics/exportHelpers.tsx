
import { toast } from "sonner";
import { 
  DetailDataType, 
  MetricType,
  isEmployeeData,
  isRosterAssignment,
  isMaintenanceVisit,
  isAircraftData
} from "./types";

export const handleExport = (
  selectedMetric: MetricType | null,
  detailData: DetailDataType[]
) => {
  try {
    // Convert data to CSV
    if (!detailData || detailData.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Prepare data for CSV export based on selected metric
    let csvData: any[] = [];
    let filename = '';

    switch (selectedMetric) {
      case 'available':
      case 'total-employees':
        csvData = detailData.filter(isEmployeeData).map(item => ({
          Name: item.name,
          'Employee ID': `E${item.e_number}`,
          Position: item.job_title_description || 'N/A',
          Team: item.team_name || 'N/A',
          Mobile: item.mobile_number || 'N/A',
          'Date of Joining': item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A'
        }));
        filename = selectedMetric === 'available' ? 'available-employees.csv' : 'total-employees.csv';
        break;
      
      case 'leave':
      case 'training':
        csvData = detailData.filter(isRosterAssignment).map(item => {
          const base = {
            Name: item.employee_name || 'N/A',
            'Employee ID': `E${item.employee_number}` || 'N/A',
            Position: item.employee_position || 'N/A',
            Team: item.employee_team || 'N/A',
            Mobile: item.employee_mobile || 'N/A',
            'Date': item.date_value ? new Date(item.date_value).toLocaleDateString() : 'N/A'
          };
          
          // Add leave type only for leave metric
          if (selectedMetric === 'leave') {
            return {
              ...base,
              'Leave Type': item.roster_id === 2 ? 'Annual Leave' : 'Sick Leave'
            };
          }
          return base;
        });
        filename = selectedMetric === 'leave' ? 'employees-on-leave.csv' : 'employees-in-training.csv';
        break;
        
      case 'grounded':
      case 'assigned':
      case 'pending':
        csvData = detailData.filter(isMaintenanceVisit).map(item => ({
          Aircraft: item.aircraft_name || 'N/A',
          Registration: item.aircraft_registration || 'N/A',
          Type: item.aircraft_type || 'N/A',
          'Check Type': item.check_type || 'N/A',
          'Date Range': `${new Date(item.date_in).toLocaleDateString()} - ${new Date(item.date_out).toLocaleDateString()}`,
          Status: item.status || 'N/A',
          Hangar: item.hangar_name || 'N/A',
          'Total Hours': item.total_hours || 'N/A',
          Remarks: item.remarks || ''
        }));
        filename = `${selectedMetric}-aircraft.csv`;
        break;
        
      case 'productivity':
        csvData = detailData.filter(isAircraftData).map(item => ({
          Aircraft: item.aircraft_name || 'N/A',
          Registration: item.registration || 'N/A',
          Type: item.type_name || 'N/A',
          Manufacturer: item.manufacturer || 'N/A',
          Customer: item.customer || 'N/A',
          'Total Hours': item.total_hours || '0',
          'Total Cycles': item.total_cycles || '0'
        }));
        filename = 'available-aircraft.csv';
        break;
        
      default:
        csvData = [];
        filename = 'export.csv';
    }

    // Handle empty data case
    if (csvData.length === 0) {
      toast.error("No data to export after filtering");
      return;
    }

    // Convert to CSV
    const headers = Object.keys(csvData[0]);
    let csvContent = headers.join(',') + '\n';
    
    csvContent += csvData.map(row => {
      return headers.map(header => {
        const cell = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(cell).includes('"') ? String(cell).replace(/"/g, '""') : String(cell);
        return cell.toString().includes(',') ? `"${escaped}"` : escaped;
      }).join(',');
    }).join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export completed successfully");
  } catch (error) {
    console.error('Export error:', error);
    toast.error("Failed to export data");
  }
};
