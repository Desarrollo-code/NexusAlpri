
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Megaphone,
    Calendar,
    Pin,
    Search,
    Filter,
    MoreVertical,
    Heart,
    MessageCircle,
    Clock,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTitle } from "@/contexts/title-context";
import { AnnouncementCreatorModal } from "./announcement-creator-modal";

// --- MOCK DATA ---
type Announcement = {
    id: string;
    title: string;
    content: string;
    author: { name: string; avatar?: string; role: string };
    date: Date;
    isPinned?: boolean;
    category: "General" | "Mantenimiento" | "Eventos" | "Académico";
    readCount: number;
    likes: number;
    imageUrl?: string;
};

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: "1",
        title: "¡Bienvenidos a la Nueva Plataforma NexusAlpri!",
        content: "Estamos emocionados de presentar la nueva versión de nuestra plataforma de aprendizaje. Hemos mejorado la interfaz, añadido nuevas funcionalidades y optimizado el rendimiento.",
        author: { name: "Admin Sistema", role: "Administrador" },
        date: new Date(),
        isPinned: true,
        category: "General",
        readCount: 1250,
        likes: 450,
        imageUrl: "/images/hero-bg.jpg" // Placeholder
    },
    {
        id: "2",
        title: "Mantenimiento Programado",
        content: "El sistema estará inactivo este sábado de 2:00 AM a 4:00 AM por actualizaciones de seguridad. Disculpen las molestias.",
        author: { name: "Soporte IT", role: "Soporte" },
        date: new Date(Date.now() - 86400000), // Yesterday
        category: "Mantenimiento",
        readCount: 890,
        likes: 12,
    },
    {
        id: "3",
        title: "Fiesta de Fin de Año - Confirmación",
        content: "Recuerden confirmar su asistencia al evento de fin de año antes del viernes. ¡No se lo pierdan!",
        author: { name: "Recursos Humanos", role: "RRHH" },
        date: new Date(Date.now() - 172800000), // 2 days ago
        category: "Eventos",
        readCount: 560,
        likes: 89,
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: "4",
        title: "Nuevos Cursos de Liderazgo",
        content: "Hemos añadido 3 nuevos módulos a la ruta de aprendizaje de Liderazgo. Ya están disponibles en el catálogo.",
        author: { name: "Equipo Académico", role: "Instructor" },
        date: new Date(Date.now() - 259200000), // 3 days ago
        category: "Académico",
        readCount: 340,
        likes: 56,
    },
    {
        id: "5",
        title: "Política de Home Office 2.0",
        content: "Se han actualizado las guías para el trabajo remoto. Por favor, revisen el documento adjunto en la sección de Recursos.",
        author: { name: "Recursos Humanos", role: "RRHH" },
        date: new Date(Date.now() - 432000000), // 5 days ago
        category: "General",
        readCount: 1100,
        likes: 23,
    }
];

export default function ModernAnnouncements() {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { setPageTitle, setHeaderActions } = useTitle();

    React.useEffect(() => {
        setPageTitle("Anuncios");
        setHeaderActions(
            <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground shadow-sm">
                <Megaphone className="mr-2 h-4 w-4" /> Nuevo Anuncio
            </Button>
        );
        return () => setHeaderActions(null);
    }, [setPageTitle, setHeaderActions]);

    const pinned = MOCK_ANNOUNCEMENTS.filter(a => a.isPinned);
    const feed = MOCK_ANNOUNCEMENTS.filter(a => !a.isPinned).filter(a => {
        if (filter !== "all" && a.category.toLowerCase() !== filter.toLowerCase()) return false;
        if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.content.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <AnnouncementCreatorModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

            {/* SEARCH & DESCRIPTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <p className="text-muted-foreground text-lg">
                    Mantente informado con las últimas noticias, actualizaciones y eventos de la plataforma.
                </p>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar anuncios..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* HERO SECTION / PINNED */}
            {pinned.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl min-h-[300px] flex items-center">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                    <div className="relative z-10 w-full p-8 md:p-12 md:max-w-2xl">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none mb-4">
                            <Pin className="h-3 w-3 mr-1" /> Destacado
                        </Badge>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{pinned[0].title}</h2>
                        <p className="text-blue-100 text-lg mb-6 line-clamp-2">{pinned[0].content}</p>
                        <Button variant="secondary" className="gap-2">
                            Leer más <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* FEED CONTROLS */}
            <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
                <TabsList className="bg-transparent p-0 border-b w-full justify-start h-auto rounded-none gap-4">
                    <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3">Todos</TabsTrigger>
                    <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3">General</TabsTrigger>
                    <TabsTrigger value="académico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3">Académico</TabsTrigger>
                    <TabsTrigger value="eventos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3">Eventos</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* ANNOUNCEMENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {feed.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AnnouncementCard item={item} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function AnnouncementCard({ item }: { item: Announcement }) {
    return (
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
            {item.imageUrl && (
                <div className="h-48 overflow-hidden relative">
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="backdrop-blur-md bg-white/70">{item.category}</Badge>
                    </div>
                </div>
            )}
            <CardHeader className="p-5 pb-2">
                {!item.imageUrl && (
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={getCategoryColor(item.category)}>{item.category}</Badge>
                        <span className="text-xs text-muted-foreground">{format(item.date, "d MMM", { locale: es })}</span>
                    </div>
                )}
                <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
            </CardHeader>
            <CardContent className="p-5 pt-2 flex-grow">
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {item.content}
                </p>
            </CardContent>
            <CardFooter className="p-5 pt-0 border-t bg-slate-50/50 mt-auto flex justify-between items-center text-xs text-muted-foreground h-12">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={item.author.avatar} />
                        <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{item.author.name}</span>
                </div>
                <div className="flex gap-3">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {item.likes}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Leer</span>
                </div>
            </CardFooter>
        </Card>
    );
}

function getCategoryColor(category: string) {
    switch (category.toLowerCase()) {
        case 'mantenimiento': return "bg-orange-100 text-orange-700 border-orange-200";
        case 'eventos': return "bg-pink-100 text-pink-700 border-pink-200";
        case 'académico': return "bg-blue-100 text-blue-700 border-blue-200";
        default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
}
