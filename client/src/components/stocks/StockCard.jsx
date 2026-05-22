import useSocketStore from '../../store/useSocketStore';
import PriceChangeTag from './PriceChangeTag';

export default function StockCard({ symbol, prevClose }) {
  const tick = useSocketStore((s) => s.prices[symbol]);
  const price = tick?.price;
  const changePct = prevClose && price != null ? ((price - prevClose) / prevClose) * 100 : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1 min-w-[130px]">
      <span className="text-xs font-semibold text-gray-300 uppercase">{symbol}</span>
      <span className="text-xl font-bold text-gray-100">
        {price != null ? `$${price.toFixed(2)}` : '—'}
      </span>
      <PriceChangeTag value={changePct} />
    </div>
  );
}
