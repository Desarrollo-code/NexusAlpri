// src/components/dashboard/calendar-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";

export const CalendarCard = () => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">CALENDAR</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className={`h-8 rounded-md ${i < 15 || (i > 20 && i < 24) ? 'bg-teal-400' : 'bg-red-400'}`} />
                    ))}
                </div>
            </div>
            <div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronDown className="h-4 w-4" />
                    <h4 className="font-semibold text-sm">JUNE</h4>
                </div>
                <ScrollArea className="h-32 mt-2">
                    <div className="space-y-3">
                        <div>
                            <p className="font-bold">12.</p>
                            <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a placerat mauris. Vestibulum non nisi.</p>
                        </div>
                         <div>
                            <p className="font-bold">18.</p>
                            <p className="text-sm text-muted-foreground">Phasellus vehicula libero in elit tempus aliquet.</p>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </CardContent>
    </Card>
);
