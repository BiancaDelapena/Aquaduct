// components/DeliveryCard.jsx
import { MapPin, Phone, Package, Navigation, CheckCircle } from 'lucide-react';

// Must match backend Order.Status choices exactly
const DELIVERY_STATUSES = [
  { label: 'Order Placed',      value: 'Created' },
  { label: 'To Be Picked Up',   value: 'To Be Picked Up' },
  { label: 'Refilling',         value: 'Refilling' },
  { label: 'On The Way',        value: 'On The Way' },
  { label: 'Delivered',         value: 'Delivered' },
];

export function DeliveryCard({ order, onStatusUpdate, onComplete, dark }) {
  const D = dark;

  const cardBg   = D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const text      = D ? 'text-slate-100' : 'text-slate-800';
  const muted     = D ? 'text-slate-400' : 'text-slate-500';
  const stepperBg = D ? 'bg-slate-800' : 'bg-slate-50';

  const itemSummary = order.items?.map(i =>
    i.item_type === 'Refill'
      ? `Refill (${i.jug?.unique_id ?? '—'})`
      : `New Jug — ${i.jug_type?.type_name ?? '—'}`
  ).join(', ') || '—';

  return (
    <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg font-bold font-mono ${text}`}>
              #{order.id}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              {order.items?.[0]?.item_type ?? 'Order'}
            </span>
          </div>
          <div className={`text-sm ${muted}`}>
            ETA:{' '}
            {order.estimated_arrival
              ? new Date(order.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600">
          ₱{order.price_snapshot}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className={`w-5 h-5 mt-0.5 ${muted}`} />
          <div>
            <div className={`text-sm font-semibold ${text}`}>
              {order.customer_name || order.customer_email}
            </div>
            <div className={`text-sm ${muted}`}>{order.delivery_address_snapshot}</div>
          </div>
        </div>
        {order.customer_phone && (
          <div className="flex items-center gap-3">
            <Phone className={`w-5 h-5 ${muted}`} />
            <div className={`text-sm ${muted}`}>{order.customer_phone}</div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Package className={`w-5 h-5 ${muted}`} />
          <div className={`text-sm ${muted}`}>{itemSummary}</div>
        </div>
      </div>

      {/* Status Stepper */}
      <div className={`mb-4 p-3 rounded-lg ${stepperBg}`}>
        <div className={`text-xs mb-2 ${muted}`}>Update Delivery Status</div>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStatusUpdate(order.id, s.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                order.status === s.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : D
                    ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400 hover:text-blue-400'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
          <Navigation className="w-4 h-4" />
          Navigate
        </button>
        {order.customer_phone && (
          <a
            href={`tel:${order.customer_phone}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        )}
        <button
          onClick={() => onComplete(order.id)}
          title="Mark as Delivered"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}