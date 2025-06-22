
import { useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";

interface TrainingSession {
  id: number;
  training_type: string;
  authority: string;
  session_date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  available_seats: number;
  location: string;
  instructor: string;
  status: string;
}

interface TrainingGanttChartProps {
  sessions: TrainingSession[];
  onSessionClick: (session: TrainingSession) => void;
  loading: boolean;
}

export const TrainingGanttChart = ({ sessions, onSessionClick, loading }: TrainingGanttChartProps) => {
  const { timelineData, sessionsByDate } = useMemo(() => {
    if (sessions.length === 0) {
      const currentDate = new Date();
      const startDate = subMonths(startOfMonth(currentDate), 1);
      const endDate = addMonths(endOfMonth(currentDate), 2);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      return {
        timelineData: days,
        sessionsByDate: {}
      };
    }

    // Find the date range from sessions
    const sessionDates = sessions.map(s => parseISO(s.session_date));
    const minDate = new Date(Math.min(...sessionDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...sessionDates.map(d => d.getTime())));
    
    // Extend the range by one month on each side
    const startDate = subMonths(startOfMonth(minDate), 1);
    const endDate = addMonths(endOfMonth(maxDate), 1);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group sessions by date
    const grouped: { [key: string]: TrainingSession[] } = {};
    sessions.forEach(session => {
      const dateKey = session.session_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });

    return {
      timelineData: days,
      sessionsByDate: grouped
    };
  }, [sessions]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-emerald-200 dark:bg-emerald-800 border-emerald-400 dark:border-emerald-600';
      case 'in-progress': return 'bg-amber-200 dark:bg-amber-800 border-amber-400 dark:border-amber-600';
      case 'upcoming': return 'bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600';
      case 'scheduled': return 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-600';
      default: return 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600';
    }
  };

  const getAuthorityColor = (authority: string) => {
    switch (authority.toLowerCase()) {
      case 'faa': return 'border-l-blue-500';
      case 'easa': return 'border-l-green-500';
      case 'gcaa': return 'border-l-purple-500';
      case 'manufacturer': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Group unique training sessions for the left sidebar
  const uniqueSessions = useMemo(() => {
    const sessionMap = new Map();
    sessions.forEach(session => {
      const key = `${session.training_type}-${session.authority}`;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          training_type: session.training_type,
          authority: session.authority,
          sessions: []
        });
      }
      sessionMap.get(key).sessions.push(session);
    });
    return Array.from(sessionMap.values());
  }, [sessions]);

  return (
    <div className="h-[600px] border rounded-lg bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header with timeline */}
      <div className="flex border-b bg-gray-50 dark:bg-gray-800">
        {/* Left sidebar header */}
        <div className="w-80 border-r bg-gray-100 dark:bg-gray-700 p-3 flex-shrink-0">
          <h4 className="font-semibold text-sm">Training Sessions</h4>
        </div>
        
        {/* Timeline header */}
        <div className="flex-1 overflow-x-auto">
          <ScrollArea orientation="horizontal" className="w-full">
            <div className="flex" style={{ minWidth: `${timelineData.length * 80}px` }}>
              {timelineData.map((day, index) => (
                <div 
                  key={day.toISOString()} 
                  className={`w-20 p-2 text-center border-r text-xs flex-shrink-0 ${
                    index === 0 || day.getDate() === 1 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="font-medium">{format(day, 'EEE')}</div>
                  <div className="text-lg font-bold">{format(day, 'd')}</div>
                  <div className="text-gray-500">{format(day, 'MMM')}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar with session types */}
        <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {uniqueSessions.map((sessionGroup, index) => (
                <div key={index} className="p-2 border rounded bg-white dark:bg-gray-700 shadow-sm">
                  <div className="font-medium text-sm truncate" title={sessionGroup.training_type}>
                    {sessionGroup.training_type}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {sessionGroup.authority} • {sessionGroup.sessions.length} session{sessionGroup.sessions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
              
              {uniqueSessions.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No training sessions found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Gantt chart area */}
        <div className="flex-1 overflow-auto">
          <ScrollArea className="h-full w-full">
            <div className="relative" style={{ minWidth: `${timelineData.length * 80}px`, minHeight: '400px' }}>
              {/* Vertical grid lines */}
              {timelineData.map((day, index) => (
                <div
                  key={`grid-${day.toISOString()}`}
                  className="absolute top-0 bottom-0 border-r border-gray-200 dark:border-gray-600"
                  style={{ left: `${index * 80}px`, width: '1px' }}
                />
              ))}

              {/* Session bars */}
              {sessions.map((session, sessionIndex) => {
                const sessionDate = parseISO(session.session_date);
                const dayIndex = timelineData.findIndex(day => 
                  day.getFullYear() === sessionDate.getFullYear() &&
                  day.getMonth() === sessionDate.getMonth() &&
                  day.getDate() === sessionDate.getDate()
                );

                if (dayIndex === -1) return null;

                const yPosition = sessionIndex * 60 + 10;
                const xPosition = dayIndex * 80 + 5;

                return (
                  <div
                    key={session.id}
                    className={`absolute cursor-pointer transition-all hover:shadow-lg ${getStatusColor(session.status)} ${getAuthorityColor(session.authority)} border-l-4 rounded p-2 text-xs`}
                    style={{
                      left: `${xPosition}px`,
                      top: `${yPosition}px`,
                      width: '70px',
                      height: '50px'
                    }}
                    onClick={() => onSessionClick(session)}
                    title={`${session.training_type} - ${session.instructor}`}
                  >
                    <div className="font-medium truncate" title={session.training_type}>
                      {session.training_type.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {session.start_time}
                    </div>
                    <div className="text-xs opacity-75">
                      {session.available_seats}/{session.total_seats}
                    </div>
                  </div>
                );
              })}

              {/* Today indicator */}
              {(() => {
                const today = new Date();
                const todayIndex = timelineData.findIndex(day => 
                  day.getFullYear() === today.getFullYear() &&
                  day.getMonth() === today.getMonth() &&
                  day.getDate() === today.getDate()
                );

                if (todayIndex === -1) return null;

                return (
                  <div
                    className="absolute top-0 bottom-0 bg-red-500 opacity-50 pointer-events-none"
                    style={{ left: `${todayIndex * 80 + 40}px`, width: '2px' }}
                  />
                );
              })()}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-200 dark:bg-emerald-800 border border-emerald-400 rounded"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-200 dark:bg-amber-800 border border-amber-400 rounded"></span>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-200 dark:bg-blue-800 border border-blue-400 rounded"></span>
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-slate-200 dark:bg-slate-700 border border-slate-400 rounded"></span>
              <span>Scheduled</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Authority:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-white border-l-4 border-l-blue-500"></span>
              <span>FAA</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-white border-l-4 border-l-green-500"></span>
              <span>EASA</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-white border-l-4 border-l-purple-500"></span>
              <span>GCAA</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-white border-l-4 border-l-orange-500"></span>
              <span>Manufacturer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
