// 会社検出ルール設定画面（将来の実装用プレースホルダー）
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CompanyDetectionSettings: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">会社自動検出設定</h1>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">検出ルール管理</h2>
        <p className="text-muted-foreground mb-4">
          PDF内容から会社を自動検出するためのルールを設定できます。
        </p>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">野原G住環境</h3>
            <p className="text-sm text-muted-foreground mb-2">
              検出キーワード: 野原グループ、野原G、NOHARA
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>編集</Button>
              <Button variant="outline" size="sm" disabled>テスト</Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">加藤ベニヤ池袋_ミサワホーム</h3>
            <p className="text-sm text-muted-foreground mb-2">
              検出キーワード: 加藤ベニヤ、ミサワホーム、池袋
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>編集</Button>
              <Button variant="outline" size="sm" disabled>テスト</Button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm">
            <strong>注意:</strong> この機能は開発中です。現在、検出ルールはバックエンドで固定されています。
          </p>
        </div>
      </Card>
      
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">検出履歴と精度</h2>
        <p className="text-muted-foreground">
          過去の検出結果と精度の統計を表示する予定です。
        </p>
      </Card>
    </div>
  );
};

export default CompanyDetectionSettings;