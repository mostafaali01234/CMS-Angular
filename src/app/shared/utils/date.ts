// shared/utils/date.ts
// the user's local date, not UTC (toISOString alone gives yesterday after midnight in UTC+2/+3)
export const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};