
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
        <TabsList className="h-10">
          <TabsTrigger value="employee" className="flex items-center gap-1">
            <User2 className="h-4 w-4" />
            Employee View
          </TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <TabsContent value="employee" className="mt-2 space-y-4">
        <EmployeeScheduleView />
      </TabsContent>
    </Tabs>
  );
};
