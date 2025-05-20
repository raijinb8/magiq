import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Project {
  id: string;
  raw_text: string;
  assigned_staff: string[];
}

export default function ProjectAssign() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      raw_text: `現場A（住友林業）千葉県流山市 13:00集合`,
      assigned_staff: ['金谷', '真部'],
    },
    {
      id: '2',
      raw_text: `現場B（積水ハウス）埼玉県川口市 9:00集合`,
      assigned_staff: [],
    },
  ]);

  const handleAssign = (projectId: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, assigned_staff: [...p.assigned_staff, name] }
          : p
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold">👷‍♂️ 現場スタッフ アサイン</h2>

      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader className="text-sm font-semibold text-gray-800">
            {project.raw_text}
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label>アサイン済み：</Label>
              <ul className="ml-4 list-disc text-sm text-muted-foreground">
                {project.assigned_staff.length > 0 ? (
                  project.assigned_staff.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))
                ) : (
                  <li className="italic">未アサイン</li>
                )}
              </ul>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Input
                placeholder="スタッフ名を入力"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAssign(project.id, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>(
                    `#input-${project.id}`
                  );
                  if (input?.value) {
                    handleAssign(project.id, input.value);
                    input.value = '';
                  }
                }}
              >
                追加
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
