import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Users, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, Plus, Filter, Search, ChevronLeft, ChevronRight, Download, Upload, Settings, Bell, BarChart3, TrendingUp, Shield, Award, AlertCircle, FileText, Target, Zap, Globe, BookOpen, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Comprehensive training sessions data
const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchTrainingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          training_types(name),
          training_authorities(authority_name)
        `)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      // Transform data to match expected format
      const transformedSessions = data?.map(session => ({
        id: session.id,
        code: session.session_code,
        name: session.session_name,
        authority: session.training_authorities?.authority_name || 'Unknown',
        location: session.location,
        start_date: session.start_date,
        end_date: session.end_date,
        max_participants: session.max_participants,
        assigned: session.assigned || 0, // You'll need to calculate this
        status: session.status,
        instructor: session.instructor_name,
        category: session.training_types?.name || 'General',
        prerequisites: session.prerequisites?.split(',') || [],
        recurrent: session.is_mandatory,
        simulator_hours: session.duration_hours || 0,
        theory_hours: session.duration_hours || 0,
        practical_hours: session.duration_hours || 0,
        equipment: session.materials_required,
        rating: 4.5, // You'll need rating logic
        priority: session.priority_level === 1 ? 'Critical' : 
                 session.priority_level === 2 ? 'High' : 
                 session.priority_level === 3 ? 'Medium' : 'Low'
      })) || [];
      
      setTrainingSessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching training sessions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchTrainingSessions();
}, []);


// Comprehensive employee data
const [employees, setEmployees] = useState<any[]>([]);

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          teams(team_name),
          job_titles(job_description)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const transformedEmployees = data?.map(emp => ({
        id: emp.id,
        e_number: emp.e_number,
        name: emp.name,
        job_title: emp.job_titles?.job_description || 'Unknown',
        team: emp.teams?.team_name || 'No Team',
        department: emp.profit_center || 'Unknown',
        shift: 'Day', // You'll need shift logic
        nationality: emp.nationality,
        hire_date: emp.date_of_joining,
        supervisor: 'Unknown', // You'll need supervisor logic
        location: 'Unknown', // You'll need location logic
        phone: emp.mobile_number,
        email: `${emp.name?.toLowerCase().replace(' ', '.')}@company.com`,
        // Add other fields as needed
      })) || [];
      
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };
  
  fetchEmployees();
}, []);


// Training locations with more detail
const trainingLocations = [
  { id: 'easa', name: 'EASA Training Centers', color: 'bg-blue-500', capacity: 150, utilization: 78, rating: 4.7, sessions_count: 6 },
  { id: 'gcaa', name: 'GCAA Training Centers', color: 'bg-green-500', capacity: 120, utilization: 82, rating: 4.5, sessions_count: 4 },
  { id: 'faa', name: 'FAA Training Centers', color: 'bg-purple-500', capacity: 100, utilization: 65, rating: 4.6, sessions_count: 3 },
  { id: 'ukcaa', name: 'UK CAA Training Centers', color: 'bg-orange-500', capacity: 80, utilization: 70, rating: 4.8, sessions_count: 2 },
  { id: 'boeing', name: 'Boeing Training Centers', color: 'bg-indigo-500', capacity: 40, utilization: 45, rating: 5.0, sessions_count: 1 },
  { id: 'airbus', name: 'Airbus Training Centers', color: 'bg-cyan-500', capacity: 50, utilization: 60, rating: 4.9, sessions_count: 1 },
  { id: 'oem', name: 'OEM/Other Training Centers', color: 'bg-pink-500', capacity: 60, utilization: 55, rating: 4.7, sessions_count: 3 }
];

const statusColors = {
  'Scheduled': 'bg-yellow-400',
  'Confirmed': 'bg-green-400', 
  'In Progress': 'bg-blue-400',
  'Completed': 'bg-gray-400',
  'Open': 'bg-red-300',
  'Cancelled': 'bg-red-500',
  'Waitlist': 'bg-orange-300'
};

const TrainingManagementSystem = () => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedEmployeeForSwap, setSelectedEmployeeForSwap] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025
  const [viewMode, setViewMode] = useState('gantt'); // gantt, calendar, list
  const [assignedEmployees, setAssignedEmployees] = useState({
    1: [1, 2, 4], 2: [3, 5, 7], 3: [6, 8, 9], 4: [1, 10], 5: [2, 3, 6], 6: [4, 7], 7: [5, 8], 8: [9, 10, 1], 9: [2], 10: [3, 4], 11: [5, 6, 7], 12: [8, 9], 13: [10, 1, 2], 14: [3], 15: [4, 5], 16: [6, 7, 8], 17: [9, 10], 18: [1, 3], 19: [2, 4, 5], 20: [6, 7]
  });
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const ganttRef = useRef(null);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalSessions = mockTrainingSessions.length;
    const totalAssigned = Object.values(assignedEmployees).reduce((sum, arr) => sum + arr.length, 0);
    const totalCapacity = mockTrainingSessions.reduce((sum, session) => sum + session.max_participants, 0);
    const utilization = Math.round((totalAssigned / totalCapacity) * 100);
    
    const expiringEmployees = mockEmployees.filter(emp => 
      emp.certifications.some(cert => cert.days_to_expire < 90 && cert.days_to_expire > 0)
    ).length;
    
    const expiredEmployees = mockEmployees.filter(emp => 
      emp.certifications.some(cert => cert.days_to_expire < 0)
    ).length;

    const averageRating = mockTrainingSessions.reduce((sum, session) => sum + session.rating, 0) / totalSessions;

    return {
      totalSessions,
      totalAssigned,
      totalCapacity,
      utilization,
      expiringEmployees,
      expiredEmployees,
      averageRating,
      availableSeats: totalCapacity - totalAssigned
    };
  }, [assignedEmployees]);

  // Generate timeline for Gantt chart
  const generateTimeline = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(1);
    const timeline = [];
    
    for (let i = 0; i < 120; i++) { // Show 120 days (4 months)
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      timeline.push({
        date: date,
        dateStr: date.toISOString().split('T')[0],
        day: date.getDate(),
        month: date.getMonth(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    return timeline;
  };

  const timeline = generateTimeline();

  // Calculate position and width for training sessions
  const getSessionPosition = (session) => {
    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);
    const timelineStart = timeline[0].date;
    
    const startDiff = Math.floor((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      left: `${(startDiff * 35)}px`, // 35px per day
      width: `${(duration * 35) - 2}px` // -2px for border
    };
  };

  // Filter sessions based on current filters
  const filteredSessions = useMemo(() => {
    return mockTrainingSessions.filter(session => {
      const matchesFilter = filterBy === 'all' || session.authority.toLowerCase() === filterBy.toLowerCase();
      const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           session.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = selectedPriority === 'all' || session.priority.toLowerCase() === selectedPriority.toLowerCase();
      const matchesStatus = selectedStatus === 'all' || session.status.toLowerCase() === selectedStatus.toLowerCase();
      
      return matchesFilter && matchesSearch && matchesPriority && matchesStatus;
    });
  }, [filterBy, searchTerm, selectedPriority, selectedStatus]);

  // Group sessions by location
  const sessionsByLocation = useMemo(() => {
    const grouped = {};
    trainingLocations.forEach(location => {
      if (location.id === 'oem') {
        grouped[location.id] = filteredSessions.filter(session => 
          ['Boeing', 'Airbus', 'CFM International'].includes(session.authority)
        );
      } else {
        grouped[location.id] = filteredSessions.filter(session => 
          session.location.toLowerCase().includes(location.name.split(' ')[0].toLowerCase())
        );
      }
    });
    return grouped;
  }, [filteredSessions]);

  const navigateTime = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEmployeePriority = (employee, sessionType) => {
    const relevantCerts = employee.certifications.filter(cert => 
      sessionType.includes(cert.code) || sessionType.includes(cert.aircraft)
    );
    
    if (relevantCerts.length === 0) return 0;
    
    const expiringCerts = relevantCerts.filter(cert => cert.days_to_expire < 90);
    const expiredCerts = relevantCerts.filter(cert => cert.days_to_expire < 0);
    
    return employee.priority_score + (expiringCerts.length * 20) + (expiredCerts.length * 50);
  };

  const sortedEmployeesForSession = useMemo(() => {
    if (!selectedSession) return [];
    
    return mockEmployees
      .map(emp => ({
        ...emp,
        relevance: getEmployeePriority(emp, selectedSession.name),
        isAssigned: assignedEmployees[selectedSession.id]?.includes(emp.id) || false
      }))
      .sort((a, b) => b.relevance - a.relevance);
  }, [selectedSession, assignedEmployees]);

  const handleAssignEmployee = (employeeId) => {
    if (!selectedSession) return;
    
    setAssignedEmployees(prev => ({
      ...prev,
      [selectedSession.id]: [...(prev[selectedSession.id] || []), employeeId]
    }));
  };

  const handleUnassignEmployee = (employeeId) => {
    if (!selectedSession) return;
    
    setAssignedEmployees(prev => ({
      ...prev,
      [selectedSession.id]: (prev[selectedSession.id] || []).filter(id => id !== employeeId)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Valid': return 'text-green-600 bg-green-100';
      case 'Expiring Soon': return 'text-orange-600 bg-orange-100';
      case 'Expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAuthorityColor = (authority) => {
    switch (authority) {
      case 'EASA': return 'bg-blue-100 text-blue-800';
      case 'GCAA': return 'bg-green-100 text-green-800';
      case 'FAA': return 'bg-purple-100 text-purple-800';
      case 'UK CAA': return 'bg-orange-100 text-orange-800';
      case 'Boeing': return 'bg-indigo-100 text-indigo-800';
      case 'Airbus': return 'bg-cyan-100 text-cyan-800';
      case 'CFM International': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-100';
      case 'High': return 'text-orange-700 bg-orange-100';
      case 'Medium': return 'text-yellow-700 bg-yellow-100';
      case 'Low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Training Management System</h1>
            <p className="text-gray-600">Enterprise-grade training schedule, certification tracking, and workforce development</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAnalyticsModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Session
            </button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalSessions}</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalAssigned}</p>
                <p className="text-xs text-green-600">{analytics.utilization}% utilization</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.expiringEmployees}</p>
                <p className="text-xs text-orange-600">Within 90 days</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.expiredEmployees}</p>
                <p className="text-xs text-red-600">Immediate action</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Seats</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.availableSeats}</p>
                <p className="text-xs text-purple-600">Ready to fill</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
                <p className="text-xs text-yellow-600">Training quality</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">94%</p>
                <p className="text-xs text-indigo-600">Success metric</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'gantt' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Gantt Chart
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTime(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
              >
                Today
              </button>
              <button
                onClick={() => navigateTime(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="text-lg font-semibold ml-4">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="flex items-center gap-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Authorities</option>
              <option value="easa">EASA</option>
              <option value="gcaa">GCAA</option>
              <option value="faa">FAA</option>
              <option value="uk caa">UK CAA</option>
              <option value="boeing">Boeing</option>
              <option value="airbus">Airbus</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="open">Open</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-300 rounded"></div>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Completed</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredSessions.length} of {mockTrainingSessions.length} training sessions
          </div>
        </div>
      </div>

      {/* Enhanced Gantt Chart */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex">
            {/* Enhanced Location Labels */}
            <div className="w-80 bg-gray-50 border-r">
              <div className="h-20 border-b flex items-center px-4 bg-gray-100">
                <h3 className="font-semibold text-gray-900">Training Centers</h3>
              </div>
              {trainingLocations.map(location => (
                <div key={location.id} className="h-20 border-b flex items-center px-4 hover:bg-gray-100">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-4 h-4 rounded ${location.color}`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span>Capacity: {location.capacity}</span>
                        <span>Util: {location.utilization}%</span>
                        <span>★ {location.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Timeline and Sessions */}
            <div className="flex-1 overflow-x-auto" ref={ganttRef}>
              <div style={{ width: `${timeline.length * 35}px` }}>
                {/* Enhanced Timeline Header */}
                <div className="h-20 border-b bg-gray-100">
                  <div className="flex">
                    {timeline.map((day, index) => (
                      <div
                        key={index}
                        className={`w-8.75 border-r text-xs text-center ${
                          day.isWeekend ? 'bg-gray-200' : ''
                        } ${day.isToday ? 'bg-blue-100 border-blue-300' : ''}`}
                        style={{ width: '35px' }}
                      >
                        <div className="pt-1">
                          <div className={`font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
                            {day.day}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {day.day === 1 ? day.date.toLocaleDateString('en-US', { month: 'short' }) : ''}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {day.date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Session Rows */}
                {trainingLocations.map(location => (
                  <div key={location.id} className="h-20 border-b relative">
                    {/* Weekend and today highlighting */}
                    {timeline.map((day, index) => (
                      <div
                        key={index}
                        className={`absolute h-full border-r ${
                          day.isWeekend ? 'bg-gray-100' : ''
                        } ${day.isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}
                        style={{ left: `${index * 35}px`, width: '35px' }}
                      ></div>
                    ))}
                    
                    {/* Enhanced Training Sessions */}
                    {sessionsByLocation[location.id]?.map(session => {
                      const position = getSessionPosition(session);
                      const assignedCount = assignedEmployees[session.id]?.length || 0;
                      const utilizationPercent = Math.round((assignedCount / session.max_participants) * 100);
                      
                      return (
                        <div
                          key={session.id}
                          className={`absolute h-16 top-2 rounded-lg cursor-pointer border-2 border-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${statusColors[session.status]} flex items-center px-3`}
                          style={position}
                          onClick={() => {
                            setSelectedSession(session);
                            setShowSessionModal(true);
                          }}
                          title={`${session.name}\nStatus: ${session.status}\nUtilization: ${utilizationPercent}%\nInstructor: ${session.instructor}\nRating: ⭐ ${session.rating}/5.0`}
                        >
                          <div className="text-xs font-medium text-white w-full">
                            <div className="truncate font-bold">{session.code}</div>
                            <div className="flex justify-between items-center text-xs opacity-90">
                              <span>{assignedCount}/{session.max_participants}</span>
                              <span className={`px-1 py-0.5 rounded text-xs ${getPriorityColor(session.priority)} bg-opacity-80`}>
                                {session.priority[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
              {timeline.slice(0, 42).map((day, index) => (
                <div
                  key={index}
                  className={`min-h-32 border rounded-lg p-2 ${
                    day.isWeekend ? 'bg-gray-50' : 'bg-white'
                  } ${day.isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className={`text-sm font-medium mb-2 ${day.isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.day}
                  </div>
                  <div className="space-y-1">
                    {filteredSessions
                      .filter(session => 
                        day.dateStr >= session.start_date && day.dateStr <= session.end_date
                      )
                      .map(session => {
                        const assignedCount = assignedEmployees[session.id]?.length || 0;
                        return (
                          <div
                            key={session.id}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${statusColors[session.status]} text-white`}
                            onClick={() => {
                              setSelectedSession(session);
                              setShowSessionModal(true);
                            }}
                            title={session.name}
                          >
                            <div className="truncate font-medium">{session.code}</div>
                            <div className="text-xs opacity-90">{assignedCount}/{session.max_participants}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Authority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSessions.map(session => {
                  const assignedCount = assignedEmployees[session.id]?.length || 0;
                  const utilizationPercent = Math.round((assignedCount / session.max_participants) * 100);
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{session.name}</div>
                          <div className="text-sm text-gray-500">{session.code}</div>
                          <div className="text-xs text-gray-400">Instructor: {session.instructor}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAuthorityColor(session.authority)}`}>
                          {session.authority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{session.start_date}</div>
                        <div className="text-gray-500">to {session.end_date}</div>
                        <div className="text-xs text-gray-400">
                          {Math.ceil((new Date(session.end_date).getTime() - new Date(session.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assignedCount}/{session.max_participants}
                        </div>
                        <div className="text-xs text-gray-500">
                          {utilizationPercent}% utilized
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${utilizationPercent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColors[session.status]}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(session.priority)}`}>
                          {session.priority}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          ⭐ {session.rating}/5.0
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            setShowSessionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Manage
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90%] h-[90%] flex flex-col">
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Training Analytics Dashboard</h2>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-8 w-8" />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Training Center Performance */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Training Center Performance</h3>
                  <div className="space-y-4">
                    {trainingLocations.map(location => (
                      <div key={location.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${location.color}`}></div>
                          <span className="font-medium">{location.name.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>★ {location.rating}</span>
                          <span>{location.utilization}% util</span>
                          <span>{location.sessions_count} sessions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certification Status Overview */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Certification Status Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600">● Valid Certifications</span>
                      <span className="font-bold">
                        {mockEmployees.reduce((sum, emp) => 
                          sum + emp.certifications.filter(cert => cert.status === 'Valid').length, 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600">● Expiring Soon</span>
                      <span className="font-bold">
                        {mockEmployees.reduce((sum, emp) => 
                          sum + emp.certifications.filter(cert => cert.status === 'Expiring Soon').length, 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-600">● Expired</span>
                      <span className="font-bold">
                        {mockEmployees.reduce((sum, emp) => 
                          sum + emp.certifications.filter(cert => cert.status === 'Expired').length, 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Training Efficiency */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Training Efficiency Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Session Utilization Rate</span>
                      <span className="font-bold">{analytics.utilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Session Rating</span>
                      <span className="font-bold">⭐ {analytics.averageRating.toFixed(1)}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-bold text-green-600">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employee Satisfaction</span>
                      <span className="font-bold text-green-600">4.6/5.0</span>
                    </div>
                  </div>
                </div>

                {/* Employee Training Progress */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Top Performing Employees</h3>
                  <div className="space-y-3">
                    {mockEmployees
                      .sort((a, b) => b.training_completed - a.training_completed)
                      .slice(0, 5)
                      .map(emp => (
                        <div key={emp.id} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-sm text-gray-600">{emp.job_title}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{emp.training_completed} completed</div>
                            <div className="text-sm text-gray-600">★ {emp.performance_rating}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Training Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-[90%] h-[90%] flex flex-col">
            {/* Modal Header */}
            <div className="border-b p-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-2xl font-bold">{selectedSession.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAuthorityColor(selectedSession.authority)}`}>
                    {selectedSession.authority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${statusColors[selectedSession.status]}`}>
                    {selectedSession.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedSession.priority)}`}>
                    {selectedSession.priority} Priority
                  </span>
                </div>
                <p className="text-gray-600 text-lg mb-2">{selectedSession.code}</p>
                <div className="flex items-center gap-8 text-sm text-gray-600">
                  <span>📅 {selectedSession.start_date} to {selectedSession.end_date}</span>
                  <span>📍 {selectedSession.location}</span>
                  <span>👨‍🏫 {selectedSession.instructor}</span>
                  <span>⭐ {selectedSession.rating}/5.0</span>
                </div>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <XCircle className="h-8 w-8" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side - Session Details & Assigned Employees */}
              <div className="w-1/2 border-r p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Comprehensive Session Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-lg mb-4 text-blue-900">Session Information</h3>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <span className="text-gray-600 block mb-1">Category:</span>
                        <span className="font-medium">{selectedSession.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Duration:</span>
                        <span className="font-medium">
                          {Math.ceil((new Date(selectedSession.end_date).getTime() - new Date(selectedSession.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Theory Hours:</span>
                        <span className="font-medium">{selectedSession.theory_hours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Practical Hours:</span>
                        <span className="font-medium">{selectedSession.practical_hours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Simulator Hours:</span>
                        <span className="font-medium">{selectedSession.simulator_hours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Equipment:</span>
                        <span className="font-medium">{selectedSession.equipment}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Prerequisites:</span>
                        <span className="font-medium">{selectedSession.prerequisites.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Recurrent:</span>
                        <span className={`font-medium ${selectedSession.recurrent ? 'text-green-600' : 'text-gray-600'}`}>
                          {selectedSession.recurrent ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Capacity:</span>
                        <span className="font-medium">{selectedSession.max_participants} participants</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Rating:</span>
                        <span className="font-medium">⭐ {selectedSession.rating}/5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Assigned Employees */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">
                        Assigned Employees ({assignedEmployees[selectedSession.id]?.length || 0}/{selectedSession.max_participants})
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSwapModal(true)}
                          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-2 text-sm font-medium"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Swap
                        </button>
                        <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 text-sm font-medium">
                          <Bell className="h-4 w-4" />
                          Notify All
                        </button>
                        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4" />
                          Generate Report
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {(assignedEmployees[selectedSession.id] || []).map(empId => {
                        const employee = mockEmployees.find(emp => emp.id === empId);
                        if (!employee) return null;
                        
                        return (
                          <div key={empId} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all border-green-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-lg">{employee.name}</span>
                                </div>
                                <div className="text-sm text-gray-600">#{employee.e_number} - {employee.job_title}</div>
                                <div className="text-sm text-gray-600">{employee.team} Team - {employee.department}</div>
                                <div className="text-xs text-gray-500 mt-1 flex gap-4">
                                  <span>📧 {employee.email}</span>
                                  <span>📱 {employee.phone}</span>
                                  <span>🎯 Performance: {employee.performance_rating}/5</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Profile
                                </button>
                                <button
                                  onClick={() => handleUnassignEmployee(empId)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {employee.certifications.map((cert, idx) => (
                                <span
                                  key={idx}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}
                                  title={`Issued: ${cert.issued_date}, Expires: ${cert.expiry}`}
                                >
                                  {cert.code} - {cert.authority} ({cert.days_to_expire}d)
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {(!assignedEmployees[selectedSession.id] || assignedEmployees[selectedSession.id].length === 0) && (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No employees assigned yet</p>
                          <p className="text-sm">Select employees from the available list to assign them to this training session</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Available Employees */}
              <div className="w-1/2 p-6 overflow-y-auto">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Available Employees</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search employees..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <Filter className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Smart AI Sorting:</strong> Employees are intelligently ranked by certification relevance, 
                      expiry urgency, performance ratings, and training history. Higher scores indicate optimal candidates.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedEmployeesForSession.map(employee => {
                    const urgentCerts = employee.certifications.filter(cert => cert.days_to_expire < 90 && cert.days_to_expire > 0);
                    const expiredCerts = employee.certifications.filter(cert => cert.days_to_expire < 0);
                    
                    return (
                      <div
                        key={employee.id}
                        className={`border rounded-lg p-4 transition-all ${
                          employee.isAssigned 
                            ? 'bg-gray-100 opacity-60 border-gray-300' 
                            : 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg">{employee.name}</span>
                              {urgentCerts.length > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                  Urgent ({urgentCerts.length})
                                </span>
                              )}
                              {expiredCerts.length > 0 && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                  Expired ({expiredCerts.length})
                                </span>
                              )}
                              {employee.performance_rating >= 4.5 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                                  ⭐ Top Performer
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">#{employee.e_number} - {employee.job_title}</div>
                            <div className="text-sm text-gray-600">{employee.team} Team - {employee.department}</div>
                            <div className="text-xs text-gray-500 mt-1 grid grid-cols-2 gap-2">
                              <span>🎯 Priority Score: {employee.relevance}</span>
                              <span>📅 Next Training: {employee.next_training_due}</span>
                              <span>⭐ Performance: {employee.performance_rating}/5</span>
                              <span>📚 Training Completed: {employee.training_completed}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => employee.isAssigned ? handleUnassignEmployee(employee.id) : handleAssignEmployee(employee.id)}
                            disabled={!employee.isAssigned && (assignedEmployees[selectedSession.id]?.length || 0) >= selectedSession.max_participants}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              employee.isAssigned
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                            }`}
                          >
                            {employee.isAssigned ? 'Remove' : 'Schedule'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {employee.certifications.map((cert, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}
                              title={`Issued: ${cert.issued_date}, Expires in ${cert.days_to_expire} days`}
                            >
                              {cert.code} - {cert.authority} ({cert.days_to_expire}d)
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Modal Footer */}
            <div className="border-t p-6 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-600 space-x-8">
                <span>👥 <strong>Utilization:</strong> {Math.round(((assignedEmployees[selectedSession.id]?.length || 0) / selectedSession.max_participants) * 100)}%</span>
                <span>🎯 <strong>Avg Priority:</strong> {
                  assignedEmployees[selectedSession.id]?.length > 0 
                    ? Math.round(assignedEmployees[selectedSession.id].reduce((sum, empId) => {
                        const emp = mockEmployees.find(e => e.id === empId);
                        return sum + (emp?.priority_score || 0);
                      }, 0) / assignedEmployees[selectedSession.id].length)
                    : 0
                }</span>
                <span>⭐ <strong>Training Rating:</strong> {selectedSession.rating}/5.0</span>
                <span>📚 <strong>Duration:</strong> {Math.ceil((new Date(selectedSession.end_date).getTime() - new Date(selectedSession.start_date).getTime()) / (1000 * 60 * 60 * 24))} days</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
                  Export to Calendar
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                  Save & Notify All
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999">
          <div className="bg-white rounded-lg w-[700px] max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold mb-2">Advanced Training Assignment Swap</h3>
              <p className="text-gray-600">
                Select an employee to swap from this training session. Our AI system will suggest optimal alternative sessions based on certification needs, schedule availability, and priority scores.
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-4">Select Employee to Swap:</h4>
              <div className="space-y-3 mb-6">
                {(assignedEmployees[selectedSession?.id] || []).map(empId => {
                  const employee = mockEmployees.find(emp => emp.id === empId);
                  if (!employee) return null;
                  
                  return (
                    <div
                      key={empId}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedEmployeeForSwap === empId 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => setSelectedEmployeeForSwap(empId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{employee.name}</div>
                          <div className="text-sm text-gray-600">#{employee.e_number} - {employee.job_title}</div>
                          <div className="text-xs text-gray-500">{employee.team} Team</div>
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                          <div>Priority: {employee.priority_score}</div>
                          <div>Performance: {employee.performance_rating}/5</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedEmployeeForSwap && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-4 text-blue-900">
                    🤖 AI-Recommended Alternative Sessions for {mockEmployees.find(e => e.id === selectedEmployeeForSwap)?.name}
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium">B2-777-008 - B777 Avionics Systems Advanced</div>
                        <div className="text-gray-600">June 16-20, 2025 • EASA Training Center Munich</div>
                        <div className="text-xs text-green-600">Perfect match for B2 certification renewal</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-medium">12/14 slots</div>
                        <div className="text-xs text-gray-500">95% match</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium">C-350-003 - A350 Base Maintenance Comprehensive</div>
                        <div className="text-gray-600">June 23 - July 4, 2025 • EASA Training Center Hamburg</div>
                        <div className="text-xs text-orange-600">High priority due to C license expiry</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-medium">8/10 slots</div>
                        <div className="text-xs text-gray-500">88% match</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium">BOEING-787-ADV-001 - Boeing 787 Advanced Troubleshooting</div>
                        <div className="text-gray-600">July 21 - August 1, 2025 • Boeing Training Center Everett</div>
                        <div className="text-xs text-blue-600">Premium OEM training opportunity</div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-600 font-medium">3/8 slots</div>
                        <div className="text-xs text-gray-500">92% match</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSelectedEmployeeForSwap(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                disabled={!selectedEmployeeForSwap}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 font-medium"
              >
                Proceed with Smart Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagementSystem;