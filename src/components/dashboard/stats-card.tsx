// src/components/dashboard/stats-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from "date-fns";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-lg shadow-lg">
        <p className="font-bold text-primary">{`${payload[0].value} visitas`}</p>
        <p className="text-xs text-muted-foreground">{`Fecha: ${label}`}</p>
      </div>
    );
  }
  return null;
};

export const StatsCard = ({ data }: { data: any[] }) => {
    const chartData = data.map(item => ({
        name: format(parseISO(item.date), "MMM"),
        visits: item.newUsers + item.newEnrollments + item.newCourses
    }));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">STATISTICS</CardTitle>
                <div className="flex items-center gap-2 text-sm text-red-500">
                    <div className="w-4 h-0.5 bg-red-400" />
                    VISITS
                </div>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis hide={true} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
};
