
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeScheduleView } from "./tabs/EmployeeScheduleView";
import { AlternativeScheduleView } from "./tabs/AlternativeScheduleView";

export const WorkforceTabs = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="employee-schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employee-schedule">Employee Schedule</TabsTrigger>
          <TabsTrigger value="alternative-schedule">Assignments Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employee-schedule" className="mt-4">
          <EmployeeScheduleView />
        </TabsContent>
        
        <TabsContent value="alternative-schedule" className="mt-4">
          <AlternativeScheduleView />
        </TabsContent>
      </Tabs>
    </div>
  );
};
