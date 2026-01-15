/**
 * Timezone utilities for handling EST/UTC conversions
 * 
 * All user inputs are assumed to be in EST (America/New_York)
 * All storage is in UTC
 * All display is in EST
 */

const EST_TIMEZONE = 'America/New_York';

/**
 * Get the UTC offset in minutes for America/New_York at a specific UTC time.
 * Returns negative for behind UTC (EST = -300, EDT = -240)
 */
function getEstOffsetMinutes(utcDate: Date): number {
  // Format the same instant in both UTC and EST
  const utcString = utcDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const estString = utcDate.toLocaleString('en-US', { timeZone: EST_TIMEZONE });
  
  // Parse both strings back to dates (will be interpreted as local, but we only care about the difference)
  const utcParsed = new Date(utcString);
  const estParsed = new Date(estString);
  
  // The difference tells us the offset
  return (estParsed.getTime() - utcParsed.getTime()) / 60000;
}

/**
 * Convert a datetime-local input string (assumed EST) to UTC Date
 * datetime-local format: "2026-01-15T14:00"
 */
export function estInputToUtc(datetimeLocalString: string): Date {
  if (!datetimeLocalString) {
    return new Date(NaN);
  }
  
  // Parse the datetime-local string
  const [datePart, timePart] = datetimeLocalString.split('T');
  if (!datePart || !timePart) {
    return new Date(NaN);
  }
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Create a UTC date with the same numeric values
  // (pretending the EST time is UTC for now)
  const assumedUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  
  // Get the EST offset at this approximate time
  // (close enough - DST transitions don't happen mid-day)
  const estOffset = getEstOffsetMinutes(assumedUtc);
  
  // Subtract the offset to convert EST -> UTC
  // If EST is UTC-5 (offset = -300), we add 300 minutes (5 hours) to get UTC
  const utcTime = assumedUtc.getTime() - estOffset * 60000;
  
  return new Date(utcTime);
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
  
  return `${datePart} @ ${timePart} EST`;
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
