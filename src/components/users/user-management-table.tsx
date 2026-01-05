
"use client";

import React, { useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    ChevronDown,
    MoreHorizontal,
    Search,
    UserPlus,
    Shield,
    GraduationCap,
    Briefcase,
    Mail,
    CheckCircle,
    XCircle,
    LayoutGrid,
    List,
    Filter,
    ChevronRight,
    Users,
    Layers
} from "lucide-react";
import { UserEditModal } from "./user-edit-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// --- TYPES ---
export type User = {
    id: string;
    name: string;
    email: string;
    role: "ADMINISTRATOR" | "INSTRUCTOR" | "STUDENT";
    status: "active" | "inactive" | "pending";
    lastLogin: string;
    process?: { id: string, name: string };
};

// --- COLUMNS DEFINITION ---
export const columns: ColumnDef<User>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Usuario
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-medium">{row.getValue("name")}</span>
                    <span className="text-xs text-muted-foreground">{row.original.email}</span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => {
            const role = row.getValue("role") as string;
            const config = {
                "ADMINISTRATOR": { icon: Shield, label: "Admin", class: "bg-purple-100 text-purple-700 border-purple-200" },
                "INSTRUCTOR": { icon: Briefcase, label: "Instructor", class: "bg-blue-100 text-blue-700 border-blue-200" },
                "STUDENT": { icon: GraduationCap, label: "Estudiante", class: "bg-slate-100 text-slate-700 border-slate-200" }
            }[role] || { icon: GraduationCap, label: role, class: "" };

            const Icon = config.icon;

            return (
                <Badge variant="outline" className={`gap-1 ${config.class}`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <div className="flex items-center gap-2">
                    {status === "active" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {status === "inactive" && <XCircle className="h-4 w-4 text-slate-400" />}
                    {status === "pending" && <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                    <span className="capitalize text-sm">{status === "active" ? "Activo" : status === "inactive" ? "Inactivo" : "Pendiente"}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "process",
        header: "Proceso/Estructura",
        cell: ({ row }) => {
            const process = row.original.process;
            return (
                <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{process?.name || "Sin Asignar"}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "lastLogin",
        header: "Último Acceso",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("lastLogin") || "Nunca"}</span>
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row, table }) => {
            const user = row.original;
            const meta = table.options.meta as any;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                            Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => meta?.onEdit(user)}>
                            Editar Colaborador
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Perfil Completo</DropdownMenuItem>
                        <DropdownMenuItem>Asignar Curso</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                                if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.name}?`)) {
                                    handleDelete(user.id);
                                }
                            }}
                        >
                            Eliminar Usuario
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

async function handleDelete(id: string) {
    try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
            window.location.reload(); // Simple refresh for now to update table
        } else {
            alert("Error al eliminar el usuario");
        }
    } catch (error) {
        console.error("Delete failed", error);
    }
}

export function UserManagementTable() {
    const [data, setData] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // UI States
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [processes, setProcesses] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const result = await response.json();
                setData(result.users || []);
            }

            const procResponse = await fetch('/api/processes');
            if (procResponse.ok) {
                const procData = await procResponse.json();
                setProcesses(procData);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const table = useReactTable({
        data,
        columns: viewMode === "table" ? columns : [], // No columns logic for grid
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        meta: {
            onEdit: handleEdit
        }
    });

    const filteredData = table.getFilteredRowModel().rows.map(row => row.original);

    return (
        <div className="flex gap-6 h-full items-start">
            <div className="flex-1 space-y-4 min-w-0">
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Usuarios Totales"
                        value={data.length}
                        icon={Users}
                        color="bg-indigo-500"
                        textColor="text-indigo-600"
                    />
                    <StatCard
                        title="Activos Ahora"
                        value={data.filter(u => u.status === 'active').length}
                        icon={CheckCircle}
                        color="bg-emerald-500"
                        textColor="text-emerald-600"
                    />
                    <StatCard
                        title="Instructores"
                        value={data.filter(u => u.role === 'INSTRUCTOR').length}
                        icon={Briefcase}
                        color="bg-blue-500"
                        textColor="text-blue-600"
                    />
                    <StatCard
                        title="Pendientes"
                        value={data.filter(u => u.status === 'pending').length}
                        icon={Mail}
                        color="bg-amber-500"
                        textColor="text-amber-600"
                    />
                </div>

                <div className="flex items-center justify-between py-4 bg-white p-4 rounded-2xl border shadow-sm">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="pl-10 h-10 bg-slate-50 border-none rounded-xl"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border">
                            <Button
                                variant={viewMode === "table" ? "ghost" : "ghost"}
                                size="sm"
                                className={`h-8 w-10 p-0 rounded-lg ${viewMode === "table" ? "shadow-sm bg-white" : "text-slate-500"}`}
                                onClick={() => setViewMode("table")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "grid" ? "ghost" : "ghost"}
                                size="sm"
                                className={`h-8 w-10 p-0 rounded-lg ${viewMode === "grid" ? "shadow-sm bg-white" : "text-slate-500"}`}
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-xl border-slate-200">
                                    <Filter className="mr-2 h-4 w-4" /> Columnas
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl p-2 w-48 font-inter">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize rounded-lg mb-1"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id === "name" ? "Usuario" :
                                                column.id === "role" ? "Rol" :
                                                    column.id === "status" ? "Estado" :
                                                        column.id === "process" ? "Proceso" :
                                                            column.id === "lastLogin" ? "Último Acceso" : column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {viewMode === "table" ? (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="h-12 font-bold text-slate-800">
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-slate-50 border-slate-100 transition-colors">
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="py-4">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-48 text-center text-slate-400">
                                            Sin resultados encontrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filteredData.map((user) => (
                            <UserCard key={user.id} user={user} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                        {filteredData.length === 0 && (
                            <div className="col-span-full h-48 flex items-center justify-center text-slate-400">
                                Sin resultados encontrados.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-slate-500 font-medium font-inter">
                        {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} usuarios seleccionados
                    </div>
                    <div className="flex gap-2 font-inter">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-lg">
                            Anterior
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-lg">
                            Siguiente
                        </Button>
                    </div>
                </div>
            </div>

            {/* ORGANIZATIONAL SIDEBAR */}
            <div className={`w-80 bg-white border rounded-2xl p-6 transition-all duration-300 shadow-sm overflow-y-auto h-fit sticky top-4 ${isSidebarOpen ? '' : 'hidden lg:block'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        Estructura Organizacional
                    </h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Gestionar Nodos</DropdownMenuItem>
                            <DropdownMenuItem>Importar Estructura</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-1">
                    <ProcessTree nodes={processes} />
                </div>
            </div>

            <UserEditModal
                user={editingUser}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}

function UserCard({ user, onEdit, onDelete }: { user: User, onEdit: (u: User) => void, onDelete: (id: string) => void }) {
    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden rounded-2xl group border font-inter">
            <CardContent className="p-0">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <Avatar className="h-16 w-16 border-4 border-slate-50 shadow-inner group-hover:scale-110 transition-transform">
                            <AvatarImage src={(user as any).avatar} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xl">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => onEdit(user)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={() => {
                                    if (confirm(`¿Eliminar a ${user.name}?`)) onDelete(user.id)
                                }}>Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 ">{user.name}</h4>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline" className={`rounded-lg py-1 ${user.role === 'ADMINISTRATOR' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                user.role === 'INSTRUCTOR' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                            {user.role === 'ADMINISTRATOR' ? 'Admin' : user.role === 'INSTRUCTOR' ? 'Instructor' : 'Estudiante'}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50/50 text-slate-400 border-slate-100 rounded-lg">
                            {user.process?.name || "Sin Grupo"}
                        </Badge>
                    </div>
                </div>
                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between transition-colors group-hover:bg-indigo-50/30">
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user.status === 'active' ? 'Conectado' : 'Desconectado'}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors" onClick={() => onEdit(user)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ProcessTree({ nodes, level = 0 }: { nodes: any[], level?: number }) {
    if (!nodes || nodes.length === 0) return null;

    return (
        <div className="space-y-1 font-inter">
            {nodes.map((node) => (
                <div key={node.id} className="space-y-1">
                    <div
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${level > 0 ? 'ml-4 border-l pl-3 border-slate-100' : ''}`}
                    >
                        {node.children && node.children.length > 0 ? (
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                        ) : (
                            <div className="h-3 w-3" />
                        )}
                        <span className="text-sm font-semibold text-slate-600">{node.name}</span>
                        {node.users && node.users.length > 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold ml-auto">{node.users.length}</span>
                        )}
                    </div>
                    {node.children && node.children.length > 0 && (
                        <ProcessTree nodes={node.children} level={level + 1} />
                    )}
                </div>
            ))}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    textColor
}: {
    title: string,
    value: number,
    icon: any,
    color: string,
    textColor: string
}) {
    return (
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl group">
            <CardContent className="p-0">
                <div className="flex items-center">
                    <div className={`w-2 h-24 ${color} transform group-hover:scale-y-110 transition-transform`} />
                    <div className="flex items-center justify-between w-full p-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
                        </div>
                        <div className={`h-14 w-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform`}>
                            <Icon className={`h-7 w-7 ${textColor}`} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
