
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Plus, Calendar as CalendarIcon, Users, BookOpen, Award,
  Clock, MapPin, User, Edit, Trash2, Filter, Search,
  CheckCircle, XCircle, AlertCircle, Download, Upload
} from "lucide-react";

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Mock data interfaces
interface TrainingSession {
  id: string;
  title: string;
  type: string;
  instructor: string;
  location: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  description: string;
  prerequisites: string[];
  materials: string[];
}

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  trainingHistory: TrainingRecord[];
}

interface TrainingRecord {
  sessionId: string;
  sessionTitle: string;
  completedDate: Date;
  score: number;
  certificateIssued: boolean;
  expiryDate?: Date;
}

interface TrainingType {
  id: string;
  name: string;
  category: string;
  duration: number; // in hours
  validityPeriod: number; // in months
  isMandatory: boolean;
  description: string;
}

// Mock data
const mockTrainingSessions: TrainingSession[] = [
  {
    id: '1',
    title: 'Safety Protocols Training',
    type: 'Safety',
    instructor: 'John Smith',
    location: 'Training Room A',
    startDate: new Date(2024, 5, 15, 9, 0),
    endDate: new Date(2024, 5, 15, 17, 0),
    maxParticipants: 20,
    currentParticipants: 15,
    status: 'Scheduled',
    description: 'Comprehensive safety protocols for aircraft maintenance',
    prerequisites: ['Basic Safety Certification'],
    materials: ['Safety Manual', 'PPE Kit']
  },
  {
    id: '2',
    title: 'Engine Maintenance Certification',
    type: 'Technical',
    instructor: 'Sarah Johnson',
    location: 'Hangar B',
    startDate: new Date(2024, 5, 20, 8, 0),
    endDate: new Date(2024, 5, 22, 16, 0),
    maxParticipants: 12,
    currentParticipants: 8,
    status: 'Scheduled',
    description: 'Advanced engine maintenance and troubleshooting',
    prerequisites: ['Basic Mechanics', 'Tool Safety'],
    materials: ['Engine Manual', 'Diagnostic Tools']
  },
  {
    id: '3',
    title: 'Quality Assurance Workshop',
    type: 'Quality',
    instructor: 'Mike Davis',
    location: 'Conference Room C',
    startDate: new Date(2024, 5, 10, 10, 0),
    endDate: new Date(2024, 5, 10, 15, 0),
    maxParticipants: 25,
    currentParticipants: 25,
    status: 'Completed',
    description: 'Quality control processes and documentation',
    prerequisites: [],
    materials: ['QA Handbook', 'Checklists']
  }
];

const mockEmployees: Employee[] = [
  {
    id: 'emp1',
    name: 'Alex Thompson',
    department: 'Maintenance',
    position: 'Senior Technician',
    email: 'alex.thompson@company.com',
    trainingHistory: [
      {
        sessionId: '3',
        sessionTitle: 'Quality Assurance Workshop',
        completedDate: new Date(2024, 5, 10),
        score: 95,
        certificateIssued: true,
        expiryDate: new Date(2025, 5, 10)
      }
    ]
  },
  {
    id: 'emp2',
    name: 'Maria Garcia',
    department: 'Engineering',
    position: 'Aircraft Engineer',
    email: 'maria.garcia@company.com',
    trainingHistory: []
  }
];

const mockTrainingTypes: TrainingType[] = [
  {
    id: 'tt1',
    name: 'Safety Protocols',
    category: 'Safety',
    duration: 8,
    validityPeriod: 12,
    isMandatory: true,
    description: 'Essential safety procedures and protocols'
  },
  {
    id: 'tt2',
    name: 'Engine Maintenance',
    category: 'Technical',
    duration: 24,
    validityPeriod: 24,
    isMandatory: true,
    description: 'Comprehensive engine maintenance training'
  },
  {
    id: 'tt3',
    name: 'Quality Assurance',
    category: 'Quality',
    duration: 6,
    validityPeriod: 18,
    isMandatory: false,
    description: 'Quality control and assurance processes'
  }
];

const TrainingManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<TrainingSession[]>(mockTrainingSessions);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>(mockTrainingTypes);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isAssignEmployeeOpen, setIsAssignEmployeeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [calendarView, setCalendarView] = useState('month');

  // Form states
  const [newSession, setNewSession] = useState<Partial<TrainingSession>>({
    title: '',
    type: '',
    instructor: '',
    location: '',
    startDate: new Date(),
    endDate: new Date(),
    maxParticipants: 20,
    description: '',
    prerequisites: [],
    materials: []
  });

  // Filter sessions based on search and type
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || session.type === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate training metrics
  const metrics = {
    totalSessions: sessions.length,
    upcomingSessions: sessions.filter(s => s.status === 'Scheduled').length,
    completedSessions: sessions.filter(s => s.status === 'Completed').length,
    totalParticipants: sessions.reduce((sum, s) => sum + s.currentParticipants, 0),
    averageUtilization: Math.round(
      (sessions.reduce((sum, s) => sum + (s.currentParticipants / s.maxParticipants), 0) / sessions.length) * 100
    ),
    upcomingDeadlines: sessions.filter(s => {
      const timeDiff = s.startDate.getTime() - new Date().getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      return daysDiff <= 7 && daysDiff > 0;
    }).length
  };

  // Create new training session
  const handleCreateSession = () => {
    if (newSession.title && newSession.startDate && newSession.endDate) {
      const session: TrainingSession = {
        id: Date.now().toString(),
        title: newSession.title || '',
        type: newSession.type || '',
        instructor: newSession.instructor || '',
        location: newSession.location || '',
        startDate: newSession.startDate,
        endDate: newSession.endDate,
        maxParticipants: newSession.maxParticipants || 20,
        currentParticipants: 0,
        status: 'Scheduled',
        description: newSession.description || '',
        prerequisites: newSession.prerequisites || [],
        materials: newSession.materials || []
      };
      
      setSessions([...sessions, session]);
      setNewSession({
        title: '',
        type: '',
        instructor: '',
        location: '',
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 20,
        description: '',
        prerequisites: [],
        materials: []
      });
      setIsCreateSessionOpen(false);
    }
  };

  // Calendar events for react-big-calendar
  const calendarEvents = sessions.map(session => ({
    id: session.id,
    title: session.title,
    start: session.startDate,
    end: session.endDate,
    resource: session
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled': return <XCircle className="h-4 w-4" />;
      case 'In Progress': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Training Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage training sessions, schedules, and employee certifications</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Training Session</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={newSession.title || ''}
                    onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                    placeholder="Enter session title"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Training Type</Label>
                  <Select value={newSession.type || ''} onValueChange={(value) => setNewSession({...newSession, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Safety">Safety</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Quality">Quality</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={newSession.instructor || ''}
                    onChange={(e) => setNewSession({...newSession, instructor: e.target.value})}
                    placeholder="Instructor name"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newSession.location || ''}
                    onChange={(e) => setNewSession({...newSession, location: e.target.value})}
                    placeholder="Training location"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={newSession.startDate ? format(newSession.startDate, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setNewSession({...newSession, startDate: new Date(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newSession.endDate ? format(newSession.endDate, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setNewSession({...newSession, endDate: new Date(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={newSession.maxParticipants || 20}
                    onChange={(e) => setNewSession({...newSession, maxParticipants: parseInt(e.target.value)})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSession.description || ''}
                    onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                    placeholder="Session description"
                    rows={3}
                  />
                </div>
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateSessionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSession}>
                    Create Session
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.totalSessions}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.upcomingSessions}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.completedSessions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Participants</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.totalParticipants}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilization</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.averageUtilization}%</p>
              </div>
              <Award className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.upcomingDeadlines}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="types">Training Types</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusIcon(session.status)}
                      <span className="ml-1">{session.status}</span>
                    </Badge>
                  </div>
                  <Badge variant="outline" className="w-fit">{session.type}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>{session.instructor}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{format(session.startDate, 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {Math.round((session.endDate.getTime() - session.startDate.getTime()) / (1000 * 60 * 60))}h duration
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{session.currentParticipants}</span>
                      <span className="text-gray-500">/{session.maxParticipants} participants</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Dialog open={isAssignEmployeeOpen} onOpenChange={setIsAssignEmployeeOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Users className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Employees to {session.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {employees.map((employee) => (
                              <div key={employee.id} className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <p className="font-medium">{employee.name}</p>
                                  <p className="text-sm text-gray-500">{employee.department} - {employee.position}</p>
                                </div>
                                <Button size="sm" variant="outline">
                                  Assign
                                </Button>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {session.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {session.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Training Calendar</h2>
            <div className="flex space-x-2">
              <Button
                variant={calendarView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarView('month')}
              >
                Month
              </Button>
              <Button
                variant={calendarView === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarView('week')}
              >
                Week
              </Button>
              <Button
                variant={calendarView === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarView('day')}
              >
                Day
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  view={calendarView as any}
                  onView={setCalendarView as any}
                  onSelectEvent={(event) => setSelectedSession(event.resource)}
                  eventPropGetter={(event) => ({
                    style: {
                      backgroundColor: event.resource.status === 'Completed' ? '#10b981' : 
                                     event.resource.status === 'Cancelled' ? '#ef4444' : '#3b82f6',
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Employee Training Records</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>

          <div className="grid gap-4">
            {employees.map((employee) => (
              <Card key={employee.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{employee.name}</CardTitle>
                      <p className="text-gray-600 dark:text-gray-400">{employee.department} - {employee.position}</p>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                    <Badge variant="outline">
                      {employee.trainingHistory.length} completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">Training History</h4>
                    {employee.trainingHistory.length > 0 ? (
                      <div className="space-y-2">
                        {employee.trainingHistory.map((record, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div>
                              <p className="font-medium">{record.sessionTitle}</p>
                              <p className="text-sm text-gray-500">
                                Completed: {format(record.completedDate, 'MMM dd, yyyy')}
                                {record.expiryDate && (
                                  <span> • Expires: {format(record.expiryDate, 'MMM dd, yyyy')}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">Score: {record.score}%</Badge>
                              {record.certificateIssued && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Award className="h-3 w-3 mr-1" />
                                  Certified
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No training records found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Training Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Training Types Configuration</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Training Type
            </Button>
          </div>

          <div className="grid gap-4">
            {trainingTypes.map((type) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium">{type.name}</h3>
                        <Badge variant="outline">{type.category}</Badge>
                        {type.isMandatory && (
                          <Badge className="bg-red-100 text-red-800">Mandatory</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{type.description}</p>
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <span>Duration: {type.duration} hours</span>
                        <span>Validity: {type.validityPeriod} months</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Training Analytics & Reports</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Training Completion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trainingTypes.map((type) => {
                    const typeSessions = sessions.filter(s => s.type === type.category);
                    const completedSessions = typeSessions.filter(s => s.status === 'Completed');
                    const completionRate = typeSessions.length > 0 
                      ? Math.round((completedSessions.length / typeSessions.length) * 100)
                      : 0;
                    
                    return (
                      <div key={type.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{type.category}</span>
                          <span className="text-sm text-gray-500">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Training Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions
                    .filter(s => {
                      const timeDiff = s.startDate.getTime() - new Date().getTime();
                      const daysDiff = timeDiff / (1000 * 3600 * 24);
                      return daysDiff <= 30 && daysDiff > 0;
                    })
                    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                    .slice(0, 5)
                    .map((session) => {
                      const daysUntil = Math.ceil((session.startDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      return (
                        <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div>
                            <p className="font-medium">{session.title}</p>
                            <p className="text-sm text-gray-500">{format(session.startDate, 'MMM dd, yyyy')}</p>
                          </div>
                          <Badge variant={daysUntil <= 7 ? 'destructive' : 'outline'}>
                            {daysUntil} days
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Training Rooms</span>
                      <span className="text-sm text-gray-500">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full w-[85%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Instructors</span>
                      <span className="text-sm text-gray-500">72%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full w-[72%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Equipment</span>
                      <span className="text-sm text-gray-500">91%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-[91%]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees.slice(0, 5).map((employee) => {
                    const completedTrainings = employee.trainingHistory.length;
                    const progressPercentage = Math.min((completedTrainings / 5) * 100, 100); // Assuming 5 trainings as target
                    
                    return (
                      <div key={employee.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{employee.name}</span>
                          <span className="text-sm text-gray-500">{completedTrainings}/5</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingManagementSystem;
