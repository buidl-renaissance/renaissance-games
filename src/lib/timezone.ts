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
 * Uses Intl.DateTimeFormat for consistent server/client behavior.
 */
function getEstOffsetMinutes(utcDate: Date): number {
  // Use Intl.DateTimeFormat to get numeric parts in both timezones
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const estFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const getParts = (formatter: Intl.DateTimeFormat) => {
    const parts = formatter.formatToParts(utcDate);
    const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    return {
      year: get('year'),
      month: get('month'),
      day: get('day'),
      hour: get('hour'),
      minute: get('minute'),
    };
  };

  const utcParts = getParts(utcFormatter);
  const estParts = getParts(estFormatter);

  // Calculate total minutes from midnight for both
  const utcMinutes = utcParts.day * 24 * 60 + utcParts.hour * 60 + utcParts.minute;
  const estMinutes = estParts.day * 24 * 60 + estParts.hour * 60 + estParts.minute;

  // Handle day boundary (e.g., UTC is Jan 2, EST is Jan 1)
  let diff = estMinutes - utcMinutes;
  
  // If the difference is too large, we crossed a day boundary
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;

  return diff;
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
 * Uses Intl.DateTimeFormat for consistent server/client behavior.
 */
export function utcToEstDisplay(utcDate: Date | string | null): string | null {
  if (!utcDate) return null;
  
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  if (isNaN(date.getTime())) return null;
  
  // Use explicit Intl.DateTimeFormat for consistency
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const dayPeriod = getPart('dayPeriod').toLowerCase();
  
  return `${month} ${day} @ ${hour}:${minute} ${dayPeriod} EST`;
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
