/**
 * Matches the Java UserResponse record returned by /api/users.
 *
 * Notes:
 *  - id      : Long in Java → safe as number in JS (within Number.MAX_SAFE_INTEGER)
 *  - email   : nullable (Column has no nullable=false)
 *  - createdAt: Jackson serialises LocalDateTime as a numeric array
 *               [year, month, day, hour, minute, second, nano] by default,
 *               or as an ISO-8601 string when write-dates-as-timestamps=false.
 *               We union both so formatDate() handles either form correctly.
 */
export interface User {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  /** Jackson array [y,m,d,h,min,s,nano] OR ISO-8601 string */
  createdAt: number[] | string | null;
}
