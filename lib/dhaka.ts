// Date and time inputs in Bangladesh time (UTC+6, no daylight saving).

/** An ISO time as the value of a datetime-local input, in Bangladesh time. */
export function toDhakaInput(iso: string | null) {
  if (!iso) return '';
  return new Date(iso)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Dhaka', hour12: false })
    .replace(' ', 'T')
    .slice(0, 16);
}

/** A datetime-local value (Bangladesh time, which has no daylight saving) as an ISO time. */
export const fromDhakaInput = (value: string) => (value ? `${value}:00+06:00` : null);
