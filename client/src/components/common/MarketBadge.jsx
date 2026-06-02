export default function MarketBadge({ market }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
      market === 'US' ? 'bg-blue-900/60 text-blue-300' : 'bg-orange-900/60 text-orange-300'
    }`}>
      {market}
    </span>
  );
}
