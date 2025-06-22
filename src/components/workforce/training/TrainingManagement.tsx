
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Clock, MapPin, Plus, Upload, Download } from "lucide-react";
import { TrainingGanttChart } from "./TrainingGanttChart";
import { TrainingSessionModal } from "./TrainingSessionModal";
import { TrainingMetrics } from "./TrainingMetrics";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

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

export const TrainingManagement = () => {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingSessions();
  }, []);

  const fetchTrainingSessions = async () => {
    try {
      setLoading(true);
      // For now, using mock data until database tables are created
      const mockData: TrainingSession[] = [
        {
          id: 1,
          training_type: "GCAA Recertification",
          authority: "GCAA",
          session_date: "2024-07-15",
          start_time: "09:00",
          end_time: "17:00",
          total_seats: 20,
          available_seats: 5,
          location: "Training Center A",
          instructor: "John Smith",
          status: "scheduled"
        },
        {
          id: 2,
          training_type: "FAA Type Rating",
          authority: "FAA",
          session_date: "2024-07-20",
          start_time: "08:00",
          end_time: "16:00",
          total_seats: 15,
          available_seats: 8,
          location: "Simulator Bay 2",
          instructor: "Sarah Johnson",
          status: "scheduled"
        },
        {
          id: 3,
          training_type: "Safety Management",
          authority: "ICAO",
          session_date: "2024-07-25",
          start_time: "10:00",
          end_time: "15:00",
          total_seats: 30,
          available_seats: 12,
          location: "Conference Room 1",
          instructor: "Mike Wilson",
          status: "scheduled"
        }
      ];
      
      setTrainingSessions(mockData);
      toast.success("Training sessions loaded successfully");
    } catch (error: any) {
      toast.error(`Error loading training sessions: ${error.message}`);
      console.error("Error fetching training sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const handleCreateSession = () => {
    // TODO: Implement create session functionality
    toast.info("Create session functionality will be implemented next");
  };

  const handleImportSessions = () => {
    // TODO: Implement import functionality
    toast.info("Import sessions functionality will be implemented next");
  };

  const handleExportSessions = () => {
    // TODO: Implement export functionality
    toast.info("Export sessions functionality will be implemented next");
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Training Metrics */}
      <TrainingMetrics />

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Training Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleImportSessions}>
            <Upload className="h-4 w-4 mr-2" />
            Import Sessions
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSessions}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleCreateSession}>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Training Gantt Chart */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Training Schedule Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <TrainingGanttChart 
            sessions={trainingSessions}
            onSessionClick={handleSessionClick}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Training Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Training Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {trainingSessions.map((session) => (
                <div 
                  key={session.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">{session.training_type}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          {session.session_date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {session.start_time} - {session.end_time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {session.location}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Instructor: </span>
                        <span className="font-medium">{session.instructor}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="font-medium">{session.available_seats}</span>
                        <span className="text-gray-500">/{session.total_seats}</span>
                      </div>
                      <span className="text-xs text-gray-500">Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Session Modal */}
      <TrainingSessionModal
        open={showSessionModal}
        onOpenChange={setShowSessionModal}
        session={selectedSession}
        onSessionUpdate={fetchTrainingSessions}
      />
    </div>
  );
};
