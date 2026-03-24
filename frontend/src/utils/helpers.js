export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric',
    month:   'short', year: 'numeric'
  });
};

export const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(h, m);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatBookingId = (id) => {
  return '#BKG-' + String(id).padStart(8, '0');
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getStatusColor = (status) => {
  const map = {
    Confirmed:'text-emerald-400 bg-emerald-400/10',
    Pending:'text-amber-400 bg-amber-400/10',
    Cancelled:'text-gray-400 bg-gray-400/10',
    Refunded:'text-blue-400 bg-blue-400/10',
    Valid:'text-emerald-400 bg-emerald-400/10',
    'Checked-In': 'text-violet-400 bg-violet-400/10',
  };
  return map[status] || 'text-gray-400 bg-gray-400/10';
};

export const get5Days = () => {
  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label:i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date:d.toISOString().split('T')[0],
      display:  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    });
  }
  return days;
};
