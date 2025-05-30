
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeScheduleView } from "./tabs/EmployeeScheduleView";
import { TeamView } from "./tabs/TeamView";
import { CertificationView } from "./tabs/CertificationView";
import { AircraftScheduleView } from "./tabs/AircraftScheduleView";

interface WorkforceTabsProps {
  onAircraftClick?: (aircraft: any) => void;
}

export const WorkforceTabs = ({ onAircraftClick }: WorkforceTabsProps) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Employee Schedule</TabsTrigger>
          <TabsTrigger value="aircraft">Aircraft Schedule</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="space-y-4">
          <EmployeeScheduleView onAircraftClick={onAircraftClick} />
        </TabsContent>
        
        <TabsContent value="aircraft" className="space-y-4">
          <AircraftScheduleView />
        </TabsContent>
        
        <TabsContent value="teams" className="space-y-4">
          <TeamView />
        </TabsContent>
        
        <TabsContent value="certifications" className="space-y-4">
          <CertificationView />
        </TabsContent>
      </Tabs>
    </div>
  );
};
