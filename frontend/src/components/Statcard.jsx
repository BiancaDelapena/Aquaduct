// components/StatCard.jsx
export function StatCard({ label, value, subtext, subtextColor = 'text-slate-600', icon: Icon, iconColor = 'text-slate-600' }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>
      <div className="text-3xl text-slate-800">{value}</div>
      {subtext && <div className={`text-xs mt-1 ${subtextColor}`}>{subtext}</div>}
    </div>
  );
}