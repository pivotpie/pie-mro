
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User2, UsersRound, Briefcase, FileText, Download, ArrowUpRight } from "lucide-react";
import { EmployeeScheduleView } from "./EmployeeScheduleView";
import { AircraftScheduleView } from "./AircraftScheduleView";
import { TeamView } from "./TeamView";
import { CertificationView } from "./CertificationView";

export const WorkforceTabs = () => {
  const [currentView, setCurrentView] = useState("employee");

  return (
    <Tabs 
      value={currentView} 
      onValueChange={setCurrentView} 
      className="mt-4 w-full"
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
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <TabsContent value="employee" className="mt-2 space-y-4 w-full">
        <EmployeeScheduleView />
      </TabsContent>

      <TabsContent value="aircraft" className="mt-2 space-y-4 w-full">
        <AircraftScheduleView />
      </TabsContent>

      <TabsContent value="team" className="mt-2 w-full">
        <TeamView />
      </TabsContent>

      <TabsContent value="certification" className="mt-2 w-full">
        <CertificationView />
      </TabsContent>
    </Tabs>
  );
};
