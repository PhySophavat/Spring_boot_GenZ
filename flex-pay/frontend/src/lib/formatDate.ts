/**
 * Formats a date value returned by the Spring Boot API.
 *
 * Jackson serialises LocalDateTime as:
 *   • number[] — [year, month, day, hour, minute, second, nano]  (default)
 *   • string   — ISO-8601 (when spring.jackson.serialization.write-dates-as-timestamps=false)
 *   • null      — if the field was null
 */
export function formatDate(value: number[] | string | null | undefined): string {
  if (value == null) return "—";

  // Jackson numeric-array format: [year, month, day, hour?, minute?, second?, nano?]
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    const d = new Date(year, month - 1, day, hour, minute, second);
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  }

  // ISO-8601 string
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    }
  }

  return "—";
}
