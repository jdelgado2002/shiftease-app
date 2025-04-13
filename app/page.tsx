"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ScheduleView } from "@/components/schedule-view"
import { ProtectedRoute } from "@/components/protected-route"

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ScheduleView />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
