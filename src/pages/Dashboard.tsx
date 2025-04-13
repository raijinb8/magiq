import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

function AdminMenu() {
    return (
      <div className="p-4 bg-yellow-100 rounded mt-4">
        <h2 className="font-bold mb-2">管理者メニュー</h2>
        <ul className="list-disc list-inside text-sm">
          <li>全スタッフの報告一覧を見る</li>
          <li>内金申請の承認</li>
          <li>現場予定の作成</li>
        </ul>
      </div>
    )
}

function StaffMenu() {
    return (
      <div className="p-4 bg-yellow-100 rounded mt-4">
        <h2 className="font-bold mb-2">管理者メニュー</h2>
        <ul className="list-disc list-inside text-sm">
          <li>全スタッフの報告一覧を見る</li>
          <li>内金申請の承認</li>
          <li>現場予定の作成</li>
        </ul>
      </div>
    )
}

export default function Dashboard() {
	const navigate = useNavigate() // ルーティング操作

	const [user, setUser] = useState<any>(null) // useState : 値（状態）を保持する
	const [loading, setLoading] = useState(true)
	const [role, setRole] = useState<'admin' | 'staff' | null>(null)

	const handleLogout = async () => {
		await supabase.auth.signOut()
		navigate('/login')
	}

    // useEffect : 副作用（ログイン確認とか）実行
	useEffect(() => {
		const checkSession = async () => {
			const { data } = await supabase.auth.getUser()

			if (!data.user) {
				navigate('/login')
			} else {
				setUser(data.user) // ログイン中のユーザー情報を保持するために必要
				const userRole = data.user.user_metadata?.role || 'staff'
				setRole(userRole)
				setLoading(false) // ローディング表示の制御に必要
			}
		}

		checkSession()
	}, [])

	if (loading) {
		return <div className="p-6">読み込み中...</div>
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
			    <h1 className="text-2xl font-bold">ダッシュボード</h1>
				<Button onClick={handleLogout} variant="outline">
					ログアウト
				</Button>
			</div>

			<p>ようこそ、{user?.email}</p>
			<p>あなたのロールは: {role}</p>

			{role === 'admin' && <AdminMenu />}

            {role === 'staff' && <StaffMenu />}
		</div>
	)
}
