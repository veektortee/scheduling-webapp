import * as XLSX from 'xlsx';
import { SchedulingCase } from '@/types/scheduling'; // Removed unused Shift and Provider imports

export interface ScheduleResult {
  assignments: Array<{
    date: string;
    shiftId: string;
    shiftType: string;
    providerId: string;
    providerName: string;
    startTime: string;
    endTime: string;
  }>;
  summary: {
    totalAssignments: number;
    providerWorkload: Record<string, number>;
    shiftCoverage: Record<string, number>;
  };
}

export function exportScheduleToExcel(
  schedulingCase: SchedulingCase,
  results?: ScheduleResult,
  filename?: string
) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Schedule Overview
  if (results) {
    const scheduleData = results.assignments.map(assignment => ({
      'Date': assignment.date,
      'Shift ID': assignment.shiftId,
      'Shift Type': assignment.shiftType,
      'Start Time': assignment.startTime,
      'End Time': assignment.endTime,
      'Provider ID': assignment.providerId,
      'Provider Name': assignment.providerName,
    }));

    const scheduleSheet = XLSX.utils.json_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Schedule');
  }

  // Sheet 2: Shifts Configuration
  const shiftsData = schedulingCase.shifts.map(shift => ({
    'Shift ID': shift.id,
    'Date': shift.date,
    'Type': shift.type,
    'Start Time': shift.start.split('T')[1]?.substring(0, 5) || shift.start,
    'End Time': shift.end.split('T')[1]?.substring(0, 5) || shift.end,
    'Allowed Provider Types': (shift.allowed_provider_types || []).join(', '),
  }));
  const shiftsSheet = XLSX.utils.json_to_sheet(shiftsData);
  XLSX.utils.book_append_sheet(workbook, shiftsSheet, 'Shifts');

  // Sheet 3: Providers Configuration
  const providersData = schedulingCase.providers.map(provider => ({
    'Provider ID': provider.id || 'N/A',
    'Name': provider.name || 'N/A',
    'Type': provider.type || 'N/A',
    'Max Consecutive Days': provider.max_consecutive_days || 'No limit',
    'Min Total Shifts': provider.limits?.min_total || 0,
    'Max Total Shifts': provider.limits?.max_total || 'No limit',
    'Fixed OFF Days': (provider.forbidden_days_hard || []).join(', ') || 'None',
    'Prefer OFF Days': (provider.forbidden_days_soft || []).join(', ') || 'None',
  }));
  const providersSheet = XLSX.utils.json_to_sheet(providersData);
  XLSX.utils.book_append_sheet(workbook, providersSheet, 'Providers');

  // Sheet 4: Calendar
  const calendarData = schedulingCase.calendar.days.map(day => {
    const date = new Date(day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = schedulingCase.calendar.weekend_days.includes(dayName);
    
    return {
      'Date': day,
      'Day': dayName,
      'Is Weekend': isWeekend ? 'Yes' : 'No',
      'Shifts Count': schedulingCase.shifts.filter(s => s.date === day).length,
    };
  });
  const calendarSheet = XLSX.utils.json_to_sheet(calendarData);
  XLSX.utils.book_append_sheet(workbook, calendarSheet, 'Calendar');

  // Sheet 5: Summary Statistics
  if (results) {
    const summaryData = [
      { 'Metric': 'Total Assignments', 'Value': results.summary.totalAssignments },
      { 'Metric': 'Total Providers', 'Value': schedulingCase.providers.length },
      { 'Metric': 'Total Shifts', 'Value': schedulingCase.shifts.length },
      { 'Metric': 'Total Days', 'Value': schedulingCase.calendar.days.length },
      { 'Metric': 'Weekend Days', 'Value': schedulingCase.calendar.weekend_days.join(', ') },
      ...Object.entries(results.summary.providerWorkload).map(([provider, count]) => ({
        'Metric': `${provider} Assignments`,
        'Value': count,
      })),
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  // Sheet 6: Configuration
  const configData = [
    { 'Setting': 'Max Time (seconds)', 'Value': schedulingCase.constants.solver.max_time_in_seconds },
    { 'Setting': 'Phase 1 Fraction', 'Value': schedulingCase.constants.solver.phase1_fraction },
    { 'Setting': 'Relative Gap', 'Value': schedulingCase.constants.solver.relative_gap },
    { 'Setting': 'Number of Threads', 'Value': schedulingCase.constants.solver.num_threads },
    { 'Setting': 'Output Directory', 'Value': schedulingCase.run.out },
    { 'Setting': 'Solutions (k)', 'Value': schedulingCase.run.k },
    { 'Setting': 'Variety (L)', 'Value': schedulingCase.run.L },
    { 'Setting': 'Seed', 'Value': schedulingCase.run.seed },
    { 'Setting': 'Time Limit (min)', 'Value': schedulingCase.run.time },
  ];
  const configSheet = XLSX.utils.json_to_sheet(configData);
  XLSX.utils.book_append_sheet(workbook, configSheet, 'Configuration');

  // Generate filename with timestamp
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const defaultFilename = `Staff_Schedule_${timestamp}.xlsx`;
  const finalFilename = filename || defaultFilename;

  // Write and download file
  XLSX.writeFile(workbook, finalFilename);

  return finalFilename;
}

export function exportCurrentCaseToExcel(schedulingCase: SchedulingCase) {
  return exportScheduleToExcel(schedulingCase, undefined, `Schedule_Configuration_${Date.now()}.xlsx`);
}

// Generate mock results for demo purposes
export function generateMockResults(schedulingCase: SchedulingCase): ScheduleResult {
  const assignments = schedulingCase.shifts.map(shift => {
    // Randomly assign a provider (in real implementation, this comes from the solver)
    const eligibleProviders = schedulingCase.providers.filter(provider => 
      !shift.allowed_provider_types.length || 
      shift.allowed_provider_types.includes(provider.type || 'MD')
    );
    
    const randomProvider = eligibleProviders[Math.floor(Math.random() * eligibleProviders.length)] || schedulingCase.providers[0];
    
    return {
      date: shift.date,
      shiftId: shift.id,
      shiftType: shift.type,
      providerId: randomProvider?.id || 'unknown',
      providerName: randomProvider?.name || 'Unknown Provider',
      startTime: shift.start.split('T')[1]?.substring(0, 5) || shift.start,
      endTime: shift.end.split('T')[1]?.substring(0, 5) || shift.end,
    };
  });

  // Calculate workload per provider
  const providerWorkload: Record<string, number> = {};
  assignments.forEach(assignment => {
    providerWorkload[assignment.providerName] = (providerWorkload[assignment.providerName] || 0) + 1;
  });

  // Calculate shift coverage
  const shiftCoverage: Record<string, number> = {};
  assignments.forEach(assignment => {
    shiftCoverage[assignment.shiftType] = (shiftCoverage[assignment.shiftType] || 0) + 1;
  });

  return {
    assignments,
    summary: {
      totalAssignments: assignments.length,
      providerWorkload,
      shiftCoverage,
    },
  };
}
