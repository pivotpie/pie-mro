
import React, { useState, useMemo, useRef } from 'react';
import { Calendar, Users, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, Plus, Filter, Search, ChevronLeft, ChevronRight, Download, Upload, Bell, BarChart3, TrendingUp, Award, FileText, Target } from 'lucide-react';

// Comprehensive training sessions data
const mockTrainingSessions = [
  {
    id: 1,
    name: "Boeing 737 MAX Type Rating",
    code: "B737MAX-TR",
    authority: "EASA",
    category: "Type Rating",
    start_date: "2025-06-15",
    end_date: "2025-06-22",
    location: "Training Center A",
    instructor: "Capt. Ahmed Al-Mansoori",
    max_participants: 8,
    theory_hours: 40,
    practical_hours: 20,
    simulator_hours: 15,
    equipment: "B737 MAX Simulator",
    status: "Confirmed",
    priority: "High",
    rating: 4.8
  },
  {
    id: 2,
    name: "A320 Recurrent Training",
    code: "A320-REC",
    authority: "GCAA",
    category: "Recurrent",
    start_date: "2025-06-20",
    end_date: "2025-06-25",
    location: "Training Center B",
    instructor: "Capt. Sarah Johnson",
    max_participants: 12,
    theory_hours: 20,
    practical_hours: 15,
    simulator_hours: 10,
    equipment: "A320 Simulator",
    status: "Open",
    priority: "Medium",
    rating: 4.6
  }
];

const mockEmployees = [
  {
    id: 1,
    name: "John Smith",
    e_number: 1001,
    job_title: "Captain",
    team: "Alpha",
    department: "Flight Operations",
    performance_rating: 4.8,
    priority_score: 85,
    certifications: [
      { code: "ATPL", authority: "EASA", status: "Valid", days_to_expire: 365 },
      { code: "B737", authority: "GCAA", status: "Expiring Soon", days_to_expire: 45 }
    ]
  },
  {
    id: 2,
    name: "Sarah Ahmed",
    e_number: 1002,
    job_title: "First Officer",
    team: "Beta",
    department: "Flight Operations",
    performance_rating: 4.5,
    priority_score: 78,
    certifications: [
      { code: "CPL", authority: "GCAA", status: "Valid", days_to_expire: 200 },
      { code: "A320", authority: "EASA", status: "Valid", days_to_expire: 120 }
    ]
  }
];

const trainingLocations = [
  {
    id: 1,
    name: "Training Center A - Main Campus",
    capacity: 50,
    utilization: 85,
    rating: 4.8,
    color: "bg-blue-500"
  },
  {
    id: 2,
    name: "Training Center B - Simulator Hub",
    capacity: 30,
    utilization: 92,
    rating: 4.6,
    color: "bg-green-500"
  }
];

const statusColors = {
  'Scheduled': 'bg-yellow-400',
  'Confirmed': 'bg-green-400', 
  'In Progress': 'bg-blue-400',
  'Completed': 'bg-gray-400',
  'Open': 'bg-red-300',
  'Cancelled': 'bg-red-500'
};

const TrainingManagementSystem = () => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedEmployeeForSwap, setSelectedEmployeeForSwap] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1));
  const [viewMode, setViewMode] = useState('gantt');
  const [assignedEmployees, setAssignedEmployees] = useState({
    1: [1, 2], 2: [3, 4], 3: [5], 4: [1], 5: [2, 3], 6: [4], 7: [5], 8: [1, 2], 9: [3], 10: [4, 5]
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
    
    for (let i = 0; i < 120; i++) {
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

  // Calculate position for training sessions
  const getSessionPosition = (session) => {
    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);
    const timelineStart = timeline[0].date;
    
    const startDiff = Math.floor((startDate - timelineStart) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      left: `${(startDiff * 35)}px`,
      width: `${(duration * 35) - 2}px`
    };
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return mockTrainingSessions.filter(session => {
      const matchesFilter = filterBy === 'all' || session.authority.toLowerCase() === filterBy.toLowerCase();
      const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           session.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = selectedPriority === 'all' || session.priority.toLowerCase() === selectedPriority.toLowerCase();
      const matchesStatus = selectedStatus === 'all' || session.status.toLowerCase() === selectedStatus.toLowerCase();
      
      return matchesFilter && matchesSearch && matchesPriority && matchesStatus;
    });
  }, [filterBy, searchTerm, selectedPriority, selectedStatus]);

  // Group sessions by location
  const sessionsByLocation = useMemo(() => {
    const grouped = {};
    trainingLocations.forEach(location => {
      grouped[location.id] = filteredSessions.filter(session => 
        session.location.toLowerCase().includes(location.name.split(' ')[0].toLowerCase())
      );
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

        {/* Quick Stats */}
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

      {/* Controls */}
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

          {/* Filters */}
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

        {/* Legend */}
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
              <div className="w-3 h-3 bg-red-300 rounded"></div>
              <span>Open</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredSessions.length} of {mockTrainingSessions.length} training sessions
          </div>
        </div>
      </div>

      {/* Gantt View */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex">
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

            <div className="flex-1 overflow-x-auto" ref={ganttRef}>
              <div style={{ width: `${timeline.length * 35}px` }}>
                <div className="h-20 border-b bg-gray-100">
                  <div className="flex">
                    {timeline.map((day, index) => (
                      <div
                        key={index}
                        className={`border-r text-xs text-center ${
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {trainingLocations.map(location => (
                  <div key={location.id} className="h-20 border-b relative">
                    {timeline.map((day, index) => (
                      <div
                        key={index}
                        className={`absolute h-full border-r ${
                          day.isWeekend ? 'bg-gray-100' : ''
                        } ${day.isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}
                        style={{ left: `${index * 35}px`, width: '35px' }}
                      ></div>
                    ))}
                    
                    {sessionsByLocation[location.id]?.map(session => {
                      const position = getSessionPosition(session);
                      const assignedCount = assignedEmployees[session.id]?.length || 0;
                      
                      return (
                        <div
                          key={session.id}
                          className={`absolute h-16 top-2 rounded-lg cursor-pointer border-2 border-white shadow-lg hover:shadow-xl transition-all ${statusColors[session.status]} flex items-center px-3`}
                          style={position}
                          onClick={() => {
                            setSelectedSession(session);
                            setShowSessionModal(true);
                          }}
                          title={`${session.name}\nStatus: ${session.status}\nAssigned: ${assignedCount}/${session.max_participants}`}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          {Math.ceil((new Date(session.end_date) - new Date(session.start_date)) / (1000 * 60 * 60 * 24))} days
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Session Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Sessions</span>
                      <span className="font-bold">{analytics.totalSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Rating</span>
                      <span className="font-bold">⭐ {analytics.averageRating.toFixed(1)}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization Rate</span>
                      <span className="font-bold">{analytics.utilization}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90%] h-[90%] flex flex-col">
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

            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/2 border-r p-6 overflow-y-auto">
                <div className="space-y-6">
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
                          {Math.ceil((new Date(selectedSession.end_date) - new Date(selectedSession.start_date)) / (1000 * 60 * 60 * 24))} days
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
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">
                        Assigned Employees ({assignedEmployees[selectedSession.id]?.length || 0}/{selectedSession.max_participants})
                      </h3>
                      <button
                        onClick={() => setShowSwapModal(true)}
                        className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-2 text-sm font-medium"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Swap
                      </button>
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
                              </div>
                              <button
                                onClick={() => handleUnassignEmployee(empId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {employee.certifications.map((cert, idx) => (
                                <span
                                  key={idx}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}
                                >
                                  {cert.code} - {cert.authority}
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-1/2 p-6 overflow-y-auto">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Available Employees</h3>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {mockEmployees.map(employee => {
                    const isAssigned = assignedEmployees[selectedSession.id]?.includes(employee.id) || false;
                    
                    return (
                      <div
                        key={employee.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isAssigned 
                            ? 'bg-gray-100 opacity-60 border-gray-300' 
                            : 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg">{employee.name}</span>
                              {employee.performance_rating >= 4.5 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                                  ⭐ Top Performer
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">#{employee.e_number} - {employee.job_title}</div>
                            <div className="text-sm text-gray-600">{employee.team} Team - {employee.department}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              ⭐ Performance: {employee.performance_rating}/5
                            </div>
                          </div>
                          <button
                            onClick={() => isAssigned ? handleUnassignEmployee(employee.id) : handleAssignEmployee(employee.id)}
                            disabled={!isAssigned && (assignedEmployees[selectedSession.id]?.length || 0) >= selectedSession.max_participants}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isAssigned
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                            }`}
                          >
                            {isAssigned ? 'Remove' : 'Schedule'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {employee.certifications.map((cert, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}
                            >
                              {cert.code} - {cert.authority}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t p-6 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-600 space-x-8">
                <span>👥 <strong>Utilization:</strong> {Math.round(((assignedEmployees[selectedSession.id]?.length || 0) / selectedSession.max_participants) * 100)}%</span>
                <span>⭐ <strong>Training Rating:</strong> {selectedSession.rating}/5.0</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-[700px] max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold mb-2">Training Assignment Swap</h3>
              <p className="text-gray-600">
                Select an employee to swap from this training session.
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
                Proceed with Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagementSystem;
