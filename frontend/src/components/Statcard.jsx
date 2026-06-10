// components/StatCard.jsx
export function StatCard({ label, value, subtext, subtextColor = 'text-slate-600', icon: Icon, iconColor = 'text-slate-600' }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>
      <div className="text-3xl text-slate-800">{value}</div>
      {subtext && <div className={`text-xs mt-1 ${subtextColor}`}>{subtext}</div>}
    </div>
  );
}

// {/* Stats Cards */} SA ADMIN PAGE LANG TO ILALAGAY
//      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//        <StatCard label="Total Orders"     value="1,548" subtext="+12% from last month" subtextColor="text-green-600" icon={Package}    iconColor="text-blue-600"   />
//        <StatCard label="Total Sales"      value="₱244K" subtext="+8% from last month"  subtextColor="text-green-600" icon={DollarSign} iconColor="text-green-600"  />
//        <StatCard label="Active Customers" value="342"   subtext="18 new this week"      subtextColor="text-blue-600"  icon={Users}      iconColor="text-purple-600" />
//        <StatCard label="Active Jugs"      value="856"   subtext="35 lost/broken"                                      icon={Droplets}   iconColor="text-cyan-600"   />
//      </div>