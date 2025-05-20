// 実際の画面本体（ルーティングやUIなど）
// 建物の中身や内装、設計
// ページのルーティング
// コンポーネントの表示
// 状態の取得・表示
// shadcn/ui や Tailwind で見た目を作る
// アプリを作るうえで一番手を入れるファイル

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import ShiftForm from '@/pages/ShiftForm';
import Login from '@/pages/Login';
import Layout from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ShiftComplete from '@/pages/ShiftComplete';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ProjectForm from '@/pages/admin/ProjectForm';
import ProjectList from '@/pages/admin/ProjectList';
import ProjectAssign from '@/pages/admin/ProjectAssign';
import AssignedProjectList from '@/pages/admin/AssignedProjectList';
import WorkOrderTool from '@/pages/admin/WorkOrderTool';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* その他のページは共通レイアウトに包む */}
        <Route path="/login" element={<Login />} />

        {/* 認証必須のルート */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shift" element={<ShiftForm />} />
            <Route path="/shift/complete" element={<ShiftComplete />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/project" element={<ProjectForm />} />
            <Route path="/admin/project-list" element={<ProjectList />} />
            <Route path="/admin/project-assign" element={<ProjectAssign />} />
            <Route
              path="/admin/assigned-project-list"
              element={<AssignedProjectList />}
            />
            <Route path="/admin/work-order-tool" element={<WorkOrderTool />} />
            {/* 他ページ追加可能 */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
