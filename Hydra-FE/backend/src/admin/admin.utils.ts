export function parsePeriod(
  yearStr?: string,
  monthStr?: string,
): { startDate?: Date; endDate?: Date } {
  if (!yearStr) return {};
  const year = Number(yearStr);
  if (isNaN(year)) return {};

  if (monthStr) {
    const month = Number(monthStr);
    if (isNaN(month) || month < 1 || month > 12) return {};
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));
    return { startDate, endDate };
  }

  return {
    startDate: new Date(Date.UTC(year, 0, 1)),
    endDate: new Date(Date.UTC(year + 1, 0, 1)),
  };
}
