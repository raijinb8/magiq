import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🏠 ホーム画面</h1>
      <Button 
        onClick={() => navigate('/admin/work-order-tool')}
        variant="default"
        size="lg"
      >
        📄 作業指示書ツールへ
      </Button>
    </div>
  );
}
