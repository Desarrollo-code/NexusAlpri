// src/components/dashboard/downloads-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const downloads = [
    { name: 'PACK 3', count: 3242, description: 'Lorem ipsum dolor sit amet.' },
    { name: 'PACK 1', count: 1156, description: 'Lorem ipsum dolor sit amet.' },
    { name: 'WALLPAPER 22', count: 921, description: 'Lorem ipsum dolor sit amet.' }
];

export const DownloadsCard = () => (
    <Card className="bg-yellow-400 text-black">
        <CardHeader>
            <CardTitle className="text-lg">DOWNLOADS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {downloads.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="bg-white/50 p-2 rounded-md font-semibold text-sm">{item.name}</div>
                    <div className="font-bold text-xl">{item.count.toLocaleString()}</div>
                    <div className="text-xs text-black/70 w-24 truncate">{item.description}</div>
                </div>
            ))}
        </CardContent>
    </Card>
);
