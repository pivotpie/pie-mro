
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AircraftCalendarProps {
  onCellClick: (aircraftId: string, day: number, month: number) => void;
}

export const AircraftCalendar = ({ onCellClick }: AircraftCalendarProps) => {
  const mockAircraftData = [
    { id: 'air123', name: 'Boeing 737-800', status: 'Active' },
    { id: 'air456', name: 'Airbus A320', status: 'Maintenance' },
    { id: 'air789', name: 'Embraer E190', status: 'Active' }
  ];
  
  const daysInMonth = 31; // For demo purposes
  const currentMonth = 4; // May (0-indexed)
  
  // Handle cell click
  const handleCellClick = (aircraftId: string, day: number) => {
    onCellClick(aircraftId, day, currentMonth);
  };
  
  return (
    <Card className="overflow-x-auto">
      <div className="min-w-max">
        <div className="grid grid-cols-[200px_repeat(31,40px)]">
          {/* Header row with dates */}
          <div className="sticky left-0 bg-white dark:bg-gray-800 border-b font-medium p-2">
            Aircraft
          </div>
          {Array.from({length: daysInMonth}).map((_, day) => (
            <div key={day} className="p-1 text-center border-b text-xs">
              {day + 1}
            </div>
          ))}
          
          {/* Aircraft rows */}
          {mockAircraftData.map(aircraft => (
            <React.Fragment key={aircraft.id}>
              <div className="sticky left-0 bg-white dark:bg-gray-800 border-b flex items-center p-2 shadow-sm z-10">
                <div>
                  <div className="font-medium text-sm">{aircraft.name}</div>
                  <div className="text-xs text-gray-500">#{aircraft.id}</div>
                </div>
              </div>
              {/* Calendar cells */}
              {Array.from({length: daysInMonth}).map((_, day) => {
                // Generate some random maintenance data for demo
                const hasEvent = Math.random() > 0.8;
                const eventType = Math.random() > 0.5 ? 'maintenance' : 'flight';
                return (
                  <div 
                    key={`${aircraft.id}-${day}`} 
                    className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                      hasEvent ? 
                        eventType === 'maintenance' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20'
                        : ''
                    }`}
                    onClick={() => handleCellClick(aircraft.id, day + 1)}
                  >
                    {hasEvent && (
                      <div className="h-full w-full flex items-center justify-center p-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            eventType === 'maintenance' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
};
