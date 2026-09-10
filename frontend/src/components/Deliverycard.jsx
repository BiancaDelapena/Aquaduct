// components/DeliveryCard.jsx
import { MapPin, Phone, Package, CheckCircle } from 'lucide-react';
import Icon, { IC } from './MyIcons';

const DELIVERY_STATUSES = [
  { label: 'Order Placed',    value: 'Ordered' },
  { label: 'To Be Picked Up', value: 'To Be Picked Up' },
  { label: 'Refilling',       value: 'Refilling' },
  { label: 'On The Way',      value: 'On The Way' },
  { label: 'Delivered',       value: 'Delivered' },
];

export function DeliveryCard({ order, onStatusUpdate, onComplete, dark }) {
  const D = dark;

  const cardBg = D ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const text = D ? 'text-slate-100' : 'text-slate-800';
  const muted = D ? 'text-slate-400' : 'text-slate-500';
  const stepperBg = D ? 'bg-slate-800' : 'bg-slate-50';

  // Build a nice label for the first item – show jug name / type
  const firstItem = order.items?.[0];
  const primaryLabel = firstItem
    ? firstItem.item_type === 'Refill'
      ? firstItem.jug_label || firstItem.jug?.unique_id || '—'
      : firstItem.generated_jug_label || firstItem.jug_type?.type_name || firstItem.jug_type_name || '—'
    : '—';

  // Full item summary for the details section
  const itemSummary = order.items?.map(i => {
    if (i.item_type === 'Refill') {
      return `Refill (${i.jug_label || i.jug?.unique_id || '—'})`;
    }
    return `New Jug — ${i.generated_jug_label || i.jug_type?.type_name || '—'}`;
  }).join(', ') || '—';

  return (
    <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
      {/* ── Header: Order ID + Jug Name ── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold font-mono ${text}`}>
            #{order.id}
          </span>
          <span className={`text-sm font-semibold ${muted}`}>
            {primaryLabel}
          </span>
        </div>
        <div className="text-2xl font-black text-blue-600">
          ₱{order.price_snapshot}
        </div>
      </div>

      {/* ── Customer / Address / Phone ── */}
      <div className="space-y-2 mb-4">
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
            <a
              href={`tel:${order.customer_phone}`}
              className={`text-sm font-medium text-blue-600 hover:underline`}
            >
              {order.customer_phone}
            </a>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Package className={`w-5 h-5 ${muted}`} />
          <div className={`text-sm ${muted}`}>{itemSummary}</div>
        </div>
      </div>

      {/* ── ETA & Placed ── */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div>
          <span className={muted}>ETA: </span>
          <span className={`font-semibold ${D ? 'text-amber-400' : 'text-amber-600'}`}>
            {order.estimated_arrival
              ? new Date(order.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </span>
        </div>
        <div>
          <span className={muted}>Placed: </span>
          <span className={muted}>
            {order.created_at
              ? new Date(order.created_at).toLocaleString()
              : '—'}
          </span>
        </div>
      </div>

      {/* ── Status Stepper ── */}
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

      {/* ── Mark as Delivered ── */}
      {onComplete && (
        <div className="flex justify-end">
          <button
            onClick={() => onComplete(order.id)}
            title="Mark as Delivered"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}