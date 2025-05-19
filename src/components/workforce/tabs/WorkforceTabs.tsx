
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User2, UsersRound, Briefcase, FileText, Download, ArrowUpRight } from "lucide-react";
import { EmployeeScheduleView } from "./EmployeeScheduleView";
import { AircraftScheduleView } from "./AircraftScheduleView";
import { TeamView } from "./tabs/TeamView";
import { CertificationView } from "./CertificationView";
import { useNotification } from '@/contexts/NotificationContext';

interface WorkforceTabsProps {
  onViewEmployeeDetails?: (id: string) => void;
  onViewAircraftDetails?: (id: string) => void;
}

export const WorkforceTabs = ({ 
  onViewEmployeeDetails,
  onViewAircraftDetails
}: WorkforceTabsProps) => {
  const [currentView, setCurrentView] = useState("employee");
  const { showToast } = useNotification();

  const handleExportData = () => {
    showToast({
      title: "Export Started",
      message: "Your data export is being prepared and will be available shortly.",
      type: "success"
    });
  };

  return (
    <Tabs 
      value={currentView} 
      onValueChange={setCurrentView} 
      className="mt-4"
    >
      <div className="flex items-center justify-between mb-2">
        <TabsList className="h-10">
          <TabsTrigger value="employee" className="flex items-center gap-1">
            <User2 className="h-4 w-4" />
            Employee View
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1">
            <UsersRound className="h-4 w-4" />
            Team View
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            Aircraft View
          </TabsTrigger>
          <TabsTrigger value="certification" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Certification View
          </TabsTrigger>
        </TabsList>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleExportData}
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <TabsContent value="employee" className="mt-2 space-y-4">
        <EmployeeScheduleView onViewDetails={onViewEmployeeDetails} />
      </TabsContent>

      <TabsContent value="aircraft" className="mt-2 space-y-4">
        <AircraftScheduleView onViewDetails={onViewAircraftDetails} />
      </TabsContent>

      <TabsContent value="team" className="mt-2">
        <TeamView />
      </TabsContent>

      <TabsContent value="certification" className="mt-2">
        <CertificationView />
      </TabsContent>
    </Tabs>
  );
};
