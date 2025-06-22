
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Clock, MapPin, Plus, Upload, Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrainingGanttChart } from "./TrainingGanttChart";
import { TrainingSessionModal } from "./TrainingSessionModal";
import { TrainingMetrics } from "./TrainingMetrics";
import { TrainingSessionsManager, type TrainingSession } from "./TrainingSessionsData";
import { toast } from "sonner";

export const EnhancedTrainingManagement = () => {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TrainingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authorityFilter, setAuthorityFilter] = useState('all');

  useEffect(() => {
    initializeTrainingData();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [trainingSessions, searchTerm, statusFilter, authorityFilter]);

  const initializeTrainingData = async () => {
    try {
      setLoading(true);
      await TrainingSessionsManager.initialize();
      const sessions = TrainingSessionsManager.getSessions();
      setTrainingSessions(sessions);
      toast.success(`Loaded ${sessions.length} training sessions`);
    } catch (error: any) {
      toast.error(`Error loading training sessions: ${error.message}`);
      console.error("Error initializing training data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...trainingSessions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.training_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Apply authority filter
    if (authorityFilter !== 'all') {
      filtered = filtered.filter(session => session.authority === authorityFilter);
    }

    setFilteredSessions(filtered);
  };

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const handleCreateSession = () => {
    toast.info("Create session functionality will be implemented next");
  };

  const handleImportSessions = () => {
    toast.info("Import sessions functionality will be implemented next");
  };

  const handleExportSessions = () => {
    const csvContent = generateCSVExport();
    downloadCSV(csvContent, 'training_sessions.csv');
    toast.success("Training sessions exported to CSV");
  };

  const generateCSVExport = (): string => {
    const headers = [
      'ID', 'Training Type', 'Authority', 'Date', 'Start Time', 'End Time',
      'Total Seats', 'Available Seats', 'Location', 'Instructor', 'Status'
    ];
    
    const rows = filteredSessions.map(session => [
      session.id,
      session.training_type,
      session.authority,
      session.session_date,
      session.start_time,
      session.end_time,
      session.total_seats,
      session.available_seats,
      session.location,
      session.instructor,
      session.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'scheduled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const uniqueAuthorities = [...new Set(trainingSessions.map(s => s.authority))];

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Training Metrics */}
      <TrainingMetrics />

      {/* Action Buttons and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-2xl font-bold">Enhanced Training Management</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Authority Filter */}
          <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Authorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authorities</SelectItem>
              {uniqueAuthorities.map(authority => (
                <SelectItem key={authority} value={authority}>{authority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Action Buttons */}
          <Button variant="outline" size="sm" onClick={handleImportSessions}>
            <Upload className="h-4 w-4 mr-2" />
            Import
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

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredSessions.length} of {trainingSessions.length} training sessions
      </div>

      {/* Training Gantt Chart */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Training Schedule Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <TrainingGanttChart 
            sessions={filteredSessions}
            onSessionClick={handleSessionClick}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Training Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Training Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div 
                  key={session.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">{session.training_type}</h3>
                        <Badge variant="outline">{session.authority}</Badge>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
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
              
              {filteredSessions.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No training sessions found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Session Modal */}
      <TrainingSessionModal
        open={showSessionModal}
        onOpenChange={setShowSessionModal}
        session={selectedSession}
        onSessionUpdate={initializeTrainingData}
      />
    </div>
  );
};
