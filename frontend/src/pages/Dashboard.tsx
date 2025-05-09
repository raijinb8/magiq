// pages/dashboard.tsx
import { NextShiftCard } from '@/components/dashboard/NextShiftCard'
import { SubmissionStatusCard } from '@/components/dashboard/SubmissionStatusCard'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function Dashboard() {
  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">ダッシュボード</h1>
      <NextShiftCard />
      <SubmissionStatusCard />
      <QuickActions />
    </div>
  )
}
