// ─── CustomerPage.jsx ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

import refillIcon from '../assets/RefillJugPicture.png';
import newJugIcon from '../assets/NewJugPicture.png';
import Icon, { IC } from '../components/MyIcons';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import JugCard from '../components/JugCard';
import ChatWidget from '../components/Chatwidget';
import AddAddressModal from '../components/AddAddressModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EditProfileModal from '../components/EditProfileModal';

import { AlertCircle } from 'lucide-react';

export default function CustomerPage() {
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jugs, setJugs] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    API.get('profile/').then(res => setProfile(res.data));
    API.get('addresses/').then(res => setAddresses(res.data));
    API.get('jug-types/').then(res => setJugTypes(res.data));

    loadCustomerData();

    const interval = setInterval(loadCustomerData, 30000);
    return () => clearInterval(interval);
  }, []);

  const [orders, setOrders] = useState([]);
  const [jugTypes, setJugTypes] = useState([]);

  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showNewJugModal, setShowNewJugModal] = useState(false);
  const [selectedJugType, setSelectedJugType] = useState(null);
  const [selectedJugForRefill, setSelectedJugForRefill] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedNewJugAddress, setSelectedNewJugAddress] = useState(null);

  // NEW: Frequency toggle confirm (enable/disable)
  const [showFreqConfirmToggle, setShowFreqConfirmToggle] = useState(false);
  const [freqToggleJug, setFreqToggleJug] = useState(null);
  const [freqTogglePending, setFreqTogglePending] = useState(null); // { days, enabled }

  // Address modal states
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showConfirmAddressModal, setShowConfirmAddressModal] = useState(false);
  const [pendingAddressData, setPendingAddressData] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);

  // Profile edit modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showConfirmProfileModal, setShowConfirmProfileModal] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState(null);
  const [monthlyConsumption, setMonthlyConsumption] = useState([]);

  // ── Jug handlers ────────────────────────────────────────────────────────────
  const [error, setError] = useState(null);
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 7000);
  };

  const activeRefillJugIds = new Set(
    orders
      .filter(o => !['Delivered', 'Cancelled'].includes(o.status))
      .flatMap(o => o.items ?? [])
      .filter(item => item.item_type === 'Refill' && item.jug)
      .map(item => item.jug)   // item.jug is the jug's DB id
  );

  const loadCustomerData = () => {
    API.get('consumption/').then(res => setMonthlyConsumption(res.data)).catch(() => { });
    API.get('jugs/').then(res => {
      const transformed = res.data.map(j => ({
        ...j,
        db_id: j.id,
        id: j.unique_id,
        type: j.jug_type_name,
        image: j.jug_type_image,
        lastRefill: j.last_delivered_at
          ? new Date(j.last_delivered_at).toLocaleDateString()
          : 'N/A',
        nextRefillRaw: j.refill_schedule?.next_reminder_at ?? null,
        nextRefill: j.refill_schedule?.next_reminder_at
          ? new Date(j.refill_schedule.next_reminder_at).toLocaleDateString()
          : '-',
        frequency: j.refill_schedule?.status === 'Active' && j.refill_schedule
          ? `${j.refill_schedule.frequency_days} days`
          : '-',
      }));
      setJugs(transformed);
    }).catch(() => { });

    API.get('orders/').then(res => setOrders(res.data)).catch(() => { });
  };

  // Initial data loading + polling
  useEffect(() => {
    API.get('profile/').then(res => setProfile(res.data));
    API.get('addresses/').then(res => setAddresses(res.data));
    API.get('jug-types/').then(res => setJugTypes(res.data));

    loadCustomerData();

    const interval = setInterval(loadCustomerData, 7000);
    return () => clearInterval(interval);
  }, []);

  const toggleJugStatus = async (id) => {
    const jug = jugs.find(j => j.id === id);
    if (!jug) return;
    const newStatus = jug.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await API.patch(`jugs/${jug.db_id}/`, { status: newStatus });
      setJugs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
    } catch (err) {
      console.error('Failed to update jug status:', err);
      showError('Could not update jug status. Please try again.');
    }
  };

  // ── NEW: Frequency update handler (called by JugCard's onUpdateFreq) ─────────
  /**
   * JugCard will call onUpdateFreq(jug, days, enabled)
   * We'll show a confirmation dialog, then apply the change.
   */
  const handleFreqUpdate = (jug, days, enabled) => {
    setFreqToggleJug(jug);
    setFreqTogglePending({ days, enabled });
    setShowFreqConfirmToggle(true);
  };

  const confirmFreqToggle = async () => {
    if (!freqToggleJug || !freqTogglePending) return;
    const { days, enabled } = freqTogglePending;
    try {
      if (enabled && days > 0) {
        // Enable / update schedule
        await API.patch(`jugs/${freqToggleJug.db_id}/schedule/`, {
          frequency_days: days,
          status: 'Active'   // ensure schedule is active
        });
        setJugs(prev => prev.map(j =>
          j.id === freqToggleJug.id
            ? { ...j, frequency: `${days} days` }
            : j
        ));
      } else {
        // Disable schedule by pausing it
        await API.patch(`jugs/${freqToggleJug.db_id}/schedule/`, {
          status: 'Paused'
        });
        setJugs(prev => prev.map(j =>
          j.id === freqToggleJug.id
            ? { ...j, frequency: '-' }
            : j
        ));
      }
    } catch (err) {
      console.error('Failed to update frequency:', err);
      showError('Could not update refill schedule. Please try again.');
    }
    setShowFreqConfirmToggle(false);
    setFreqToggleJug(null);
    setFreqTogglePending(null);
  };

  // ── Address handlers ────────────────────────────────────────────────────────
  const handleAddAddressContinue = (formData) => {
    setPendingAddressData(formData);
    setShowAddAddressModal(false);
    setShowConfirmAddressModal(true);
  };

  const handleConfirmAddress = async () => {
    if (!pendingAddressData) return;
    try {
      if (editingAddress) {
        await API.patch(`addresses/${editingAddress.id}/`, pendingAddressData);
      } else {
        await API.post('addresses/', pendingAddressData);
      }

      const refreshed = await API.get('addresses/');
      setAddresses(refreshed.data);

      setShowConfirmAddressModal(false);
      setPendingAddressData(null);
      setEditingAddress(null);
    } catch (err) {
      console.error('Failed to save address:', err.response?.data || err);
      showError('Failed to save address. Please check your details and try again.');
    }
  };

  // ── Profile handlers ────────────────────────────────────────────────────────
  const handleEditProfileContinue = (formData) => {
    setPendingProfileData(formData);
    setShowEditProfileModal(false);
    setShowConfirmProfileModal(true);
  };

  const handleConfirmProfile = async () => {
    if (pendingProfileData) {
      try {
        const res = await API.patch('profile/', {
          name: pendingProfileData.name,
          email: pendingProfileData.email,
          phone_number: pendingProfileData.phone,
        });
        setProfile(res.data);
        setShowConfirmProfileModal(false);
        setPendingProfileData(null);
      } catch (err) {
        console.error('Failed to update profile:', err);
        showError('Failed to update profile. Please try again.');
      }
    }
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

  const theme = { text, muted, border, hov, inp, card, D };

  const NAV_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: IC.droplet },
    { id: 'orders', label: 'Orders', icon: IC.truck },
    { id: 'inventory', label: 'Inventory', icon: IC.package },
    { id: 'profile', label: 'Profile', icon: IC.user },
  ];

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const activeJugs = jugs.filter(j => j.status === 'Active' && j.nextRefillRaw);
    let nextRefillText = '';
    if (activeJugs.length > 0) {
      const upcomingDates = activeJugs
        .map(j => new Date(j.nextRefillRaw))
        .filter(d => !isNaN(d));
      if (upcomingDates.length > 0) {
        const earliest = new Date(Math.min(...upcomingDates));
        const now = new Date();
        const diffDays = Math.ceil((earliest - now) / (1000 * 60 * 60 * 24));
        nextRefillText = diffDays > 0 ? `${diffDays} days` : 'Today';
      }
    }
    const bars = monthlyConsumption.map(item => ({
      m: item.month,
      v: item.count,
    }));
    const maxV = Math.max(...bars.map(b => b.v), 1);

    const activeOrders = orders.filter(o =>
      ['Ordered', 'To Be Picked Up', 'Refilling', 'On The Way'].includes(o.status)
    );

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
                  <img src={refillIcon} alt="Refill" className="w-8 h-8 object-contain" />
                </div>
                <div className="font-bold text-lg mt-2">Request Refill</div>
                <div className="text-blue-200 text-sm mt-0.5">Schedule a swift refill delivery</div>
              </div>
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
                  <img src={newJugIcon} alt="New Jug" className="w-8 h-8 object-contain" />
                </div>
                <div className={`font-bold text-lg mt-2 ${text}`}>New Container</div>
                <div className={`text-sm mt-0.5 ${muted}`}>Purchase an additional water jug</div>
              </div>
            </div>
          </button>
        </div>

        {/* Active Deliveries */}
        <div className={`p-6 rounded-2xl border ${card} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${text}`}>Active Deliveries</h3>
              <span className={`text-xs px-2.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full font-semibold`}>
                {activeOrders.length} pending
              </span>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
            >
              View Order History →
            </button>
          </div>
          {activeOrders.length === 0 ? (
            <div className={`text-sm ${muted}`}>No active deliveries right now.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((order) => {
                const itemSummary = order.items?.map(i =>
                  i.item_type === 'Refill'
                    ? `Refill (${i.jug?.unique_id ?? '—'})`
                    : `New Jug — ${i.jug_type?.type_name ?? '—'}`
                ).join(', ') || 'Order';

                return (
                  <div key={order.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${D ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'}`}>
                    <div className="min-w-0 pr-2">
                      <div className={`text-sm font-mono font-bold ${text} truncate`}>
                        #{order.id} — <span className="font-sans font-medium text-xs">{itemSummary}</span>
                      </div>
                      <div className={`text-xs mt-1 font-medium ${D ? 'text-amber-400' : 'text-amber-600'}`}>
                        ETA: {order.estimated_arrival ? new Date(order.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      <div className={`text-xs mt-0.5 truncate ${muted}`}>
                        {order.delivery_address_snapshot}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={order.status} dark={D} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart + live deliveries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-2xl border p-6 ${card}`}>
            <div className="mb-5">
              <div className={`font-bold ${text}`}>Consumption History</div>
              <div className={`text-xs mt-0.5 ${muted}`}>Jugs consumed per month</div>
            </div>

            {monthlyConsumption.length === 0 ? (
              <div className={`flex items-center justify-center h-40 text-sm ${muted}`}>
                No consumption data yet.
              </div>
            ) : (
              <div className="flex items-end gap-2 sm:gap-3 h-40 pt-4">
                {bars.map((b, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    <div className={`absolute -top-6 text-xs font-bold transition-opacity opacity-0 group-hover:opacity-100 ${text}`}>
                      {b.v}
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${b.v === maxV
                        ? 'bg-blue-500 group-hover:bg-blue-400'
                        : D ? 'bg-slate-700 group-hover:bg-slate-600' : 'bg-slate-200 group-hover:bg-blue-200'
                        }`}
                      style={{ height: `${maxV > 0 ? (b.v / maxV) * 100 : 0}%` }}
                    />
                    <span className={`text-xs font-medium ${muted}`}>{b.m}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-2xl border p-6 ${card} space-y-4`}>
            <div className={`font-bold ${text}`}>Live Deliveries</div>
            {orders.filter(o => o.status === 'On The Way').length === 0 ? (
              <div className={`text-sm ${muted}`}>No active deliveries.</div>
            ) : (
              orders.filter(o => o.status === 'On The Way').map(o => (
                <div key={o.id} className={`p-3 rounded-xl border ${D ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200'}`}>
                  <div className={`text-sm font-bold ${D ? 'text-amber-300' : 'text-amber-800'}`}>{o.id}</div>
                  <div className={`text-xs mt-0.5 ${D ? 'text-amber-400' : 'text-amber-600'}`}>
                    {o.items?.[0]?.item_type || 'Order'}
                  </div>
                  <div className={`text-xs mt-1 font-medium ${D ? 'text-amber-300' : 'text-amber-700'}`}>
                    ETA {o.estimated_arrival ? new Date(o.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              ))
            )}
            <div className={`pt-3 border-t ${border}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Default Address</div>
              <div className="flex gap-2 items-start">
                <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                <p className={`text-xs leading-snug ${muted}`}>{addresses.find(a => a.is_default)?.full_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Jugs', val: jugs.filter(j => j.status === 'Active').length, color: 'text-emerald-500', bg: D ? 'bg-emerald-900/30' : 'bg-emerald-50', icon: IC.droplet },
            { label: 'In Transit', val: orders.filter(o => o.status === 'On The Way').length, color: 'text-blue-500', bg: D ? 'bg-blue-900/30' : 'bg-blue-50', icon: IC.truck },
            { label: 'Next Refill', val: nextRefillText || '—', color: 'text-amber-500', bg: D ? 'bg-amber-900/30' : 'bg-amber-50', icon: IC.clock, },
            { label: 'Orders (Jun)', val: orders.length, color: 'text-purple-500', bg: D ? 'bg-purple-900/30' : 'bg-purple-50', icon: IC.package },
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
    const grouped = orders.reduce((acc, o) => {
      const dateKey = o.created_at?.split('T')[0] || new Date(o.created_at).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(o);
      return acc;
    }, {});

    return (
      <div className="space-y-5">
        {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, orders]) => (
          <div key={date} className={`rounded-2xl border ${card}`}>
            <div className={`px-6 py-3 border-b text-sm font-semibold ${D ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-xs font-semibold uppercase tracking-wider border-b ${D ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    {['Order ID', 'Jug', 'Type', 'ETA', 'Arrived', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="text-left py-3 px-4 whitespace-nowrap font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${D ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {orders.map(o => (
                    <tr key={o.id} className={`transition-colors ${D ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3.5 px-4 font-mono font-bold text-xs ${text}`}>{o.id}</td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>
                        {o.items?.[0]?.jug_label || o.items?.[0]?.jug?.unique_id || '—'}
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>
                        {o.items?.[0]?.item_type || '—'}
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>
                        {o.estimated_arrival ? new Date(o.estimated_arrival).toLocaleString() : '—'}
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>
                        {o.actual_arrival ? new Date(o.actual_arrival).toLocaleString() : '—'}
                      </td>
                      <td className={`py-3.5 px-4 text-xs font-bold ${text}`}>₱{o.price_snapshot}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={o.status} dark={D} /></td>
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

  // ── INVENTORY (UPDATED) ─────────────────────────────────────────────────────
  const renderInventory = () => {
    const activeJugs = jugs.filter(j => j.status?.toUpperCase() === 'ACTIVE');
    const inactiveJugs = jugs.filter(j => j.status?.toUpperCase() !== 'ACTIVE');

    const JugSection = ({ title, items, isEmpty }) => (
      <div className={`rounded-2xl border overflow-visible ${card}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${border}`}>
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${title === 'Active Jugs'
                ? 'bg-emerald-500'
                : D ? 'bg-slate-600' : 'bg-slate-400'
                }`}
            />
            <span className={`font-bold ${text}`}>{title}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${title === 'Active Jugs'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : D ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}
            >
              {items.length}
            </span>
          </div>
        </div>

        {isEmpty || items.length === 0 ? (
          <div className={`px-6 py-8 text-sm text-center ${muted}`}>
            No {title.toLowerCase()} right now.
          </div>
        ) : (
          <div className={`divide-y ${D ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {items.map(jug => (
              <JugCard
                key={jug.id}
                jug={jug}
                dark={dark}
                theme={theme}
                onToggleStatus={toggleJugStatus}
                onUpdateFreq={handleFreqUpdate}   // ← new prop
              />
            ))}
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-5">
        <div className="px-1">
          <div className={`font-bold text-lg ${text}`}>Registered Water Jugs</div>
          <div className={`text-sm mt-0.5 ${muted}`}>Manage containers assigned to your profile</div>
        </div>

        <JugSection title="Active Jugs" items={activeJugs} />
        <JugSection title="Inactive Jugs" items={inactiveJugs} isEmpty={inactiveJugs.length === 0} />
      </div>
    );
  };

  const handleLogout = async () => {
    await API.post('logout/');
    navigate('/');
  };

  // ── PROFILE (unchanged) ─────────────────────────────────────────────────────
  const renderProfile = () => (
    <div className="mx-auto space-y-5 max-w-2xl">
      {/* Personal info */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className="flex items-center justify-between mb-5">
          <div className={`font-bold ${text}`}>Personal Information</div>
          <button
            onClick={() => setShowEditProfileModal(true)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-colors text-blue-500 ${D ? 'hover:bg-slate-800' : 'hover:bg-blue-50'}`}
          >
            <Icon path={IC.edit} className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Name', val: profile?.name, type: 'text' },
            { label: 'Email', val: profile?.email, type: 'email' },
            { label: 'Phone Number', val: profile?.phone_number, type: 'tel' },
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
          <button
            onClick={() => {
              setEditingAddress(null); setShowAddAddressModal(true);
            }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Icon path={IC.plus} className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-colors ${D ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex gap-3 items-start">
                <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-bold ${text}`}>{addr.label}</span>
                    {addr.is_default && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Default</span>}
                  </div>
                  <div className={`text-xs leading-snug ${muted}`}>{addr.full_address}</div>
                </div>
              </div>
              <button
                onClick={() => { setEditingAddress(addr); setShowAddAddressModal(true); }}
                className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors text-blue-500 ${D ? 'hover:bg-slate-700' : 'hover:bg-blue-50'}`}
              >Edit</button>
            </div>
          ))}
        </div>
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
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(v => !v)}
                className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors ${D ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${D ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <Icon path={IC.user} className={`w-5 h-5 ${D ? 'text-slate-300' : 'text-slate-500'}`} />
                </div>
                <span className={`text-sm font-semibold hidden sm:inline truncate max-w-[100px] ${text}`}>
                  {profile?.name?.split(' ')[0]}
                </span>
                <Icon path={IC.chevronDown} className={`w-4 h-4 hidden sm:block transition-transform duration-200 ${muted} ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                  <div className={`absolute right-0 top-full mt-2 w-48 rounded-2xl border shadow-lg z-50 overflow-hidden ${D ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`px-4 py-3 border-b ${D ? 'border-slate-700' : 'border-slate-100'}`}>
                      <div className={`text-sm font-bold truncate ${text}`}>{profile?.name}</div>
                      <div className={`text-xs truncate mt-0.5 ${muted}`}>{profile?.email}</div>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setShowProfileDropdown(false); handleLogout(); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors text-red-500 ${D ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
                      >
                        <Icon path={IC.logout} className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'profile' && renderProfile()}
        {error && (<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>)}
      </main>

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
              {jugs.filter(j => j.status === 'Active' && !activeRefillJugIds.has(j.db_id)).map(j => (
                <button key={j.id} onClick={() => setSelectedJugForRefill(j)}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${selectedJugForRefill?.id === j.id
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
              {addresses.map(addr => (
                <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${selectedAddress === addr.id
                    ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                    : D ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-blue-300'
                    }`}>
                  <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${D ? 'text-white' : 'text-slate-800'}`}>{addr.label}</span>
                      {addr.is_default && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Default</span>}
                    </div>
                    <div className={`text-xs mt-0.5 leading-snug ${muted}`}>{addr.full_address}</div>
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
            onClick={async () => {
              if (!selectedJugForRefill || !selectedAddress) return;
              try {
                await API.post('orders/', {
                  address_id: selectedAddress,
                  items: [{ item_type: 'Refill', jug_id: selectedJugForRefill.db_id, quantity: 1 }],
                });
                const res = await API.get('orders/');
                setOrders(res.data);
              } catch (err) {
                console.error('Order failed:', err);
                showError('Failed to place refill order. Please try again.');
              }
              setShowRefillModal(false);
              setSelectedJugForRefill(null);
              setSelectedAddress(null);
            }}
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
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>1. Delivery Address</label>
            <div className="space-y-2">
              {addresses.map(addr => (
                <button key={addr.id} onClick={() => setSelectedNewJugAddress(addr.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${selectedNewJugAddress === addr.id
                    ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                    : D ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-blue-300'
                    }`}>
                  <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${D ? 'text-white' : 'text-slate-800'}`}>{addr.label || addr.address_type}</span>
                      {addr.is_default && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Default</span>}
                    </div>
                    <div className={`text-xs mt-0.5 leading-snug ${muted}`}>{addr.full_address}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>2. Select Container Type</label>
          {jugTypes.filter(jt => jt.is_available).map(jt => (
            <button key={jt.id} onClick={() => setSelectedJugType(jt.id)}
              className={`w-full p-5 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${selectedJugType === jt.id
                ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                : D ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-blue-300'
                }`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {jt.image ? (
                  <img src={jt.image.startsWith('http') ? jt.image : `http://localhost:8000${jt.image}`} alt={jt.type_name} className="w-full h-full object-cover" />
                ) : (
                  <Icon path={IC.droplet} className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-bold ${D ? 'text-white' : 'text-slate-800'}`}>{jt.type_name}</div>
                <div className={`text-sm ${muted}`}>{jt.description || `${jt.gallon_capacity} gal`}</div>
              </div>
              <div className={`text-xl font-black flex-shrink-0 ${D ? 'text-white' : 'text-slate-800'}`}>₱{jt.purchase_price}</div>
            </button>
          ))}
          <button
            disabled={!selectedJugType || !selectedNewJugAddress}
            onClick={async () => {
              if (!selectedJugType || !selectedNewJugAddress) return;
              try {
                await API.post('orders/', {
                  address_id: selectedNewJugAddress,
                  items: [{ item_type: 'New Jug', jug_type_id: selectedJugType, quantity: 1 }],
                });
                const res = await API.get('orders/');
                setOrders(res.data);
              } catch (err) {
                console.error('Order failed:', err);
                showError('Failed to place new jug order. Please try again.');
              }
              setShowNewJugModal(false);
              setSelectedJugType(null);
              setSelectedNewJugAddress(null);
            }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm mt-2 transition-all ${selectedJugType && selectedNewJugAddress
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : D ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Confirm Order
          </button>
        </div>
      </Modal>

      {/* Frequency Confirm Toggle (NEW) */}
      <ConfirmDialog
        show={showFreqConfirmToggle}
        onClose={() => { setShowFreqConfirmToggle(false); setFreqToggleJug(null); setFreqTogglePending(null); }}
        onBack={() => { setShowFreqConfirmToggle(false); }}
        onConfirm={confirmFreqToggle}
        title="Confirm Schedule Change"
        confirmText="Yes, Update"
        dark={D}
        theme={theme}
        bannerMessage={
          freqTogglePending && freqToggleJug && (
            <>
              {freqTogglePending.enabled
                ? <>Set refill schedule for <strong className="font-mono">{freqToggleJug.id}</strong> to every <strong>{freqTogglePending.days} day{freqTogglePending.days === 1 ? '' : 's'}</strong>?</>
                : <>Disable the refill schedule for <strong className="font-mono">{freqToggleJug.id}</strong>?</>
              }
            </>
          )
        }
      />

      {/* Add Address */}
      <AddAddressModal
        show={showAddAddressModal}
        onClose={() => { setShowAddAddressModal(false); setEditingAddress(null); setPendingAddressData(null); }}
        onContinue={handleAddAddressContinue}
        initialData={editingAddress}
        dark={D}
        theme={theme}
      />

      {/* Confirm Address */}
      <ConfirmDialog
        show={showConfirmAddressModal}
        onClose={() => { setShowConfirmAddressModal(false); setPendingAddressData(null); }}
        onBack={() => { setShowConfirmAddressModal(false); setShowAddAddressModal(true); }}
        onConfirm={handleConfirmAddress}
        title={editingAddress ? "Save address changes?" : "Add address to your profile?"}
        message={editingAddress
          ? "Your address will be updated."
          : "This address will be added to your profile and can be selected for future deliveries."
        }
        confirmText={editingAddress ? "Save Changes" : "Add Address"}
        isDangerous
        dark={D}
        theme={theme}
        previewData={pendingAddressData ? [
          { label: "Type", value: pendingAddressData.address_type },
          ...(pendingAddressData.address_type === 'Apartment' ? [
            { label: "Unit", value: pendingAddressData.unit_number },
            { label: "Building", value: pendingAddressData.building_name || '—' },
          ] : []),
          { label: "Street", value: pendingAddressData.street_address },
          { label: "Barangay", value: pendingAddressData.barangay || '—' },
          { label: "City", value: "Quezon City" },
          ...(pendingAddressData.is_default ? [{ label: "Default", extra: "Will be set as default" }] : []),
        ] : []}
      />

      {/* Edit Profile */}
      <EditProfileModal
        show={showEditProfileModal}
        onClose={() => { setShowEditProfileModal(false); setPendingProfileData(null); }}
        onContinue={handleEditProfileContinue}
        profileData={profile}
        dark={D}
        theme={theme}
      />

      {/* Confirm Profile */}
      <ConfirmDialog
        show={showConfirmProfileModal}
        onClose={() => { setShowConfirmProfileModal(false); setPendingProfileData(null); }}
        onBack={() => { setShowConfirmProfileModal(false); setShowEditProfileModal(true); }}
        onConfirm={handleConfirmProfile}
        title="Confirm Profile Changes?"
        confirmText="Save Changes"
        isDangerous
        dark={D}
        theme={theme}
        previewData={pendingProfileData ? [
          { label: "Name", value: pendingProfileData.name, mono: true },
          { label: "Email Address", value: pendingProfileData.email, mono: true },
          { label: "Phone Number", value: pendingProfileData.phone, mono: true },
        ] : []}
      />
    </div>
  );
}