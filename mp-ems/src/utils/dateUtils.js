/**
 * Standardizes date formatting across the application to DD-MM-YYYY
 * @param {Date|string} date - The date to format
 * @param {boolean} includeTime - Whether to include time (defaults to false)
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '—';
  
  // Handle strings and Date objects
  const d = new Date(date);
  
  // If the date is invalid, just return the input as a string or fallback
  if (isNaN(d.getTime())) return String(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let formattedDate = `${day}-${month}-${year}`;

  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    formattedDate += ` ${hours}:${minutes}`;
  }

  return formattedDate;
};

/**
 * Alternative formatter for short months if needed, but defaults to DD-MM-YYYY as requested.
 */
export const formatShortDate = (date) => formatDate(date);
