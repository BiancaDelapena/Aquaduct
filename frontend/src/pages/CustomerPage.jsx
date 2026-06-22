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
import NotificationsPopover from '../components/NotificationsPopover';
import logo from '../assets/logoaqud.png';
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

    const interval = setInterval(loadCustomerData, 7000);
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

  // Confirm dialogs for order submission
  const [showConfirmRefillOrder, setShowConfirmRefillOrder] = useState(false);
  const [pendingRefillOrder, setPendingRefillOrder] = useState(null);
  const [showConfirmNewJugOrder, setShowConfirmNewJugOrder] = useState(false);
  const [pendingNewJugOrder, setPendingNewJugOrder] = useState(null);

  // Frequency toggle confirm
  const [showFreqConfirmToggle, setShowFreqConfirmToggle] = useState(false);
  const [freqToggleJug, setFreqToggleJug] = useState(null);
  const [freqTogglePending, setFreqTogglePending] = useState(null);

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

  // Error handling
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
      .map(item => item.jug)
  );

  const loadCustomerData = () => {
    API.get('consumption/').then(res => setMonthlyConsumption(res.data)).catch(() => { });
    API.get('jugs/').then(res => {
      const transformed = res.data.map(j => ({
        ...j,
        db_id: j.id,
        id: j.unique_id,
        label: j.jug_label,
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
        await API.patch(`jugs/${freqToggleJug.db_id}/schedule/`, {
          frequency_days: days,
          status: 'Active'
        });
        setJugs(prev => prev.map(j =>
          j.id === freqToggleJug.id ? { ...j, frequency: `${days} days` } : j
        ));
      } else {
        await API.patch(`jugs/${freqToggleJug.db_id}/schedule/`, { status: 'Paused' });
        setJugs(prev => prev.map(j =>
          j.id === freqToggleJug.id ? { ...j, frequency: '-' } : j
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

  // Address handlers
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

  // Profile handlers
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

  // Order submission
  const placeRefillOrder = async () => {
    if (!pendingRefillOrder) return;
    const { jug, addressId } = pendingRefillOrder;
    try {
      await API.post('orders/', {
        address_id: addressId,
        items: [{ item_type: 'Refill', jug_id: jug.db_id, quantity: 1 }],
      });
      const res = await API.get('orders/');
      setOrders(res.data);
      setShowConfirmRefillOrder(false);
      setPendingRefillOrder(null);
      setShowRefillModal(false);
      setSelectedJugForRefill(null);
      setSelectedAddress(null);
    } catch (err) {
      console.error('Order failed:', err);
      showError('Failed to place refill order. Please try again.');
      setShowConfirmRefillOrder(false);
    }
  };

  const placeNewJugOrder = async () => {
    if (!pendingNewJugOrder) return;
    const { jugTypeId, addressId } = pendingNewJugOrder;
    try {
      await API.post('orders/', {
        address_id: addressId,
        items: [{ item_type: 'New Jug', jug_type_id: jugTypeId, quantity: 1 }],
      });
      const res = await API.get('orders/');
      setOrders(res.data);
      setShowConfirmNewJugOrder(false);
      setPendingNewJugOrder(null);
      setShowNewJugModal(false);
      setSelectedJugType(null);
      setSelectedNewJugAddress(null);
    } catch (err) {
      console.error('Order failed:', err);
      showError('Failed to place new jug order. Please try again.');
      setShowConfirmNewJugOrder(false);
    }
  };

  // Theme tokens
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
        {/* CTA cards with water wave animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowRefillModal(true)}
            className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-blue-600 text-white transition-all duration-200 text-left"
          >
            <div className="water-wave absolute inset-0 bg-blue-400/40 pointer-events-none">
              <svg className="wave-svg wave-layer-1" viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: 40 }}>
                <path fill="rgba(255,255,255,0.25)" d="M0,40 C200,80 400,0 600,45 C800,90 1000,10 1200,50 C1300,65 1380,30 1440,40 L1440,80 L0,80 Z" />
              </svg>
              <svg className="wave-svg wave-layer-2" viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: 40, top: -18, opacity: 0.5 }}>
                <path fill="rgba(255,255,255,0.15)" d="M0,20 C150,60 350,5 550,55 C750,90 950,15 1150,45 C1300,65 1400,25 1440,30 L1440,80 L0,80 Z" />
              </svg>
            </div>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 inline-flex p-2.5 bg-white/15 rounded-xl">
                  <img src={refillIcon} alt="Refill" className="w-8 h-8 object-contain" />
                </div>
                <div className="font-bold text-base sm:text-lg mt-2">Request Refill</div>
                <div className="text-blue-200 text-xs sm:text-sm mt-0.5">Schedule a swift refill delivery</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowNewJugModal(true)}
            className={`group relative overflow-hidden p-5 sm:p-6 rounded-2xl border transition-all duration-200 text-left ${card}`}
          >
            <div className="water-wave absolute inset-0 bg-blue-400/20 pointer-events-none">
              <svg className="wave-svg wave-layer-1" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 28 }}>
                <path fill="rgba(59,130,246,0.2)" d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
              </svg>
              <svg className="wave-svg wave-layer-2" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 28, top: -14, opacity: 0.5 }}>
                <path fill="rgba(59,130,246,0.15)" d="M0,20 C480,55 960,0 1440,35 L1440,60 L0,60 Z" />
              </svg>
            </div>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className={`mb-1 inline-flex p-2.5 rounded-xl ${D ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                  <img src={newJugIcon} alt="New Jug" className="w-8 h-8 object-contain" />
                </div>
                <div className={`font-bold text-base sm:text-lg mt-2 ${text}`}>New Container</div>
                <div className={`text-xs sm:text-sm mt-0.5 ${muted}`}>Purchase an additional water jug</div>
              </div>
            </div>
          </button>
        </div>

        {/* Active Deliveries – Progress Tracker Style */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${card} space-y-4`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${text}`}>Active Deliveries</h3>
              <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
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
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const STEPS = [
                  { key: 'Ordered',         label: 'Order Placed', iconPath: IC.check },
                  { key: 'To Be Picked Up', label: 'Pickup',       iconPath: IC.package },
                  { key: 'Refilling',       label: 'Refilling',    iconPath: IC.droplet },
                  { key: 'On The Way',      label: 'On the Way',   iconPath: IC.truck },
                  { key: 'Delivered',       label: 'Delivered',    iconPath: IC.map },
                ];

                const currentStepIndex = STEPS.findIndex(s => s.key === order.status);

                const item = order.items?.[0];
                const itemLabel = item
                  ? item.item_type === 'Refill'
                    ? `Refill (${item.jug_label || item.jug?.unique_id || '—'})`
                    : `New Jug — ${item.generated_jug_label || item.jug_type?.type_name || item.jug_type_name || '—'}`
                  : 'Order';

                return (
                  <div
                    key={order.id}
                    className={`p-4 sm:p-5 rounded-2xl border ${D ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50/60'}`}
                  >
                    {/* Top row: order info + ETA */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${muted}`}>
                          #{order.id} — {itemLabel}
                        </div>
                        <div className={`text-xs ${muted}`}>
                          Placed:{' '}
                          {order.created_at
                            ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                          {' · '}
                          {order.delivery_address_snapshot || '—'}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>ETA</div>
                        <div className={`text-sm font-black ${D ? 'text-amber-400' : 'text-amber-600'}`}>
                          {order.estimated_arrival
                            ? new Date(order.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="relative flex items-start justify-between">
                      {/* connecting line background */}
                      <div className={`absolute top-4 left-4 right-4 h-0.5 ${D ? 'bg-slate-700' : 'bg-slate-200'}`} />
                      {/* connecting line fill */}
                      <div
                        className="absolute top-4 left-4 h-0.5 bg-blue-600 transition-all duration-700"
                        style={{ left: '10%',
                          width: currentStepIndex <= 0
                            ? '0%'
                            : `calc(${(currentStepIndex / (STEPS.length - 1)) * 80}% - 0px)`
                        }}
                      />

                      {STEPS.map((step, i) => {
                        const done = i < currentStepIndex;
                        const active = i === currentStepIndex;

                        return (
                          <div key={step.key} className="relative flex flex-col items-center gap-1.5 z-10" style={{ width: `${100 / STEPS.length}%` }}>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                                done
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : active
                                  ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md shadow-blue-500/40'
                                  : D
                                  ? 'bg-slate-800 border-slate-600 text-slate-500'
                                  : 'bg-white border-slate-300 text-slate-400'
                              }`}
                            >
                              {done
                                ? <Icon path={IC.check} className="w-4 h-4" />
                                : <Icon path={step.iconPath} className="w-4 h-4" />}
                            </div>
                            <span
                              className={`text-[10px] sm:text-xs font-semibold text-center leading-tight ${
                                active
                                  ? 'text-blue-500'
                                  : done
                                  ? D ? 'text-slate-300' : 'text-slate-600'
                                  : muted
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
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
            { label: 'Next Refill', val: nextRefillText || '—', color: 'text-amber-500', bg: D ? 'bg-amber-900/30' : 'bg-amber-50', icon: IC.clock },
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
                    {['Order ID', 'Jug', 'Type', 'ETA', 'Arrived', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left py-3 px-4 whitespace-nowrap font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${D ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {orders.map(o => (
                    <tr key={o.id} className={`transition-colors ${D ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3.5 px-4 font-mono font-bold text-xs ${text}`}>{o.id}</td>
                      <td className={`py-3.5 px-4 text-xs ${muted}`}>
                        {(() => {
                          const item = o.items?.[0];
                          if (!item) return '—';
                          if (item.item_type === 'Refill') {
                            return item.jug_label || item.jug?.unique_id || '—';
                          }
                          return item.generated_jug_label || item.jug_type_name || '—';
                        })()}
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

  // ── INVENTORY ──────────────────────────────────────────────────────────────
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
                onUpdateFreq={handleFreqUpdate}
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

  // ── PROFILE ────────────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div className="mx-auto space-y-5 max-w-2xl">
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

      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`font-bold ${text}`}>Delivery Addresses</div>
          <button
            onClick={() => { setEditingAddress(null); setShowAddAddressModal(true); }}
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

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <style>{`
        @keyframes modalPop { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* HEADER */}
      <header className={`sticky top-0 z-30 border-b shadow-sm transition-colors ${D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logo} alt="Aquaduct Logo" className="w-10 h-10 object-contain" />
            <span className="font-gugi text-2xl bg-gradient-to-t from-blue-700 to-cyan-300 bg-clip-text text-transparent">Aquaduct</span>
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
            <button onClick={() => setDark(v => !v)} title={D ? 'Light mode' : 'Dark mode'}
              className={`p-2 rounded-xl transition-all ${D ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              <Icon path={D ? IC.sun : IC.moon} className="w-5 h-5" />
            </button>
            <NotificationsPopover dark={dark} theme={theme} />
            <div className="relative">
              <button onClick={() => setShowProfileDropdown(v => !v)}
                className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors ${D ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
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
                      <button onClick={() => { setShowProfileDropdown(false); handleLogout(); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors text-red-500 ${D ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
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

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'profile' && renderProfile()}
        {error && (<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>)}
      </main>

      {/* CHATBOT TOGGLE */}
      <button onClick={() => setShowChatbot(c => !c)}
        className={`fixed bottom-6 left-6 z-40 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${D ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 hover:bg-slate-900'} text-white`}>
        <Icon path={IC.chat} className="w-6 h-6" />
      </button>
      {showChatbot && <ChatWidget dark={dark} theme={theme} onClose={() => setShowChatbot(false)} />}

      {/* MODALS */}
      {/* Refill */}
      <Modal show={showRefillModal} onClose={() => { setShowRefillModal(false); setSelectedJugForRefill(null); setSelectedAddress(null); }} title="Order Refill" dark={D} maxWidth="max-w-lg">
        <div className="p-6 space-y-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>1. Select Jug</label>
            <div className="space-y-2">
              {jugs.filter(j => j.status === 'Active' && !activeRefillJugIds.has(j.db_id)).map(j => (
                <button key={j.id} onClick={() => setSelectedJugForRefill(j)}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${selectedJugForRefill?.id === j.id
                    ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                    : D ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-blue-300'}`}>
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${D ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                    <Icon path={IC.droplet} className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5">
                      <div className={`font-bold font-mono text-sm ${D ? 'text-white' : 'text-slate-800'}`}> {j.label || j.id} </div>
                      {j.label && (<div className={`text-xs font-mono ${muted}`}> {j.id} </div>)}
                    </div>
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
                    : D ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-blue-300'}`}>
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
            <div className={`flex justify-between text-sm mb-2 ${muted}`}><span>Refill Service</span><span>₱{selectedJugForRefill?.jug_type?.refill_price ?? '—'}</span></div>
            <div className={`flex justify-between pt-2 border-t font-bold ${border}`}><span className={text}>Total</span><span className="text-blue-500 text-xl">₱{selectedJugForRefill?.jug_type?.refill_price ?? '—'}</span></div>
          </div>
          <button
            disabled={!selectedJugForRefill || !selectedAddress}
            onClick={() => {
              if (!selectedJugForRefill || !selectedAddress) return;
              setPendingRefillOrder({ jug: selectedJugForRefill, addressId: selectedAddress, addressLabel: addresses.find(a => a.id === selectedAddress)?.full_address });
              setShowRefillModal(false);
              setShowConfirmRefillOrder(true);
            }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${selectedJugForRefill && selectedAddress
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : D ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            Confirm Refill Order
          </button>
        </div>
      </Modal>

      {/* New Jug */}
      <Modal show={showNewJugModal} onClose={() => { setShowNewJugModal(false); setSelectedJugType(null); setSelectedNewJugAddress(null); }} title="Order New Container" dark={D}>
        <div className="p-6 space-y-3">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>1. Delivery Address</label>
            <div className="space-y-2">
              {addresses.map(addr => (
                <button key={addr.id} onClick={() => setSelectedNewJugAddress(addr.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${selectedNewJugAddress === addr.id
                    ? 'border-blue-500 ' + (D ? 'bg-blue-900/20' : 'bg-blue-50')
                    : D ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-blue-300'}`}>
                  <Icon path={IC.map} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${muted}`} />
                  <div>
                    <div className="flex items-center gap-2"><span className={`text-sm font-bold ${D ? 'text-white' : 'text-slate-800'}`}>{addr.label || addr.address_type}</span>{addr.is_default && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Default</span>}</div>
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
                : D ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-blue-300'}`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {jt.image ? (<img src={jt.image.startsWith('http') ? jt.image : `http://localhost:8000${jt.image}`} alt={jt.type_name} className="w-full h-full object-cover" />) : (<Icon path={IC.droplet} className="w-6 h-6 text-blue-500" />)}
              </div>
              <div className="flex-1"><div className={`font-bold ${D ? 'text-white' : 'text-slate-800'}`}>{jt.type_name}</div><div className={`text-sm ${muted}`}>{jt.description || `${jt.gallon_capacity} gal`}</div></div>
              <div className={`text-xl font-black flex-shrink-0 ${D ? 'text-white' : 'text-slate-800'}`}>₱{jt.purchase_price}</div>
            </button>
          ))}
          <button
            disabled={!selectedJugType || !selectedNewJugAddress}
            onClick={() => {
              if (!selectedJugType || !selectedNewJugAddress) return;
              const jugType = jugTypes.find(jt => jt.id === selectedJugType);
              setPendingNewJugOrder({ jugType, jugTypeId: selectedJugType, addressId: selectedNewJugAddress, addressLabel: addresses.find(a => a.id === selectedNewJugAddress)?.full_address });
              setShowNewJugModal(false);
              setShowConfirmNewJugOrder(true);
            }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm mt-2 transition-all ${selectedJugType && selectedNewJugAddress
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : D ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            Confirm Order
          </button>
        </div>
      </Modal>

      {/* Confirm Refill Order */}
      <ConfirmDialog show={showConfirmRefillOrder} onClose={() => { setShowConfirmRefillOrder(false); setPendingRefillOrder(null); }} onBack={() => { setShowConfirmRefillOrder(false); setShowRefillModal(true); }} onConfirm={placeRefillOrder} title="Confirm Refill Order" confirmText="Place Order" isDangerous={false} dark={D} theme={theme}
        previewData={pendingRefillOrder ? [
          { label: "Jug", value: pendingRefillOrder.jug.label || pendingRefillOrder.jug.id, mono: true },
          { label: "Type", value: pendingRefillOrder.jug.type },
          { label: "Delivery Address", value: pendingRefillOrder.addressLabel },
          { label: "Total", value: `₱${jugTypes.find(jt => jt.id === pendingRefillOrder.jug.jug_type)?.refill_price ?? '—'}`, extra: "Refill fee" },
        ] : []}
      />

      {/* Confirm New Jug Order */}
      <ConfirmDialog show={showConfirmNewJugOrder} onClose={() => { setShowConfirmNewJugOrder(false); setPendingNewJugOrder(null); }} onBack={() => { setShowConfirmNewJugOrder(false); setShowNewJugModal(true); }} onConfirm={placeNewJugOrder} title="Confirm New Container Order" confirmText="Place Order" isDangerous={false} dark={D} theme={theme}
        previewData={pendingNewJugOrder ? [
          { label: "Container Type", value: pendingNewJugOrder.jugType?.type_name, mono: true },
          { label: "Capacity", value: `${pendingNewJugOrder.jugType?.gallon_capacity} gal` },
          { label: "Delivery Address", value: pendingNewJugOrder.addressLabel },
          { label: "Total", value: `₱${pendingNewJugOrder.jugType?.purchase_price}`, extra: "One‑time purchase" },
        ] : []}
      />

      {/* Frequency Confirm Toggle */}
      <ConfirmDialog show={showFreqConfirmToggle} onClose={() => { setShowFreqConfirmToggle(false); setFreqToggleJug(null); setFreqTogglePending(null); }} onBack={() => { setShowFreqConfirmToggle(false); }} onConfirm={confirmFreqToggle} title="Confirm Schedule Change" confirmText="Yes, Update" dark={D} theme={theme}
        bannerMessage={freqTogglePending && freqToggleJug && (
          <>{freqTogglePending.enabled
            ? <>Set refill schedule for <strong className="font-mono">{freqToggleJug.id}</strong> to every <strong>{freqTogglePending.days} day{freqTogglePending.days === 1 ? '' : 's'}</strong>?</>
            : <>Disable the refill schedule for <strong className="font-mono">{freqToggleJug.id}</strong>?</>}
          </>)}
      />

      {/* Add Address */}
      <AddAddressModal show={showAddAddressModal} onClose={() => { setShowAddAddressModal(false); setEditingAddress(null); setPendingAddressData(null); }} onContinue={handleAddAddressContinue} initialData={editingAddress} dark={D} theme={theme} />

      {/* Confirm Address */}
      <ConfirmDialog show={showConfirmAddressModal} onClose={() => { setShowConfirmAddressModal(false); setPendingAddressData(null); }} onBack={() => { setShowConfirmAddressModal(false); setShowAddAddressModal(true); }} onConfirm={handleConfirmAddress}
        title={editingAddress ? "Save address changes?" : "Add address to your profile?"}
        message={editingAddress ? "Your address will be updated." : "This address will be added to your profile and can be selected for future deliveries."}
        confirmText={editingAddress ? "Save Changes" : "Add Address"} isDangerous dark={D} theme={theme}
        previewData={pendingAddressData ? [
          { label: "Type", value: pendingAddressData.address_type },
          ...(pendingAddressData.address_type === 'Apartment' ? [{ label: "Unit", value: pendingAddressData.unit_number }, { label: "Building", value: pendingAddressData.building_name || '—' }] : []),
          { label: "Street", value: pendingAddressData.street_address },
          { label: "Barangay", value: pendingAddressData.barangay || '—' },
          { label: "City", value: "Quezon City" },
          ...(pendingAddressData.is_default ? [{ label: "Default", extra: "Will be set as default" }] : []),
        ] : []}
      />

      {/* Edit Profile */}
      <EditProfileModal show={showEditProfileModal} onClose={() => { setShowEditProfileModal(false); setPendingProfileData(null); }} onContinue={handleEditProfileContinue} profileData={profile} dark={D} theme={theme} />

      {/* Confirm Profile */}
      <ConfirmDialog show={showConfirmProfileModal} onClose={() => { setShowConfirmProfileModal(false); setPendingProfileData(null); }} onBack={() => { setShowConfirmProfileModal(false); setShowEditProfileModal(true); }} onConfirm={handleConfirmProfile} title="Confirm Profile Changes?" confirmText="Save Changes" isDangerous dark={D} theme={theme}
        previewData={pendingProfileData ? [
          { label: "Name", value: pendingProfileData.name, mono: true },
          { label: "Email Address", value: pendingProfileData.email, mono: true },
          { label: "Phone Number", value: pendingProfileData.phone, mono: true },
        ] : []}
      />
    </div>
  );
}