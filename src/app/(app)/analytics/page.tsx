// src/app/(app)/analytics/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  UsersRound, 
  BookOpenCheck, 
  Activity, 
  UserPlus,
  Loader2, 
  AlertTriangle, 
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, Pie, PieChart, ResponsiveContainer, Cell, Label, XAxis, YAxis, Sector, CartesianGrid, AreaChart as RechartsArea } from "recharts";
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import type { AdminDashboardStats } from '@/app/api/dashboard/admin-stats/route';


// --- DASHBOARD COMPONENTS ---

const MetricCard = ({ title, value: finalValue, icon: Icon, description }: { title: string; value: number; icon: React.ElementType; description?: string }) => {
    const animatedValue = useAnimatedCounter(finalValue);
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{animatedValue}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
};

const userRolesChartConfig = {
  count: { label: "Usuarios" },
  STUDENT: { label: "Estudiantes", color: "hsl(var(--chart-1))" },
  INSTRUCTOR: { label: "Instructores", color: "hsl(var(--chart-2))" },
  ADMINISTRATOR: { label: "Admins", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 11;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={4} textAnchor="middle" fill={fill} className="text-base font-bold">
        {payload.label}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
       <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
       <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
       <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 6} dy="-0.5em">{value}</tspan>
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 6} dy="1em">{`(${(percent * 100).toFixed(0)}%)`}</tspan>
      </text>
    </g>
  );
};


function DonutChartCard({ title, data, config }: { title: string, data: any[], config: ChartConfig }) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, [setActiveIndex]);
  
  return (
    <Card className="card-border-animated">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie 
                data={data} 
                dataKey="count" 
                nameKey="label" 
                innerRadius={60} 
                strokeWidth={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                className="cursor-pointer"
              >
                 {data.map((entry) => (
                    <Cell key={`cell-${entry.label}`} fill={entry.fill} />
                  ))}
                 {activeIndex === undefined && (
                    <Label
                        content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                        <tspan x={viewBox.cx} y={viewBox.cy} className="text-2xl font-bold fill-foreground">
                                            {total.toLocaleString()}
                                        </tspan>
                                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="text-xs fill-muted-foreground">
                                            Total
                                        </tspan>
                                    </text>
                                );
                            }
                        }}
                    />
                 )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function AdminAnalyticsPage() {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard/admin-stats');
            if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch stats");
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'ADMINISTRATOR') {
            fetchStats();
        } else if (user) {
            router.push('/dashboard');
        }
    }, [user, router, fetchStats]);

    const userRolesChartData = useMemo(() => {
        if (!stats?.usersByRole) return [];
        const order: ('STUDENT' | 'INSTRUCTOR' | 'ADMINISTRATOR')[] = ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'];
        return order.map(role => ({
            role: role,
            label: userRolesChartConfig[role]?.label || role,
            count: stats.usersByRole.find(item => item.role === role)?.count || 0,
            fill: userRolesChartConfig[role]?.color || 'hsl(var(--muted))'
        }));
    }, [stats?.usersByRole]);
    
    const registrationTrendChartConfig = {
      count: {
        label: "Nuevos Usuarios",
        color: "hsl(var(--chart-2))",
      },
    } satisfies ChartConfig;

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="lg:col-span-2 h-96" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Error al Cargar Analíticas</p>
                <p className="text-sm">{error}</p>
                <Button onClick={fetchStats} variant="outline" className="mt-4">Reintentar</Button>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Resumen de la Plataforma</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <MetricCard title="Total Usuarios" value={stats?.totalUsers || 0} icon={UsersRound} />
            <MetricCard title="Total Cursos" value={stats?.totalCourses || 0} icon={BookOpenCheck} />
            <MetricCard title="Usuarios Activos" value={stats?.recentLogins || 0} icon={Activity} description="En los últimos 7 días" />
            <MetricCard title="Nuevos Usuarios" value={stats?.newUsersLast7Days || 0} icon={UserPlus} description="En los últimos 7 días"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DonutChartCard title="Distribución de Roles" data={userRolesChartData} config={userRolesChartConfig} />
            <Card className="lg:col-span-2 card-border-animated">
            <CardHeader>
                <CardTitle>Tendencia de Registros (Últimos 7 Días)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                    <ChartContainer config={registrationTrendChartConfig} className="w-full h-full">
                    <RechartsArea
                        data={stats?.userRegistrationTrend || []}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)}/>
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}/>
                        <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                        <Area dataKey="count" type="monotone" fill="var(--color-count)" fillOpacity={0.4} stroke="var(--color-count)" />
                    </RechartsArea>
                    </ChartContainer>
            </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default function AnalyticsPageWrapper() {
  const { user } = useAuth();

  if (user?.role === 'ADMINISTRATOR') {
    return <AdminAnalyticsPage />;
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Acceso Denegado</CardTitle>
          <CardDescription>
            Esta página solo está disponible para administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Volver al Panel Principal</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
