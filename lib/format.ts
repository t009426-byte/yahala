/** Formats a number as KWD currency: "KD 250.000" */
export function formatKwd(amount: number): string {
  return `KD ${amount.toFixed(3)}`;
}

/** Arabic relative time: "منذ ٥ دقائق", "الآن", etc. */
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "الآن";

  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return rtf.format(-diffHour, "hour");
  return rtf.format(-Math.floor(diffHour / 24), "day");
}
