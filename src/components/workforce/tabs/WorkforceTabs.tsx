
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeScheduleView } from './EmployeeScheduleView';
import { AircraftScheduleView } from './AircraftScheduleView';
import { CertificationView } from './CertificationView';
import { TeamView } from './TeamView';

export const WorkforceTabs = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  
  return (
    <Tabs
      defaultValue="schedule"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="flex justify-start mb-6 bg-transparent">
        <TabsTrigger value="schedule" className="text-sm px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400">
          Employee Schedule
        </TabsTrigger>
        <TabsTrigger value="aircraft" className="text-sm px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400">
          Aircraft Schedule
        </TabsTrigger>
        <TabsTrigger value="certification" className="text-sm px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400">
          Certifications
        </TabsTrigger>
        <TabsTrigger value="teams" className="text-sm px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400">
          Teams
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="schedule" className="p-0">
        <EmployeeScheduleView />
      </TabsContent>
      
      <TabsContent value="aircraft" className="p-0">
        <AircraftScheduleView />
      </TabsContent>
      
      <TabsContent value="certification" className="p-0">
        <CertificationView />
      </TabsContent>
      
      <TabsContent value="teams" className="p-0">
        <TeamView />
      </TabsContent>
    </Tabs>
  );
};
