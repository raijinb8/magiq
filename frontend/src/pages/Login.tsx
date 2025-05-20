// src/pages/Login.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setCompany = useCompanyStore((s) => s.setCompany);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      // ✅ ログイン成功 → ユーザー情報取得
      const { data: userData } = await supabase.auth.getUser();
      const companyId = userData.user?.user_metadata?.companyId || 'active'; // 開発時のテスト

      if (!companyId) {
        setError('会社IDが設定されていません');
        setLoading(false);
        return;
      }

      // ✅ 対応する会社設定ファイルを読み込み（importではなくfetchで）
      try {
        const res = await fetch(`/public/config/${companyId}.json`);
        if (!res.ok) {
          // レスポンスが正常か確認
          throw new Error(
            `Failed to fetch company config: ${res.status} ${res.statusText}`
          );
        }
        const config = await res.json();
        setCompany(config);
        navigate('/dashboard'); // ✅ ここで遷移！
        return;
      } catch (e) {
        setError('会社設定の読み込みに失敗しました');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">ログイン</h2>
        <Input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? 'ログイン中…' : 'ログイン'}
        </Button>
      </div>
    </div>
  );
}
