
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

  return {
      <div className="flex items-center justify-between mb-2">
</TabsContent>
      </div>
      
  );
};
