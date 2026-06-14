// components/StatCard.jsx
export function StatCard({ label, value, subtext, subtextColor = 'text-slate-600', icon: Icon, iconColor = 'text-slate-600', dark = false }) {
  const D = dark;
  return (
    <div className={`p-6 rounded-xl border shadow-sm ${D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm ${D ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>
      <div className={`text-3xl ${D ? 'text-slate-100' : 'text-slate-800'}`}>{value}</div>
      {subtext && <div className={`text-xs mt-1 ${D ? 'text-slate-500' : subtextColor}`}>{subtext}</div>}
    </div>
  );
}