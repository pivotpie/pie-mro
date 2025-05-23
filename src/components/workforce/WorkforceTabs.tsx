
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User2, UsersRound, Briefcase, FileText, Download } from "lucide-react";
import { EmployeeScheduleView } from "./tabs/EmployeeScheduleView";
import { AircraftScheduleView } from "./tabs/AircraftScheduleView";
import { TeamView } from "./tabs/TeamView";
import { CertificationView } from "./tabs/CertificationView";
import { toast } from "sonner";

export const WorkforceTabs = () => {
  const [currentView, setCurrentView] = useState("employee");

  const handleExport = () => {
    toast.success("Data export started", {
      description: "Your export will be ready to download shortly."
    });
  };

  return (
    <Tabs 
      value={currentView} 
      onValueChange={setCurrentView} 
      className="mt-4"
    >
      <div className="flex items-center justify-between mb-2">
        <TabsList>
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
            <span>Employee Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Aircraft Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            <span>Team View</span>
          </TabsTrigger>
          <TabsTrigger value="certification" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Certifications</span>
          </TabsTrigger>
        </TabsList>

        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <TabsContent value="employee" className="mt-0">
        <EmployeeScheduleView />
      </TabsContent>
      
      <TabsContent value="aircraft" className="mt-0">
        <AircraftScheduleView />
      </TabsContent>

      <TabsContent value="team" className="mt-0">
        <TeamView />
      </TabsContent>

      <TabsContent value="certification" className="mt-0">
        <CertificationView />
      </TabsContent>
    </Tabs>
  );
};
