import TopBar from '../components/layout/TopBar';
import TradeForm from '../components/portfolio/TradeForm';
import { useNavigate } from 'react-router-dom';

export default function TradeEntryPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Add Trade" />
      <main className="flex-1 p-6 overflow-auto max-w-3xl">
        <TradeForm onAdded={() => navigate('/nasdaq')} />
      </main>
    </div>
  );
}
