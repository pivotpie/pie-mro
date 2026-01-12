
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { AircraftCalendar } from "./schedule/AircraftCalendar";

export const AircraftScheduleSection = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            <CardTitle>Aircraft Maintenance Schedule</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AircraftCalendar />
      </CardContent>
    </Card>
  );
};
