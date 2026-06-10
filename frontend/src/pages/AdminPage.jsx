// AdminPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Users, Package, AlertCircle, DollarSign, FileText, Clock, Search,
  Filter, ChevronRight, Calendar, CheckCircle, History, Navigation, LogOut
} from 'lucide-react';
import API from '../api';
import Icon, { IC } from '../components/Icon';

import { StatCard } from '../components/Statcard';
import { OrderStatusBadge } from '../components/Orderstatusbadge';
import { DeliveryCard } from '../components/Deliverycard';
import AddJugTypeModal from '../components/Addjugtypemodal';
import EditJugTypeModal from '../components/Editjugtypemodal';
import RowActionMenu from '../components/RowActionMenu';
import ConfirmDialog from '../components/ConfirmDialog';

const jugStatusData = [
  { name: 'Active',  value: 856, color: '#10b981' },
  { name: 'Lost',    value: 23,  color: '#ef4444' },
  { name: 'Broken',  value: 12,  color: '#f59e0b' },
  { name: 'Retired', value: 45,  color: '#64748b' },
];

const mockActiveOrders = [
  {
    id: 'ORD002', customer: 'John Doe', address: '123 Main St, Quezon City',
    phone: '+63 912 345 6789', jug: 'JUG002', type: 'Refill',
    price: '₱30', eta: '11:00 AM', priority: 'High', status: 'pending',
  },
  {
    id: 'ORD003', customer: 'Jane Smith', address: '456 Oak Ave, Makati',
    phone: '+63 917 654 3210', jug: 'JUG005', type: 'New Jug',
    price: '₱125', eta: '1:30 PM', priority: 'Normal', status: 'pending',
  },
];

const mockAllOrders = [
  { id: 'ORD002', customer: 'John Doe',     status: 'Pending',    price: '₱30',  date: '2026-05-14 09:00' },
  { id: 'ORD003', customer: 'Jane Smith',   status: 'On the way', price: '₱125', date: '2026-05-14 11:20' },
  { id: 'ORD004', customer: 'Roberto Lim',  status: 'Refilling',  price: '₱30',  date: '2026-05-14 12:00' },
];

const mockHistory = [
  { id: 'ORD998', customer: 'Carlos Tan',   type: 'Refill',  price: '₱30',  time: '09:30 AM', date: '2026-05-14' },
  { id: 'ORD997', customer: 'Ana Reyes',    type: 'Refill',  price: '₱30',  time: '08:15 AM', date: '2026-05-14' },
  { id: 'ORD985', customer: 'Liza Santos',  type: 'Refill',  price: '₱30',  time: '02:10 PM', date: '2026-05-13' },
];

const mockAuditLogs = [
  { id: 1, timestamp: '2026-05-14 10:45', admin: 'Bianca Dela Peña', action: 'Order Status Changed', resourceType: 'Order',   resourceId: 'ORD001' },
  { id: 2, timestamp: '2026-05-14 11:20', admin: 'Bianca Dela Peña', action: 'Order Status Changed', resourceType: 'Order',   resourceId: 'ORD002' },
  { id: 3, timestamp: '2026-05-14 12:00', admin: 'Carlos Tan',       action: 'Jug Type Created',     resourceType: 'JugType', resourceId: 'Standard 5L' },
  { id: 4, timestamp: '2026-05-14 13:30', admin: 'Carlos Tan',       action: 'Jug Type Updated',     resourceType: 'JugType', resourceId: 'Large 10L' },
  { id: 5, timestamp: '2026-05-14 14:10', admin: 'Bianca Dela Peña', action: 'Jug Type Deleted',     resourceType: 'JugType', resourceId: 'Old Slim Jug' },
  { id: 6, timestamp: '2026-05-14 15:00', admin: 'Bianca Dela Peña', action: 'Customer Updated',     resourceType: 'User',    resourceId: 'USR004' },
  { id: 7, timestamp: '2026-05-14 15:45', admin: 'Carlos Tan',       action: 'Login',                resourceType: 'Auth',    resourceId: '-' },
];

export function AdminDashboard() {
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [searchTerm, setSearchTerm]   = useState('');
  const [activeOrders, setActiveOrders] = useState(mockActiveOrders);
  const [allOrders, setAllOrders]       = useState(mockAllOrders);
  const [isAddJugTypeModalOpen, setIsAddJugTypeModalOpen] = useState(false);
  const [isEditJugTypeModalOpen, setIsEditJugTypeModalOpen] = useState(false);
  const [selectedJugType, setSelectedJugType] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [jugTypeToDelete, setJugTypeToDelete] = useState(null);
  const [jugTypeToEdit, setJugTypeToEdit] = useState(null);
  const [jugTypes, setJugTypes] = useState([
    { id: 1, typeName: 'Standard 5L', capacity: '5L', purchasePrice: '₱150', refillPrice: '₱30', isAvailable: true },
    { id: 2, typeName: 'Large 10L', capacity: '10L', purchasePrice: '₱250', refillPrice: '₱50', isAvailable: true },
    { id: 3, typeName: 'Premium 5L', capacity: '5L', purchasePrice: '₱200', refillPrice: '₱35', isAvailable: true },
  ]);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [profile, setProfile] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    API.get('profile/').then(res => setProfile(res.data)).catch(() => {});
  }, []);

  // ── Theme tokens (mirrors CustomerPage) ─────────────────────────────────────
  const D = dark;
  const bg     = D ? 'bg-slate-950'  : 'bg-slate-50';
  const card   = D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const text   = D ? 'text-slate-100' : 'text-slate-800';
  const muted  = D ? 'text-slate-400' : 'text-slate-500';
  const border = D ? 'border-slate-800' : 'border-slate-200';
  const hov    = D ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50';
  const inp    = D
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500';
  const theadBg  = D ? 'bg-slate-800'   : 'bg-slate-50';
  const theadTxt = D ? 'text-slate-400' : 'text-slate-600';
  const rowHov   = D ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50';
  const rowBorder = D ? 'border-slate-800' : 'border-slate-100';

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await API.post('logout/');
    navigate('/');
  };

  // ── Status helpers ───────────────────────────────────────────────────────────
  const updateDeliveryStatus = (orderId, newStatus) =>
    setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

  const updateOrderStatus = (orderId, newStatus) =>
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

  // ── Jug type handlers ────────────────────────────────────────────────────────
  const handleAddJugType = (newJugType) => {
    const jugTypeWithId = {
      ...newJugType,
      id: Date.now(),
      purchasePrice: `₱${newJugType.purchasePrice}`,
      refillPrice: `₱${newJugType.refillPrice}`,
    };
    setJugTypes(prev => [...prev, jugTypeWithId]);
    setIsAddJugTypeModalOpen(false);
  };

  const handleEditJugType = (jugType) => {
    setSelectedJugType(jugType);
    setJugTypeToEdit(jugType);
    setIsEditJugTypeModalOpen(true);
  };

  const handleSaveEditJugType = (updatedJugType) => {
    setIsEditConfirmOpen(true);
    setJugTypeToEdit(updatedJugType);
  };

  const confirmEditJugType = () => {
    setJugTypes(prev => prev.map(jug => jug.id === jugTypeToEdit.id ? jugTypeToEdit : jug));
    setIsEditJugTypeModalOpen(false);
    setSelectedJugType(null);
    setJugTypeToEdit(null);
  };

  const handleDeleteJugType = (jugType) => {
    setJugTypeToDelete(jugType);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteJugType = () => {
    setJugTypes(prev => prev.filter(jug => jug.id !== jugTypeToDelete.id));
    setJugTypeToDelete(null);
  };

  // ── Tab renderers ────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Active Deliveries Summary */}
      <div className={`p-6 rounded-xl border shadow-sm ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg ${text}`}>Active Deliveries Today</h3>
          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {activeOrders.filter(o => o.status !== 'completed').length} pending
          </span>
        </div>
        <div className="space-y-3">
          {activeOrders.slice(0, 3).map((order) => (
            <div key={order.id} className={`flex items-center justify-between p-3 rounded-lg ${D ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <div>
                <div className={`text-sm ${text}`}>{order.id} — {order.customer}</div>
                <div className={`text-xs ${muted}`}>{order.address}</div>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
          ))}
        </div>
        <button
          onClick={() => setActiveTab('deliveries')}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Manage Deliveries →
        </button>
      </div>

      {/* Recent Alerts */}
      <div className={`p-6 rounded-xl border shadow-sm ${card}`}>
        <h3 className={`text-lg mb-4 ${text}`}>Recent Alerts</h3>
        <div className="space-y-3">
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${D ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <div className={`text-sm ${text}`}>High number of lost jugs in Quezon City area</div>
              <div className={`text-xs mt-1 ${muted}`}>15 jugs reported lost in the past 7 days</div>
            </div>
            <div className={`text-xs ${muted}`}>2h ago</div>
          </div>
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${D ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-200'}`}>
            <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <div className={`text-sm ${text}`}>3 delayed deliveries today</div>
              <div className={`text-xs mt-1 ${muted}`}>Average delay: 35 minutes</div>
            </div>
            <div className={`text-xs ${muted}`}>4h ago</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeliveries = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl ${text}`}>Active Deliveries</h2>
        <span className={`text-sm ${muted}`}>
          {activeOrders.filter(o => o.status !== 'completed').length} pending tasks
        </span>
      </div>

      {activeOrders.filter(o => o.status !== 'completed').map((order) => (
        <DeliveryCard
          key={order.id}
          order={order}
          onStatusUpdate={updateDeliveryStatus}
          onComplete={(id) => updateDeliveryStatus(id, 'completed')}
        />
      ))}

      {activeOrders.filter(o => o.status !== 'completed').length === 0 && (
        <div className={`p-12 rounded-xl border text-center ${card}`}>
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className={`text-lg mb-2 ${text}`}>All Caught Up!</h3>
          <p className={muted}>No active deliveries at the moment</p>
        </div>
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
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inp}`}
            />
          </div>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${D ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}>
            <Filter className="w-4 h-4" />
            Filter
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
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Price</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Date</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {allOrders
                .filter(o =>
                  !searchTerm ||
                  o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  o.customer.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((order) => (
                  <tr key={order.id} className={`border-b ${rowBorder} ${rowHov}`}>
                    <td className={`py-3 px-4 text-sm ${text}`}>{order.id}</td>
                    <td className={`py-3 px-4 text-sm ${text}`}>{order.customer}</td>
                    <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                    <td className={`py-3 px-4 text-sm ${text}`}>{order.price}</td>
                    <td className={`py-3 px-4 text-sm ${muted}`}>{order.date}</td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inp}`}
                      >
                        <option>Pending</option>
                        <option>Driver on the way to pick up</option>
                        <option>Refilling</option>
                        <option>On the way</option>
                        <option>Delivered</option>
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

  const renderHistory = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Completed Today" value="3"   subtext="₱185 collected"   subtextColor="text-green-600" icon={CheckCircle} iconColor="text-green-600"  />
        <StatCard label="This Week"       value="32"  subtext="₱2,640 collected" subtextColor="text-blue-600"  icon={History}     iconColor="text-blue-600"   />
        <StatCard label="Success Rate"    value="97%" subtext="2 delays this week"                              icon={CheckCircle} iconColor="text-purple-600" />
      </div>

      <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`p-4 border-b flex items-center justify-between ${border}`}>
          <h3 className={`text-lg ${text}`}>Delivery History</h3>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${D ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}>
            <Calendar className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className={`divide-y ${D ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {mockHistory.map((entry) => (
            <div key={entry.id} className={`flex items-center justify-between p-4 ${rowHov}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${D ? 'bg-green-900/40' : 'bg-green-100'}`}>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className={`text-sm ${text}`}>{entry.id} — {entry.customer}</div>
                  <div className={`text-xs ${muted}`}>{entry.type} · {entry.time} · {entry.date}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${text}`}>{entry.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderJugs = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {jugStatusData.map((status) => (
          <div key={status.name} className={`p-6 rounded-xl border shadow-sm ${card}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${muted}`}>{status.name} Jugs</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
            </div>
            <div className={`text-3xl ${text}`}>{status.value}</div>
          </div>
        ))}
      </div>

      <div className={`p-4 rounded-xl border shadow-sm ${card}`}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${muted}`} />
            <input
              type="text"
              placeholder="Search by Jug ID..."
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inp}`}
            />
          </div>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${D ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}>
            <Filter className="w-4 h-4" />
            Filter by Status
          </button>
        </div>
      </div>

      {/* Jug Types Section */}
      <div className={`p-6 rounded-xl border shadow-sm ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg ${text}`}>Jug Types</h3>
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
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Capacity</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Purchase Price</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Refill Price</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Status</th>
                <th className={`text-left py-3 px-4 text-sm ${theadTxt}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jugTypes.map((jugType) => (
                <tr key={jugType.id} className={`border-b ${rowBorder} ${rowHov}`}>
                  <td className={`py-3 px-4 text-sm ${text}`}>{jugType.typeName}</td>
                  <td className={`py-3 px-4 text-sm ${text}`}>{jugType.capacity}</td>
                  <td className={`py-3 px-4 text-sm ${text}`}>{jugType.purchasePrice}</td>
                  <td className={`py-3 px-4 text-sm ${text}`}>{jugType.refillPrice}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${jugType.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {jugType.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <RowActionMenu
                      onEdit={() => handleEditJugType(jugType)}
                      onDelete={() => handleDeleteJugType(jugType)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {jugTypes.length === 0 && (
          <div className="text-center py-8">
            <p className={`mb-4 ${muted}`}>No jug types added yet</p>
            <button onClick={() => setIsAddJugTypeModalOpen(true)} className="text-blue-600 hover:text-blue-700 font-medium">
              Add your first jug type
            </button>
          </div>
        )}
      </div>

      <AddJugTypeModal isOpen={isAddJugTypeModalOpen} onClose={() => setIsAddJugTypeModalOpen(false)} onSave={handleAddJugType} dark={dark} />
      <EditJugTypeModal
        isOpen={isEditJugTypeModalOpen}
        onClose={() => { setIsEditJugTypeModalOpen(false); setSelectedJugType(null); setJugTypeToEdit(null); }}
        onSave={handleSaveEditJugType}
        jugType={selectedJugType}
        dark={dark}
      />
      <ConfirmDialog isOpen={isEditConfirmOpen} onClose={() => setIsEditConfirmOpen(false)} onConfirm={confirmEditJugType} title="Confirm Changes" message="Are you sure you want to save these changes to the jug type?" confirmText="Save Changes" cancelText="Cancel" isDangerous={false} dark={dark} />
      <ConfirmDialog isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={confirmDeleteJugType} title="Delete Jug Type" message={`Are you sure you want to delete "${jugTypeToDelete?.typeName}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" isDangerous={true} dark={dark} />
    </div>
  );

  const renderAuditLogs = () => {
    const actionColors = {
      'Order Status Changed': 'bg-blue-100 text-blue-700',
      'Jug Type Created':     'bg-green-100 text-green-700',
      'Jug Type Updated':     'bg-yellow-100 text-yellow-700',
      'Jug Type Deleted':     'bg-red-100 text-red-700',
      'Customer Created':     'bg-green-100 text-green-700',
      'Customer Updated':     'bg-yellow-100 text-yellow-700',
      'Customer Deleted':     'bg-red-100 text-red-700',
      'Login':                'bg-slate-100 text-slate-600',
      'Logout':               'bg-slate-100 text-slate-600',
    };

    const resourceTypeColors = {
      'Order':   'bg-indigo-50 text-indigo-700',
      'JugType': 'bg-cyan-50 text-cyan-700',
      'User':    'bg-purple-50 text-purple-700',
      'Auth':    'bg-slate-50 text-slate-600',
    };

    const filtered = mockAuditLogs
      .filter(log =>
        !auditSearchTerm ||
        log.resourceId.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        log.admin.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearchTerm.toLowerCase())
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-xl border shadow-sm ${card}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${muted}`} />
              <input
                type="text"
                placeholder="Search by action, resource ID, or admin user..."
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
            <h3 className={`text-lg ${text}`}>Admin Audit Logs</h3>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${D ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}>
              <Calendar className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theadBg} ${border}`}>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Date & Time</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Admin User</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Action</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Resource Type</th>
                  <th className={`text-left py-3 px-4 text-sm whitespace-nowrap ${theadTxt}`}>Resource ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((log) => (
                  <tr key={log.id} className={`border-b ${rowBorder} ${rowHov}`}>
                    <td className={`py-3 px-4 text-sm whitespace-nowrap ${muted}`}>{log.timestamp}</td>
                    <td className={`py-3 px-4 text-sm ${text}`}>{log.admin}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${actionColors[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${resourceTypeColors[log.resourceType] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.resourceType}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm font-mono font-semibold ${text}`}>{log.resourceId}</td>
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
    { id: 'dashboard',  label: 'Dashboard',        icon: Droplets   },
    { id: 'deliveries', label: 'Active Deliveries', icon: Navigation },
    { id: 'orders',     label: 'Orders',            icon: Package    },
    { id: 'history',    label: 'History',           icon: History    },
    { id: 'jugs',       label: 'Jug Inventory',     icon: Droplets   },
    { id: 'audit',      label: 'Audit Logs',        icon: FileText   },
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
              <h1 className={`text-xl ${text}`}>Aquaduct</h1>
              <p className={`text-sm ${muted}`}>Business Dashboard</p>
            </div>
          </div>

          {/* Right controls — all in one flex row */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Dark mode toggle */}
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
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : `border-transparent ${muted} hover:${text}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard'  && renderDashboard()}
        {activeTab === 'deliveries' && renderDeliveries()}
        {activeTab === 'orders'     && renderOrders()}
        {activeTab === 'history'    && renderHistory()}
        {activeTab === 'jugs'       && renderJugs()}
        {activeTab === 'audit'      && renderAuditLogs()}
      </div>
    </div>
  );
}