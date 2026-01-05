"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Camera,
    Eye,
    EyeOff,
    LayoutDashboard,
    Trophy,
    MessageSquare,
    Calendar,
    BookOpen,
    Users,
    Layers,
    FileText,
    Award,
    Save,
    X
} from "lucide-react";
import { User } from "./user-management-table";
import { useToast } from "@/hooks/use-toast"; // Correct hook from shadcn/ui

interface UserEditModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PERMISSION_CATEGORIES = [
    {
        title: "Panel Principal",
        icon: LayoutDashboard,
        permissions: [
            { id: "view_dashboard", label: "Panel Principal" },
        ]
    },
    {
        title: "Competición",
        icon: Trophy,
        permissions: [
            { id: "view_leaderboard", label: "Competición" },
        ]
    },
    {
        title: "Comunicaciones",
        icon: MessageSquare,
        permissions: [
            { id: "view_announcements", label: "Anuncios" },
            { id: "view_calendar", label: "Calendario" },
        ]
    },
    {
        title: "Formación",
        icon: BookOpen,
        permissions: [
            { id: "view_catalog", label: "Catálogo de Cursos" },
            { id: "view_my_courses", label: "Mis Cursos" },
        ]
    },
    {
        title: "Gestión",
        icon: Users,
        permissions: [
            { id: "view_users", label: "Usuarios" },
            { id: "manage_processes", label: "Procesos" },
            { id: "manage_certificates", label: "Certificados" },
            { id: "manage_forms", label: "Formularios" },
        ]
    }
];

export function UserEditModal({ user, isOpen, onClose, onSuccess }: UserEditModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
        processId: "unassigned",
        avatar: "",
        isActive: true,
    });
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [processes, setProcesses] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                password: "",
                role: user.role || "STUDENT",
                processId: user.process?.id || "unassigned",
                avatar: (user as any).avatar || "",
                isActive: (user as any).isActive !== undefined ? (user as any).isActive : true,
            });
            setPermissions((user as any).customPermissions || {});
        }
    }, [user]);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const response = await fetch('/api/processes?format=flat');
                if (response.ok) {
                    const data = await response.json();
                    setProcesses(data);
                }
            } catch (error) {
                console.error("Failed to fetch processes:", error);
            }
        };
        if (isOpen) {
            fetchProcesses();
        }
    }, [isOpen]);

    const handlePermissionChange = (permId: string, checked: boolean) => {
        setPermissions(prev => ({ ...prev, [permId]: checked }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Get signed URL
            const prevResponse = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type
                })
            });

            if (!prevResponse.ok) throw new Error("Failed to get upload URL");
            const { uploadUrl, url } = await prevResponse.json();

            // 2. Upload to Supabase
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadResponse.ok) throw new Error("Failed to upload image");

            toast({ title: "Imagen actualizada", description: "La foto de perfil se ha subido correctamente." });
        } catch (error) {
            console.error("Image upload failed:", error);
            toast({ title: "Error", description: "No se pudo subir la imagen.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...formData,
                    customPermissions: permissions
                })
            });

            if (response.ok) {
                toast({ title: "Usuario actualizado", description: "Los datos se han guardado correctamente." });
                onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                toast({ title: "Error", description: errorData.message || "Error al actualizar usuario", variant: "destructive" });
            }
        } catch (error) {
            console.error("Update failed:", error);
            toast({ title: "Error", description: "Error de conexión con el servidor", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 h-[80vh] flex flex-col overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-50 border-b">
                    <DialogTitle className="text-xl font-bold text-slate-800">Editar Colaborador</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: BASIC INFO */}
                        <div className="md:col-span-5 space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                                        <AvatarImage src={formData.avatar} />
                                        <AvatarFallback className="text-3xl bg-indigo-50 text-indigo-600 font-bold">
                                            {formData.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label className="absolute bottom-0 right-0 h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-indigo-700 transition-colors group-hover:scale-110 duration-200 border-2 border-white">
                                        {isUploading ? (
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                        ) : (
                                            <Camera className="h-5 w-5" />
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">Click para cambiar imagen</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Nombre Completo</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Correo Electrónico</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Nueva Contraseña (Opcional)</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="bg-slate-50 border-slate-200 focus:bg-white transition-all pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Rol</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={val => setFormData(prev => ({ ...prev, role: val }))}
                                        >
                                            <SelectTrigger className="bg-slate-50 border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMINISTRATOR">Administrador</SelectItem>
                                                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                                <SelectItem value="STUDENT">Estudiante</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Proceso Asignado</Label>
                                        <Select
                                            value={formData.processId}
                                            onValueChange={val => setFormData(prev => ({ ...prev, processId: val }))}
                                        >
                                            <SelectTrigger className="bg-slate-50 border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Sin Asignar</SelectItem>
                                                {processes.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PERMISSIONS */}
                        <div className="md:col-span-7">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <Award className="h-5 w-5 text-indigo-600" />
                                        Permisos Granulares
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Sobrescribe los permisos del rol y concede acceso a páginas específicas.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {PERMISSION_CATEGORIES.map((category) => {
                                        const Icon = category.icon;
                                        return (
                                            <div key={category.title} className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                    <Icon className="h-3 w-3" />
                                                    {category.title}
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {category.permissions.map((perm) => (
                                                        <div
                                                            key={perm.id}
                                                            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${permissions[perm.id]
                                                                ? "bg-white border-indigo-200 ring-1 ring-indigo-100"
                                                                : "bg-slate-100/50 border-transparent text-slate-500"
                                                                }`}
                                                            onClick={() => handlePermissionChange(perm.id, !permissions[perm.id])}
                                                        >
                                                            <Checkbox
                                                                id={perm.id}
                                                                checked={!!permissions[perm.id]}
                                                                onCheckedChange={(checked) => handlePermissionChange(perm.id, !!checked)}
                                                                className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                            />
                                                            <label
                                                                htmlFor={perm.id}
                                                                className="text-sm font-medium leading-none cursor-pointer"
                                                            >
                                                                {perm.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-between">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 px-8 py-6 rounded-xl gap-2 font-bold"
                    >
                        {isLoading ? <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Save className="h-5 w-5" />}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
