// ─── StatusBadge.jsx ──────────────────────────────────────────────────────────

const STATUS_STYLES = {
  // Jug statuses
  ACTIVE: { dark: 'bg-emerald-900/50 text-emerald-300 border-emerald-700', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INACTIVE: { dark: 'bg-slate-800 text-slate-400 border-slate-700', light: 'bg-slate-100 text-slate-500 border-slate-300' },
  LOST: { dark: 'bg-red-900/50 text-red-300 border-red-800', light: 'bg-red-50 text-red-600 border-red-200' },
  BROKEN: { dark: 'bg-orange-900/50 text-orange-300 border-orange-800', light: 'bg-orange-50 text-orange-600 border-orange-200' },

  // Order statuses
  Ordered:            { dark: 'bg-blue-900/50 text-blue-300 border-blue-800', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  'To Be Picked Up': { dark: 'bg-indigo-900/50 text-indigo-300 border-indigo-800', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  Refilling:          { dark: 'bg-purple-900/50 text-purple-300 border-purple-800', light: 'bg-purple-50 text-purple-700 border-purple-200' },
  'On The Way':       { dark: 'bg-amber-900/50 text-amber-300 border-amber-800', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  Delivered:          { dark: 'bg-emerald-900/50 text-emerald-300 border-emerald-700', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Cancelled:          { dark: 'bg-red-900/50 text-red-300 border-red-800', light: 'bg-red-50 text-red-600 border-red-200' },
};

const FALLBACK = {
  dark: 'bg-slate-800 text-slate-400 border-slate-700',
  light: 'bg-slate-100 text-slate-500 border-slate-200',
};

const StatusBadge = ({ status, dark }) => {
  const styles = STATUS_STYLES[status] ?? FALLBACK;
  const cls = dark ? styles.dark : styles.light;

  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {status}
    </span>
  );
};

export default StatusBadge;