
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Award, Lock, Flame, Trophy, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Achievement = {
    id: string;
    name: string;
    description: string;
    isUnlocked: boolean;
    icon: React.ElementType;
    progress?: number;
    xpReward: number;
};

const ACHIEVEMENTS: Achievement[] = [
    { id: "1", name: "Primer Paso", description: "Completa tu primer curso", isUnlocked: true, icon: Award, xpReward: 100 },
    { id: "2", name: "Ratón de Biblioteca", description: "Completa 5 cursos", isUnlocked: true, icon: Trophy, xpReward: 500 },
    { id: "3", name: "Racha de Fuego", description: "Inicia sesión 7 días seguidos", isUnlocked: false, icon: Flame, progress: 42, xpReward: 250 },
    { id: "4", name: "Perfeccionista", description: "Obtén 100% en un Quiz", isUnlocked: false, icon: Star, progress: 0, xpReward: 300 },
    { id: "5", name: "Social", description: "Comenta en 3 cursos", isUnlocked: true, icon: UsersIcon, xpReward: 50 },
    { id: "6", name: "Maestro Jedi", description: "Alcanza el nivel 20", isUnlocked: false, icon: Trophy, xpReward: 5000 },
];

function UsersIcon(props: any) { return <Users {...props} />; }
import { Users } from "lucide-react";

export default function AchievementsPage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Nivel Actual"
                    value="12"
                    icon={<Star className="h-6 w-6 text-yellow-500" />}
                    description="2,400 / 3,000 XP"
                    progress={80}
                />
                <StatCard
                    title="Racha Actual"
                    value="3 días"
                    icon={<Flame className="h-6 w-6 text-orange-500" />}
                    description="Login diario para mantenerla"
                />
                <StatCard
                    title="Logros"
                    value="12/45"
                    icon={<Trophy className="h-6 w-6 text-purple-500" />}
                    description="Top 15% de usuarios"
                />
            </div>


            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="unlocked">Desbloqueados</TabsTrigger>
                    <TabsTrigger value="locked">Pendientes</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4">Galería de Medallas</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {ACHIEVEMENTS.map((ach) => (
                            <AchievementBadge key={ach.id} achievement={ach} />
                        ))}
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

function StatCard({ title, value, icon, description, progress }: { title: string, value: string, icon: React.ReactNode, description: string, progress?: number }) {
    return (
        <Card>
            <CardContent className="p-6 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase">{title}</h3>
                    {icon}
                </div>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
                {progress !== undefined && (
                    <Progress value={progress} className="h-2 mt-2" />
                )}
            </CardContent>
        </Card>
    )
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`relative aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-colors cursor-help
                    ${achievement.isUnlocked
                                ? 'bg-gradient-to-br from-white to-slate-50 border-primary/20 shadow-sm'
                                : 'bg-slate-50 border-slate-200 opacity-70 grayscale'
                            }
                `}
                    >
                        <div className={`
                    p-4 rounded-full mb-3 
                    ${achievement.isUnlocked ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}
                `}>
                            {achievement.isUnlocked ? <achievement.icon className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
                        </div>

                        <h4 className="text-center font-bold text-sm leading-tight text-slate-800">{achievement.name}</h4>

                        {achievement.isUnlocked && (
                            <Badge variant="secondary" className="mt-2 text-[10px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                +{achievement.xpReward} XP
                            </Badge>
                        )}

                        {/* Lock Overlay for locked items */}
                        {!achievement.isUnlocked && achievement.progress !== undefined && (
                            <div className="absolute bottom-4 left-4 right-4">
                                <Progress value={achievement.progress} className="h-1.5" />
                            </div>
                        )}
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-xs">{achievement.description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
