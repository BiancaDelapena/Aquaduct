// ─── CustomerPage.jsx ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Icon, { IC } from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import JugCard from '../components/JugCard';
import ChatWidget from '../components/ChatWidget';
import FrequencyEditModal from '../components/FrequencyEditModal';
import FrequencyConfirmModal from '../components/FrequencyConfirmModal';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_JUGS = [
  { id: 'JUG-001', type: 'Circular Big', status: 'ACTIVE', lastRefill: '2026-05-28', nextRefill: '2026-06-11', frequency: '2 weeks' },
  { id: 'JUG-002', type: 'Slim Med', status: 'ACTIVE', lastRefill: '2026-06-02', nextRefill: '2026-06-16', frequency: '2 weeks' },
  { id: 'JUG-003', type: 'Circular Big', status: 'LOST', lastRefill: 'N/A', nextRefill: '-', frequency: '-' },
];

const MOCK_ORDERS = [
  { id: 'AQ-9872', date: '2026-06-05', type: 'Refill Service', jug: 'JUG-001', amount: '₱30', status: 'Delivered', eta: '10:30', toa: '10:45', delay: '15 min' },
  { id: 'AQ-9910', date: '2026-06-06', type: 'New Jug (Circular Big)', jug: 'JUG-003', amount: '₱125', status: 'In Transit', eta: '14:00', toa: '-', delay: '-' },
];

const MOCK_PROFILE = {
  name: 'Bianca D. Dela Peña',
  email: 'bianca@example.com',
  phone: '+63 912 345 6789',
  initials: 'BD',
  addresses: [
    { id: 1, label: 'Home', address: '123 Balibago Road, Angeles City, Pampanga', isDefault: true },
    { id: 2, label: 'Office', address: 'City College of Angeles, Barangay Pampang, Angeles City', isDefault: false },
  ],
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerPage() {
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jugs, setJugs] = useState(INITIAL_JUGS);
  const [showChatbot, setShowChatbot] = useState(false);

  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showNewJugModal, setShowNewJugModal] = useState(false);
  const [selectedJugType, setSelectedJugType] = useState(null);
  const [selectedJugForRefill, setSelectedJugForRefill] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [showFreqModal, setShowFreqModal] = useState(false);
  const [showFreqConfirm, setShowFreqConfirm] = useState(false);
  const [freqJug, setFreqJug] = useState(null);
  const [pendingFreq, setPendingFreq] = useState('');

  // ── Jug handlers ────────────────────────────────────────────────────────────
  const toggleJugStatus = (id) => {
    setJugs(prev =>
      prev.map(j => j.id === id ? { ...j, status: j.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : j)
    );
  };

  const openFreqModal = (jug) => {
    setFreqJug(jug);
    setPendingFreq(jug.frequency === '-' ? '' : jug.frequency);
    setShowFreqModal(true);
  };

  const confirmFreq = () => {
    setJugs(prev => prev.map(j => j.id === freqJug.id ? { ...j, frequency: pendingFreq } : j));
    setShowFreqConfirm(false);
    setFreqJug(null);
    setPendingFreq('');
  };

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const D = dark;
  const bg = D ? 'bg-slate-950' : 'bg-slate-50';
  const card = D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const text = D ? 'text-slate-100' : 'text-slate-800';
  const muted = D ? 'text-slate-400' : 'text-slate-500';
  const border = D ? 'border-slate-800' : 'border-slate-200';
  const hov = D ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50';
  const inp = D
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500'
    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500';

  // Theme bundle passed to child components
  const theme = { text, muted, border, hov, inp, card, D };

  const NAV_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: IC.droplet },
    { id: 'orders', label: 'Orders', icon: IC.truck },
    { id: 'inventory', label: 'Inventory', icon: IC.package },
    { id: 'profile', label: 'Profile', icon: IC.user },
  ];

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const bars = [
      { m: 'Jan', v: 30 }, { m: 'Feb', v: 55 }, { m: 'Mar', v: 85 },
      { m: 'Apr', v: 45 }, { m: 'May', v: 95 }, { m: 'Jun', v: 20 },
    ];
    const maxV = Math.max(...bars.map(b => b.v));

    return (
      <div className="space-y-6">
        {/* CTA cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowRefillModal(true)}
            className="group relative overflow-hidden p-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg hover:shadow-blue-500/30 text-left"
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 inline-flex p-2.5 bg-white/15 rounded-xl">
                  <Icon path={IC.refresh} className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-lg mt-2">Request Refill</div>
                <div className="text-blue-200 text-sm mt-0.5">Schedule a swift refill delivery</div>
              </div>
              <div className="text-3xl font-black text-white/90 flex-shrink-0">₱30</div>
            </div>
          </button>

          <button
            onClick={() => setShowNewJugModal(true)}
            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all shadow-sm hover:shadow-md text-left ${card} ${hov}`}
          >
            <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full ${D ? 'bg-blue-500/10' : 'bg-blue-50'} group-hover:scale-150 transition-transform duration-500 pointer-events-none`} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className={`mb-1 inline-flex p-2.5 rounded-xl ${D ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                  <Icon path={IC.plus} className="w-5 h-5 text-blue-500" />
                </div>
                <div className={`font-bold text-lg mt-2 ${text}`}>New Container</div>
                <div className={`text-sm mt-0.5 ${muted}`}>Purchase an additional water jug</div>
              </div>
              <div className={`text-3xl font-black ${text} flex-shrink-0`}>₱125</div>
            </div>
          </button>
        </div>

        {/* Chart + live deliveries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-2xl border p-6 ${card}`}>
            <div className="mb-5">
              <div className={`font-bold ${text}`}>Consumption History</div>
              <div className={`text-xs mt-0.5 ${muted}`}>Jugs consumed per month</div>
            </div>
            <div className="flex items-end gap-2 sm:gap-3 h-40 pt-4">
              {bars.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  <div className={`absolute -top-6 text-xs font-bold transition-opacity opacity-0 group-hover:opacity-100 ${text}`}>
                    {Math.round(b.v / 10)}
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${b.v === maxV
                      ? 'bg-blue-500 group-hover:bg-blue-400'
                      : D ? 'bg-slate-700 group-hover:bg-slate-600' : 'bg-slate-200 group-hover:bg-blue-200'
                      }`}
                    style={{ height: `${b.v}%` }}
                  />
                  <span className={`text-xs font-medium ${muted}`}>{b.m}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border p-6 ${card} space-y-4`}>
            <div className={`font-bold ${text}`}>Live Deliveries</div>
            {MOCK_ORDERS.filter(o => o.status === 'In Transit').length === 0 ? (
              <div className={`text-sm ${muted}`}>No active deliveries.</div>
            ) : (
              MOCK_ORDERS.filter(o => o.status === 'In Transit').map(o => (
                <div key={o.id} className={`p-3 rounded-xl border ${D ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200'}`}>
                  <div className={`text-sm font-bold ${D ? 'text-amber-300' : 'text-amber-800'}`}>{o.id}</div>
                  <div className={`text-xs mt-0.5 ${D ? 'text-amber-400' : 'text-amber-600'}`}>{o.type}</div>
                  <div className={`text-xs mt-1 font-medium ${D ? 'text-amber-300' : 'text-amber-700'}`}>ETA {o.eta}</div>
                </div>
              ))
            )}
            <div className={`pt-3 border-t ${border}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Default Address</div>
              <div className="flex gap-2 items-start">
                <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                <p className={`text-xs leading-snug ${muted}`}>{MOCK_PROFILE.addresses.find(a => a.isDefault)?.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Jugs', val: jugs.filter(j => j.status === 'ACTIVE').length, color: 'text-emerald-500', bg: D ? 'bg-emerald-900/30' : 'bg-emerald-50', icon: IC.droplet },
            { label: 'In Transit', val: MOCK_ORDERS.filter(o => o.status === 'In Transit').length, color: 'text-blue-500', bg: D ? 'bg-blue-900/30' : 'bg-blue-50', icon: IC.truck },
            { label: 'Next Refill', val: '9 days', color: 'text-amber-500', bg: D ? 'bg-amber-900/30' : 'bg-amber-50', icon: IC.clock },
            { label: 'Orders (Jun)', val: MOCK_ORDERS.length, color: 'text-purple-500', bg: D ? 'bg-purple-900/30' : 'bg-purple-50', icon: IC.package },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${card}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold ${muted}`}>{s.label}</span>
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <Icon path={s.icon} className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── ORDERS ─────────────────────────────────────────────────────────────────
  const renderOrders = () => {
    const grouped = MOCK_ORDERS.reduce((acc, o) => {
      if (!acc[o.date]) acc[o.date] = [];
      acc[o.date].push(o);
      return acc;
    }, {});

    return (
      <div className="space-y-5">
        {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, orders]) => (
          <div key={date} className={`rounded-2xl border overflow-hidden ${card}`}>
            <div className={`px-6 py-3 border-b text-sm font-semibold ${D ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-xs font-semibold uppercase tracking-wider border-b ${D ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    {['Order ID', 'Jug', 'Type', 'ETA', 'Arrived', 'Delay', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="text-left py-3 px-4 whitespace-nowrap font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${D ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {orders.map(o => (
                    <tr key={o.id} className={`transition-colors ${D ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3.5 px-4 font-mono font-bold text-xs ${text}`}>{o.id}</td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>{o.jug}</td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>{o.type}</td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>{o.eta}</td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>{o.toa}</td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>{o.delay}</td>
                      <td className={`py-3.5 px-4 text-xs font-bold ${text}`}>{o.amount}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={o.status} dark={D} /></td>
                      <td className="py-3.5 px-4">
                        {o.status === 'Delivered' && (
                          <button className="text-xs text-red-500 hover:text-red-400 font-medium hover:underline">Report</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── INVENTORY ──────────────────────────────────────────────────────────────
  const renderInventory = () => (
    <div className={`rounded-2xl border overflow-hidden ${card}`}>
      <div className={`px-6 py-5 border-b ${border}`}>
        <div className={`font-bold text-lg ${text}`}>Registered Water Jugs</div>
        <div className={`text-sm mt-0.5 ${muted}`}>Manage containers assigned to your profile</div>
      </div>
      <div className={`divide-y ${D ? 'divide-slate-800' : 'divide-slate-100'}`}>
        {jugs.map(jug => (
          <JugCard
            key={jug.id}
            jug={jug}
            dark={dark}
            theme={theme}
            onToggleStatus={toggleJugStatus}
            onOpenFreqModal={openFreqModal}
          />
        ))}
      </div>
    </div>
  );

  const handleLogout = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
    navigate("/");
  };


  // ── PROFILE ────────────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div className="mx-auto space-y-5 max-w-2xl">
      {/* Personal info */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className="flex items-center justify-between mb-5">
          <div className={`font-bold ${text}`}>Personal Information</div>
          <button className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-colors text-blue-500 ${D ? 'hover:bg-slate-800' : 'hover:bg-blue-50'}`}>
            <Icon path={IC.edit} className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Full Name', val: MOCK_PROFILE.name, type: 'text' },
            { label: 'Email', val: MOCK_PROFILE.email, type: 'email' },
            { label: 'Phone Number', val: MOCK_PROFILE.phone, type: 'tel' },
          ].map(f => (
            <div key={f.label}>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${muted}`}>{f.label}</label>
              <input
                type={f.type}
                defaultValue={f.val}
                readOnly
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Addresses */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`font-bold ${text}`}>Delivery Addresses</div>
          <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            <Icon path={IC.plus} className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {MOCK_PROFILE.addresses.map(addr => (
            <div key={addr.id} className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-colors ${D ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex gap-3 items-start">
                <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-bold ${text}`}>{addr.label}</span>
                    {addr.isDefault && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Default</span>}
                  </div>
                  <div className={`text-xs leading-snug ${muted}`}>{addr.address}</div>
                </div>
              </div>
              <button className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors text-blue-500 ${D ? 'hover:bg-slate-700' : 'hover:bg-blue-50'}`}>Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Session */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className={`font-bold mb-1 ${text}`}>Session</div>
        <div className={`text-sm mb-4 ${muted}`}>Signed in as {MOCK_PROFILE.email}</div>
        <button onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold py-2.5 px-6 rounded-2xl text-sm tracking-wide shadow-lg shadow-red-200 transition-all duration-200">
          Log Out
        </button>
      </div>
    </div>
  );

  // ── RETURN ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <style>{`
        @keyframes modalPop { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-30 border-b shadow-sm transition-colors ${D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-500/30">
              <Icon path={IC.droplet} className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={`text-lg font-black tracking-tight ${text}`}>Aquaduct</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : `${muted} ${hov}`
                  }`}>
                <Icon path={t.icon} className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setDark(v => !v)}
              title={D ? 'Light mode' : 'Dark mode'}
              className={`p-2 rounded-xl transition-all ${D ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <Icon path={D ? IC.sun : IC.moon} className="w-5 h-5" />
            </button>
            <button className={`relative p-2 rounded-xl transition-all ${D ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              <Icon path={IC.bell} className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md">
                {MOCK_PROFILE.initials}
              </div>
              <span className={`text-sm font-semibold hidden sm:inline truncate max-w-[100px] ${text}`}>
                {MOCK_PROFILE.name.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className={`md:hidden flex border-t ${border} overflow-x-auto`}>
          {NAV_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-xs font-semibold transition-colors min-w-[60px] border-b-2 ${activeTab === t.id ? 'text-blue-600 border-blue-600' : `${muted} border-transparent`}`}>
              <Icon path={t.icon} className="w-4 h-4" />
              <span className="truncate w-full text-center">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24" style={{ animation: 'slideUp 0.22s ease' }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'profile' && renderProfile()}
      </main>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowRefillModal(true)}
        title="Quick Refill"
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl shadow-blue-500/40 transition-all hover:scale-110 active:scale-95"
      >
        <Icon path={IC.refresh} className="w-6 h-6" />
      </button>

      {/* ── CHATBOT TOGGLE ──────────────────────────────────────────────── */}
      <button
        onClick={() => setShowChatbot(c => !c)}
        className={`fixed bottom-6 left-6 z-40 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${D ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 hover:bg-slate-900'} text-white`}
      >
        <Icon path={IC.chat} className="w-6 h-6" />
      </button>

      {showChatbot && (
        <ChatWidget
          dark={dark}
          theme={theme}
          onClose={() => setShowChatbot(false)}
        />
      )}

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Refill */}
      <Modal
        show={showRefillModal}
        onClose={() => { setShowRefillModal(false); setSelectedJugForRefill(null); setSelectedAddress(null); }}
        title="Order Refill"
        dark={D}
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>1. Select Jug</label>
            <div className="space-y-2">
              {jugs.filter(j => j.status === 'ACTIVE').map(j => (
                <button key={j.id} onClick={() => setSelectedJugForRefill(j.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${selectedJugForRefill === j.id
                    ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                    : D ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-blue-300'
                    }`}>
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${D ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                    <Icon path={IC.droplet} className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold font-mono text-sm ${D ? 'text-white' : 'text-slate-800'}`}>{j.id}</div>
                    <div className={`text-xs ${muted}`}>{j.type} · Last: {j.lastRefill}</div>
                  </div>
                  <StatusBadge status={j.status} dark={D} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>2. Delivery Address</label>
            <div className="space-y-2">
              {MOCK_PROFILE.addresses.map(addr => (
                <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${selectedAddress === addr.id
                    ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                    : D ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-blue-300'
                    }`}>
                  <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${D ? 'text-white' : 'text-slate-800'}`}>{addr.label}</span>
                      {addr.isDefault && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Default</span>}
                    </div>
                    <div className={`text-xs mt-0.5 leading-snug ${muted}`}>{addr.address}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${D ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`flex justify-between text-sm mb-2 ${muted}`}><span>Refill Service</span><span>₱30</span></div>
            <div className={`flex justify-between pt-2 border-t font-bold ${border}`}>
              <span className={text}>Total</span>
              <span className="text-blue-500 text-xl">₱30</span>
            </div>
          </div>

          <button
            disabled={!selectedJugForRefill || !selectedAddress}
            onClick={() => { setShowRefillModal(false); setSelectedJugForRefill(null); setSelectedAddress(null); }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${selectedJugForRefill && selectedAddress
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : D ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Confirm Refill Order
          </button>
        </div>
      </Modal>

      {/* New Jug */}
      <Modal
        show={showNewJugModal}
        onClose={() => { setShowNewJugModal(false); setSelectedJugType(null); }}
        title="Order New Container"
        dark={D}
      >
        <div className="p-6 space-y-3">
          {[
            { id: 'circular', name: 'Circular Water Jug Big', desc: 'Large capacity, built for families', price: '₱125' },
            { id: 'square', name: 'Square Jug Small', desc: 'Compact design, easy to store', price: '₱125' },
          ].map(j => (
            <button key={j.id} onClick={() => setSelectedJugType(j.id)}
              className={`w-full p-5 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${selectedJugType === j.id
                ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                : D ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-blue-300'
                }`}>
              <div className={`p-3 rounded-xl flex-shrink-0 ${D ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                <Icon path={IC.droplet} className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className={`font-bold ${D ? 'text-white' : 'text-slate-800'}`}>{j.name}</div>
                <div className={`text-sm ${muted}`}>{j.desc}</div>
              </div>
              <div className={`text-xl font-black flex-shrink-0 ${D ? 'text-white' : 'text-slate-800'}`}>{j.price}</div>
            </button>
          ))}
          <button
            disabled={!selectedJugType}
            onClick={() => { setShowNewJugModal(false); setSelectedJugType(null); }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm mt-2 transition-all ${selectedJugType
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : D ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Confirm Order
          </button>
        </div>
      </Modal>

      {/* Frequency Edit */}
      <FrequencyEditModal
        show={showFreqModal}
        onClose={() => { setShowFreqModal(false); setFreqJug(null); }}
        onContinue={() => { setShowFreqModal(false); setShowFreqConfirm(true); }}
        freqJug={freqJug}
        pendingFreq={pendingFreq}
        setPendingFreq={setPendingFreq}
        dark={D}
        theme={theme}
      />

      {/* Frequency Confirm */}
      <FrequencyConfirmModal
        show={showFreqConfirm}
        onClose={() => { setShowFreqConfirm(false); setFreqJug(null); }}
        onBack={() => { setShowFreqConfirm(false); setShowFreqModal(true); }}
        onConfirm={confirmFreq}
        freqJug={freqJug}
        pendingFreq={pendingFreq}
        dark={D}
        theme={theme}
      />
    </div>
  );
}