// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TasksCard } from './tasks-card';
import { StatsCard } from './stats-card';
import { VisitorsCard } from './visitors-card';
import { MetricCard } from './metric-card';
import { DownloadsCard } from './downloads-card';
import { CalendarCard } from './calendar-card';
import type { AdminDashboardStats, SecurityLog } from '@/types';

interface AdminDashboardProps {
  adminStats: AdminDashboardStats;
  securityLogs: SecurityLog[];
}

export function AdminDashboard({ adminStats, securityLogs }: AdminDashboardProps) {
  if (!adminStats) {
    return null;
  }
  
  const {
    totalUsers,
    totalCourses,
    totalEnrollments,
    userRegistrationTrend,
    usersByRole
  } = adminStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Columna 1 */}
      <div className="lg:col-span-1 space-y-6">
        <TasksCard />
        <MetricCard title="VISITORS TODAY" value={totalUsers} color="bg-red-400" />
        <MetricCard title="MONTHLY VISITS" value={totalEnrollments} percentage="+10%" color="bg-teal-400" />
        <DownloadsCard />
      </div>
      
      {/* Columna 2 */}
      <div className="lg:col-span-3 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StatsCard data={userRegistrationTrend} />
          </div>
          <div className="lg:col-span-1">
            <VisitorsCard data={usersByRole} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricCard title="PAGES VIEWS" value={totalCourses * 15} color="bg-yellow-400" />
            <MetricCard title="SHARES" value={totalEnrollments * 4} percentage="+05%" color="bg-teal-400" />
        </div>
        <CalendarCard />
      </div>
    </div>
  );
}
