import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/nasdaq', label: 'NASDAQ Portfolio', icon: '🇺🇸' },
  { to: '/set', label: 'SET Portfolio', icon: '🇹🇭' },
  { to: '/trade', label: 'Add Trade', icon: '➕' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-lg font-bold text-sky-400 tracking-tight">StockDash</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-900/40 text-sky-300'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
