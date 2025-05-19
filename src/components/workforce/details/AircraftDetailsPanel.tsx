
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, FileSpreadsheet, Plane, Tool, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AircraftDetailsProps {
  aircraft: {
    id: string;
    registration: string;
    type: string;
    status: string;
    totalFlightHours: number;
    hoursRemaining: number;
    maintenanceStatus: number;
    nextMaintenance: string;
    recentActivities: Array<{
      type: string;
      date: string;
      description: string;
    }>;
    upcomingSchedule: Array<{
      date: string;
      type: string;
      details: string;
    }>;
  };
}

export const AircraftDetailsPanel = ({ aircraft }: AircraftDetailsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{aircraft.registration}</h3>
          <div className="flex items-center mt-1 text-gray-500">
            <Plane className="h-4 w-4 mr-1" />
            <span className="text-sm">{aircraft.type}</span>
          </div>
        </div>
        <Badge 
          variant={
            aircraft.status === "Active" ? "default" : 
            aircraft.status === "Maintenance" ? "outline" : 
            "destructive"
          }
        >
          {aircraft.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Flight Hours</p>
              <p className="font-medium">{aircraft.totalFlightHours} hours</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Hours Until Next Check</p>
              <p className="font-medium">{aircraft.hoursRemaining} hours</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Maintenance Status</span>
              <span>{aircraft.maintenanceStatus}%</span>
            </div>
            <Progress value={aircraft.maintenanceStatus} 
              className={`h-2 ${
                aircraft.maintenanceStatus > 70 ? 'bg-green-100' : 
                aircraft.maintenanceStatus > 30 ? 'bg-yellow-100' : 
                'bg-red-100'
              }`}
            />
            <div className="flex items-center text-xs mt-1">
              <CalendarDays className="h-3 w-3 mr-1" />
              <span>Next scheduled: {aircraft.nextMaintenance}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="schedule" className="text-xs">Upcoming Schedule</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs">Maintenance History</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="pt-4 space-y-4">
          {aircraft.upcomingSchedule.map((item, index) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className="p-2 bg-secondary rounded-md">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{item.type}</div>
                <div className="text-xs text-gray-500 mt-1">{item.date}</div>
                <div className="text-xs mt-1">{item.details}</div>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="maintenance" className="pt-4 space-y-4">
          {aircraft.recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className="p-2 bg-secondary rounded-md">
                <Tool className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{activity.type}</div>
                <div className="text-xs text-gray-500 mt-1">{activity.date}</div>
                <div className="text-xs mt-1">{activity.description}</div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" className="flex items-center gap-1">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Documents</span>
        </Button>
        <Button className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          <span>Report Issue</span>
        </Button>
      </div>
    </div>
  );
};
