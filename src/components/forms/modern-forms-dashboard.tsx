
"use client";

import React, { useState } from "react";
import {
    Search,
    Plus,
    FileText,
    MoreVertical,
    BarChart3,
    Share2,
    Trash2,
    Clock,
    CheckCircle2,
    Users,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- MOCK DATA ---
type Form = {
    id: string;
    title: string;
    description: string;
    status: "published" | "draft" | "archived";
    responses: number;
    lastUpdated: Date;
    author: string;
};

const MOCK_FORMS: Form[] = [
    { id: "1", title: "Encuesta de Satisfacción 2024", description: "Evaluación anual del clima laboral.", status: "published", responses: 142, lastUpdated: new Date(), author: "Ana García" },
    { id: "2", title: "Evaluación de Curso: React", description: "Feedback sobre el curso de React Avanzado.", status: "published", responses: 89, lastUpdated: new Date(Date.now() - 86400000), author: "Carlos Perez" },
    { id: "3", title: "Registro de Evento de Fin de Año", description: "Formulario de inscripción para la fiesta.", status: "draft", responses: 0, lastUpdated: new Date(Date.now() - 172800000), author: "Ana García" },
    { id: "4", title: "Quiz: Seguridad Industrial", description: "Evaluación rápida de conocimientos.", status: "archived", responses: 310, lastUpdated: new Date(Date.now() - 604800000), author: "Admin" },
];

export default function ModernFormsDashboard() {
    const router = useRouter();
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    const filteredForms = MOCK_FORMS.filter(f => {
        if (filter !== "all" && f.status !== filter) return false;
        if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* HEDAER & KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total Formularios" value={MOCK_FORMS.length} icon={FileText} />
                <KPICard title="Activos" value={MOCK_FORMS.filter(f => f.status === 'published').length} icon={CheckCircle2} color="text-green-500" />
                <KPICard title="Respuestas Totales" value={541} icon={Users} color="text-blue-500" />
                <KPICard title="Borradores" value={MOCK_FORMS.filter(f => f.status === 'draft').length} icon={Clock} color="text-amber-500" />
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar formularios..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                {filter === 'all' ? 'Todos los Estados' : filter === 'published' ? 'Publicados' : filter === 'draft' ? 'Borradores' : 'Archivados'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFilter('all')}>Todos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('published')}>Publicados</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('draft')}>Borradores</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('archived')}>Archivados</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button className="gap-2" onClick={() => router.push('/forms/demo')}>
                        <Plus className="h-4 w-4" /> Crear Formulario
                    </Button>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredForms.map((form) => (
                    <ModernFormCard key={form.id} form={form} />
                ))}
            </div>
        </div>
    );
}

function ModernFormCard({ form }: { form: Form }) {
    const statusColors = {
        published: "bg-green-100 text-green-700 border-green-200",
        draft: "bg-amber-100 text-amber-700 border-amber-200",
        archived: "bg-slate-100 text-slate-700 border-slate-200",
    };

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/0 hover:border-l-primary">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`capitalize ${statusColors[form.status]}`}>
                        {form.status === 'published' ? 'Publicado' : form.status === 'draft' ? 'Borrador' : 'Archivado'}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem><Share2 className="mr-2 h-4 w-4" /> Compartir</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                    <Link href="/forms/demo">{form.title}</Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 h-10">
                    {form.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>{form.responses} respuestas</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Actualizado {format(form.lastUpdated, "d MMM", { locale: es })}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2 border-t bg-slate-50/50">
                <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-white text-muted-foreground hover:text-primary">
                    Ver Resultados <BarChart3 className="h-4 w-4 ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
}

function KPICard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color?: string }) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className={`h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    )
}
