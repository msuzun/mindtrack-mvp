export function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, amount: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() + amount);
  return toLocalDateKey(date);
}

export function startOfWeek(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return toLocalDateKey(date);
}

export function endOfWeek(dateKey: string): string {
  return addDays(startOfWeek(dateKey), 6);
}

export function monthRange(dateKey: string): [string, string] {
  const [y, m] = dateKey.split('-').map(Number);
  const start = new Date(y!, m! - 1, 1);
  const end = new Date(y!, m!, 0);
  return [toLocalDateKey(start), toLocalDateKey(end)];
}

export function yearRange(dateKey: string): [string, string] {
  const y = Number(dateKey.slice(0, 4));
  return [`${y}-01-01`, `${y}-12-31`];
}
