import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Users, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, Plus, Filter, Search, ChevronLeft, ChevronRight, Download, Upload, Settings, Bell, BarChart3, TrendingUp, Shield, Award, AlertCircle, FileText, Target, Zap, Globe, BookOpen, Activity } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

// Comprehensive training sessions data
const mockTrainingSessions = [
  // EASA Training Center - June 2025
  { id: 1, code: 'B1.1-787-001', name: 'Boeing 787 Type Rating Initial', authority: 'EASA', location: 'EASA Training Center Frankfurt', start_date: '2025-06-02', end_date: '2025-06-13', max_participants: 12, assigned: 10, status: 'Confirmed', instructor: 'Capt. Hans Mueller', category: 'Type Rating', prerequisites: ['B1.1 Basic'], recurrent: false, simulator_hours: 40, theory_hours: 80, practical_hours: 60, equipment: 'B787 Simulator', rating: 4.8, priority: 'High' },
  { id: 2, code: 'A1-320-015', name: 'A320 Line Maintenance Recurrent', authority: 'EASA', location: 'EASA Training Center Toulouse', start_date: '2025-06-09', end_date: '2025-06-11', max_participants: 18, assigned: 15, status: 'Confirmed', instructor: 'Eng. Pierre Dubois', category: 'Line Maintenance', prerequisites: ['A1 Initial'], recurrent: true, simulator_hours: 8, theory_hours: 16, practical_hours: 24, equipment: 'A320 Training Aircraft', rating: 4.6, priority: 'Medium' },
  { id: 3, code: 'B2-777-008', name: 'B777 Avionics Systems Advanced', authority: 'EASA', location: 'EASA Training Center Munich', start_date: '2025-06-16', end_date: '2025-06-20', max_participants: 14, assigned: 12, status: 'Confirmed', instructor: 'Tech. Klaus Weber', category: 'Avionics', prerequisites: ['B2 Basic', 'Electronics Fundamentals'], recurrent: false, simulator_hours: 20, theory_hours: 30, practical_hours: 50, equipment: 'B777 Avionics Trainer', rating: 4.9, priority: 'High' },
  { id: 4, code: 'C-350-003', name: 'A350 Base Maintenance Comprehensive', authority: 'EASA', location: 'EASA Training Center Hamburg', start_date: '2025-06-23', end_date: '2025-07-04', max_participants: 10, assigned: 8, status: 'Open', instructor: 'Sr. Eng. Wolfgang Fischer', category: 'Base Maintenance', prerequisites: ['C License', '5 Years Experience'], recurrent: false, simulator_hours: 0, theory_hours: 60, practical_hours: 140, equipment: 'A350 Training Bay', rating: 4.7, priority: 'Critical' },

  // GCAA Training Center - June/July 2025
  { id: 5, code: 'B1.1-MAX-012', name: 'B737 MAX Systems Initial', authority: 'GCAA', location: 'GCAA Training Center Dubai', start_date: '2025-06-05', end_date: '2025-06-16', max_participants: 16, assigned: 14, status: 'Confirmed', instructor: 'Capt. Ahmed Al Mansouri', category: 'Type Rating', prerequisites: ['B1.1 Basic', 'B737 NG'], recurrent: false, simulator_hours: 35, theory_hours: 70, practical_hours: 55, equipment: 'B737 MAX Simulator', rating: 4.5, priority: 'High' },
  { id: 6, code: 'A2-PA28-007', name: 'PA-28 Piston Aircraft Maintenance', authority: 'GCAA', location: 'GCAA Training Center Al Ain', start_date: '2025-06-12', end_date: '2025-06-14', max_participants: 12, assigned: 9, status: 'Scheduled', instructor: 'Eng. Fatima Al Qassimi', category: 'General Aviation', prerequisites: ['A2 Basic'], recurrent: true, simulator_hours: 0, theory_hours: 12, practical_hours: 36, equipment: 'PA-28 Aircraft', rating: 4.3, priority: 'Low' },
  { id: 7, code: 'B1.4-R44-005', name: 'Robinson R44 Helicopter Systems', authority: 'GCAA', location: 'GCAA Training Center Sharjah', start_date: '2025-06-19', end_date: '2025-06-21', max_participants: 8, assigned: 6, status: 'Open', instructor: 'Pilot Khalid Al Nuaimi', category: 'Helicopter', prerequisites: ['B1.4 Basic'], recurrent: false, simulator_hours: 15, theory_hours: 18, practical_hours: 27, equipment: 'R44 Simulator', rating: 4.4, priority: 'Medium' },
  { id: 8, code: 'C-777-013', name: 'B777 Base Maintenance Inspector', authority: 'GCAA', location: 'GCAA Training Center Abu Dhabi', start_date: '2025-06-26', end_date: '2025-07-07', max_participants: 12, assigned: 10, status: 'Confirmed', instructor: 'Sr. Eng. Mariam Al Shamsi', category: 'Base Maintenance', prerequisites: ['C License', 'Inspector Authorization'], recurrent: false, simulator_hours: 0, theory_hours: 48, practical_hours: 112, equipment: 'B777 Hangar Training', rating: 4.6, priority: 'High' },

  // FAA Training Center - June/July 2025
  { id: 9, code: 'B1.1-787-FAA-004', name: 'B787 GEnx Engine Specialist', authority: 'FAA', location: 'FAA Training Center Seattle', start_date: '2025-06-03', end_date: '2025-06-07', max_participants: 10, assigned: 8, status: 'Confirmed', instructor: 'Eng. Michael Roberts', category: 'Engine Systems', prerequisites: ['B1.1 License', 'Turbine Experience'], recurrent: false, simulator_hours: 16, theory_hours: 24, practical_hours: 40, equipment: 'GEnx Engine Trainer', rating: 4.7, priority: 'High' },
  { id: 10, code: 'B2-MAX-FAA-009', name: 'B737 MAX Electrical Systems', authority: 'FAA', location: 'FAA Training Center Miami', start_date: '2025-06-10', end_date: '2025-06-13', max_participants: 14, assigned: 5, status: 'Open', instructor: 'Tech. Sarah Anderson', category: 'Electrical Systems', prerequisites: ['B2 License'], recurrent: false, simulator_hours: 12, theory_hours: 20, practical_hours: 28, equipment: 'MAX Electrical Trainer', rating: 4.4, priority: 'Medium' },
  { id: 11, code: 'A1-320-FAA-018', name: 'A320 NEO Line Maintenance', authority: 'FAA', location: 'FAA Training Center Dallas', start_date: '2025-06-17', end_date: '2025-06-19', max_participants: 16, assigned: 12, status: 'Scheduled', instructor: 'Eng. David Thompson', category: 'Line Maintenance', prerequisites: ['A1 License', 'A320 Experience'], recurrent: true, simulator_hours: 6, theory_hours: 12, practical_hours: 30, equipment: 'A320neo Training', rating: 4.5, priority: 'Medium' },

  // UK CAA Training Center - July 2025
  { id: 12, code: 'C-777-UKCAA-002', name: 'B777 Base Maintenance Advanced', authority: 'UK CAA', location: 'UK CAA Training Center Gatwick', start_date: '2025-07-01', end_date: '2025-07-12', max_participants: 9, assigned: 7, status: 'Scheduled', instructor: 'Sr. Eng. James Wilson', category: 'Base Maintenance', prerequisites: ['C License', 'B777 Experience'], recurrent: false, simulator_hours: 0, theory_hours: 54, practical_hours: 126, equipment: 'B777 Maintenance Bay', rating: 4.8, priority: 'High' },
  { id: 13, code: 'A1-NEO-UKCAA-006', name: 'A320neo PW1100G Engine', authority: 'UK CAA', location: 'UK CAA Training Center Manchester', start_date: '2025-07-08', end_date: '2025-07-11', max_participants: 12, assigned: 9, status: 'Confirmed', instructor: 'Capt. Emily Clarke', category: 'Engine Systems', prerequisites: ['A1 License', 'Turbine Rating'], recurrent: false, simulator_hours: 14, theory_hours: 22, practical_hours: 36, equipment: 'PW1100G Trainer', rating: 4.6, priority: 'Medium' },
  { id: 14, code: 'B1.3-H225-UK-009', name: 'Airbus H225 Helicopter Systems', authority: 'UK CAA', location: 'UK CAA Training Center Norwich', start_date: '2025-07-15', end_date: '2025-07-19', max_participants: 8, assigned: 4, status: 'Open', instructor: 'Pilot Richard Davies', category: 'Helicopter', prerequisites: ['B1.3 License'], recurrent: false, simulator_hours: 20, theory_hours: 24, practical_hours: 36, equipment: 'H225 Simulator', rating: 4.5, priority: 'Medium' },

  // Manufacturer Training - OEM Sessions
  { id: 15, code: 'BOEING-787-ADV-001', name: 'Boeing 787 Advanced Troubleshooting', authority: 'Boeing', location: 'Boeing Training Center Everett', start_date: '2025-07-21', end_date: '2025-08-01', max_participants: 8, assigned: 3, status: 'Open', instructor: 'Boeing Master Instructor', category: 'OEM Training', prerequisites: ['B787 Type Rating', '2 Years Experience'], recurrent: false, simulator_hours: 30, theory_hours: 45, practical_hours: 105, equipment: 'B787 Factory Training', rating: 5.0, priority: 'Critical' },
  { id: 16, code: 'AIRBUS-350-SPEC-003', name: 'A350 Specialized Systems Integration', authority: 'Airbus', location: 'Airbus Training Center Toulouse', start_date: '2025-08-04', end_date: '2025-08-15', max_participants: 10, assigned: 6, status: 'Scheduled', instructor: 'Airbus Senior Specialist', category: 'OEM Training', prerequisites: ['A350 Experience', 'C License'], recurrent: false, simulator_hours: 25, theory_hours: 50, practical_hours: 125, equipment: 'A350 Production Line', rating: 4.9, priority: 'Critical' },
  { id: 17, code: 'CFM-LEAP-ENG-007', name: 'CFM LEAP Engine Maintenance', authority: 'CFM International', location: 'CFM Training Center Paris', start_date: '2025-08-11', end_date: '2025-08-15', max_participants: 12, assigned: 8, status: 'Confirmed', instructor: 'CFM Engine Specialist', category: 'Engine Systems', prerequisites: ['Turbine Experience'], recurrent: true, simulator_hours: 0, theory_hours: 25, practical_hours: 55, equipment: 'LEAP Engine Stand', rating: 4.7, priority: 'High' },

  // Additional sessions for more comprehensive data
  { id: 18, code: 'EASA-FUEL-SYS-012', name: 'Advanced Fuel Systems', authority: 'EASA', location: 'EASA Training Center Vienna', start_date: '2025-07-28', end_date: '2025-08-01', max_participants: 14, assigned: 11, status: 'Confirmed', instructor: 'Eng. Franz Huber', category: 'Systems', prerequisites: ['A1 or B1 License'], recurrent: false, simulator_hours: 8, theory_hours: 20, practical_hours: 32, equipment: 'Fuel System Trainer', rating: 4.4, priority: 'Medium' },
  { id: 19, code: 'GCAA-SAFETY-SMS-015', name: 'Safety Management Systems', authority: 'GCAA', location: 'GCAA Training Center Dubai', start_date: '2025-08-18', end_date: '2025-08-22', max_participants: 20, assigned: 16, status: 'Scheduled', instructor: 'Safety Manager Ahmed Rashid', category: 'Safety Training', prerequisites: ['Management Position'], recurrent: true, simulator_hours: 0, theory_hours: 35, practical_hours: 5, equipment: 'Classroom', rating: 4.2, priority: 'High' },
  { id: 20, code: 'FAA-NDT-CERT-008', name: 'Non-Destructive Testing Certification', authority: 'FAA', location: 'FAA Training Center Phoenix', start_date: '2025-08-25', end_date: '2025-08-29', max_participants: 10, assigned: 7, status: 'Open', instructor: 'NDT Level III Instructor', category: 'Inspection', prerequisites: ['5 Years Maintenance'], recurrent: false, simulator_hours: 0, theory_hours: 25, practical_hours: 35, equipment: 'NDT Laboratory', rating: 4.6, priority: 'Medium' }
];

// Comprehensive employee data
const mockEmployees = [
  { id: 1, e_number: 234001, name: 'Ahmed Al Mansoori', job_title: 'Senior Aircraft Engineer', team: 'Line Maintenance', department: 'Engineering', shift: 'Day', nationality: 'UAE', hire_date: '2018-03-15', supervisor: 'Khalid Rahman', location: 'Hangar 1A', certifications: [
    { code: 'A1', aircraft: 'A320/B737', authority: 'EASA', expiry: '2027-08-07', status: 'Valid', days_to_expire: 774, issued_date: '2024-08-07' },
    { code: 'B1.1', aircraft: 'B787', authority: 'EASA', expiry: '2025-07-15', status: 'Expiring Soon', days_to_expire: 22, issued_date: '2023-07-15' },
    { code: 'B2', aircraft: 'B777', authority: 'GCAA', expiry: '2025-12-20', status: 'Valid', days_to_expire: 180, issued_date: '2023-12-20' }
  ], next_training_due: '2025-07-15', priority_score: 95, phone: '+971501234567', email: 'ahmed.almansoori@company.com', training_completed: 8, training_pending: 2, performance_rating: 4.5, languages: ['English', 'Arabic'], skills: ['Turbine Engines', 'Avionics', 'Hydraulics'] },
  
  { id: 2, e_number: 234002, name: 'Fatima Al Qassimi', job_title: 'Lead Maintenance Technician', team: 'Base Maintenance', department: 'Technical Services', shift: 'Day', nationality: 'UAE', hire_date: '2019-01-10', supervisor: 'Omar Hassan', location: 'Hangar 2B', certifications: [
    { code: 'B1.1', aircraft: 'B787', authority: 'EASA', expiry: '2025-07-07', status: 'Expiring Soon', days_to_expire: 14, issued_date: '2023-07-07' },
    { code: 'A1', aircraft: 'A320/B737', authority: 'EASA', expiry: '2027-04-30', status: 'Valid', days_to_expire: 673, issued_date: '2024-04-30' },
    { code: 'C', aircraft: 'All Aircraft', authority: 'GCAA', expiry: '2026-03-15', status: 'Valid', days_to_expire: 360, issued_date: '2022-03-15' }
  ], next_training_due: '2025-07-07', priority_score: 98, phone: '+971501234568', email: 'fatima.qassimi@company.com', training_completed: 12, training_pending: 1, performance_rating: 4.8, languages: ['English', 'Arabic', 'French'], skills: ['Base Maintenance', 'Inspection', 'Quality Control'] },
  
  { id: 3, e_number: 234015, name: 'Zayed Al Mazrouei', job_title: 'Aircraft Technician', team: 'Line Maintenance', department: 'Operations', shift: 'Night', nationality: 'UAE', hire_date: '2020-06-20', supervisor: 'Ahmed Al Mansoori', location: 'Line Station', certifications: [
    { code: 'B1.1', aircraft: 'B787', authority: 'UK CAA', expiry: '2025-11-05', status: 'Valid', days_to_expire: 135, issued_date: '2023-11-05' },
    { code: 'B2', aircraft: 'B777', authority: 'EASA', expiry: '2025-10-05', status: 'Valid', days_to_expire: 104, issued_date: '2023-10-05' },
    { code: 'A1', aircraft: 'A320/B737', authority: 'GCAA', expiry: '2026-08-20', status: 'Valid', days_to_expire: 520, issued_date: '2023-08-20' }
  ], next_training_due: '2025-10-05', priority_score: 78, phone: '+971501234569', email: 'zayed.mazrouei@company.com', training_completed: 6, training_pending: 3, performance_rating: 4.2, languages: ['English', 'Arabic'], skills: ['Line Maintenance', 'Troubleshooting', 'Documentation'] },
  
  { id: 4, e_number: 234032, name: 'Aisha Al Mehairi', job_title: 'Avionics Engineer', team: 'Avionics', department: 'Engineering', shift: 'Day', nationality: 'UAE', hire_date: '2017-09-05', supervisor: 'Sarah Johnson', location: 'Avionics Shop', certifications: [
    { code: 'B2', aircraft: 'B777', authority: 'EASA', expiry: '2025-08-15', status: 'Valid', days_to_expire: 53, issued_date: '2023-08-15' },
    { code: 'A1', aircraft: 'A320/B737', authority: 'UK CAA', expiry: '2026-04-21', status: 'Valid', days_to_expire: 398, issued_date: '2023-04-21' },
    { code: 'B1.4', aircraft: 'R44 Helicopter', authority: 'GCAA', expiry: '2025-09-03', status: 'Expiring Soon', days_to_expire: 72, issued_date: '2023-09-03' }
  ], next_training_due: '2025-08-15', priority_score: 85, phone: '+971501234570', email: 'aisha.mehairi@company.com', training_completed: 10, training_pending: 2, performance_rating: 4.6, languages: ['English', 'Arabic', 'Hindi'], skills: ['Avionics Systems', 'Navigation', 'Communication'] },
  
  { id: 5, e_number: 234050, name: 'Amal Al Hammadi', job_title: 'Senior Technician Inspector', team: 'Base Maintenance', department: 'Quality Assurance', shift: 'Day', nationality: 'UAE', hire_date: '2016-11-12', supervisor: 'Michael Thompson', location: 'Hangar 3A', certifications: [
    { code: 'C', aircraft: 'All Aircraft', authority: 'EASA', expiry: '2026-02-10', status: 'Valid', days_to_expire: 327, issued_date: '2022-02-10' },
    { code: 'B1.1', aircraft: 'A350', authority: 'UK CAA', expiry: '2025-12-13', status: 'Valid', days_to_expire: 173, issued_date: '2023-12-13' },
    { code: 'A2', aircraft: 'PA-28', authority: 'GCAA', expiry: '2025-05-20', status: 'Expired', days_to_expire: -34, issued_date: '2023-05-20' }
  ], next_training_due: '2025-05-20', priority_score: 92, phone: '+971501234571', email: 'amal.hammadi@company.com', training_completed: 15, training_pending: 1, performance_rating: 4.7, languages: ['English', 'Arabic'], skills: ['Inspection', 'Quality Control', 'Compliance'] },
  
  { id: 6, e_number: 234021, name: 'Yasir Mahmood', job_title: 'Lead Aircraft Engineer', team: 'Line Maintenance', department: 'Engineering', shift: 'Day', nationality: 'Pakistan', hire_date: '2015-02-28', supervisor: 'Ahmed Al Mansoori', location: 'Hangar 1B', certifications: [
    { code: 'B1.1', aircraft: 'B737 MAX', authority: 'FAA', expiry: '2025-07-24', status: 'Expiring Soon', days_to_expire: 31, issued_date: '2023-07-24' },
    { code: 'C', aircraft: 'All Aircraft', authority: 'EASA', expiry: '2025-08-15', status: 'Valid', days_to_expire: 53, issued_date: '2021-08-15' },
    { code: 'B1.1', aircraft: 'B787', authority: 'EASA', expiry: '2025-09-08', status: 'Valid', days_to_expire: 77, issued_date: '2023-09-08' }
  ], next_training_due: '2025-07-24', priority_score: 88, phone: '+971501234572', email: 'yasir.mahmood@company.com', training_completed: 18, training_pending: 2, performance_rating: 4.4, languages: ['English', 'Urdu', 'Arabic'], skills: ['Boeing Systems', 'Leadership', 'Training'] },

  // Additional employees for more comprehensive data
  { id: 7, e_number: 234078, name: 'Maria Santos', job_title: 'Helicopter Maintenance Specialist', team: 'Rotorcraft', department: 'Specialized Operations', shift: 'Day', nationality: 'Philippines', hire_date: '2019-08-14', supervisor: 'James Wilson', location: 'Helicopter Hangar', certifications: [
    { code: 'B1.3', aircraft: 'H225', authority: 'EASA', expiry: '2026-01-20', status: 'Valid', days_to_expire: 300, issued_date: '2023-01-20' },
    { code: 'B1.4', aircraft: 'R44', authority: 'GCAA', expiry: '2025-11-30', status: 'Valid', days_to_expire: 160, issued_date: '2023-11-30' },
    { code: 'A3', aircraft: 'H130', authority: 'EASA', expiry: '2026-06-15', status: 'Valid', days_to_expire: 447, issued_date: '2023-06-15' }
  ], next_training_due: '2025-11-30', priority_score: 72, phone: '+971501234573', email: 'maria.santos@company.com', training_completed: 9, training_pending: 2, performance_rating: 4.3, languages: ['English', 'Filipino', 'Arabic'], skills: ['Helicopter Systems', 'Rotor Dynamics', 'Safety'] },

  { id: 8, e_number: 234091, name: 'Rajesh Kumar', job_title: 'Engine Specialist', team: 'Powerplant', department: 'Engineering', shift: 'Day', nationality: 'India', hire_date: '2018-05-22', supervisor: 'David Harris', location: 'Engine Shop', certifications: [
    { code: 'B1.1', aircraft: 'CFM56', authority: 'EASA', expiry: '2026-09-10', status: 'Valid', days_to_expire: 560, issued_date: '2023-09-10' },
    { code: 'B1.1', aircraft: 'GEnx', authority: 'FAA', expiry: '2025-08-22', status: 'Valid', days_to_expire: 60, issued_date: '2023-08-22' },
    { code: 'B1.1', aircraft: 'Trent 1000', authority: 'UK CAA', expiry: '2026-12-05', status: 'Valid', days_to_expire: 650, issued_date: '2023-12-05' }
  ], next_training_due: '2025-08-22', priority_score: 82, phone: '+971501234574', email: 'rajesh.kumar@company.com', training_completed: 11, training_pending: 3, performance_rating: 4.5, languages: ['English', 'Hindi', 'Arabic'], skills: ['Engine Systems', 'Turbine Technology', 'Performance Analysis'] },

  { id: 9, e_number: 234105, name: 'Elena Rodriguez', job_title: 'Composite Structures Specialist', team: 'Structures', department: 'Engineering', shift: 'Day', nationality: 'Spain', hire_date: '2020-01-15', supervisor: 'Michael Thompson', location: 'Composite Shop', certifications: [
    { code: 'B1.1', aircraft: 'A350', authority: 'EASA', expiry: '2026-04-18', status: 'Valid', days_to_expire: 395, issued_date: '2023-04-18' },
    { code: 'B1.1', aircraft: 'B787', authority: 'EASA', expiry: '2025-10-12', status: 'Valid', days_to_expire: 111, issued_date: '2023-10-12' },
    { code: 'C', aircraft: 'Composite Aircraft', authority: 'EASA', expiry: '2026-07-30', status: 'Valid', days_to_expire: 508, issued_date: '2022-07-30' }
  ], next_training_due: '2025-10-12', priority_score: 76, phone: '+971501234575', email: 'elena.rodriguez@company.com', training_completed: 7, training_pending: 1, performance_rating: 4.4, languages: ['English', 'Spanish', 'French'], skills: ['Composite Repair', 'NDT', 'Materials Engineering'] },

  { id: 10, e_number: 234118, name: 'Chen Wei', job_title: 'Avionics Systems Engineer', team: 'Avionics', department: 'Engineering', shift: 'Evening', nationality: 'China', hire_date: '2019-03-08', supervisor: 'Sarah Johnson', location: 'Avionics Lab', certifications: [
    { code: 'B2', aircraft: 'All Aircraft', authority: 'EASA', expiry: '2025-12-08', status: 'Valid', days_to_expire: 168, issued_date: '2023-12-08' },
    { code: 'B2', aircraft: 'B787', authority: 'FAA', expiry: '2026-03-20', status: 'Valid', days_to_expire: 270, issued_date: '2024-03-20' },
    { code: 'A1', aircraft: 'A320/B737', authority: 'GCAA', expiry: '2026-11-15', status: 'Valid', days_to_expire: 610, issued_date: '2023-11-15' }
  ], next_training_due: '2025-12-08', priority_score: 74, phone: '+971501234576', email: 'chen.wei@company.com', training_completed: 6, training_pending: 2, performance_rating: 4.2, languages: ['English', 'Mandarin', 'Arabic'], skills: ['Flight Management Systems', 'Navigation', 'Software Troubleshooting'] }
];

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
  const [viewMode, setViewMode] = useState('gantt'); // gantt, calendar, list, employee
  const [assignedEmployees, setAssignedEmployees] = useState({
    1: [1, 2, 4], 2: [3, 5, 7], 3: [6, 8, 9], 4: [1, 10], 5: [2, 3, 6], 6: [4, 7], 7: [5, 8], 8: [9, 10, 1], 9: [2], 10: [3, 4], 11: [5, 6, 7], 12: [8, 9], 13: [10, 1, 2], 14: [3], 15: [4, 5], 16: [6, 7, 8], 17: [9, 10], 18: [1, 3], 19: [2, 4, 5], 20: [6, 7]
  });
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const ganttRef = useRef(null);
  const [selectedReplacementEmployee, setSelectedReplacementEmployee] = useState<number | null>(null);
  const [substitutionStep, setSubstitutionStep] = useState<'select-original' | 'select-replacement'>('select-original');
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);
  const [employeeToReplace, setEmployeeToReplace] = useState<number | null>(null);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState(null);
  const [showAssignTrainingModal, setShowAssignTrainingModal] = useState(false);
  const [selectedEmployeeForTraining, setSelectedEmployeeForTraining] = useState(null);
  const [employeeQualifiedTrainings, setEmployeeQualifiedTrainings] = useState([]);

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

  // Add this after the existing filteredSessions useMemo (around line 250)
  const employeeTrainingData = useMemo(() => {
    return mockEmployees.map(employee => {
      const employeeTrainings = Object.entries(assignedEmployees)
        .filter(([sessionId, employeeIds]) => employeeIds.includes(employee.id))
        .map(([sessionId]) => {
          const session = mockTrainingSessions.find(s => s.id === parseInt(sessionId));
          return session;
        })
        .filter(Boolean);
  
      return {
        ...employee,
        trainings: employeeTrainings,
        upcomingTrainings: employeeTrainings.filter(t => new Date(t.start_date) > new Date()),
        completedTrainings: employeeTrainings.filter(t => new Date(t.end_date) < new Date()),
        expiringCertifications: employee.certifications.filter(cert => cert.days_to_expire < 90 && cert.days_to_expire > 0),
        expiredCertifications: employee.certifications.filter(cert => cert.days_to_expire < 0)
      };
    });
  }, [assignedEmployees]);

  const getQualifiedTrainingsForEmployee = useMemo(() => {
    return (employee) => {
      if (!employee) return [];
      
      return mockTrainingSessions.filter(session => {
        // Exclude sessions that are completed or cancelled
        if (['Completed', 'Cancelled'].includes(session.status)) return false;
        
        // Check if employee is already assigned
        const isAlreadyAssigned = assignedEmployees[session.id]?.includes(employee.id);
        if (isAlreadyAssigned) return false;
        
        // Check if session has available capacity
        const currentAssigned = assignedEmployees[session.id]?.length || 0;
        if (currentAssigned >= session.max_participants) return false;
        
        // Match training prerequisites with employee certifications
        const employeeCerts = employee.certifications.map(cert => cert.code.toLowerCase());
        const sessionRequirements = session.prerequisites || [];
        
        // Basic qualification check - employee should have relevant certifications
        const hasRelevantCert = employeeCerts.some(cert => 
          session.name.toLowerCase().includes(cert) || 
          session.category.toLowerCase().includes('basic') ||
          cert.includes('a1') || cert.includes('b1') || cert.includes('b2') || cert.includes('c')
        );
        
        return hasRelevantCert;
      }).sort((a, b) => {
        // Sort by priority and relevance
        const aRelevance = getPriorityForEmployee(employee, a);
        const bRelevance = getPriorityForEmployee(employee, b);
        return bRelevance - aRelevance;
      });
    };
  }, [assignedEmployees]);
  
  const getPriorityForEmployee = (employee, session) => {
    let score = 0;
    
    // Higher priority for employees with expiring certifications
    const expiringCerts = employee.certifications.filter(cert => cert.days_to_expire < 90 && cert.days_to_expire > 0);
    const expiredCerts = employee.certifications.filter(cert => cert.days_to_expire < 0);
    
    score += expiringCerts.length * 20;
    score += expiredCerts.length * 50;
    
    // Higher priority for high-priority sessions
    if (session.priority === 'Critical') score += 30;
    else if (session.priority === 'High') score += 20;
    else if (session.priority === 'Medium') score += 10;
    
    // Factor in employee's base priority score
    score += employee.priority_score * 0.5;
    
    return score;
  };


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

  const handleEmployeeSubstitution = () => {
    if (!selectedSession || !selectedEmployeeForSwap || !selectedReplacementEmployee) return;
    
    setAssignedEmployees(prev => ({
      ...prev,
      [selectedSession.id]: prev[selectedSession.id]
        ?.filter(empId => empId !== selectedEmployeeForSwap)
        .concat(selectedReplacementEmployee) || [selectedReplacementEmployee]
    }));
    
    // Close modal and reset state
    setShowSwapModal(false);
    setSelectedEmployeeForSwap(null);
    setSelectedReplacementEmployee(null);
    setSubstitutionStep('select-original');
    
    // Optional: Show success message
    console.log(`Successfully substituted employee ${selectedEmployeeForSwap} with ${selectedReplacementEmployee}`);
  };

  const handleScheduleEmployeeForTraining = (sessionId) => {
    if (!selectedEmployeeForTraining) return;
    
    setAssignedEmployees(prev => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] || []), selectedEmployeeForTraining.id]
    }));
    
    // Update qualified trainings list to reflect the change
    const updatedQualifiedTrainings = employeeQualifiedTrainings.filter(session => session.id !== sessionId);
    setEmployeeQualifiedTrainings(updatedQualifiedTrainings);
    
    // Optional: Show success message
    console.log(`Successfully scheduled ${selectedEmployeeForTraining.name} for training: ${mockTrainingSessions.find(s => s.id === sessionId)?.name}`);
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
              <button
                onClick={() => setViewMode('employee')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'employee' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Employee View
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
        <div className="bg-white rounded-lg shadow overflow-hidden  h-[45vh]">
          <ScrollArea className="h-full">
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
                            <div className="text-xs font-medium text-gray w-full">
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
          </ScrollArea>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow overflow-hidden h-[45vh]">
          <ScrollArea className="h-full">
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
          </ScrollArea>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden h-[45vh]">
          <ScrollArea className="h-full">
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
          </ScrollArea>
        </div>
      )}

      {/* Employee View */}
        {viewMode === 'employee' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Employee Training Overview</h3>
            <p className="text-sm text-gray-600 mt-1">View all employees and their assigned training sessions</p>
          </div>
          <ScrollArea className="h-[45vh]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certifications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upcoming Training</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeTrainingData.map(employee => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">#{employee.e_number}</div>
                            <div className="text-xs text-gray-400">{employee.job_title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.team}</div>
                        <div className="text-sm text-gray-500">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {employee.certifications.slice(0, 3).map((cert, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}
                            >
                              {cert.code}
                            </span>
                          ))}
                          {employee.certifications.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{employee.certifications.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {employee.upcomingTrainings.length > 0 ? (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {employee.upcomingTrainings.map((training, index) => (
                              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-1 last:pb-0">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                                  {training.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(training.start_date).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No upcoming training</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {employee.expiredCertifications.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {employee.expiredCertifications.length} Expired
                            </span>
                          )}
                          {employee.expiringCertifications.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {employee.expiringCertifications.length} Expiring
                            </span>
                          )}
                          {employee.expiredCertifications.length === 0 && employee.expiringCertifications.length === 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                employee.priority_score >= 90 ? 'bg-red-500' :
                                employee.priority_score >= 70 ? 'bg-orange-500' :
                                employee.priority_score >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${employee.priority_score}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-900">{employee.priority_score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => {
                            setSelectedEmployeeForDetails(employee);
                            setShowEmployeeDetailsModal(true);
                          }}
                        >
                          View Details
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => {
                            setSelectedEmployeeForTraining(employee);
                            const qualifiedTrainings = getQualifiedTrainingsForEmployee(employee);
                            setEmployeeQualifiedTrainings(qualifiedTrainings);
                            setShowAssignTrainingModal(true);
                          }}
                        >
                          Assign Training
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
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

      {/* Employee Details Modal */}
      {showEmployeeDetailsModal && selectedEmployeeForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[800px] max-h-[90%] overflow-y-auto">
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Employee Details - {selectedEmployeeForDetails.name}</h2>
              <button
                onClick={() => setShowEmployeeDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-8 w-8" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <p><strong>Employee #:</strong> {selectedEmployeeForDetails.e_number}</p>
                  <p><strong>Job Title:</strong> {selectedEmployeeForDetails.job_title}</p>
                  <p><strong>Department:</strong> {selectedEmployeeForDetails.department}</p>
                  <p><strong>Team:</strong> {selectedEmployeeForDetails.team}</p>
                  <p><strong>Shift:</strong> {selectedEmployeeForDetails.shift}</p>
                  <p><strong>Location:</strong> {selectedEmployeeForDetails.location}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Certifications</h3>
                  <div className="space-y-2">
                    {selectedEmployeeForDetails.certifications.map((cert, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{cert.code} - {cert.aircraft}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          cert.status === 'Valid' ? 'bg-green-100 text-green-800' :
                          cert.status === 'Expiring Soon' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cert.status}
                        </span>
                      </div>
                    ))}
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
              <h3 className="text-xl font-semibold mb-2">Employee SWAP</h3>
              <p className="text-gray-600">
                Replace an assigned employee with another qualified employee for the same training session: <strong>{selectedSession?.name}</strong>
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-4">Step 1: Select Employee to Replace:</h4>
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
                      onClick={() => {
                        setSelectedEmployeeForSwap(empId);
                        setEmployeeToReplace(empId); // Add this line
                      }}
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


              {selectedEmployeeForSwap && substitutionStep === 'select-original' && (
                <div>
                  <h4 className="font-medium mb-4">Step 2: Select Replacement Employee:</h4>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mb-4">
                    <p className="text-sm text-green-800">
                      🔄 <strong>Substituting:</strong> {mockEmployees.find(e => e.id === selectedEmployeeForSwap)?.name} 
                      with a qualified replacement for the same training session.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="mb-4 flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showAllEmployees}
                          onChange={(e) => setShowAllEmployees(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Choose others (show all employees)
                        </span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {showAllEmployees ? 'Showing all employees' : 'Showing top 5 qualified candidates'}
                      </span>
                    </div>

                    {(showAllEmployees 
                      ? mockEmployees.filter(emp => 
                          emp.id !== employeeToReplace &&  
                          !selectedSession?.assignedEmployees?.some(assigned => assigned.id === emp.id)
                        )
                      : mockEmployees
                          .filter(emp => 
                            !assignedEmployees[selectedSession?.id]?.includes(emp.id) && // Not already assigned
                            emp.id !== selectedEmployeeForSwap && // Not the employee being replaced
                            // Add qualification logic here - check if employee meets prerequisites
                            selectedSession?.prerequisites.some(prereq => 
                              emp.certifications.some(cert => cert.code.includes(prereq.split(' ')[0]))
                            )
                          )
                          .sort((a, b) => {
                            // Sort by priority score and certification relevance
                            const aScore = a.priority_score + (a.certifications.length * 5);
                            const bScore = b.priority_score + (b.certifications.length * 5);
                            return bScore - aScore;
                          })
                          .slice(0, 5) // Show top 5 candidates
                    ).map(employee => (
                        <div
                          key={employee.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedReplacementEmployee === employee.id 
                              ? 'border-green-500 bg-green-50' 
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => setSelectedReplacementEmployee(employee.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{employee.name}</div>
                              <div className="text-sm text-gray-600">#{employee.e_number} - {employee.job_title}</div>
                              <div className="text-xs text-gray-500">{employee.team} Team</div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {employee.certifications.slice(0, 3).map((cert, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                    {cert.code}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 text-right">
                              <div className="text-green-600 font-medium">✓ Qualified</div>
                              <div>Priority: {employee.priority_score}</div>
                              <div>Performance: {employee.performance_rating}/5</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSelectedEmployeeForSwap(null);
                  setSelectedReplacementEmployee(null);
                  setSubstitutionStep('select-original');
                  setShowAllEmployees(false); // Add this line
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                disabled={!selectedEmployeeForSwap || !selectedReplacementEmployee}
                onClick={handleEmployeeSubstitution}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                Complete Substitution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Training Modal */}
      {showAssignTrainingModal && selectedEmployeeForTraining && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[1000px] max-h-[90vh] overflow-hidden">
            <div className="border-b p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Assign Training - {selectedEmployeeForTraining.name}</h2>
                <p className="text-gray-600 mt-1">#{selectedEmployeeForTraining.e_number} - {selectedEmployeeForTraining.job_title}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignTrainingModal(false);
                  setSelectedEmployeeForTraining(null);
                  setEmployeeQualifiedTrainings([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-8 w-8" />
              </button>
            </div>
      
            <div className="p-6">
              {/* Employee Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Employee Overview</h3>
                    <p className="text-sm"><strong>Team:</strong> {selectedEmployeeForTraining.team}</p>
                    <p className="text-sm"><strong>Department:</strong> {selectedEmployeeForTraining.department}</p>
                    <p className="text-sm"><strong>Priority Score:</strong> {selectedEmployeeForTraining.priority_score}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Certification Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployeeForTraining.certifications.slice(0, 3).map((cert, idx) => (
                        <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                          {cert.code} ({cert.days_to_expire}d)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
      
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Qualified Training Sessions ({employeeQualifiedTrainings.length})</h3>
                <div className="text-sm text-gray-600">
                  🎯 Smart recommendations based on certifications and priority
                </div>
              </div>
      
              {/* Qualified Trainings List */}
              <div className="max-h-96 overflow-y-auto space-y-4">
                {employeeQualifiedTrainings.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 mb-2">No qualified training sessions found</div>
                    <div className="text-sm text-gray-400">All available sessions are either full, completed, or not matching employee qualifications</div>
                  </div>
                ) : (
                  employeeQualifiedTrainings.map(session => {
                    const currentAssigned = assignedEmployees[session.id]?.length || 0;
                    const utilization = Math.round((currentAssigned / session.max_participants) * 100);
                    const relevanceScore = getPriorityForEmployee(selectedEmployeeForTraining, session);
                    
                    return (
                      <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">{session.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAuthorityColor(session.authority)}`}>
                                {session.authority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(session.priority)}`}>
                                {session.priority}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="mr-4">📅 {session.start_date} to {session.end_date}</span>
                              <span className="mr-4">📍 {session.location}</span>
                              <span>👨‍🏫 {session.instructor}</span>
                            </div>
                            <div className="text-xs text-gray-500 grid grid-cols-3 gap-2">
                              <span>🎯 Relevance Score: {relevanceScore}</span>
                              <span>👥 Capacity: {currentAssigned}/{session.max_participants}</span>
                              <span>⭐ Rating: {session.rating}/5</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleScheduleEmployeeForTraining(session.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                          >
                            Schedule
                          </button>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                utilization >= 90 ? 'bg-red-500' : 
                                utilization >= 75 ? 'bg-orange-500' : 
                                utilization >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{utilization}%</span>
                        </div>
      
                        {/* Prerequisites Match */}
                        <div className="text-xs text-gray-600">
                          <strong>Match Indicators:</strong>
                          {selectedEmployeeForTraining.certifications.filter(cert => 
                            session.name.toLowerCase().includes(cert.code.toLowerCase()) ||
                            session.category.toLowerCase().includes(cert.code.toLowerCase())
                          ).map((cert, idx) => (
                            <span key={idx} className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded">
                              ✓ {cert.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
      
            <div className="border-t p-6 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="mr-6">📚 Training Completed: {selectedEmployeeForTraining.training_completed}</span>
                <span className="mr-6">⏳ Training Pending: {selectedEmployeeForTraining.training_pending}</span>
                <span>⭐ Performance: {selectedEmployeeForTraining.performance_rating}/5</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignTrainingModal(false);
                    setSelectedEmployeeForTraining(null);
                    setEmployeeQualifiedTrainings([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    // Bulk schedule top 3 recommended trainings
                    const topTrainings = employeeQualifiedTrainings.slice(0, 3);
                    topTrainings.forEach(session => handleScheduleEmployeeForTraining(session.id));
                  }}
                  disabled={employeeQualifiedTrainings.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  Quick Schedule (Top 3)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainingManagementSystem;