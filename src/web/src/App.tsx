import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import ActivityLogPage from '@/pages/ActivityLogPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PurchaseOrdersPage from '@/pages/PurchaseOrdersPage'
import SettingsPage from '@/pages/SettingsPage'
import StockDataPage from '@/pages/StockDataPage'
import WeeklyCheckPage from '@/pages/WeeklyCheckPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/weekly-check" replace />} />
        <Route path="weekly-check" element={<WeeklyCheckPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="activity-log" element={<ActivityLogPage />} />
        <Route path="stock-data" element={<StockDataPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
