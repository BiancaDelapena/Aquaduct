// components/DeliveryCard.jsx
import { MapPin, Phone, Package, Navigation, CheckCircle } from 'lucide-react';

const deliveryStatuses = [
  'Order placed',
  'Driver on the way to pick up',
  'Refilling',
  'On the way',
  'Delivered',
];

export function DeliveryCard({ order, onStatusUpdate, onComplete }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg text-slate-800">{order.id}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              order.priority === 'High'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {order.priority} Priority
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              {order.type}
            </span>
          </div>
          <div className="text-sm text-slate-600">ETA: {order.eta}</div>
        </div>
        <div className="text-2xl text-blue-600">{order.price}</div>
      </div>

      {/* Details */}
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
          {deliveryStatuses.map((s) => {
            const slug = s.toLowerCase().replace(/ /g, '-');
            return (
              <button
                key={s}
                onClick={() => onStatusUpdate(order.id, slug)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  order.status === slug
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
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
          onClick={() => onComplete(order.id)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}