/**
 * Date utility functions for consistent date formatting across the application
 * Handles timezone issues and provides standardized formatting
 */

/**
 * Format a date string to a readable date format
 * Handles UTC dates properly without timezone conversion issues
 */
export function formatDate(dateString: string | Date, options?: {
  includeTime?: boolean;
  format?: 'short' | 'long' | 'medium';
}): string {
  const { includeTime = false, format = 'medium' } = options || {};
  
  // Handle the date properly by ensuring it's treated as local time
  let date: Date;
  if (typeof dateString === 'string') {
    // If the string doesn't end with Z or timezone info, treat it as local time
    if (!dateString.includes('T') || (!dateString.endsWith('Z') && !dateString.includes('+'))) {
      // Replace the T with a space and treat as local time
      const normalizedDate = dateString.replace('T', ' ').split('.')[0];
      date = new Date(normalizedDate);
    } else {
      date = new Date(dateString);
    }
  } else {
    date = dateString;
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const formatOptions: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case 'short':
      formatOptions.year = 'numeric';
      formatOptions.month = 'short';
      formatOptions.day = 'numeric';
      break;
    case 'long':
      formatOptions.year = 'numeric';
      formatOptions.month = 'long';
      formatOptions.day = 'numeric';
      formatOptions.weekday = 'long';
      break;
    case 'medium':
    default:
      formatOptions.year = 'numeric';
      formatOptions.month = 'short';
      formatOptions.day = 'numeric';
      break;
  }

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    formatOptions.hour12 = true;
  }

  return date.toLocaleDateString('en-US', formatOptions);
}

/**
 * Format a date for "joined" or "created" display
 */
export function formatJoinedDate(dateString: string | Date): string {
  return formatDate(dateString, { format: 'medium' });
}

/**
 * Format a date with time for detailed views
 */
export function formatDateWithTime(dateString: string | Date): string {
  return formatDate(dateString, { includeTime: true, format: 'medium' });
}

/**
 * Format a date for CSV export
 */
export function formatDateForCSV(dateString: string | Date): string {
  if (!dateString) return '';
  
  let date: Date;
  if (typeof dateString === 'string') {
    // Handle UTC dates properly
    if (!dateString.includes('T') || (!dateString.endsWith('Z') && !dateString.includes('+'))) {
      const normalizedDate = dateString.replace('T', ' ').split('.')[0];
      date = new Date(normalizedDate);
    } else {
      date = new Date(dateString);
    }
  } else {
    date = dateString;
  }

  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Format date for order tracking and other detailed views
 */
export function formatOrderDate(dateString: string | Date): string {
  return formatDate(dateString, { format: 'long' });
}