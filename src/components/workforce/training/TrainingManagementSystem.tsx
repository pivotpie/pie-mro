import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen, Clock, Search, Plus, Edit, Trash2, UserPlus, UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface Employee {
  id: number;
  name: string;
  e_number: string;
  department?: string;
  position?: string;
}

interface TrainingSession {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_attendees?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendees?: Employee[];
  created_at: string;
  updated_at: string;
}

interface TrainingAttendance {
  id: number;
  session_id: number;
  employee_id: number;
  status: 'registered' | 'attended' | 'absent' | 'cancelled';
  created_at: string;
}

export const TrainingManagementSystem = () => {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [newSession, setNewSession] = useState<Partial<TrainingSession>>({});
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapSessionId, setSwapSessionId] = useState<number | null>(null);
  const [employeeToReplace, setEmployeeToReplace] = useState<Employee | null>(null);
  const [showAllEmployees, setShowAllEmployees] = useState(false);

  useEffect(() => {
    fetchTrainingSessions();
    fetchEmployees();
  }, []);

  const fetchTrainingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          training_attendance (
            employee_id,
            status,
            employees (
              id,
              name,
              e_number,
              department,
              position
            )
          )
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const sessionsWithAttendees = data?.map(session => ({
        ...session,
        attendees: session.training_attendance
          ?.filter(attendance => attendance.status === 'registered' || attendance.status === 'attended')
          .map(attendance => attendance.employees)
          .filter(Boolean) || []
      })) || [];

      setTrainingSessions(sessionsWithAttendees);
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      toast.error('Failed to fetch training sessions');
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, e_number, department, position')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!newSession.title || !newSession.start_date || !newSession.end_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .insert([{
          title: newSession.title,
          description: newSession.description,
          start_date: newSession.start_date,
          end_date: newSession.end_date,
          location: newSession.location,
          max_attendees: newSession.max_attendees,
          status: 'scheduled'
        }])
        .select()
        .single();

      if (error) throw error;

      // Add selected employees to the session
      if (selectedEmployees.length > 0) {
        const attendanceRecords = selectedEmployees.map(employeeId => ({
          session_id: data.id,
          employee_id: employeeId,
          status: 'registered'
        }));

        const { error: attendanceError } = await supabase
          .from('training_attendance')
          .insert(attendanceRecords);

        if (attendanceError) throw attendanceError;
      }

      toast.success('Training session created successfully');
      setIsAddSessionOpen(false);
      setNewSession({});
      setSelectedEmployees([]);
      fetchTrainingSessions();
    } catch (error) {
      console.error('Error creating training session:', error);
      toast.error('Failed to create training session');
    }
  };

  const handleUpdateSession = async () => {
    try {
      if (!editingSession) return;

      const { error } = await supabase
        .from('training_sessions')
        .update({
          title: editingSession.title,
          description: editingSession.description,
          start_date: editingSession.start_date,
          end_date: editingSession.end_date,
          location: editingSession.location,
          max_attendees: editingSession.max_attendees,
          status: editingSession.status
        })
        .eq('id', editingSession.id);

      if (error) throw error;

      toast.success('Training session updated successfully');
      setIsEditSessionOpen(false);
      setEditingSession(null);
      fetchTrainingSessions();
    } catch (error) {
      console.error('Error updating training session:', error);
      toast.error('Failed to update training session');
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      // First delete attendance records
      const { error: attendanceError } = await supabase
        .from('training_attendance')
        .delete()
        .eq('session_id', sessionId);

      if (attendanceError) throw attendanceError;

      // Then delete the session
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Training session deleted successfully');
      fetchTrainingSessions();
    } catch (error) {
      console.error('Error deleting training session:', error);
      toast.error('Failed to delete training session');
    }
  };

  const handleAddEmployeeToSession = async (sessionId: number, employeeId: number) => {
    try {
      const { error } = await supabase
        .from('training_attendance')
        .insert([{
          session_id: sessionId,
          employee_id: employeeId,
          status: 'registered'
        }]);

      if (error) throw error;

      toast.success('Employee added to training session');
      fetchTrainingSessions();
    } catch (error) {
      console.error('Error adding employee to session:', error);
      toast.error('Failed to add employee to session');
    }
  };

  const handleRemoveEmployeeFromSession = async (sessionId: number, employeeId: number) => {
    try {
      const { error } = await supabase
        .from('training_attendance')
        .delete()
        .eq('session_id', sessionId)
        .eq('employee_id', employeeId);

      if (error) throw error;

      toast.success('Employee removed from training session');
      fetchTrainingSessions();
    } catch (error) {
      console.error('Error removing employee from session:', error);
      toast.error('Failed to remove employee from session');
    }
  };

  const handleSwapEmployee = async (sessionId: number, oldEmployee: Employee, newEmployee: Employee) => {
    try {
      // Remove old employee
      await handleRemoveEmployeeFromSession(sessionId, oldEmployee.id);
      
      // Add new employee
      await handleAddEmployeeToSession(sessionId, newEmployee.id);
      
      toast.success(`Swapped ${oldEmployee.name} with ${newEmployee.name}`);
      handleCloseSwapModal();
    } catch (error) {
      console.error('Error swapping employee:', error);
      toast.error('Failed to swap employee');
    }
  };

  const handleOpenSwapModal = (sessionId: number, employee: Employee) => {
    setSwapSessionId(sessionId);
    setEmployeeToReplace(employee);
    setShowAllEmployees(false);
    setIsSwapModalOpen(true);
  };

  const handleCloseSwapModal = () => {
    setIsSwapModalOpen(false);
    setSwapSessionId(null);
    setEmployeeToReplace(null);
    setShowAllEmployees(false);
  };

  const getAvailableEmployeesForSwap = () => {
    if (showAllEmployees) {
      return allEmployees.filter(emp => employeeToReplace && emp.id !== employeeToReplace.id);
    }
    
    if (!swapSessionId || !employeeToReplace) return [];
    
    const session = trainingSessions.find(s => s.id === swapSessionId);
    if (!session) return [];
    
    const sessionEmployeeIds = session.attendees?.map(a => a.id) || [];
    return allEmployees.filter(emp => 
      !sessionEmployeeIds.includes(emp.id) && 
      emp.id !== employeeToReplace.id
    );
  };

  const filteredSessions = trainingSessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Management</h1>
          <p className="text-muted-foreground">Manage training sessions and employee attendance</p>
        </div>
        <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Training Session</DialogTitle>
              <DialogDescription>
                Add a new training session and assign employees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newSession.title || ''}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    placeholder="Training session title"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newSession.location || ''}
                    onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                    placeholder="Training location"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSession.description || ''}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  placeholder="Training session description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={newSession.start_date || ''}
                    onChange={(e) => setNewSession({ ...newSession, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={newSession.end_date || ''}
                    onChange={(e) => setNewSession({ ...newSession, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_attendees">Max Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  value={newSession.max_attendees || ''}
                  onChange={(e) => setNewSession({ ...newSession, max_attendees: parseInt(e.target.value) })}
                  placeholder="Maximum number of attendees"
                />
              </div>

              <div>
                <Label>Select Employees</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {employees.map(employee => (
                    <div key={employee.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees([...selectedEmployees, employee.id]);
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                          }
                        }}
                      />
                      <Label htmlFor={`employee-${employee.id}`} className="flex-1">
                        {employee.name} ({employee.e_number})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddSessionOpen(false)}>
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

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search training sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Training Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4">
            {filteredSessions.map(session => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {session.title}
                      </CardTitle>
                      <CardDescription>{session.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(session.status)}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSession(session);
                          setIsEditSessionOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(session.start_date).toLocaleTimeString()} - {new Date(session.end_date).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {session.attendees?.length || 0} attendees
                        {session.max_attendees && ` / ${session.max_attendees} max`}
                      </span>
                    </div>
                  </div>

                  {session.location && (
                    <div className="mb-4">
                      <span className="text-sm text-muted-foreground">Location: </span>
                      <span className="text-sm">{session.location}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Attendees</h4>
                      <Select onValueChange={(value) => handleAddEmployeeToSession(session.id, parseInt(value))}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Add employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees
                            .filter(emp => !session.attendees?.some(att => att.id === emp.id))
                            .map(employee => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.name} ({employee.e_number})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {session.attendees?.map(attendee => (
                        <div key={attendee.id} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
                          <span className="text-sm">{attendee.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleOpenSwapModal(session.id, attendee)}
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleRemoveEmployeeFromSession(session.id, attendee.id)}
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trainingSessions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trainingSessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Attendees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trainingSessions.reduce((total, session) => total + (session.attendees?.length || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditSessionOpen} onOpenChange={setIsEditSessionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Training Session</DialogTitle>
            <DialogDescription>
              Update training session details
            </DialogDescription>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingSession.title}
                    onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editingSession.location || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, location: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingSession.description || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start-date">Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="datetime-local"
                    value={editingSession.start_date}
                    onChange={(e) => setEditingSession({ ...editingSession, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end-date">End Date</Label>
                  <Input
                    id="edit-end-date"
                    type="datetime-local"
                    value={editingSession.end_date}
                    onChange={(e) => setEditingSession({ ...editingSession, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-max-attendees">Max Attendees</Label>
                  <Input
                    id="edit-max-attendees"
                    type="number"
                    value={editingSession.max_attendees || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, max_attendees: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingSession.status}
                    onValueChange={(value) => setEditingSession({ ...editingSession, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditSessionOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSession}>
                  Update Session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSwapModalOpen} onOpenChange={handleCloseSwapModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Swap Employee</DialogTitle>
            <DialogDescription>
              Replace {employeeToReplace?.name} with another employee
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="choose-others"
                checked={showAllEmployees}
                onCheckedChange={setShowAllEmployees}
              />
              <Label htmlFor="choose-others">Choose others</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Select Replacement Employee</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {getAvailableEmployeesForSwap().map(employee => (
                  <Button
                    key={employee.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSwapEmployee(swapSessionId!, employeeToReplace!, employee)}
                  >
                    <span className="font-medium">{employee.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({employee.e_number})
                    </span>
                  </Button>
                ))}
              </div>
              {getAvailableEmployeesForSwap().length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {showAllEmployees 
                    ? "No other employees available" 
                    : "No available employees for this session"
                  }
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
