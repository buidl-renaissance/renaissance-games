/**
 * Timezone utilities for handling EST/UTC conversions
 * 
 * All user inputs are assumed to be in EST (America/New_York)
 * All storage is in UTC
 * All display is in EST
 */

const EST_TIMEZONE = 'America/New_York';

/**
 * Convert a datetime-local input string (assumed EST) to UTC Date
 * datetime-local format: "2026-01-15T14:00"
 */
export function estInputToUtc(datetimeLocalString: string): Date {
  // The datetime-local input gives us a string without timezone
  // We need to interpret it as EST and convert to UTC
  
  // Create a date string with EST timezone explicitly
  const estDateString = `${datetimeLocalString}:00`;
  
  // Use Intl to get the UTC offset for EST at this particular date/time
  const tempDate = new Date(datetimeLocalString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Parse the EST time and convert to UTC
  // EST is UTC-5, EDT is UTC-4
  const parts = formatter.formatToParts(tempDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  
  // We need to figure out the offset for the target date in EST
  // Create the date in UTC first, then adjust
  const [datePart, timePart] = datetimeLocalString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Create a date object and use the timezone to convert properly
  // This approach: create a date assuming EST, then let JS convert to UTC
  const estDate = new Date(
    new Date(datetimeLocalString).toLocaleString('en-US', { timeZone: EST_TIMEZONE })
  );
  
  // Get the offset in minutes for EST/EDT
  const utcDate = new Date(datetimeLocalString + 'Z'); // Treat as UTC first
  const estString = utcDate.toLocaleString('en-US', { timeZone: EST_TIMEZONE });
  const estParsed = new Date(estString);
  const offsetMinutes = (utcDate.getTime() - estParsed.getTime()) / 60000;
  
  // Create final UTC date by adding the offset to the user's input
  const userInputAsUtc = new Date(`${datetimeLocalString}:00Z`);
  const finalUtc = new Date(userInputAsUtc.getTime() - offsetMinutes * 60000);
  
  return finalUtc;
}

/**
 * Convert a UTC Date to EST for display
 */
export function utcToEstDisplay(utcDate: Date | string | null): string | null {
  if (!utcDate) return null;
  
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  if (isNaN(date.getTime())) return null;
  
  const datePart = date.toLocaleDateString('en-US', {
    timeZone: EST_TIMEZONE,
    month: 'short',
    day: 'numeric',
  });
  
  const timePart = date.toLocaleTimeString('en-US', {
    timeZone: EST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).toLowerCase();
  
  return `${datePart} @ ${timePart}`;
}

/**
 * Convert a UTC Date to datetime-local format in EST for form inputs
 */
export function utcToEstInput(utcDate: Date | string | null): string {
  if (!utcDate) return '';
  
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  if (isNaN(date.getTime())) return '';
  
  // Format the date in EST timezone for the datetime-local input
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  
  // datetime-local format: YYYY-MM-DDTHH:MM
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
}
