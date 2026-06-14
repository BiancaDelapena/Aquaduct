// AdminPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Users, Package, AlertCircle, DollarSign, FileText, Clock, Search,
  Filter, ChevronRight, Calendar, CheckCircle, History, Navigation, LogOut, RefreshCw,
} from 'lucide-react';
import API from '../api';
import Icon, { IC } from '../components/MyIcons';

import { StatCard } from '../components/Statcard';
import { OrderStatusBadge } from '../components/Orderstatusbadge';
import { DeliveryCard } from '../components/Deliverycard';
import AddJugTypeModal from '../components/Addjugtypemodal';
import EditJugTypeModal from '../components/Editjugtypemodal';
import RowActionMenu from '../components/RowActionMenu';
import ConfirmDialog from '../components/ConfirmDialog';

const ORDER_STATUS_OPTIONS = [
  'Ordered',
  'To Be Picked Up',
  'Refilling',
  'On The Way',
  'Delivered',
  'Cancelled',
];
const ACTIVE_STATUSES = new Set(['Ordered', 'To Be Picked Up', 'Refilling', 'On The Way']);

export function AdminDashboard() {
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Real data state ─────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);  // all orders from API
  const [jugTypes, setJugTypes] = useState([]);
  const [jugs, setJugs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const showError = (message) => {setError(message); setTimeout(() => setError(null), 7000);};

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [isAddJugTypeModalOpen, setIsAddJugTypeModalOpen] = useState(false);
  const [isEditJugTypeModalOpen, setIsEditJugTypeModalOpen] = useState(false);
  const [selectedJugType, setSelectedJugType] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [jugTypeToDelete, setJugTypeToDelete] = useState(null);
  const [jugTypeToEdit, setJugTypeToEdit] = useState(null);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [jugNames, setJugNames] = useState({});
  const [namingOrder, setNamingOrder] = useState(null);

  // ── Derived slices ───────────────────────────────────────────────────────────
  const activeOrders = orders.filter(o => ACTIVE_STATUSES.has(o.status));
  const historyOrders = orders.filter(o => o.status === 'Delivered');

  // Jug status counts from real data
  const jugStatusData = [
    { name: 'Active', value: jugs.filter(j => j.status === 'Active').length, color: '#10b981' },
    { name: 'Inactive', value: jugs.filter(j => j.status === 'Inactive').length, color: '#64748b' },
    { name: 'Lost', value: jugs.filter(j => j.status === 'Lost').length, color: '#ef4444' },
    { name: 'Broken', value: jugs.filter(j => j.status === 'Broken').length, color: '#f59e0b' },
  ];

  // ── Data loading ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes, jugTypesRes, jugsRes, auditRes] = await Promise.all([
        API.get('profile/'),
        API.get('orders/'),
        API.get('jug-types/'),
        API.get('jugs/'),
        API.get('admin/audit-logs/'),
      ]);
      setProfile(jugTypesRes && profileRes.data);
      setOrders(ordersRes.data);
      setJugTypes(jugTypesRes.data);
      setJugs(jugsRes.data);
      setAuditLogs(auditRes.data);
      // also set profile properly
      setProfile(profileRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const D = dark;
  const bg = D ? 'bg-slate-950' : 'bg-slate-50';
  const card = D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const text = D ? 'text-slate-100' : 'text-slate-800';
  const muted = D ? 'text-slate-400' : 'text-slate-500';
  const border = D ? 'border-slate-800' : 'border-slate-200';
  const inp = D
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500';
  const theadBg = D ? 'bg-slate-800' : 'bg-slate-50';
  const theadTxt = D ? 'text-slate-400' : 'text-slate-600';
  const rowHov = D ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50';
  const rowBorder = D ? 'border-slate-800' : 'border-slate-100';

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await API.post('logout/');
    navigate('/');
  };

  // ── Order status update ──────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId, newStatus) => {
    if (newStatus === 'On The Way') {
      const order = orders.find(o => o.id === orderId);
      const newJugItems = (order?.items ?? []).filter(i => i.item_type === 'New Jug');
      const names = jugNames[orderId] ?? {};
      const allNamed = newJugItems.every((_, idx) => (names[idx] ?? '').trim() !== '');
      if (newJugItems.length > 0 && !allNamed) {
        showError('Please name all new jugs before marking this order as "On The Way".');
        return;
      }
    }

    try {
      await API.patch(`orders/${orderId}/status/`, { status: newStatus });
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      if (newStatus === 'Delivered') {
        const names = jugNames[orderId] ?? {};
        if (Object.keys(names).length > 0) {
          const orderRes = await API.get(`orders/${orderId}/`);
          const items = orderRes.data.items ?? [];

          for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const name = names[idx]?.trim();
            if (item.item_type === 'New Jug' && name && item.generated_jug) {
              await API.patch(`jugs/${item.generated_jug}/`, {
                jug_label: name,
              });
            }
          }

          setJugNames(prev => {
            const updated = { ...prev };
            delete updated[orderId];
            return updated;
          });
          setNamingOrder(null);
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err.response?.data || err);
      showError('Failed to update order status. Please try again.');
    }
  };

  // Delivery card complete → mark Delivered
  const handleDeliveryComplete = (orderId) => updateOrderStatus(orderId, 'Delivered');

  // ── Jug type CRUD ────────────────────────────────────────────────────────────
  const handleAddJugType = async (formData) => {
    try {
      const payload = new FormData();
      payload.append('type_name', formData.typeName);
      payload.append('gallon_capacity', formData.capacity);
      payload.append('purchase_price', formData.purchasePrice);
      payload.append('refill_price', formData.refillPrice);
      payload.append('description', formData.description || '');
      payload.append('is_available', formData.isAvailable ? 'true' : 'false');
      if (formData.image) payload.append('image', formData.image);

      await API.post('jug-types/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const res = await API.get('jug-types/');
      setJugTypes(res.data);
      setIsAddJugTypeModalOpen(false);
    } catch (err) {
      console.error('Failed to add jug type:', err.response?.data || err);
      showError('Failed to save jug type. Check fields and try again');
    }
  };

  const handleEditJugType = (jugType) => {
    setSelectedJugType(jugType);
    setJugTypeToEdit(jugType);
    setIsEditJugTypeModalOpen(true);
  };

  const handleSaveEditJugType = (updatedForm) => {
    setJugTypeToEdit(updatedForm);
    setIsEditConfirmOpen(true);
  };

  const confirmEditJugType = async () => {
    if (!jugTypeToEdit) return;
    try {
      const payload = new FormData();
      payload.append('type_name', jugTypeToEdit.typeName ?? jugTypeToEdit.type_name ?? '');
      payload.append('gallon_capacity', jugTypeToEdit.capacity ?? jugTypeToEdit.gallon_capacity ?? '');
      payload.append('purchase_price', jugTypeToEdit.purchasePrice ?? jugTypeToEdit.purchase_price ?? '');
      payload.append('refill_price', jugTypeToEdit.refillPrice ?? jugTypeToEdit.refill_price ?? '');
      payload.append('description', jugTypeToEdit.description ?? '');
      payload.append('is_available', (jugTypeToEdit.isAvailable ?? jugTypeToEdit.is_available) ? 'true' : 'false');
      if (jugTypeToEdit.image) payload.append('image', jugTypeToEdit.image);

      await API.put(`jug-types/${selectedJugType.id}/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const res = await API.get('jug-types/');
      setJugTypes(res.data);
      setIsEditJugTypeModalOpen(false);
      setIsEditConfirmOpen(false);
      setSelectedJugType(null);
      setJugTypeToEdit(null);
    } catch (err) {
      console.error('Failed to update jug type:', err.response?.data || err);
      showError('Failed to update jug type.');
    }
  };

  const handleDeleteJugType = (jugType) => {
    setJugTypeToDelete(jugType);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteJugType = async () => {
    if (!jugTypeToDelete) return;
    try {
      await API.delete(`jug-types/${jugTypeToDelete.id}/`);
      setJugTypes(prev => prev.filter(jt => jt.id !== jugTypeToDelete.id));
      setJugTypeToDelete(null);
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Failed to delete jug type:', err.response?.data || err);
      showError('Failed to delete jug type. It may be referenced by existing orders.');
    }
  };

  // ── Tab renderers ─────────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {jugStatusData.map(s => (
          <div key={s.name} className={`p-6 rounded-xl border shadow-sm ${card}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${muted}`}>{s.name} Jugs</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            </div>
            <div className={`text-3xl font-black ${text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Active Deliveries Summary */}
      <div className={`p-6 rounded-xl border shadow-sm ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${text}`}>Active Deliveries Today</h3>
          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
            {activeOrders.length} pending
          </span>
        </div>
        {loading ? (
          <div className={`text-sm ${muted}`}>Loading…</div>
        ) : activeOrders.length === 0 ? (
          <div className={`text-sm ${muted}`}>No active orders right now.</div>
        ) : (
          <div className="space-y-3">
            {activeOrders.slice(0, 3).map((order) => (
              <div key={order.id} className={`flex items-center justify-between p-3 rounded-lg ${D ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div>
                  <div className={`text-sm font-mono font-bold ${text}`}>#{order.id} — {order.customer_name || order.customer_email}</div>
                  <div className={`text-xs ${muted}`}>{order.delivery_address_snapshot}</div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setActiveTab('deliveries')}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Manage Deliveries →
        </button>
      </div>

      {/* Recent Orders Summary */}
      <div className={`p-6 rounded-xl border shadow-sm ${card}`}>
        <h3 className={`text-lg font-bold mb-4 ${text}`}>Recent Orders</h3>
        <div className="space-y-2">
          {orders.slice(0, 5).map(o => (
            <div key={o.id} className={`flex items-center justify-between p-3 rounded-lg ${D ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <div>
                <span className={`text-sm font-mono font-bold ${text}`}>#{o.id}</span>
                <span className={`text-xs ml-2 ${muted}`}>{o.customer_name || o.customer_email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${text}`}>₱{o.price_snapshot}</span>
                <OrderStatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setActiveTab('orders')}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          View All Orders →
        </button>
      </div>
    </div>
  );

  const renderDeliveries = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${text}`}>Active Deliveries</h2>
        <span className={`text-sm ${muted}`}>{activeOrders.length} pending tasks</span>
      </div>

      {loading ? (
        <div className={`p-12 rounded-xl border text-center ${card}`}>
          <RefreshCw className={`w-10 h-10 mx-auto mb-3 animate-spin ${muted}`} />
          <p className={muted}>Loading orders…</p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className={`p-12 rounded-xl border text-center ${card}`}>
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className={`text-lg mb-2 ${text}`}>All Caught Up!</h3>
          <p className={muted}>No active deliveries at the moment</p>
        </div>
      ) : (
        activeOrders.map((order) => {
          const newJugItems = (order.items ?? []).filter(i => i.item_type === 'New Jug');
          const hasNewJugs = newJugItems.length > 0;
          const names = jugNames[order.id] ?? {};
          const allNamed = newJugItems.every((_, idx) => (names[idx] ?? '').trim() !== '');
          const isNaming = namingOrder === order.id;

          return (
            <div key={order.id}>
              <DeliveryCard
                order={order}
                dark={dark}
                onStatusUpdate={updateOrderStatus}
                onComplete={handleDeliveryComplete}
              />

              {/* Naming panel – only for orders with New Jug items */}
              {hasNewJugs && (
                <div className={`-mt-2 mx-0 mb-2 rounded-b-xl border border-t-0 px-4 py-3 ${D ? 'bg-slate-800 border-slate-700' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className={`w-4 h-4 ${allNamed ? 'text-green-500' : 'text-amber-500'}`} />
                      <span className={`text-sm font-semibold ${allNamed ? 'text-green-600' : D ? 'text-amber-300' : 'text-amber-700'}`}>
                        {allNamed
                          ? `New jug${newJugItems.length > 1 ? 's' : ''} named ✓`
                          : `Name new jug${newJugItems.length > 1 ? 's' : ''} before "On The Way"`}
                      </span>
                    </div>
                    <button
                      onClick={() => setNamingOrder(isNaming ? null : order.id)}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                        allNamed
                          ? D ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          : D ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {isNaming ? 'Close' : allNamed ? 'Edit Names' : 'Name Jugs'}
                    </button>
                  </div>

                  {isNaming && (
                    <div className="mt-3 space-y-2">
                      {newJugItems.map((item, idx) => {
                        const currentName = names[idx] ?? '';
                        return (
                          <div key={item.id ?? idx} className="flex items-center gap-2">
                            <span className={`text-xs w-20 flex-shrink-0 ${muted}`}>
                              Jug {idx + 1}{newJugItems.length > 1 ? ` (${item.jug_type?.type_name ?? ''})` : ''}
                            </span>
                            <input
                              type="text"
                              placeholder="e.g. Kitchen jug or JUG-001"
                              value={currentName}
                              onChange={(e) =>
                                setJugNames(prev => ({
                                  ...prev,
                                  [order.id]: { ...(prev[order.id] ?? {}), [idx]: e.target.value },
                                }))
                              }
                              className={`flex-1 text-sm px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inp}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
        
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border shadow-sm ${card}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${muted}`} />
            <input
              type="text"
              placeholder="Search by order ID or customer name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inp}`}
            />
          </div>
          <button
            onClick={loadAll}
            title="Refresh"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${D ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theadBg} ${border}`}>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Order ID</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Customer</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Status</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Amount</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Date</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={`py-12 text-center text-sm ${muted}`}>Loading…</td>
                </tr>
              ) : orders
                .filter(o =>
                  !searchTerm ||
                  String(o.id).includes(searchTerm) ||
                  (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (o.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((order) => (
                  <tr key={order.id} className={`border-b ${rowBorder} ${rowHov}`}>
                    <td className={`py-3 px-4 text-sm font-mono font-bold ${text}`}>#{order.id}</td>
                    <td className={`py-3 px-4 text-sm ${text}`}>{order.customer_name || order.customer_email}</td>
                    <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                    <td className={`py-3 px-4 text-sm font-semibold ${text}`}>₱{order.price_snapshot}</td>
                    <td className={`py-3 px-4 text-sm ${muted}`}>
                      {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inp}`}
                      >
                        {ORDER_STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => {
    const totalRevenue = historyOrders.reduce((sum, o) => sum + parseFloat(o.price_snapshot || 0), 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Completed"
            value={historyOrders.length}
            subtext={`₱${totalRevenue.toFixed(2)} collected`}
            subtextColor="text-green-600"
            icon={CheckCircle}
            iconColor="text-green-600"
          />
          <StatCard
            label="Total Orders"
            value={orders.length}
            subtext={`${activeOrders.length} still active`}
            subtextColor="text-blue-600"
            icon={History}
            iconColor="text-blue-600"
          />
          <StatCard
            label="Completion Rate"
            value={orders.length > 0 ? `${Math.round((historyOrders.length / orders.length) * 100)}%` : '—'}
            icon={CheckCircle}
            iconColor="text-purple-600"
          />
        </div>

        <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
          <div className={`p-4 border-b flex items-center justify-between ${border}`}>
            <h3 className={`text-lg font-bold ${text}`}>Delivery History</h3>
          </div>
          <div className={`divide-y ${D ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {historyOrders.length === 0 ? (
              <div className={`py-12 text-center text-sm ${muted}`}>No delivered orders yet.</div>
            ) : historyOrders.map((order) => (
              <div key={order.id} className={`flex items-center justify-between p-4 ${rowHov}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${D ? 'bg-green-900/40' : 'bg-green-100'}`}>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className={`text-sm font-mono font-bold ${text}`}>
                      #{order.id} — {order.customer_name || order.customer_email}
                    </div>
                    <div className={`text-xs ${muted}`}>
                      {order.items?.[0]?.item_type ?? 'Order'} ·{' '}
                      {order.actual_arrival
                        ? new Date(order.actual_arrival).toLocaleString()
                        : order.completed_at
                          ? new Date(order.completed_at).toLocaleString()
                          : new Date(order.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-semibold ${text}`}>₱{order.price_snapshot}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderJugs = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {jugStatusData.map((s) => (
          <div key={s.name} className={`p-6 rounded-xl border shadow-sm ${card}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${muted}`}>{s.name} Jugs</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            </div>
            <div className={`text-3xl font-black ${text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Jug Types Section */}
      <div className={`p-6 rounded-xl border shadow-sm ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${text}`}>Jug Types</h3>
          <button
            onClick={() => setIsAddJugTypeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Package className="w-4 h-4" />
            Add Jug Type
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theadBg} ${border}`}>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Type Name</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Capacity (gal)</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Purchase Price</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Refill Price</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Status</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={`py-12 text-center text-sm ${muted}`}>Loading…</td>
                </tr>
              ) : jugTypes.map((jt) => (
                <tr key={jt.id} className={`border-b ${rowBorder} ${rowHov}`}>
                  <td className={`py-3 px-4 text-sm font-semibold ${text}`}>{jt.type_name}</td>
                  <td className={`py-3 px-4 text-sm ${text}`}>{jt.gallon_capacity}</td>
                  <td className={`py-3 px-4 text-sm ${text}`}>₱{jt.purchase_price}</td>
                  <td className={`py-3 px-4 text-sm ${text}`}>₱{jt.refill_price}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${jt.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {jt.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <RowActionMenu
                      onEdit={() => handleEditJugType(jt)}
                      onDelete={() => handleDeleteJugType(jt)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {jugTypes.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className={`mb-4 ${muted}`}>No jug types added yet</p>
            <button onClick={() => setIsAddJugTypeModalOpen(true)} className="text-blue-600 hover:text-blue-700 font-medium">
              Add your first jug type
            </button>
          </div>
        )}
      </div>

      <AddJugTypeModal
        isOpen={isAddJugTypeModalOpen}
        onClose={() => setIsAddJugTypeModalOpen(false)}
        onSave={handleAddJugType}
        dark={dark}
        theme={{ muted, inp, D }}
      />
      <EditJugTypeModal
        isOpen={isEditJugTypeModalOpen}
        onClose={() => { setIsEditJugTypeModalOpen(false); setSelectedJugType(null); setJugTypeToEdit(null); }}
        onSave={handleSaveEditJugType}
        jugType={selectedJugType}
        dark={dark}
        theme={{ muted, inp, D }}
      />
      <ConfirmDialog
        isOpen={isEditConfirmOpen}
        onClose={() => setIsEditConfirmOpen(false)}
        onConfirm={confirmEditJugType}
        title="Confirm Changes"
        message="Save these changes to the jug type?"
        confirmText="Save Changes"
        cancelText="Cancel"
        isDangerous={false}
        dark={dark}
      />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteJugType}
        title="Delete Jug Type"
        message={`Are you sure you want to delete "${jugTypeToDelete?.type_name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        dark={dark}
      />
    </div>
  );

  const renderAuditLogs = () => {
    const actionColors = {
      'Order Status Changed': 'bg-blue-100 text-blue-700',
      'Jug Type Created': 'bg-green-100 text-green-700',
      'Jug Type Updated': 'bg-yellow-100 text-yellow-700',
      'Jug Type Deleted': 'bg-red-100 text-red-700',
      'Customer Created': 'bg-green-100 text-green-700',
      'Customer Updated': 'bg-yellow-100 text-yellow-700',
      'Customer Deleted': 'bg-red-100 text-red-700',
      'Login': 'bg-slate-100 text-slate-600',
      'Logout': 'bg-slate-100 text-slate-600',
    };
    const resourceTypeColors = {
      'Order': 'bg-indigo-50 text-indigo-700',
      'JugType': 'bg-cyan-50 text-cyan-700',
      'User': 'bg-purple-50 text-purple-700',
      'Auth': 'bg-slate-50 text-slate-600',
    };

    const filtered = auditLogs.filter(log =>
      !auditSearchTerm ||
      String(log.resource_id || '').toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      (log.admin_email || '').toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      (log.action_display || log.action || '').toLowerCase().includes(auditSearchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-xl border shadow-sm ${card}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${muted}`} />
              <input
                type="text"
                placeholder="Search by action, resource ID, or admin user…"
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inp}`}
              />
            </div>
            <div className={`flex items-center gap-2 text-sm ${muted}`}>
              <FileText className="w-4 h-4" />
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        </div>

        <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
          <div className={`p-4 border-b flex items-center justify-between ${border}`}>
            <h3 className={`text-lg font-bold ${text}`}>Admin Audit Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theadBg} ${border}`}>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Date &amp; Time</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Admin User</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Action</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Resource Type</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Resource ID</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className={`py-12 text-center text-sm ${muted}`}>Loading…</td></tr>
                ) : filtered.length > 0 ? filtered.map((log) => (
                  <tr key={log.id} className={`border-b ${rowBorder} ${rowHov}`}>
                    <td className={`py-3 px-4 text-sm whitespace-nowrap ${muted}`}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className={`py-3 px-4 text-sm ${text}`}>{log.admin_email || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${actionColors[log.action_display || log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.action_display || log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${resourceTypeColors[log.resource_type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.resource_type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm font-mono font-semibold ${text}`}>
                      {log.resource_id ?? '—'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className={`py-12 text-center text-sm ${muted}`}>
                      No audit logs match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Droplets },
    { id: 'deliveries', label: 'Active Deliveries', icon: Navigation },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'history', label: 'History', icon: History },
    { id: 'jugs', label: 'Jug Inventory', icon: Droplets },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className={`border-b shadow-sm transition-colors ${D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-black ${text}`}>Aquaduct</h1>
              <p className={`text-sm ${muted}`}>Business Dashboard</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setDark(v => !v)}
              title={D ? 'Light mode' : 'Dark mode'}
              className={`p-2 rounded-xl transition-all ${D ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <Icon path={D ? IC.sun : IC.moon} className="w-5 h-5" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(v => !v)}
                className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors ${D ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${D ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <Icon path={IC.user} className={`w-5 h-5 ${D ? 'text-slate-300' : 'text-slate-500'}`} />
                </div>
                <span className={`text-sm font-semibold hidden sm:inline truncate max-w-[100px] ${text}`}>
                  {profile?.name?.split(' ')[0] ?? 'Admin'}
                </span>
                <Icon path={IC.chevronDown} className={`w-4 h-4 hidden sm:block transition-transform duration-200 ${muted} ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                  <div className={`absolute right-0 top-full mt-2 w-48 rounded-2xl border shadow-lg z-50 overflow-hidden ${D ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`px-4 py-3 border-b ${D ? 'border-slate-700' : 'border-slate-100'}`}>
                      <div className={`text-sm font-bold truncate ${text}`}>{profile?.name ?? 'Admin'}</div>
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
      </div>

      {/* ── NAVIGATION ──────────────────────────────────────────────────── */}
      <div className={`border-b transition-colors ${D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : `border-transparent ${muted} hover:${text}`
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'deliveries' && activeOrders.length > 0 && (
                  <span className="ml-1 text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-bold">
                    {activeOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'deliveries' && renderDeliveries()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'jugs' && renderJugs()}
        {activeTab === 'audit' && renderAuditLogs()}
      </div>
    </div>
  );
}