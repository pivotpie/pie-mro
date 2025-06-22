
import { useMemo } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

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
  const currentDate = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const sessionsByDate = useMemo(() => {
    const grouped: { [key: string]: TrainingSession[] } = {};
    sessions.forEach(session => {
      const dateKey = session.session_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-full">
        {/* Header with days */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center">
              <div className="font-medium text-sm">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-bold">
                {format(day, 'd')}
              </div>
              <div className="text-xs text-gray-500">
                {format(day, 'MMM')}
              </div>
            </div>
          ))}
        </div>

        {/* Training sessions grid */}
        <div className="grid grid-cols-7 gap-2 min-h-96">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const daySessions = sessionsByDate[dayKey] || [];
            
            return (
              <div key={day.toISOString()} className="border rounded-lg p-2 min-h-32">
                <div className="space-y-2">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded p-2 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-xs"
                      onClick={() => onSessionClick(session)}
                    >
                      <div className="font-medium truncate" title={session.training_type}>
                        {session.training_type}
                      </div>
                      <div className="text-xs opacity-75">
                        {session.start_time} - {session.end_time}
                      </div>
                      <div className="text-xs opacity-75">
                        {session.available_seats}/{session.total_seats} seats
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
