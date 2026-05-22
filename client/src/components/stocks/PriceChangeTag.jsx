export default function PriceChangeTag({ value, suffix = '%' }) {
  if (value == null) return <span className="text-gray-500 text-xs">—</span>;
  const pos = value >= 0;
  return (
    <span className={`text-xs font-medium ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      {pos ? '+' : ''}{typeof value === 'number' ? value.toFixed(2) : value}{suffix}
    </span>
  );
}
