import { useState } from 'react';
import {
  Droplets, Users, Package, AlertCircle,
  DollarSign, MapPin, FileText, QrCode,
  Clock, Search, Filter, ChevronRight, Calendar,
  CheckCircle, Phone, Navigation, History
} from 'lucide-react';

const jugStatusData = [
  { name: 'Active', value: 856, color: '#10b981' },
  { name: 'Lost', value: 23, color: '#ef4444' },
  { name: 'Broken', value: 12, color: '#f59e0b' },
  { name: 'Retired', value: 45, color: '#64748b' },
];

const mockActiveOrders = [
  {
    id: 'ORD002',
    customer: 'John Doe',
    address: '123 Main St, Quezon City',
    phone: '+63 912 345 6789',
    jug: 'JUG002',
    type: 'Refill',
    price: '₱30',
    eta: '11:00 AM',
    priority: 'High',
    status: 'pending'
  },
  {
    id: 'ORD003',
    customer: 'Jane Smith',
    address: '456 Oak Ave, Makati',
    phone: '+63 917 654 3210',
    jug: 'JUG005',
    type: 'New Jug',
    price: '₱125',
    eta: '1:30 PM',
    priority: 'Normal',
    status: 'pending'
  },
  {
    id: 'ORD004',
    customer: 'Roberto Lim',
    address: '789 Rizal Blvd, Pasig',
    phone: '+63 918 222 3333',
    jug: 'JUG008',
    type: 'Refill',
    price: '₱30',
    eta: '3:00 PM',
    priority: 'Normal',
    status: 'on-the-way'
  },
];

const mockAllOrders = [
  { id: 'ORD001', customer: 'Maria Garcia', status: 'Delivered', price: '₱125', date: '2026-05-14 10:45' },
  { id: 'ORD002', customer: 'John Doe', status: 'Pending', price: '₱30', date: '2026-05-14 09:00' },
  { id: 'ORD003', customer: 'Jane Smith', status: 'On the way', price: '₱125', date: '2026-05-14 11:20' },
  { id: 'ORD004', customer: 'Roberto Lim', status: 'Refilling', price: '₱30', date: '2026-05-14 12:00' },
];

const mockHistory = [
  { id: 'ORD001', customer: 'Maria Garcia', type: 'New Jug', price: '₱125', time: '10:45 AM', date: '2026-05-14' },
  { id: 'ORD998', customer: 'Carlos Tan', type: 'Refill', price: '₱30', time: '09:30 AM', date: '2026-05-14' },
  { id: 'ORD997', customer: 'Ana Reyes', type: 'Refill', price: '₱30', time: '08:15 AM', date: '2026-05-14' },
  { id: 'ORD990', customer: 'Ben Cruz', type: 'New Jug', price: '₱125', time: '04:50 PM', date: '2026-05-13' },
  { id: 'ORD985', customer: 'Liza Santos', type: 'Refill', price: '₱30', time: '02:10 PM', date: '2026-05-13' },
];

const deliveryStatuses = [
  'Order placed',
  'Driver on the way to pick up',
  'Refilling',
  'On the way',
  'Delivered',
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrders, setActiveOrders] = useState(mockActiveOrders);
  const [allOrders, setAllOrders] = useState(mockAllOrders);

  const updateDeliveryStatus = (orderId, newStatus) => {
    setActiveOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    );
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setAllOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Total Orders</span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl text-slate-800">1,548</div>
          <div className="text-xs text-green-600 mt-1">+12% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Total Sales</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl text-slate-800">₱244K</div>
          <div className="text-xs text-green-600 mt-1">+8% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Active Customers</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl text-slate-800">342</div>
          <div className="text-xs text-blue-600 mt-1">18 new this week</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Active Jugs</span>
            <Droplets className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-3xl text-slate-800">856</div>
          <div className="text-xs text-slate-600 mt-1">35 lost/broken</div>
        </div>
      </div>

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
              <span className={`text-xs px-2 py-1 rounded-full ${
                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                order.status === 'on-the-way' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {order.status === 'on-the-way' ? 'On the way' : order.status === 'completed' ? 'Done' : 'Pending'}
              </span>
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
        <div key={order.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-slate-800">{order.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.priority} Priority
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  {order.type}
                </span>
              </div>
              <div className="text-sm text-slate-600">ETA: {order.eta}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl text-blue-600">{order.price}</div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <div className="text-sm text-slate-800">{order.customer}</div>
                <div className="text-sm text-slate-600">{order.address}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <div className="text-sm text-slate-600">{order.phone}</div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-slate-400" />
              <div className="text-sm text-slate-600">Jug ID: {order.jug}</div>
            </div>
          </div>

          {/* Status Stepper */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-2">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {deliveryStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => updateDeliveryStatus(order.id, s.toLowerCase().replace(/ /g, '-'))}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    order.status === s.toLowerCase().replace(/ /g, '-')
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Navigation className="w-4 h-4" />
              Navigate
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              <Phone className="w-4 h-4" />
              Call
            </button>
            <button
              onClick={() => updateDeliveryStatus(order.id, 'completed')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
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
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Completed Today</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl text-slate-800">3</div>
          <div className="text-xs text-green-600 mt-1">₱185 collected</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">This Week</span>
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl text-slate-800">32</div>
          <div className="text-xs text-blue-600 mt-1">₱2,640 collected</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Success Rate</span>
            <CheckCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl text-slate-800">97%</div>
          <div className="text-xs text-slate-600 mt-1">2 delays this week</div>
        </div>
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
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
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
    </div>
  );

  const renderQRTracking = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="bg-blue-50 w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <QrCode className="w-16 h-16 text-blue-600" />
        </div>
        <h3 className="text-2xl text-slate-800 mb-2">Jug QR Code Tracking</h3>
        <p className="text-slate-600 mb-6">Scan jug QR codes to record handover and returns</p>

        <div className="space-y-4 text-left">
          <div className="p-4 border border-slate-200 rounded-lg">
            <label className="block text-sm text-slate-600 mb-2">Jug ID</label>
            <input
              type="text"
              placeholder="JUG001 or scan QR code"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-4 border border-slate-200 rounded-lg">
            <label className="block text-sm text-slate-600 mb-2">Customer ID</label>
            <input
              type="text"
              placeholder="Enter customer ID"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-4 border border-slate-200 rounded-lg">
            <label className="block text-sm text-slate-600 mb-2">Action</label>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Record Handover
              </button>
              <button className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                Record Return
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg text-left">
          <h4 className="text-sm text-slate-800 mb-2">Recent Scans</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">JUG001 - Handover to John Doe</span>
              <span className="text-xs text-slate-500">2 min ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">JUG002 - Return from Jane Smith</span>
              <span className="text-xs text-slate-500">15 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg text-slate-800 mb-4">Compliance Documents</h3>
        <div className="space-y-3">
          {[
            'Business Permit 2026',
            'Health Certificate',
            'Water Quality Report Q1 2026',
            'Water Quality Report Q2 2026',
            'Sanitary Permit',
            'BIR Certificate of Registration',
          ].map((doc) => (
            <div key={doc} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-slate-800">{doc}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">All documents are up to date. Next renewal due: December 2026.</div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Droplets },
    { id: 'deliveries', label: 'Active Deliveries', icon: Navigation },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'history', label: 'History', icon: History },
    { id: 'jugs', label: 'Jug Inventory', icon: Droplets },
    { id: 'qr', label: 'QR Tracking', icon: QrCode },
    { id: 'documents', label: 'Documents', icon: FileText },
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
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Calendar className="w-4 h-4" />
                Generate Report
              </button>
            </div>
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
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'deliveries' && renderDeliveries()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'jugs' && renderJugs()}
        {activeTab === 'qr' && renderQRTracking()}
        {activeTab === 'documents' && renderDocuments()}
      </div>
    </div>
  );
}