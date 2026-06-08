// AdminPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Users, Package, AlertCircle, DollarSign, FileText, Clock, Search,
  Filter, ChevronRight, Calendar, CheckCircle, History, Navigation, LogOut
} from 'lucide-react';

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
  {
    id: 'ORD004', customer: 'Roberto Lim', address: '789 Rizal Blvd, Pasig',
    phone: '+63 918 222 3333', jug: 'JUG008', type: 'Refill',
    price: '₱30', eta: '3:00 PM', priority: 'Normal', status: 'on-the-way',
  },
];

const mockAllOrders = [
  { id: 'ORD001', customer: 'Maria Garcia', status: 'Delivered',  price: '₱125', date: '2026-05-14 10:45' },
  { id: 'ORD002', customer: 'John Doe',     status: 'Pending',    price: '₱30',  date: '2026-05-14 09:00' },
  { id: 'ORD003', customer: 'Jane Smith',   status: 'On the way', price: '₱125', date: '2026-05-14 11:20' },
  { id: 'ORD004', customer: 'Roberto Lim',  status: 'Refilling',  price: '₱30',  date: '2026-05-14 12:00' },
];

const mockHistory = [
  { id: 'ORD001', customer: 'Maria Garcia', type: 'New Jug', price: '₱125', time: '10:45 AM', date: '2026-05-14' },
  { id: 'ORD998', customer: 'Carlos Tan',   type: 'Refill',  price: '₱30',  time: '09:30 AM', date: '2026-05-14' },
  { id: 'ORD997', customer: 'Ana Reyes',    type: 'Refill',  price: '₱30',  time: '08:15 AM', date: '2026-05-14' },
  { id: 'ORD990', customer: 'Ben Cruz',     type: 'New Jug', price: '₱125', time: '04:50 PM', date: '2026-05-13' },
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

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  // ── Status helpers ───────────────────────────────────────────────────────────
  const updateDeliveryStatus = (orderId, newStatus) =>
    setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

  const updateOrderStatus = (orderId, newStatus) =>
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

  // ── Jug type handlers ───────────────────────────────────────────────────────────
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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-slate-800">Active Deliveries Today</h3>
          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {activeOrders.filter(o => o.status !== 'completed').length} pending
          </span>
        </div>
        <div className="space-y-3">
          {activeOrders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="text-sm text-slate-800">{order.id} — {order.customer}</div>
                <div className="text-xs text-slate-600">{order.address}</div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders"     value="1,548" subtext="+12% from last month" subtextColor="text-green-600" icon={Package}  iconColor="text-blue-600"   />
        <StatCard label="Total Sales"      value="₱244K" subtext="+8% from last month"  subtextColor="text-green-600" icon={DollarSign} iconColor="text-green-600" />
        <StatCard label="Active Customers" value="342"   subtext="18 new this week"      subtextColor="text-blue-600"  icon={Users}    iconColor="text-purple-600" />
        <StatCard label="Active Jugs"      value="856"   subtext="35 lost/broken"                                      icon={Droplets} iconColor="text-cyan-600"   />
      </div>

      {/* Recent Alerts */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg text-slate-800 mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-slate-800">High number of lost jugs in Quezon City area</div>
              <div className="text-xs text-slate-600 mt-1">15 jugs reported lost in the past 7 days</div>
            </div>
            <div className="text-xs text-slate-500">2h ago</div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-slate-800">3 delayed deliveries today</div>
              <div className="text-xs text-slate-600 mt-1">Average delay: 35 minutes</div>
            </div>
            <div className="text-xs text-slate-500">4h ago</div>
          </div>
        </div>
      </div>

      {/* Logout — bottom of dashboard tab */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );

  const renderDeliveries = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-slate-800">Active Deliveries</h2>
        <span className="text-sm text-slate-600">
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
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg text-slate-800 mb-2">All Caught Up!</h3>
          <p className="text-slate-600">No active deliveries at the moment</p>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm text-slate-600">Order ID</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Price</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Date</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Update Status</th>
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
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-800">{order.id}</td>
                    <td className="py-3 px-4 text-sm text-slate-800">{order.customer}</td>
                    <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="py-3 px-4 text-sm text-slate-800">{order.price}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{order.date}</td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg text-slate-800">Delivery History</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors">
            <Calendar className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {mockHistory.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-800">{entry.id} — {entry.customer}</div>
                  <div className="text-xs text-slate-600">{entry.type} · {entry.time} · {entry.date}</div>
                </div>
              </div>
              <div className="text-slate-800">{entry.price}</div>
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
          <div key={status.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">{status.name} Jugs</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
            </div>
            <div className="text-3xl text-slate-800">{status.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Jug ID..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            Filter by Status
          </button>
        </div>
      </div>

      {/* Jug Types Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-slate-800">Jug Types</h3>
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
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm text-slate-600">Type Name</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Capacity</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Purchase Price</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Refill Price</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jugTypes.map((jugType) => (
                <tr key={jugType.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-800">{jugType.typeName}</td>
                  <td className="py-3 px-4 text-sm text-slate-800">{jugType.capacity}</td>
                  <td className="py-3 px-4 text-sm text-slate-800">{jugType.purchasePrice}</td>
                  <td className="py-3 px-4 text-sm text-slate-800">{jugType.refillPrice}</td>
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
            <p className="text-slate-600 mb-4">No jug types added yet</p>
            <button
              onClick={() => setIsAddJugTypeModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first jug type
            </button>
          </div>
        )}
      </div>

      {/* Add Jug Type Modal */}
      <AddJugTypeModal
        isOpen={isAddJugTypeModalOpen}
        onClose={() => setIsAddJugTypeModalOpen(false)}
        onSave={handleAddJugType}
      />

      {/* Edit Jug Type Modal */}
      <EditJugTypeModal
        isOpen={isEditJugTypeModalOpen}
        onClose={() => {
          setIsEditJugTypeModalOpen(false);
          setSelectedJugType(null);
          setJugTypeToEdit(null);
        }}
        onSave={handleSaveEditJugType}
        jugType={selectedJugType}
      />

      {/* Edit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isEditConfirmOpen}
        onClose={() => setIsEditConfirmOpen(false)}
        onConfirm={confirmEditJugType}
        title="Confirm Changes"
        message="Are you sure you want to save these changes to the jug type?"
        confirmText="Save Changes"
        cancelText="Cancel"
        isDangerous={false}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteJugType}
        title="Delete Jug Type"
        message={`Are you sure you want to delete "${jugTypeToDelete?.typeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
      />
    </div>
  );

  // -aduit logs

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

        {/* Search bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by action, resource ID, or admin user..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg text-slate-800">Admin Audit Logs</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors">
              <Calendar className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm text-slate-600 whitespace-nowrap">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm text-slate-600 whitespace-nowrap">Admin User</th>
                  <th className="text-left py-3 px-4 text-sm text-slate-600 whitespace-nowrap">Action</th>
                  <th className="text-left py-3 px-4 text-sm text-slate-600 whitespace-nowrap">Resource Type</th>
                  <th className="text-left py-3 px-4 text-sm text-slate-600 whitespace-nowrap">Resource ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 text-sm text-slate-800">{log.admin}</td>
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
                    <td className="py-3 px-4 text-sm font-mono font-semibold text-slate-800">
                      {log.resourceId}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
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

  // ── Tabs config ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard',  label: 'Dashboard',        icon: Droplets   },
    { id: 'deliveries', label: 'Active Deliveries', icon: Navigation },
    { id: 'orders',     label: 'Orders',            icon: Package    },
    { id: 'history',    label: 'History',           icon: History    },
    { id: 'jugs',       label: 'Jug Inventory',     icon: Droplets   },
    { id: 'audit',      label: 'Audit Logs',        icon: FileText   },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl text-slate-800">Aquaduct</h1>
                <p className="text-sm text-slate-600">Business Dashboard</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Calendar className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
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