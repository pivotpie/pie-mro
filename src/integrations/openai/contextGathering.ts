import { supabase } from '@/integrations/supabase/client';

export interface OperationalContext {
  currentDate: Date;
  aircraft: {
    today: {
      total: number;
      inMaintenance: number;
      scheduled: number;
      completed: number;
      details: Array<{
        registration: string;
        status: string;
        checkType: string;
      }>;
    };
    overall: {
      totalVisits: number;
      inProgress: number;
      scheduled: number;
      completed: number;
    };
  };
  workforce: {
    today: {
      total: number;
      available: number;
      onLeave: number;
      inTraining: number;
      availabilityRate: number;
    };
    overall: {
      totalEmployees: number;
    };
  };
  certifications: {
    expiringSoon: number;
    critical: number;
    details: Array<{
      employeeName: string;
      authType: string;
      expiryDate: string;
    }>;
  };
}

/**
 * Fetch aircraft maintenance status - both today's data and overall statistics
 */
export async function fetchAircraftContext(currentDate: Date) {
  try {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Get maintenance visits active TODAY (date_in <= currentDate <= date_out)
    const { data: todayData, error: todayError } = await supabase
      .from('maintenance_visits')
      .select('aircraft(registration), status, check_type, date_in, date_out')
      .lte('date_in', dateStr)
      .gte('date_out', dateStr);

    if (todayError) throw todayError;

    // Get ALL maintenance visits for overall statistics
    const { data: allData, error: allError } = await supabase
      .from('maintenance_visits')
      .select('status');

    if (allError) throw allError;

    // Process today's data
    const todayInProgress = todayData?.filter(d => d.status === 'In Progress') || [];
    const todayScheduled = todayData?.filter(d => d.status === 'Scheduled') || [];
    const todayCompleted = todayData?.filter(d => d.status === 'Completed') || [];

    // Process overall data
    const overallInProgress = allData?.filter(d => d.status === 'In Progress') || [];
    const overallScheduled = allData?.filter(d => d.status === 'Scheduled') || [];
    const overallCompleted = allData?.filter(d => d.status === 'Completed') || [];

    return {
      today: {
        total: todayData?.length || 0,
        inMaintenance: todayInProgress.length,
        scheduled: todayScheduled.length,
        completed: todayCompleted.length,
        details: todayData?.slice(0, 10).map(d => ({
          registration: d.aircraft?.registration || 'Unknown',
          status: d.status || 'Unknown',
          checkType: d.check_type || 'Unknown'
        })) || []
      },
      overall: {
        totalVisits: allData?.length || 0,
        inProgress: overallInProgress.length,
        scheduled: overallScheduled.length,
        completed: overallCompleted.length
      }
    };
  } catch (error) {
    console.error('Error fetching aircraft context:', error);
    return {
      today: {
        total: 0,
        inMaintenance: 0,
        scheduled: 0,
        completed: 0,
        details: []
      },
      overall: {
        totalVisits: 0,
        inProgress: 0,
        scheduled: 0,
        completed: 0
      }
    };
  }
}

/**
 * Fetch workforce availability - both today's assignments and overall employee count
 */
export async function fetchWorkforceContext(currentDate: Date) {
  try {
    // Get total employee count (overall)
    const { data: allEmployees, error: empError } = await supabase
      .from('employees')
      .select('id');

    if (empError) throw empError;

    const totalEmployees = allEmployees?.length || 0;

    // Get employee support codes for TODAY
    const dateStr = currentDate.toISOString().split('T')[0];
    const { data: supportData, error: supportError } = await supabase
      .from('employee_supports')
      .select(`
        employee_id,
        support_codes(support_code)
      `)
      .eq('assignment_date', dateStr);

    if (supportError) throw supportError;

    if (!supportData || supportData.length === 0) {
      return {
        today: {
          total: totalEmployees,
          available: 0,
          onLeave: 0,
          inTraining: 0,
          availabilityRate: 0
        },
        overall: {
          totalEmployees: totalEmployees
        }
      };
    }

    // Count employees by support code for TODAY
    const available = supportData.filter(s =>
      s.support_codes?.support_code === 'AV'
    );

    const onLeave = supportData.filter(s =>
      s.support_codes?.support_code === 'L' ||
      s.support_codes?.support_code === 'AL'
    );

    const inTraining = supportData.filter(s =>
      s.support_codes?.support_code === 'TR'
    );

    const availabilityRate = totalEmployees > 0
      ? (available.length / totalEmployees) * 100
      : 0;

    return {
      today: {
        total: totalEmployees,
        available: available.length,
        onLeave: onLeave.length,
        inTraining: inTraining.length,
        availabilityRate: Math.round(availabilityRate)
      },
      overall: {
        totalEmployees: totalEmployees
      }
    };
  } catch (error) {
    console.error('Error fetching workforce context:', error);
    return {
      today: {
        total: 0,
        available: 0,
        onLeave: 0,
        inTraining: 0,
        availabilityRate: 0
      },
      overall: {
        totalEmployees: 0
      }
    };
  }
}

/**
 * Fetch certification expiry information
 */
export async function fetchCertificationContext(currentDate: Date) {
  try {
    const next30Days = new Date(currentDate);
    next30Days.setDate(next30Days.getDate() + 30);
    const next90Days = new Date(currentDate);
    next90Days.setDate(next90Days.getDate() + 90);

    const { data, error } = await supabase
      .from('employee_authorizations')
      .select(`
        id,
        expiry_date,
        employees(name, e_number),
        authorization_types(name),
        aircraft_models(model_name)
      `)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', currentDate.toISOString().split('T')[0])
      .lte('expiry_date', next90Days.toISOString().split('T')[0]);

    if (error) throw error;

    if (!data) {
      return {
        expiringSoon: 0,
        critical: 0,
        details: []
      };
    }

    const critical = data.filter(d => {
      const expiryDate = new Date(d.expiry_date);
      return expiryDate <= next30Days;
    });

    return {
      expiringSoon: data.length,
      critical: critical.length,
      details: critical.slice(0, 5).map(d => ({
        employeeName: d.employees?.name || 'Unknown',
        authType: d.authorization_types?.name || 'Unknown',
        expiryDate: new Date(d.expiry_date).toLocaleDateString()
      }))
    };
  } catch (error) {
    console.error('Error fetching certification context:', error);
    return {
      expiringSoon: 0,
      critical: 0,
      details: []
    };
  }
}

/**
 * Gather all operational context for AI assistant
 */
export async function gatherOperationalContext(currentDate: Date): Promise<OperationalContext> {
  // Fetch all context in parallel for performance
  const [aircraft, workforce, certifications] = await Promise.all([
    fetchAircraftContext(currentDate),
    fetchWorkforceContext(currentDate),
    fetchCertificationContext(currentDate)
  ]);

  return {
    currentDate,
    aircraft,
    workforce,
    certifications
  };
}

/**
 * Format operational context into a concise string for GPT prompt
 */
export function formatContextForPrompt(context: OperationalContext): string {
  return `
OPERATIONAL STATUS (as of ${context.currentDate.toLocaleDateString()}):

=== TODAY'S SNAPSHOT (${context.currentDate.toLocaleDateString()}) ===

Aircraft Maintenance TODAY:
- Active maintenance visits: ${context.aircraft.today.total}
- In Progress: ${context.aircraft.today.inMaintenance}
- Scheduled: ${context.aircraft.today.scheduled}
- Completed: ${context.aircraft.today.completed}
${context.aircraft.today.details.length > 0 ? `- Details: ${context.aircraft.today.details.map(a => `${a.registration} (${a.status}, ${a.checkType})`).join(', ')}` : ''}

Workforce TODAY:
- Employees in system: ${context.workforce.today.total}
- Available for assignment: ${context.workforce.today.available} (${context.workforce.today.availabilityRate}%)
- On leave: ${context.workforce.today.onLeave}
- In training: ${context.workforce.today.inTraining}

=== OVERALL SYSTEM STATISTICS ===

Aircraft (All Time):
- Total maintenance visits in system: ${context.aircraft.overall.totalVisits}
- Currently In Progress: ${context.aircraft.overall.inProgress}
- Currently Scheduled: ${context.aircraft.overall.scheduled}
- Completed visits: ${context.aircraft.overall.completed}

Workforce (Overall):
- Total employees in organization: ${context.workforce.overall.totalEmployees}

=== CERTIFICATIONS & COMPLIANCE ===

- Authorizations expiring in 90 days: ${context.certifications.expiringSoon}
- Critical (expiring in 30 days): ${context.certifications.critical}
${context.certifications.details.length > 0 ? `- Critical expiries: ${context.certifications.details.map(c => `${c.employeeName} - ${c.authType} (${c.expiryDate})`).join(', ')}` : ''}
`.trim();
}
