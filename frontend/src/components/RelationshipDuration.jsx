import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Live, real-time ticker showing years / months / days / hours / minutes / seconds
 * since the couple's anniversary. Updates every second.
 *
 * Reads from `couple.anniversary_at` (timestamptz, second-precision) first;
 * falls back to `couple.anniversary_date` (treated as midnight local) if not set.
 *
 * Props:
 *   anniversary: ISO string, Date, or null
 *   compact:     boolean — single line "X days, HH:MM:SS" if true; otherwise grid
 */
function diff(from, to) {
  if (!from || isNaN(from.getTime())) return null;
  if (to < from) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };

  // Calendar-aware year/month/day diff
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  let hours = to.getHours() - from.getHours();
  let minutes = to.getMinutes() - from.getMinutes();
  let seconds = to.getSeconds() - from.getSeconds();

  if (seconds < 0) { seconds += 60; minutes -= 1; }
  if (minutes < 0) { minutes += 60; hours -= 1; }
  if (hours < 0)   { hours   += 24; days   -= 1; }
  if (days < 0) {
    // Days in the previous month relative to `to`
    const prev = new Date(to.getFullYear(), to.getMonth(), 0);
    days += prev.getDate();
    months -= 1;
  }
  if (months < 0) { months += 12; years -= 1; }

  const totalDays = Math.floor((to - from) / 86400000);

  return { years, months, days, hours, minutes, seconds, totalDays };
}

export default function RelationshipDuration({ anniversary, compact = false }) {
  const fromDate = useMemo(() => {
    if (!anniversary) return null;
    const d = anniversary instanceof Date ? anniversary : new Date(anniversary);
    return isNaN(d.getTime()) ? null : d;
  }, [anniversary]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!fromDate) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [fromDate]);

  if (!fromDate) {
    return (
      <p className="text-white/60 text-sm">Set your anniversary to count the seconds ✨</p>
    );
  }

  const d = diff(fromDate, now);
  if (!d) return null;

  const pad = (n) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <p className="text-white/70 text-sm">
        Together for{' '}
        <span className="text-white font-semibold">{d.totalDays} day{d.totalDays === 1 ? '' : 's'}</span>
        {' • '}
        <span className="text-white font-mono tabular-nums">
          {pad(d.hours)}:{pad(d.minutes)}:{pad(d.seconds)}
        </span>
      </p>
    );
  }

  const cells = [
    { label: 'years',   value: d.years   },
    { label: 'months',  value: d.months  },
    { label: 'days',    value: d.days    },
    { label: 'hours',   value: d.hours   },
    { label: 'mins',    value: d.minutes },
    { label: 'secs',    value: d.seconds },
  ];

  // Show only non-zero leading cells for cleaner look (always show last 3 for ticker effect)
  const firstNonZero = cells.findIndex((c) => c.value > 0);
  const visible = firstNonZero === -1 ? cells.slice(3) : cells.slice(Math.min(firstNonZero, 3));

  return (
    <div className="grid grid-cols-6 gap-1.5 max-w-md mx-auto">
      {cells.map((c) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 border border-white/15 rounded-xl px-1 py-2 text-center"
        >
          <div className="text-white text-base font-bold tabular-nums leading-tight">
            {pad(c.value)}
          </div>
          <div className="text-white/60 text-[9px] uppercase tracking-wider mt-0.5">
            {c.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
