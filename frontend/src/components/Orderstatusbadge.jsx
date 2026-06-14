// components/OrderStatusBadge.jsx

const statusStyles = {
  Ordered:            'bg-blue-100 text-blue-700',
  'To Be Picked Up': 'bg-indigo-100 text-indigo-700',
  Refilling:          'bg-purple-100 text-purple-700',
  'On The Way':       'bg-yellow-100 text-yellow-700',
  Delivered:          'bg-green-100 text-green-700',
  Cancelled:          'bg-red-100 text-red-700',
};

export function OrderStatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${style}`}>
      {status}
    </span>
  );
}