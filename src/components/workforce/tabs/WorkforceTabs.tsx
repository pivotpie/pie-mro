
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User2, UsersRound, Download } from "lucide-react";
import { EmployeeScheduleView } from "./EmployeeScheduleView";
import { AlternativeScheduleView } from "./AlternativeScheduleView";

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
            Employee Calendar
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-1">
            <UsersRound className="h-4 w-4" />
            Assignment Calendar
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

      <TabsContent value="assignments" className="mt-2 space-y-4 w-full">
        <AlternativeScheduleView />
      </TabsContent>
    </Tabs>
  );
};
