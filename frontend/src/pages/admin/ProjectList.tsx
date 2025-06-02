import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Project {
  id: string;
  raw_text: string;
  created_at: string;
}

export default function ProjectList() {
  // 📦 仮データ（あとでSupabaseと連携するときに差し替え）
  const [projects] = useState<Project[]>([
    {
      id: '1',
      raw_text: `13:00～
発注者：渡辺ベニヤ 千葉 宮下
現場名：江口 環 邸
ハウスメーカー：住友林業
現場住所：千葉県流山市江戸川台西2-14
（省略）`,
      created_at: '2025-04-20T10:30:00Z',
    },
    {
      id: '2',
      raw_text: `9:00～
発注者：青木建材 埼玉 佐藤
現場名：中村 誠 邸
ハウスメーカー：積水ハウス
現場住所：埼玉県川口市本町3-22
（省略）`,
      created_at: '2025-04-18T09:00:00Z',
    },
  ]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-bold">
        📋 登録済みの現場一覧（テストデータ）
      </h2>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">まだ現場は登録されていません。</p>
      ) : (
        projects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="text-xs text-muted-foreground">
              登録日：{new Date(project.created_at).toLocaleString()}
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">
                {project.raw_text}
              </pre>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
