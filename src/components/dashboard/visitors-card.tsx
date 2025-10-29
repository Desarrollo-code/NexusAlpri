// src/components/dashboard/visitors-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = {
  ADMINISTRATOR: '#F87171', // Red
  INSTRUCTOR: '#60A5FA', // Blue
  STUDENT: '#34D399', // Green
  OTHERS: '#FBBF24' // Amber
};

export const VisitorsCard = ({ data }: { data: any[] }) => {
  const chartData = data.map(item => ({ name: item.role, value: item.count }));
  
  return (
    <Card className="bg-teal-400 text-white h-full">
      <CardHeader>
        <CardTitle className="text-lg">VISITORS</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="h-48 w-48">
            <ResponsiveContainer>
                <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.OTHERS} />
                    ))}
                </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {chartData.map(entry => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || COLORS.OTHERS }} />
              <span>{entry.name === 'STUDENT' ? 'ANDROID' : (entry.name === 'INSTRUCTOR' ? 'WEB' : 'IOS')}</span>
            </div>
          ))}
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-300" />
              <span>OTHERS</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
};
