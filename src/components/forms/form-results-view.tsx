
"use client";

import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, CheckCircle } from "lucide-react";

// --- MOCK DATA ---
const MOCK_STATS = {
    totalResponses: 142,
    completionRate: "88%",
    avgTime: "4m 12s"
};

const SATISFACTION_DATA = [
    { name: "Muy Satisfecho", value: 45, fill: "#22c55e" },
    { name: "Satisfecho", value: 30, fill: "#84cc16" },
    { name: "Neutral", value: 15, fill: "#eab308" },
    { name: "Insatisfecho", value: 10, fill: "#f97316" },
];

const DEPARTMENT_DATA = [
    { name: "Ventas", count: 35 },
    { name: "Marketing", count: 28 },
    { name: "IT", count: 42 },
    { name: "RRHH", count: 15 },
    { name: "Finanzas", count: 22 },
];

export default function FormResultsView() {
    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resultados: Encuesta de Satisfacción</h2>
                    <p className="text-muted-foreground">Datos actualizados en tiempo real.</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                    <div className="px-3 py-1 text-sm font-medium border-r">
                        <span className="text-slate-500">Estado</span>
                        <span className="ml-2 text-green-600 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Activo</span>
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Respuestas Totales" value={MOCK_STATS.totalResponses} icon={Users} />
                <StatsCard title="Tasa de Finalización" value={MOCK_STATS.completionRate} icon={CheckCircle} />
                <StatsCard title="Tiempo Promedio" value={MOCK_STATS.avgTime} icon={Clock} />
            </div>

            <Tabs defaultValue="charts" className="w-full">
                <TabsList>
                    <TabsTrigger value="charts">Gráficos</TabsTrigger>
                    <TabsTrigger value="individual">Respuestas Individuales</TabsTrigger>
                </TabsList>

                <TabsContent value="charts" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SATISFACTION PIE CHART */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Satisfacción General</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={SATISFACTION_DATA}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {SATISFACTION_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 text-xs">
                                    {SATISFACTION_DATA.map(item => (
                                        <div key={item.name} className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span>{item.name} ({item.value}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* DEPARTMENT BAR CHART */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Respuestas por Departamento</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DEPARTMENT_DATA} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '12px' }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="individual">
                    <Card className="h-[400px] flex items-center justify-center text-slate-400">
                        <p>Tabla de respuestas individuales (Próximamente)</p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}