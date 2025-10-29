// src/components/dashboard/tasks-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const tasks = [
    { title: 'Task 1', description: 'Description. Lorem ipsum dolor sit amet, consectetur.' },
    { title: 'Task 2', description: 'Description. Lorem ipsum dolor sit amet, consectetur.' }
];

export const TasksCard = () => (
    <Card className="bg-red-400 text-white h-full">
        <CardHeader>
            <CardTitle className="text-lg">TASKS</CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-48">
                <div className="space-y-4">
                    {tasks.map((task, i) => (
                        <div key={i}>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 bg-yellow-300 rounded-sm" />
                                <h4 className="font-semibold">{task.title}</h4>
                            </div>
                            <p className="text-sm text-white/80 ml-6">{task.description}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
);
