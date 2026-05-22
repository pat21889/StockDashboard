export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    green: 'bg-emerald-900/50 text-emerald-400',
    red: 'bg-red-900/50 text-red-400',
    blue: 'bg-sky-900/50 text-sky-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}
