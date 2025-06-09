// src/pages/admin/CompanyDetectionRules.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { ALL_COMPANY_OPTIONS } from '@/constants/company';

interface DetectionRule {
  id: string;
  company_id: string;
  rule_type: 'keyword' | 'pattern' | 'address' | 'logo_text';
  rule_value: string;
  priority: number;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const CompanyDetectionRules: React.FC = () => {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<DetectionRule>>({
    company_id: '',
    rule_type: 'keyword',
    rule_value: '',
    priority: 50,
    is_active: true,
    description: '',
  });

  // ルールの読み込み
  const loadRules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_detection_rules')
        .select('*')
        .order('company_id')
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('ルールの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // ルールの追加
  const handleAddRule = async () => {
    if (!editingRule.company_id || !editingRule.rule_value) {
      toast.error('会社とルール値を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('company_detection_rules')
        .insert([editingRule]);

      if (error) throw error;

      toast.success('ルールを追加しました');
      setEditingRule({
        company_id: '',
        rule_type: 'keyword',
        rule_value: '',
        priority: 50,
        is_active: true,
        description: '',
      });
      await loadRules();
    } catch (error) {
      console.error('Error adding rule:', error);
      toast.error('ルールの追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ルールの削除
  const handleDeleteRule = async (id: string) => {
    if (!confirm('このルールを削除しますか？')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('company_detection_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('ルールを削除しました');
      await loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('ルールの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ルールの有効/無効切り替え
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('company_detection_rules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      await loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('ルールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const colors = {
      keyword: 'default' as const,
      pattern: 'secondary' as const,
      address: 'outline' as const,
      logo_text: 'default' as const,
    };
    return <Badge variant={colors[type as keyof typeof colors] || 'default'}>{type}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">会社判定ルール設定</h1>

      {/* 新規ルール追加フォーム */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">新規ルール追加</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="company">会社</Label>
            <Select
              value={editingRule.company_id}
              onValueChange={(value) => setEditingRule({ ...editingRule, company_id: value })}
            >
              <SelectTrigger id="company">
                <SelectValue placeholder="会社を選択" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COMPANY_OPTIONS.filter(opt => opt.value !== 'UNKNOWN_OR_NOT_SET').map(company => (
                  <SelectItem key={company.value} value={company.value}>
                    {company.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">ルールタイプ</Label>
            <Select
              value={editingRule.rule_type}
              onValueChange={(value: 'keyword' | 'pattern' | 'address' | 'logo_text') => 
                setEditingRule({ ...editingRule, rule_type: value })
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">キーワード</SelectItem>
                <SelectItem value="pattern">パターン（正規表現）</SelectItem>
                <SelectItem value="address">住所</SelectItem>
                <SelectItem value="logo_text">ロゴテキスト</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value">ルール値</Label>
            <Input
              id="value"
              value={editingRule.rule_value || ''}
              onChange={(e) => setEditingRule({ ...editingRule, rule_value: e.target.value })}
              placeholder={editingRule.rule_type === 'pattern' ? '正規表現' : 'キーワード'}
            />
          </div>

          <div>
            <Label htmlFor="priority">優先度（0-100）</Label>
            <Input
              id="priority"
              type="number"
              min="0"
              max="100"
              value={editingRule.priority || 50}
              onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 50 })}
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Input
              id="description"
              value={editingRule.description || ''}
              onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
              placeholder="このルールの説明"
            />
          </div>
        </div>

        <Button
          className="mt-4"
          onClick={handleAddRule}
          disabled={isLoading || !editingRule.company_id || !editingRule.rule_value}
        >
          <Plus className="w-4 h-4 mr-2" />
          ルールを追加
        </Button>
      </Card>

      {/* 既存ルール一覧 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">既存ルール一覧</h2>
        {isLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">ルールがありません</div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  rule.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">
                      {ALL_COMPANY_OPTIONS.find(c => c.value === rule.company_id)?.label || rule.company_id}
                    </span>
                    {getRuleTypeBadge(rule.rule_type)}
                    <Badge variant="outline">優先度: {rule.priority}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">{rule.rule_value}</code>
                    {rule.description && (
                      <span className="ml-2 text-gray-500">- {rule.description}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={rule.is_active ? "outline" : "default"}
                    onClick={() => handleToggleActive(rule.id, rule.is_active)}
                    disabled={isLoading}
                  >
                    {rule.is_active ? '無効化' : '有効化'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompanyDetectionRules;