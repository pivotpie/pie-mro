
// Helper function to determine if a date is a weekend
export const isWeekend = (dayOfMonth: number, month: number) => {
  const date = new Date(2025, month, dayOfMonth);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

// Function to generate days for a specific month
export const generateDaysForMonth = (month: number, year: number = 2025) => {
  const days = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, isWeekend: isWeekend(i, month) });
  }
  
  return days;
};

// Function to generate days for multiple months
export const generateDaysForMonths = (startMonth: number, endMonth: number, year: number = 2025) => {
  const days = [];
  
  for (let month = startMonth; month <= endMonth; month++) {
    const monthDays = generateDaysForMonth(month, year);
    days.push(...monthDays);
  }
  
  return days;
};

// Status color mapping
export const statusColors: Record<string, string> = {
  "D": "status-duty", // Duty
  "L": "status-leave", // Leave
  "T": "status-training", // Training
  "O": "status-off", // Off
};

// Legend for status colors
export const statusLegend = [
  { status: "On Duty", code: "D", className: "status-duty" },
  { status: "On Leave", code: "L", className: "status-leave" },
  { status: "Training", code: "T", className: "status-training" },
  { status: "Day Off", code: "O", className: "status-off" },
];

// Get month name
export const getMonthName = (monthIndex: number) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

// Get formatted date
export const getFormattedDate = (day: number, month: number, year: number = 2025) => {
  return `${getMonthName(month)} ${day}, ${year}`;
};
