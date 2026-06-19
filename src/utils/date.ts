export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the Monday date string (YYYY-MM-DD) of the current week in local timezone.
 */
export function getWeekStartMonday(date: Date = new Date()): string {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
  return getLocalDateString(monday);
}
