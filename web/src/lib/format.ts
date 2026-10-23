export function dateTime(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value)) + " IST"
    : "Not available";
}
export function isStale(value: string, now = Date.now()) {
  return now - Date.parse(value) > 48 * 60 * 60 * 1000;
}
export function inWindow(value: string, days: number, reference: string) {
  const age = Date.parse(reference) - Date.parse(value);
  return age >= 0 && age < days * 86400000;
}
export function pathLabel(value: string) {
  return new URL(value).pathname;
}
export const humanize = (value: string) =>
  value.replaceAll("_", " ").replaceAll("-", " ");
