// components/dashboard/QuickActions.tsx
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="secondary"
        onClick={() => navigate('/shift')}
        className="text-sm"
      >
        シフト申請
      </Button>
      <Button
        variant="secondary"
        onClick={() => navigate('/ky')}
        className="text-sm"
      >
        KY画像提出
      </Button>
      <Button
        variant="secondary"
        onClick={() => navigate('/advance')}
        className="text-sm col-span-2"
      >
        内金申請
      </Button>
    </div>
  );
}
