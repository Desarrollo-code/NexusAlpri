
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
    LayoutGrid,
    List,
    Filter,
    ChevronRight,
    Users,
    Layers,
    Edit3,
    Trash2,
    AlertCircle,
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
    Plus
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
            if (!process) return <span className="text-slate-400 italic text-sm">Sin Asignar</span>;

            // Generate a deterministic color based on process name
            const colors = [
                "bg-blue-50 text-blue-700 border-blue-100",
                "bg-purple-50 text-purple-700 border-purple-100",
                "bg-indigo-50 text-indigo-700 border-indigo-100",
                "bg-pink-50 text-pink-700 border-pink-100",
                "bg-amber-50 text-amber-700 border-amber-100",
                "bg-emerald-50 text-emerald-700 border-emerald-100"
            ];
            const colorIndex = process.name.length % colors.length;

            return (
                <Badge variant="outline" className={`font-bold px-3 py-1 rounded-full ${colors[colorIndex]}`}>
                    {process.name}
                </Badge>
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
    const [totalUsers, setTotalUsers] = useState(0);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // UI States
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBulkProcessModalOpen, setIsBulkProcessModalOpen] = useState(false);
    const [processes, setProcesses] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const search = (columnFilters.find(f => f.id === 'name')?.value as string) || '';
            const params = new URLSearchParams({
                page: (pagination.pageIndex + 1).toString(),
                pageSize: pagination.pageSize.toString(),
                search: search,
            });

            const response = await fetch(`/api/users?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                // Map isActive to status for the UI
                const mappedUsers = (result.users || []).map((u: any) => ({
                    ...u,
                    status: u.isActive ? 'active' : 'inactive',
                    lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'Nunca'
                }));
                setData(mappedUsers);
                setTotalUsers(result.totalUsers || 0);
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
    }, [pagination.pageIndex, pagination.pageSize, columnFilters, sorting]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const table = useReactTable({
        data,
        columns: viewMode === "table" ? columns : [],
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        // Manual pagination
        manualPagination: true,
        pageCount: Math.ceil(totalUsers / pagination.pageSize),
        onPaginationChange: setPagination,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
        meta: {
            onEdit: handleEdit
        }
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedUserIds = selectedRows.map(row => row.original.id);

    const handleBulkProcessStatusUpdate = async (processId: string | null) => {
        try {
            const response = await fetch('/api/users/bulk-update', {
                method: 'PUT',
                body: JSON.stringify({
                    userIds: selectedUserIds,
                    data: { processId }
                })
            });
            if (response.ok) {
                fetchData();
                setRowSelection({});
                setIsBulkProcessModalOpen(false);
            }
        } catch (error) {
            console.error("Bulk update failed", error);
        }
    };

    const filteredData = table.getFilteredRowModel().rows.map(row => row.original);

    return (
        <div className="flex gap-6 h-full items-start">
            <div className="flex-1 space-y-4 min-w-0">
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Usuarios Totales"
                        value={totalUsers}
                        icon={Users}
                        color="from-primary to-chart-3"
                        textColor="text-white"
                        description="Crecimiento del 12% este mes"
                    />
                    <StatCard
                        title="Activos Ahora"
                        value={data.filter(u => u.status === 'active').length}
                        icon={CheckCircle}
                        color="from-chart-2 to-emerald-400"
                        textColor="text-white"
                        description="Usuarios con sesión iniciada"
                    />
                    <StatCard
                        title="Instructores"
                        value={data.filter(u => u.role === 'INSTRUCTOR').length}
                        icon={Briefcase}
                        color="from-chart-1 to-blue-400"
                        textColor="text-white"
                        description="Personal docente verificado"
                    />
                    <StatCard
                        title="Pendientes"
                        value={data.filter(u => u.status === 'pending').length}
                        icon={Mail}
                        color="from-chart-5 to-orange-400"
                        textColor="text-white"
                        description="Esperando confirmación"
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

                <div className="flex items-center justify-between py-6">
                    <div className="text-sm text-slate-500 font-medium font-inter bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                        Mostrando <span className="text-slate-900 font-bold">{data.length}</span> de <span className="text-slate-900 font-bold">{totalUsers}</span> usuarios
                    </div>
                    <div className="flex items-center gap-4 font-inter">
                        <div className="flex items-center gap-2 mr-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Página</span>
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 h-8 w-8 flex items-center justify-center rounded-lg border border-indigo-100 italic">
                                {pagination.pageIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">de {Math.ceil(totalUsers / pagination.pageSize)}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="rounded-xl h-10 px-6 font-bold hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="rounded-xl h-10 px-6 font-bold bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-all active:scale-95"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUserIds.length > 0 && (
                    <BulkActionsBar
                        count={selectedUserIds.length}
                        onAssignProcess={() => setIsBulkProcessModalOpen(true)}
                        onClear={() => setRowSelection({})}
                    />
                )}

                <BulkProcessAssignModal
                    isOpen={isBulkProcessModalOpen}
                    onClose={() => setIsBulkProcessModalOpen(false)}
                    onAssign={handleBulkProcessStatusUpdate}
                    processes={processes}
                />
            </div>

            {/* ORGANIZATIONAL SIDEBAR - INDUSTRIAL REDESIGN */}
            <div className={`w-85 bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 shadow-xl overflow-y-auto h-fit sticky top-8 ${isSidebarOpen ? '' : 'hidden lg:block'}`}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 tracking-tight">Estructura</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organizacional</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50 transition-all">
                        <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                    </Button>
                </div>

                <div className="space-y-1 relative">
                    {/* Vertical guideline for the root */}
                    <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-100" />
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
    const processColors = [
        "from-blue-600 to-indigo-600",
        "from-purple-600 to-pink-600",
        "from-emerald-600 to-teal-600",
        "from-amber-600 to-orange-600",
        "from-indigo-600 to-blue-600"
    ];
    const colorIndex = (user.process?.name?.length || 0) % processColors.length;
    const processColor = user.process ? processColors[colorIndex] : "from-slate-400 to-slate-500";

    return (
        <Card className="hover:shadow-2xl transition-all duration-500 border-none shadow-lg overflow-hidden rounded-[2rem] group relative bg-white font-inter">
            {/* Top Pattern/Glow */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${processColor}`} />

            <CardContent className="p-0">
                <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                <AvatarImage src={(user as any).avatar} />
                                <AvatarFallback className={`bg-gradient-to-br ${processColor} text-white font-black text-2xl`}>
                                    {user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white shadow-sm ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
                                    <MoreHorizontal className="h-6 w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl min-w-[180px] font-inter">
                                <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-xl h-11 font-bold gap-3 focus:bg-indigo-50 focus:text-indigo-600">
                                    <Edit3 className="h-4 w-4" /> Editar Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl h-11 font-bold gap-3 focus:bg-indigo-50 focus:text-indigo-600">
                                    <Users className="h-4 w-4" /> Ver Equipo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2" />
                                <DropdownMenuItem className="text-red-500 rounded-xl h-11 font-bold gap-3 focus:bg-red-50 focus:text-red-600" onClick={() => {
                                    if (confirm(`¿Eliminar a ${user.name}?`)) onDelete(user.id)
                                }}>
                                    <Trash2 className="h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-black text-xl text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{user.name}</h4>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="h-3.5 w-3.5" />
                            <p className="text-xs font-bold truncate">{user.email}</p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Rol del Usuario</span>
                            <Badge className={`rounded-xl px-4 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-sm ${user.role === 'ADMINISTRATOR' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {user.role === 'ADMINISTRATOR' ? 'Admin' : user.role === 'INSTRUCTOR' ? 'Instructor' : 'Estudiante'}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Departamento</span>
                            {user.process ? (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${processColor} text-white shadow-lg`}>
                                    <span className="text-[10px] font-black">{user.process.name}</span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-black text-slate-400 italic">No Asignado</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex items-center justify-between transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-inner group-hover:rounded-b-[2rem]">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Último Ingreso</span>
                        <span className="text-xs font-bold leading-none mt-1">{user.lastLogin || 'Hoy'}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-12 rounded-[1.25rem] px-6 font-black text-xs uppercase tracking-widest gap-2 bg-indigo-50 text-indigo-600 group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-sm" onClick={() => onEdit(user)}>
                        Gestionar <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ProcessTree({ nodes, level = 0 }: { nodes: any[], level?: number }) {
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ "root": true });

    if (!nodes || nodes.length === 0) return null;

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-2 font-inter relative">
            {nodes.map((node, index) => {
                const isExpanded = expandedNodes[node.id] || level === 0;
                const hasChildren = node.children && node.children.length > 0;

                return (
                    <div key={node.id} className="relative">
                        {/* Horizontal Connector Line */}
                        {level > 0 && (
                            <div className="absolute -left-6 top-6 w-6 h-px bg-slate-100" />
                        )}

                        <div
                            onClick={() => hasChildren && toggleNode(node.id)}
                            className={`
                                group flex items-center gap-3 p-3 rounded-[1.25rem] transition-all duration-300 cursor-pointer
                                ${level === 0 ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'}
                                ${isExpanded && level === 0 ? 'ring-1 ring-slate-200' : ''}
                            `}
                        >
                            <div className="relative">
                                {hasChildren ? (
                                    <div className={`
                                        h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-500
                                        ${isExpanded ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                                    `}>
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </div>
                                ) : (
                                    <div className="h-6 w-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                    </div>
                                )}
                            </div>

                            <span className={`
                                text-sm tracking-tight transition-colors duration-300
                                ${level === 0 ? 'font-black uppercase text-[11px] tracking-[0.1em] text-slate-500' : 'font-bold text-slate-700 group-hover:text-primary'}
                            `}>
                                {node.name}
                            </span>

                            {node.users && (
                                <div className="ml-auto">
                                    <span className="bg-slate-50 text-slate-400 text-[9px] font-black h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full border border-slate-100 group-hover:border-primary/30 group-hover:text-primary transition-all shadow-sm">
                                        {node.users.length}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Recursive Children with motion/animation */}
                        <AnimatePresence>
                            {isExpanded && hasChildren && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="ml-6 border-l border-slate-100 overflow-hidden"
                                >
                                    <div className="pt-2 pb-1">
                                        <ProcessTree nodes={node.children} level={level + 1} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    textColor,
    description
}: {
    title: string,
    value: number,
    icon: any,
    color: string,
    textColor: string,
    description?: string
}) {
    return (
        <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] group relative">
            {/* Background Gradient Layer */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`} />

            <CardContent className="p-8 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">
                                {title}
                            </span>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter mt-1 group-hover:scale-105 origin-left transition-transform duration-500">
                                {value}
                            </span>
                        </div>
                        {description && (
                            <div className="flex items-center gap-1.5 pt-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400">{description}</span>
                            </div>
                        )}
                    </div>

                    <div className={`h-16 w-16 rounded-[1.25rem] bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-primary/20`}>
                        <Icon className={`h-8 w-8 text-white`} />
                    </div>
                </div>
            </CardContent>

            {/* Bottom Glow Effect */}
            <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
        </Card>
    );
}

import { motion, AnimatePresence } from "framer-motion";

function BulkActionsBar({ count, onAssignProcess, onClear }: { count: number, onAssignProcess: () => void, onClear: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-8 border border-slate-800 backdrop-blur-md bg-opacity-95"
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-black text-lg">
                        {count}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seleccionados</span>
                        <span className="text-sm font-medium">Usuarios listos para acción</span>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-700" />

                <div className="flex items-center gap-3">
                    <Button
                        onClick={onAssignProcess}
                        className="bg-white text-slate-900 hover:bg-primary/10 font-bold rounded-xl px-6 h-11 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Layers className="h-4 w-4" />
                        Asignar Proceso
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClear}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 font-bold rounded-xl h-11"
                    >
                        Cancelar
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

function BulkProcessAssignModal({ isOpen, onClose, onAssign, processes }: { isOpen: boolean, onClose: () => void, onAssign: (id: string | null) => void, processes: any[] }) {
    const [selectedProcessId, setSelectedProcessId] = useState<string>("unassigned");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Layers className="h-7 w-7" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Asignar Proceso Masivamente</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium py-2">
                        Selecciona el nuevo proceso o grupo para los usuarios seleccionados. Esto sobrescribirá su asignación actual.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Seleccionar Destino</Label>
                        <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                            <SelectTrigger className="h-14 rounded-xl border-slate-200 bg-slate-50/50 font-medium">
                                <SelectValue placeholder="Selecciona un proceso" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl p-2 font-inter">
                                <SelectItem value="unassigned" className="rounded-lg">Sin Asignar / Quitar Proceso</SelectItem>
                                {processes.map((p) => (
                                    <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-start">
                    <Button
                        onClick={() => onAssign(selectedProcessId === "unassigned" ? null : selectedProcessId)}
                        className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        Confirmar Asignación
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-14 px-6 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl"
                    >
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
