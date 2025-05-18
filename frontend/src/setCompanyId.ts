import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';
const supabaseAnonKey = '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setCompanyId(email: string, companyId: string) {
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('ユーザー一覧の取得に失敗しました:', error.message);
    return;
  }

  const user = users.find((u) => u.email === email);

  if (!user) {
    console.log('指定されたメールアドレスのユーザーが見つかりませんでした。');
    return;
  }

  // ユーザーIDを使用して user_metadata を更新
  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        companyId: companyId,
        role: 'admin',
      },
    }
  );

  if (updateError) {
    console.error('ユーザー情報の更新に失敗しました:', updateError.message);
  } else {
    console.log('ユーザー情報の更新に成功しました:', data);
  }
}

setCompanyId('ranjinb8@gmail.com', 'active');
