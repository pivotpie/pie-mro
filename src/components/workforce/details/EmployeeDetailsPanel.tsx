
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Mail, Phone, Star, User } from "lucide-react";

interface EmployeeDetailsProps {
  employee: {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    team: string;
    status: string;
    certifications: string[];
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

export const EmployeeDetailsPanel = ({ employee }: EmployeeDetailsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{employee.name}</h3>
          <div className="flex items-center mt-1 text-gray-500">
            <User className="h-4 w-4 mr-1" />
            <span className="text-sm">{employee.role}</span>
          </div>
        </div>
        <Badge variant={employee.status === "Active" ? "default" : "outline"}>
          {employee.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm">{employee.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm">{employee.phone}</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm">Team: {employee.team}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Certifications</h4>
        <div className="flex flex-wrap gap-2">
          {employee.certifications.map((cert, index) => (
            <Badge key={index} variant="secondary">
              {cert}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="schedule" className="text-xs">Upcoming Schedule</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="pt-4 space-y-4">
          {employee.upcomingSchedule.map((item, index) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className="p-2 bg-secondary rounded-md">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{item.type}</div>
                <div className="text-xs text-gray-500 mt-1">{item.date}</div>
                <div className="text-xs mt-1">{item.details}</div>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="activity" className="pt-4 space-y-4">
          {employee.recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className="p-2 bg-secondary rounded-md">
                <Clock className="h-4 w-4" />
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
        <Button variant="outline">Edit Profile</Button>
        <Button>View Full History</Button>
      </div>
    </div>
  );
};
