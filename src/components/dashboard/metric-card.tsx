// src/components/dashboard/metric-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: number;
    percentage?: string;
    color: string;
}

export const MetricCard = ({ title, value, percentage, color }: MetricCardProps) => (
  <Card className={cn(color, "text-white")}>
    <CardHeader>
      <CardTitle className="text-sm font-normal">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex items-baseline justify-between">
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      {percentage && <p className="text-lg font-semibold">{percentage}</p>}
    </CardContent>
  </Card>
);
