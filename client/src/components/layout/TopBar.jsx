import useSocketStore from '../../store/useSocketStore';

export default function TopBar({ title }) {
  const connected = useSocketStore((s) => s.connected);
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-900/50 shrink-0">
      <h1 className="text-base font-semibold text-gray-100">{title}</h1>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
        {connected ? 'Live' : 'Connecting…'}
      </div>
    </header>
  );
}
