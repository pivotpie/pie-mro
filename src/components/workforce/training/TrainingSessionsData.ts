
// Training sessions data generator and manager
import { supabase } from '@/integrations/supabase/client';

export interface TrainingSession {
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
  assigned_employees?: number[];
}

export interface TrainingType {
  code: string;
  name: string;
  authority: string;
  duration_hours: number;
  max_attendees: number;
  frequency_months: number;
}

// Realistic training types based on aviation industry standards
export const TRAINING_TYPES: TrainingType[] = [
  { code: "GCAA-REC", name: "GCAA Recertification", authority: "GCAA", duration_hours: 8, max_attendees: 15, frequency_months: 24 },
  { code: "FAA-TR", name: "FAA Type Rating", authority: "FAA", duration_hours: 8, max_attendees: 12, frequency_months: 24 },
  { code: "EASA-B1", name: "EASA B1 License Training", authority: "EASA", duration_hours: 16, max_attendees: 10, frequency_months: 60 },
  { code: "SAFETY-MGT", name: "Safety Management System", authority: "ICAO", duration_hours: 6, max_attendees: 20, frequency_months: 12 },
  { code: "HF-TRAIN", name: "Human Factors Training", authority: "ICAO", duration_hours: 4, max_attendees: 25, frequency_months: 24 },
  { code: "FIRE-SAFETY", name: "Fire Safety & Emergency", authority: "Local", duration_hours: 3, max_attendees: 30, frequency_months: 12 },
  { code: "HAZMAT", name: "Hazardous Materials Handling", authority: "IATA", duration_hours: 4, max_attendees: 20, frequency_months: 24 },
  { code: "QUALITY-SYS", name: "Quality System Training", authority: "Internal", duration_hours: 6, max_attendees: 15, frequency_months: 12 },
  { code: "CYBER-SEC", name: "Cybersecurity Awareness", authority: "Internal", duration_hours: 2, max_attendees: 50, frequency_months: 12 },
  { code: "TOOL-CALIB", name: "Tool Calibration Training", authority: "Internal", duration_hours: 4, max_attendees: 12, frequency_months: 36 }
];

// Training locations
const LOCATIONS = [
  "Training Center A", "Training Center B", "Simulator Bay 1", "Simulator Bay 2",
  "Conference Room 1", "Conference Room 2", "Hangar 4A Classroom", "Hangar 3B Classroom",
  "Safety Training Room", "E-Learning Lab", "Workshop Training Area", "External Facility"
];

// Instructors
const INSTRUCTORS = [
  "John Smith", "Sarah Johnson", "Mike Wilson", "Emily Davis", "Robert Brown",
  "Lisa Anderson", "David Taylor", "Jennifer Lee", "Michael Garcia", "Patricia Martinez",
  "James Rodriguez", "Mary Thompson", "Christopher White", "Linda Harris", "Daniel Clark"
];

export class TrainingSessionsManager {
  private static sessions: TrainingSession[] = [];
  private static employeePool: number[] = [];

  static async initialize() {
    // Fetch active employees from database
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id')
        .eq('is_active', true);
      
      if (error) throw error;
      
      this.employeePool = employees.map(emp => emp.id);
      console.log(`Initialized with ${this.employeePool.length} active employees`);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Fallback to mock employee IDs if database fetch fails
      this.employeePool = Array.from({ length: 101 }, (_, i) => i + 1);
    }

    this.generateSessions();
  }

  private static generateSessions() {
    const sessions: TrainingSession[] = [];
    let sessionId = 1;

    // Generate sessions from May 2025 to August 2025
    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-08-31');

    TRAINING_TYPES.forEach(trainingType => {
      // Generate 2-4 sessions per training type across the period
      const sessionCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < sessionCount; i++) {
        const sessionDate = this.getRandomDateBetween(startDate, endDate);
        const startTime = this.getRandomStartTime();
        const endTime = this.calculateEndTime(startTime, trainingType.duration_hours);
        const maxSeats = Math.min(trainingType.max_attendees, Math.floor(Math.random() * 6) + 10);
        const assignedCount = Math.floor(Math.random() * maxSeats * 0.8);
        const assignedEmployees = this.getRandomEmployees(assignedCount);

        sessions.push({
          id: sessionId++,
          training_type: trainingType.name,
          authority: trainingType.authority,
          session_date: sessionDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          total_seats: maxSeats,
          available_seats: maxSeats - assignedCount,
          location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
          instructor: INSTRUCTORS[Math.floor(Math.random() * INSTRUCTORS.length)],
          status: this.getSessionStatus(sessionDate),
          assigned_employees: assignedEmployees
        });
      }
    });

    // Sort sessions by date
    this.sessions = sessions.sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  }

  private static getRandomDateBetween(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
  }

  private static getRandomStartTime(): string {
    const hours = [8, 9, 10, 13, 14, 15]; // Common training start times
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minutes = [0, 30][Math.floor(Math.random() * 2)];
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private static calculateEndTime(startTime: string, durationHours: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (durationHours * 60);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  private static getRandomEmployees(count: number): number[] {
    const shuffled = [...this.employeePool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static getSessionStatus(sessionDate: Date): string {
    const now = new Date();
    const diffDays = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < -7) return 'completed';
    if (diffDays < 0) return 'in-progress';
    if (diffDays < 7) return 'upcoming';
    return 'scheduled';
  }

  static getSessions(): TrainingSession[] {
    if (this.sessions.length === 0) {
      this.generateSessions();
    }
    return this.sessions;
  }

  static getSessionsByDateRange(startDate: string, endDate: string): TrainingSession[] {
    return this.sessions.filter(session => 
      session.session_date >= startDate && session.session_date <= endDate
    );
  }

  static getUpcomingSessions(limit: number = 10): TrainingSession[] {
    const now = new Date().toISOString().split('T')[0];
    return this.sessions
      .filter(session => session.session_date >= now)
      .slice(0, limit);
  }

  static assignEmployeeToSession(sessionId: number, employeeId: number): boolean {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session || session.available_seats <= 0) return false;
    
    if (!session.assigned_employees) session.assigned_employees = [];
    if (session.assigned_employees.includes(employeeId)) return false;
    
    session.assigned_employees.push(employeeId);
    session.available_seats--;
    return true;
  }

  static removeEmployeeFromSession(sessionId: number, employeeId: number): boolean {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session || !session.assigned_employees) return false;
    
    const index = session.assigned_employees.indexOf(employeeId);
    if (index === -1) return false;
    
    session.assigned_employees.splice(index, 1);
    session.available_seats++;
    return true;
  }
}
