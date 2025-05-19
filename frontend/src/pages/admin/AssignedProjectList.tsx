import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AssignedProject = {
  date: string;
  siteName: string;
  leader: string;
  staff: string[];
  status: '未報告' | '報告済';
};

const dummyData: AssignedProject[] = [
  {
    date: '2025-04-22',
    siteName: '住友林業A棟',
    leader: '金谷',
    staff: ['佐藤', '高橋'],
    status: '未報告',
  },
  {
    date: '2025-04-22',
    siteName: '積水B棟',
    leader: '山田',
    staff: ['田中', '鈴木'],
    status: '報告済',
  },
  {
    date: '2025-04-23',
    siteName: '大和C棟',
    leader: '佐藤',
    staff: ['金谷'],
    status: '未報告',
  },
];

export default function AssignedProjectList() {
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-center">📋 アサイン済み現場一覧</h1>

      {dummyData.map((project, i) => (
        <Card key={i}>
          <CardHeader className="text-sm font-medium">
            {project.date}｜{project.siteName}
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>班長：{project.leader}</div>
            <div>スタッフ：{project.staff.join(', ')}</div>
            <div>
              状況：
              <Badge
                variant={
                  project.status === '報告済' ? 'default' : 'destructive'
                }
              >
                {project.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
