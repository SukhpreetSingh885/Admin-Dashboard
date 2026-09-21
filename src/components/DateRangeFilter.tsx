export type DatePreset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';
export type DateSelection = { preset: DatePreset; from: string; to: string };
export const initialDateSelection: DateSelection = { preset: '30d', from: '', to: '' };

const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const parseDay = (value: string) => value ? new Date(`${value}T00:00:00`) : null;

export function dateBounds(selection: DateSelection): { start: Date | null; end: Date | null } {
  const today = dayStart(new Date());
  const before = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  if (selection.preset === 'all') return { start: null, end: null };
  if (selection.preset === 'today') return { start: today, end: before(-1) };
  if (selection.preset === 'yesterday') return { start: before(1), end: today };
  if (selection.preset === '7d') return { start: before(6), end: before(-1) };
  if (selection.preset === '30d') return { start: before(29), end: before(-1) };
  if (selection.preset === 'month') return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: before(-1) };
  const from = parseDay(selection.from); const to = parseDay(selection.to);
  return { start: from, end: to ? new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1) : from ? new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1) : null };
}

export function inDateRange(value: string | undefined, selection: DateSelection): boolean {
  if (selection.preset === 'all') return true;
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  const { start, end } = dateBounds(selection);
  return (!start || time >= start.getTime()) && (!end || time < end.getTime());
}

export default function DateRangeFilter({ value, onChange }: { value: DateSelection; onChange: (value: DateSelection) => void }) {
  return <div className="date-range-control" aria-label="Date filter">
    <select aria-label="Date range" value={value.preset} onChange={(event) => onChange({ ...value, preset: event.target.value as DatePreset })}>
      <option value="all">All time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="month">This month</option><option value="custom">Custom dates</option>
    </select>
    {value.preset === 'custom' && <div className="date-range-fields"><input aria-label="From date" type="date" value={value.from} max={value.to || undefined} onChange={(event) => onChange({ ...value, from: event.target.value })} /><span>to</span><input aria-label="To date" type="date" value={value.to} min={value.from || undefined} onChange={(event) => onChange({ ...value, to: event.target.value })} /></div>}
  </div>;
}
