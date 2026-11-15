// "Europe/Paris" → "Paris", "America/New_York" → "New York"
export function timezoneCity(timezone: string) {
  return (timezone.split("/").pop() ?? timezone).replace(/_/g, " ");
}

export function localTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("fr", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
