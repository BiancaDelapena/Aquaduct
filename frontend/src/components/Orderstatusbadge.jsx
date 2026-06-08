// components/OrderStatusBadge.jsx

const statusStyles = {
  Delivered:   'bg-green-100 text-green-700',
  Pending:     'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  'on-the-way':'bg-blue-100 text-blue-700',
};

const defaultStyle = 'bg-blue-100 text-blue-700';

export function OrderStatusBadge({ status }) {
  const style = statusStyles[status] ?? defaultStyle;

  // Human-readable label for slugified statuses
  const label =
    status === 'on-the-way' ? 'On the way' :
    status === 'completed'  ? 'Done'       :
    status;

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${style}`}>
      {label}
    </span>
  );
}